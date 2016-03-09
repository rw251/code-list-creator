/* jshint node: true */
"use strict";

var fs = require('fs'),
  path = require('path');

module.exports = {

  getDefaults: function() {
    var defaults = {};
    try {
      defaults = JSON.parse(fs.readFileSync('.defaults.json').toString());
    } catch (e) {
      defaults = {};
    }
    return defaults;
  },

  setDefaults: function(defaults) {
    fs.writeFileSync('.defaults.json', JSON.stringify(defaults, null, 2));
  },

  getSynonyms: function(file) {
    if (!file) file = path.join('in', 'synonyms.txt');
    return fs.readFileSync(file).toString().replace(/\r\n/g, '\n').split('\n').filter(function(el) {
      return el.search(/^\s*$/) === -1;
    });
  },

  writeSynonyms: function(synonyms, file) {
    if (!file) file = path.join('out', 'synonyms.txt');
    fs.writeFileSync(file, synonyms.join("\n"));
  },

  writeCodes: function(outputGraph, file) {
    if (!file) file = path.join('out', 'codes.txt');
    fs.writeFileSync(file, outputGraph.included().join("\n"));
  },

  writeMetadata: function(metadata, file) {
    if (!file) file = path.join('out', 'meta.json');
    fs.writeFileSync(file, JSON.stringify(metadata, null, 2));
  }

};
