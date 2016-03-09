/* jshint node: true */
"use strict";

var fs = require('fs'),
  util = require('util'),
  stream = require('stream'),
  es = require("event-stream"),
  sqlite3 = require('sqlite3'),
  path = require('path');

var start, s, db = new sqlite3.Database(path.join('db', 'dictionary.sqlite')),
  files = [path.join('processed', 'Corev2.all.js.dict.txt'), path.join('processed', 'unidrug.rc.js.dict.txt')];

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

    s = fs.createReadStream(file)
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
});
