/* jshint node: true */
"use strict";

var util = require('util'),
  stream = require('stream'),
  es = require("event-stream"),
  inquirer = require('inquirer'),
  main = require('./scripts/main.js'),
  Graph = require('./scripts/Graph.js'),
  pkg = require('./package.json'),
  file = require('./scripts/file.js'),
  q = require('./scripts/questions.js');

// Read synonyms from file
var synonyms = file.getSynonyms();

// Read defaults from file
var defaults = file.getDefaults();

var questions = q.initial;

questions.forEach(function(q) {
  if (defaults[q.name]) q.default = defaults[q.name];
});

inquirer.prompt(questions, function(result) {
  Object.keys(result).forEach(function(key) {
    defaults[key] = result[key];
  });

  file.setDefaults(defaults);

  main.resultsAndProcess(synonyms, function(err, data) {
    file.writeSynonyms(synonyms);

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

        var meta = {
          version: pkg.version,
          name: defaults.listname,
          description: defaults.description,
          author: defaults.name,
          terminologies: defaults.terminologies,
          synonyms: synonyms,
          excludedCodes: outputGraph.excluded()
        };

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
