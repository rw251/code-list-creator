var fs = require('fs'),
  util = require('util'),
  stream = require('stream'),
  es = require("event-stream"),
  path = require('path'),
  inquirer = require('inquirer'),
  db = require('./scripts/getFromSynonyms'),
  Graph = require('./scripts/Graph.js'),
  package = require('./package.json');

// Read synonyms from file
var synonyms = fs.readFileSync(path.join('in', 'synonyms.txt')).toString().replace(/\r\n/g, '\n').split('\n').filter(function(el) {
  return el.search(/^\s*$/) === -1;
});

// Read defaults file if exists
var defaults = {};
try {
  defaults = JSON.parse(fs.readFileSync('.defaults.json').toString());
} catch (e) {
  defaults = {};
}

var questions = [
  {
    name: "name",
    message: "Enter your name"
  },
  {
    type: "checkbox",
    name: "terminologies",
    message: "Please select the terminologies used",
    choices: [
      new inquirer.Separator(" = ICD = "),
      {
        name: "ICD9"
      },
      {
        name: "ICD10"
      },
      {
        name: "ICD11"
      },
      new inquirer.Separator(" = READ = "),
      {
        name: "ReadV2"
      },
      {
        name: "ReadV3"
      },
      new inquirer.Separator(" = SNOMED = "),
      {
        name: "SNOMED CT"
      }
    ]
  },
  {
    name: "listname",
    message: "Please enter a short name for your code list"
  },
  {
    name: "description",
    message: "Please enter a description for your code list"
  }
];

questions.forEach(function(q) {
  if (defaults[q.name]) q.default = defaults[q.name];
});


inquirer.prompt(questions, function(result) {
  Object.keys(result).forEach(function(key) {
    defaults[key] = result[key];
  });

  fs.writeFileSync('.defaults.json', JSON.stringify(defaults, null, 2));

  db.resultsAndProcess(synonyms, function(err, data) {
    fs.writeFileSync(path.join('out', 'synonyms.txt'), synonyms.join("\n"));
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

        fs.writeFileSync(path.join('out', 'codes.txt'), outputGraph.included().join("\n"));

        var meta = {
          version: package.version,
          name: defaults.listname,
          description: defaults.description,
          author: defaults.name,
          terminologies: defaults.terminologies,
          synonyms: synonyms,
          excludedCodes: outputGraph.excluded()
        };

        fs.writeFileSync(path.join('out', 'meta.json'), JSON.stringify(meta, null, 2));

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
