/* jshint node: true */
"use strict";

var sqlite3 = require('sqlite3'),
  path = require('path'),
  Graph = require('./Graph.js');

module.exports = {
  getFromSynonyms: function(synonyms, callback) {
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
      graphs.forEach(function(g) {
        g.addDepth();
      });

      callback(null, graphs);
    });
  },

  getSiblings: function(code, callback) {
    var siblings = [],
      db = new sqlite3.Database(path.join('db', 'dictionary.sqlite'));
    db.serialize(function() {
      db.each(["SELECT  h2.code as sibling, h2.description as siblingDescription",
      " FROM hierarchy h1 INNER JOIN hierarchy h2 ON h2.parent= h1.parent ",
      " WHERE h1.code = '" + code + "' and h2.code != '" + code + "'"].join(""),
        function(err, row) {
          //Each time we get a result back
          if (err) {
            return callback(err);
          }
          //graph.addNode(row.sibling);
          //graph.addNode(row.siblingDescription);
          siblings.push({
            code: row.sibling,
            description: row.siblingDescription
          });
        });
    });

    db.close(function() {
      callback(null, siblings);
    });
  },

  findOtherTerms: function(codes, callback) {
    var terms = {},
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
  }

};
