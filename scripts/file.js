/* jshint node: true, esversion:6 */
"use strict";

var fs = require('fs'),
  path = require('path');
const DEFAULT_FILE = '.defaults.json';

module.exports = {

  getDefaults: function(file) {
    if (!file) file = DEFAULT_FILE;
    var defaults = {};
    try {
      defaults = JSON.parse(fs.readFileSync(file).toString());
    } catch (e) {
      defaults = {};
    }
    return defaults;
  },

  setDefaults: function(defaults, file) {
    if (!file) file = DEFAULT_FILE;
    fs.writeFileSync(file, JSON.stringify(defaults, null, 2));
  },

  writeCodes: function(outputGraph, file) {
    if (!file) file = path.join('out', 'codes.txt');
    fs.writeFileSync(file, outputGraph.included().join("\n"));
  },

  loadMetadata: function(file){
    return JSON.parse(fs.readFileSync(file).toString());
  },

  writeMetadata: function(metadata, file) {
    if (!file) file = path.join('out', 'meta.json');
    fs.writeFileSync(file, JSON.stringify(metadata, null, 2));
  }

};
