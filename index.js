/* jshint node: true */
"use strict";

var util = require('util'),
  stream = require('stream'),
  es = require("event-stream"),
  inquirer = require('inquirer'),
  main = require('./scripts/main.js'),
  Graph = require('./scripts/Graph.js'),
  db = require('./scripts/db.js'),
  pkg = require('./package.json'),
  file = require('./scripts/file.js'),
  q = require('./scripts/questions.js'),
  program = require('commander');

program
  .version(pkg.version)
  .option('-P, --process', 'Load files in ./processed into database')
  .option('-m, --meta <file>', 'Load a metadata file')
  .parse(process.argv);

if (program.process) {
  //Process dictionary files
  db.processDictionaryFiles(function(err) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    process.exit(0);
  });
} else {

  var meta = program.meta ? file.loadMetadata(program.meta) : {};

  // Read synonyms from file
  var synonyms = Object.keys(meta).length > 0 ? meta.synonyms : file.getSynonyms();

  // Read defaults from file
  var defaults = file.getDefaults();

  var questions = q.initial;

  questions.forEach(function(q) {
    if (meta[q.name]) q.default = meta[q.name];
    else if (defaults[q.name]) q.default = defaults[q.name];
  });

  inquirer.prompt(questions, function(result) {
    Object.keys(result).forEach(function(key) {
      defaults[key] = result[key];
    });

    meta.version = pkg.version; //TODO maybe a warning if the version has changed
    meta.name = defaults.name;
    meta.description = defaults.description;
    meta.author = defaults.author;
    meta.terminologies = defaults.terminologies;
    meta.synonyms = synonyms;

    file.setDefaults(defaults);

    main.resultsAndProcess(meta, function(err, data) {

      console.log("New synonyms file written.");
      if (err) {
        console.log(err);
        return;
      }

      var g, output = [];
      var input = function(val) {
        if (val.children) {
          g.nodes().forEach(function(node) {
            if (val.children.indexOf(node) > -1) {
              g.prop(node, "include", true);
            } else {
              g.prop(node, "include", false);
            }
          });
        }
        output.push(g);
        done();
      };

      var done = function() {
        if (data.length === 0) {
          var outputGraph = Graph.merge(output);

          file.writeCodes(outputGraph);

          meta.synonyms = synonyms;
          meta.excludedCodes = outputGraph.excluded();
          meta.includedCodes = outputGraph.included();

          file.writeMetadata(meta);

          process.exit(0);
        }
        g = data.pop();

        var checkboxes = g.nodes().map(function(v) {
          return {
            "value": v,
            "name": new Array(g.prop(v, "depth") * 3).join(" ") + g.prop(v, "description").join(" | "),
            "short": v,
            "checked": g.prop(v, "include")
          };
        });

        inquirer.prompt([{
          type: "checkbox",
          name: "children",
          message: "Review:",
          choices: checkboxes
        }], input);
      };

      done();

    });

  });
}
