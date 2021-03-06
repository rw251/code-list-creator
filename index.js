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
  db.processDictionaryFiles('dictionary.sqlite', 'processed', function(err) {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    process.exit(0);
  });
} else {

  var meta = program.meta ? file.loadMetadata(program.meta) : {};

  var synonyms = Object.keys(meta).length > 0 ? meta.synonyms : [];

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

    var nextStep = function() {
      meta.version = pkg.version; //TODO maybe a warning if the version has changed
      meta.name = defaults.name;
      meta.description = defaults.description;
      meta.author = defaults.author;
      meta.terminologies = defaults.terminologies;
      meta.synonyms = synonyms;

      file.setDefaults(defaults);

      main.resultsAndProcess(meta, function(err, data) {

        if (err) {
          console.log(err);
          return;
        }

        if(data.length===0) console.log("No matching terms found in the dictionary");

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
            var timestamp = (new Date()).toISOString().substr(0,19).replace(/[:]/g,"-").replace(/[T]/g,"_");

            var o1 = file.writeCodes(outputGraph, "codes_" + timestamp + (meta.name ? "_"+meta.name : "") + ".txt");
            console.log("Code list written to " + o1);

            meta.synonyms = synonyms;
            meta.excludedCodes = outputGraph.excluded();
            meta.includedCodes = outputGraph.included();

            var o2 = file.writeMetadata(meta, "meta_" + timestamp + (meta.name ? "_"+meta.name : "") + ".json");
            console.log("Code list written to " + o2);

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
    };

    var askSynonym = function() {
      inquirer.prompt({
        type: "input",
        name: "synonym",
        message: "Enter a synonym and hit enter (leave blank to finish)"
      }, function(answers) {
        if (answers.synonym === "") {
          nextStep();
        } else {
          synonyms.push(answers.synonym);
          askSynonym();
        }
      });
    };

    if(synonyms.length>0) nextStep();
    else askSynonym();
  });
}
