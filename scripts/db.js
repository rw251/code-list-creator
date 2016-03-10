/* jshint node: true */
"use strict";

var sqlite3 = require('sqlite3'),
  path = require('path'),
  Graph = require('./Graph.js'),
  fs = require('fs'),
  util = require('util'),
  stream = require('stream'),
  es = require("event-stream");

module.exports = {
  getFromSynonyms: function(meta, callback) {
    var graph = new Graph(),
      db = new sqlite3.Database(path.join('db', 'dictionary.sqlite'));

    db.serialize(function() {
      var simpleSynonyms = meta.synonyms.filter(function(val) {
        return val.indexOf('*') === -1 && val.indexOf(' ') === -1;
      });
      var wildcardSynonyms = meta.synonyms.filter(function(val) {
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

          if (meta.excludedCodes) {
            if (meta.excludedCodes.indexOf(row.code) > -1) graph.prop(row.code, "include", false);
            if (meta.excludedCodes.indexOf(row.parent) > -1) graph.prop(row.parent, "include", false);
          }
          if (meta.includedCodes) {
            if (meta.includedCodes.indexOf(row.code) > -1) graph.prop(row.code, "include", true);
            if (meta.includedCodes.indexOf(row.parent) > -1) graph.prop(row.parent, "include", true);
          }

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
    var siblings = {},
      db = new sqlite3.Database(path.join('db', 'dictionary.sqlite'));
    db.serialize(function() {
      db.each(["SELECT h2.code as sibling, h2.description as siblingDescription ",
      " FROM hierarchy h1 INNER JOIN hierarchy h2 ON h2.parent= h1.parent ",
      " WHERE h1.code = '" + code + "' and h2.code != '" + code + "'"].join(""),
        function(err, row) {
          //Each time we get a result back
          if (err) {
            return callback(err);
          }
          if (!siblings[row.sibling]) siblings[row.sibling] = [row.siblingDescription];
          else siblings[row.sibling].push(row.siblingDescription);
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
  },

  processDictionaryFiles: function(callback) {
    var start, s, db = new sqlite3.Database(path.join('db', 'dictionary.sqlite')),
      files = fs.readdirSync('processed');// [path.join('processed', 'Corev2.all.js.dict.txt'), path.join('processed', 'unidrug.rc.js.dict.txt')];

    db.serialize(function() {
      db.run('DROP TABLE IF EXISTS hierarchy');
      db.run('CREATE TABLE hierarchy (code VARCHAR, description VARCHAR, parent VARCHAR)');

      db.run('DROP TABLE IF EXISTS dictionary');
      db.run('CREATE VIRTUAL TABLE dictionary USING fts4(code VARCHAR, description VARCHAR)');

      start = Date.now();
      files.forEach(function(file) {
        db.run("begin transaction");
        var stmt = db.prepare("INSERT OR IGNORE INTO dictionary (code, description) VALUES (?,?)");
        var stmt2 = db.prepare("INSERT OR IGNORE INTO hierarchy (code, description, parent) VALUES (?,?,?)");

        s = fs.createReadStream(path.join('processed', file))
          .pipe(es.split())
          .pipe(es.mapSync(function(line) {

              // pause the readstream
              s.pause();

              (function() {

                // process line here and call s.resume() when rdy
                //console.log(line.split('\t')[1]);
                stmt.run(line.split('\t')[0], line.split('\t')[1]);
                stmt2.run(line.split('\t')[0], line.split('\t')[1], line.split('\t')[2]);

                // resume the readstream
                s.resume();

              })();
            })
            .on('error', function() {
              console.log('Error while reading file.');
            })
            .on('end', function() {
              console.log('Read entirefile.');
            })
          );
        if (file === files[files.length - 1]) {
          db.run('CREATE INDEX hierParent ON hierarchy (parent)');
          db.run('CREATE INDEX hierCode ON hierarchy (code)');
        }
        db.run("commit");
      });
    });

    db.close(function() {
      // sqlite3 has now fully committed the changes
      console.log("Elapsed: " + (Date.now() - start) + "ms");
      return callback(null);
    });
  }

};
