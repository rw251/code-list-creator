/* jshint node: true */
"use strict";

var inquirer = require('inquirer'),
  Graph = require('./Graph.js'),
  db = require('./db.js'),
  colors = require('colors');

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
    }, true); //not working for all children rejected??

    if (val.siblings) {
      //val.siblings is a list of included siblings
      val.siblings.forEach(function(sibling) {
        if (!g.hasNode(sibling.code)) {
          g.addNode(sibling.code, {
            description: sibling.description,
            children: [],
            parent: g.prop(v, "parent"),
            depth: g.prop(v, "depth")
          });
        }
        g.prop(sibling.code, "include", true);
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
    //reject parents unless already included
    g.prop(v, "parent").forEach(function(p) {
      if(!g.prop(p,"include")) g.prop(p, "include", false);
    });
    //reject children
    g.getDescendents(v).forEach(function(p) {
      g.prop(p, "include", val.include.indexOf(p) > -1);
    });
    j++;
    next();
  };

  var siblingCheck = function(val) {
    if (val.include || val.include === false) {
      //single parent included/excluded
      g.prop(g.prop(v, "parent")[0], "include", val.include);
    } else if (val.parents) {
      //val.parents is a list of included parents
      g.prop(v, "parent").forEach(function(p) {
        g.prop(p, "include", val.parents.indexOf(p) > -1);
      });
    }

    //get siblings
    db.getSiblings(v, function(err, siblings) {
      if (err) {
        return callback(err);
      }

      var unmatchedSiblings = Object.keys(siblings).filter(function(val) {
        return !g.hasNode(val);
      });

      if (unmatchedSiblings && unmatchedSiblings.length > 0) {
        var checkboxes = unmatchedSiblings.map(function(val) {
          return {
            "value": {code: val, description: siblings[val]},
            "name": val + ": " + siblings[val].join(" | "),
            "short": val
          };
        });
        inquirer.prompt([{
          type: "checkbox",
          name: "siblings",
          message: "Select sibling codes to include:",
          choices: checkboxes
      }], childCheck);
      } else {
        childCheck({
          q: "y"
        });
      }
    });
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
        }], siblingCheck);
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
        }], siblingCheck);
      }
    }
  };

  //Process the next code.
  var next = function() {
    if (i > graphs.length - 1) {
      //all done
      return callback(null, graphs);
    }
    if (orderedNodes && j > orderedNodes.length - 1) {
      //This subgraph is complete... move to the next
      j = 0;
      i++;
      next();
    } else {
      if (j === 0) {
        //Load next graph
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

  var nodeButNoSynonym = function(node) {
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

var resultsAndProcess = function(meta, callback) {
  db.getFromSynonyms(meta, function(err, graphs) {
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
        validateResults(graphs[i], meta.synonyms, function() {
          i++;
          doNext();
        });
      };

      doNext();
    });
  });
};

module.exports = {
  resultsAndProcess: resultsAndProcess
};
