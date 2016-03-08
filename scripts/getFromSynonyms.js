var sqlite3 = require('sqlite3'),
  path = require('path'),
  colors = require('colors'),
  inquirer = require('inquirer'),
  Graph = require('./Graph.js');

var getFromSynonyms = function(synonyms, callback) {
  var graph = new Graph(),
    db = new sqlite3.Database(path.join('db', 'dictionary.sqlite'));

  db.serialize(function() {
    var simpleSynonyms = synonyms.filter(function(val) {
      return val.indexOf('*') === -1 && val.indexOf(' ') === -1;
    });
    var wildcardSynonyms = synonyms.filter(function(val) {
      return val.indexOf('*') > -1 || val.indexOf(' ') > -1;
    });
    db.each(["WITH RECURSIVE ",
             "  child_of_code(n) AS ( ",
             "    SELECT code FROM dictionary WHERE description MATCH '", simpleSynonyms.join(" OR "), "'",
             wildcardSynonyms.map(function(val) {
          return " UNION  SELECT code FROM dictionary WHERE description MATCH '" + val + "' ";
        }).join(""),
             "	  UNION ",
             "	  SELECT code FROM hierarchy, child_of_code ",
             "	  WHERE hierarchy.parent=child_of_code.n) ",
             "SELECT h1.code, h1.description, h2.code as parent, h2.description as parentDescription FROM hierarchy h1 ",
             "INNER JOIN hierarchy h2 ON h2.code = h1.parent ",
             "WHERE h1.code IN child_of_code;"].join(""),
      function(err, row) {
        //Each time we get a result back
        if (err) {
          return callback(err);
        }
        graph.addNode(row.code);
        graph.addNode(row.parent);

        graph.prop(row.code, "match", true);

        if (graph.prop(row.code, "description").indexOf(row.description) === -1) graph.prop(row.code, "description").push(row.description);
        if (graph.prop(row.parent, "description").indexOf(row.parentDescription) === -1) graph.prop(row.parent, "description").push(row.parentDescription);

        if (graph.prop(row.parent, "children").indexOf(row.code) === -1) graph.prop(row.parent, "children").push(row.code);
        if (graph.prop(row.code, "parent").indexOf(row.parent) === -1) graph.prop(row.code, "parent").push(row.parent);

      });
  });

  db.close(function() {
    // sqlite3 has now fully committed the changes
    // Now we split the graph into subgraphs of connected components
    // - each one can then be processed in isolation

    var graphs = graph.connectedSubgraphs();
    graphs.forEach(function(g){
      g.addDepth();
    });

    callback(null, graphs);
  });
};

var processResults = function(graphs, callback) {
  var i = 0,
    j = 0,
    k, g, v, orderedNodes;

  var sortByDepth = function(a, b) {
    return g.prop(a, "depth") - g.prop(b, "depth");
  };

  var removeLeaves = function(val) {
    return g.prop(val, "match");
  };

  var includeCode = function(err, val) {
    if (err) {
      return callback(err);
    }
    j++;
    next();
  };

  var childCheckDone = function(val) {
    if (val.children) {
      g.getDescendents(v).forEach(function(p) {
        g.prop(p, "include", val.children.indexOf(p) > -1);
      });
    }

    j++;
    next();
  };

  var childCheck = function(val) {
    var allChildrenIncluded = g.getDescendents(v).reduce(function(prev, cur) {
      return prev && (g.prop(cur, "include") || g.prop(cur, "include") === false);
    }, true);

    if (val.include || val.include === false) {
      //single parent included
      g.prop(g.prop(v, "parent")[0], "include", val.include);
    } else if (val.parents) {
      //list of included parents
      g.prop(v, "parent").forEach(function(p) {
        g.prop(p, "include", val.parents.indexOf(p) > -1);
      });
    }

    if (allChildrenIncluded) {
      j++;
      next();
    } else {
      var checkboxes = g.getDescendents(v).map(function(val) {
        return {
          "value": val,
          "name": g.prop(val, "description"),
          "short": val,
          "checked": g.prop(val, "include") !== false
        };
      });
      inquirer.prompt([{
        type: "checkbox",
        name: "children",
        message: "All child codes will be included (except ones already rejected) unless you deselect them:",
        choices: checkboxes
      }], childCheckDone);
    }
  };

  var rejectCheck = function(val) {
    //reject parents in all cases - any reason why not??
    g.prop(v, "parent").forEach(function(p) {
      g.prop(p, "include", false);
    });
    //reject children
    g.getDescendents(v).forEach(function(p) {
      g.prop(p, "include", val.include.indexOf(p) > -1);
    });
    j++;
    next();
  };

  var parentCheck = function(val) {
    var allParentsIncluded = g.prop(v, "parent").reduce(function(prev, cur) {
      return prev && (g.prop(cur, "include") || g.prop(cur, "include") === false);
    }, true);
    g.prop(v, "include", true);
    if (!val.include) {
      g.prop(v, "include", false);
      if (g.prop(v, "children").length > 0) {
        inquirer.prompt([{
          type: "checkbox",
          name: "include",
          message: "All children will be rejected unless you select them below",
          choices: g.getDescendents(v).map(function(val) {
            return {
              value: val,
              name: g.prop(val, "description"),
              short: val
            };
          })
        }], rejectCheck);
      } else {
        rejectCheck({
          include: []
        });
      }
    } else if (allParentsIncluded) {
      childCheck({
        q: "y"
      });
    } else {
      if (g.prop(v, "parent").length === 1) {
        inquirer.prompt([{
          type: "confirm",
          name: "include",
          message: "Include parent code " + g.prop(v, "parent")[0] + "?",
          default: "y"
        }], childCheck);
      } else {
        var checkboxes = g.prop(v, "parent").filter(function(val) {
          return !g.prop(val, "include");
        }).map(function(val) {
          return {
            "value": val,
            "name": g.prop(val, "description").join(" | "),
            "short": val
          };
        });
        inquirer.prompt([{
          type: "checkbox",
          name: "parents",
          message: "Select parent codes to include:",
          choices: checkboxes
        }], childCheck);
      }
    }
  };

  var next = function() {
    if (i > graphs.length - 1) {
      //all done
      return callback(null, graphs);
    }
    if (orderedNodes && j > orderedNodes.length - 1) {
      j = 0;
      i++;
      next();
    } else {
      if (j === 0) {
        //Next graph
        g = graphs[i];
        orderedNodes = g.nodes().sort(sortByDepth).filter(removeLeaves);
      }

      v = orderedNodes[j];
      var status;
      console.log("");
      console.log("");
      for (k = 0; k < g.prop(v, "parent").length; k++) {
        status = "";
        if (g.prop(g.prop(v, "parent")[k], "include")) status = "  INCLUDED".cyan;
        if (g.prop(g.prop(v, "parent")[k], "include") === false) status = "  REJECTED".red;
        console.log("PARENT: ".yellow + g.prop(v, "parent")[k] + "-" + g.prop(g.prop(v, "parent")[k], "description").join(" | ").yellow + status);
      }
      console.log("|".white);
      status = g.prop(v, "include") ? "  INCLUDED".cyan : "";
      if (g.prop(v, "include") === false) status = "  REJECTED".red;
      console.log("+--".white + " CODE: ".green + v + "-" + g.prop(v, "description").join(" | ").green + status);

      g.displayChildrenInTree(v);

      console.log("");
      if (!g.prop(v, "include") && g.prop(v, "include") !== false) {
        inquirer.prompt([{
          type: "confirm",
          name: "include",
          message: "Include " + v + "?",
          default: "y"
        }], parentCheck);
      } else {
        parentCheck({
          "include": g.prop(v, "include")
        });
      }
    }
  };

  next();
};

var validateResults = function(graph, synonyms, callback) {
  // Show
  // Items rejected despite presence of a synonyms

  var currentNode;
  var notInDescription = function(synonym) {
    return graph.prop(currentNode, "description").join("|").toLowerCase().search(new RegExp(synonym.toLowerCase().replace("*", "").replace(" ", ".*"), 'g')) > -1;
  };

  var nodeButNoSynonym = function(node){
    currentNode = node;
    return graph.prop(node, "include") && synonyms.filter(notInDescription).length === 0;
  };

  // Parent/children included but no synonym
  var vs = graph.nodes().filter(nodeButNoSynonym);

  vs.forEach(function(v) {
    console.log(v, graph.prop(v, "description").join(" | "));
  });

  var updateResults = function(v) {
    if (v.synonym === "") {
      vs = graph.nodes().filter(nodeButNoSynonym);

      vs.forEach(function(v) {
        graph.prop(v, "include", false);
      });
    } else {
      synonyms.push(v.synonym);
    }
    vs = graph.nodes().filter(nodeButNoSynonym);

    vs.forEach(function(v) {
      console.log(v, graph.prop(v, "description").join(" | "));
    });

    if (vs.length > 0) {
      console.log("The following are currently matched but not by synonym.");
      console.log("");
      inquirer.prompt([{
        name: "synonym",
        message: "Please add a synonym to match some of the above - or hit enter to reject these"
      }], updateResults);
    } else {
      callback();
    }
  };

  if (vs.length > 0) {
    console.log("The following are currently matched but not by synonym.");
    console.log("");
    inquirer.prompt([{
      name: "synonym",
      message: "Please add a synonym to match some of the above - or hit enter to reject these"
    }], updateResults);
  } else {
    callback();
  }
};

var resultsAndProcess = function(synonyms, callback) {
  getFromSynonyms(synonyms, function(err, graphs) {
    if (err) {
      return callback(err);
    }
    processResults(graphs, function(err, graphs) {
      if (err) {
        return callback(err);
      }
      var i = 0;
      var doNext = function() {
        if (i >= graphs.length) return callback(null, graphs);
        validateResults(graphs[i], synonyms, function() {
          i++;
          doNext();
        });
      };

      doNext();
    });
  });
};

var findOtherTerms = function(codes, callback) {
  var terms = {};
  db = new sqlite3.Database(path.join('db', 'dictionary.sqlite'));
  db.serialize(function() {
    db.each("SELECT code,description FROM dictionary WHERE code IN ('" + codes.join("','") + "')", function(err, row) {
      //Each time we get a result back
      if (err) {
        return callback(err);
      }
      row.description.split(' ').forEach(function(term) {
        if (!terms[term]) terms[term] = [];
        terms[term].push({
          "code": row.code,
          "description": row.description
        });
      });
    });
  });

  db.close(function() {
    // sqlite3 has now fully committed the changes
    callback(null, terms);
  });
};

module.exports = {
  results: getFromSynonyms,
  process: processResults,
  resultsAndProcess: resultsAndProcess,
  findOtherTerms: findOtherTerms
};
