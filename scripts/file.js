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

  getSynonyms: function(file) {
    if (!file) file = path.join('in', 'synonyms.txt');
    try {
      return fs.readFileSync(file).toString().replace(/\r\n/g, '\n').split('\n').filter(function(el) {
        return el.search(/^\s*$/) === -1;
      });
    } catch(e) {
      return [];
    }
  },

  writeSynonyms: function(synonyms, file) {
    if (!file) file = path.join('out', 'synonyms.txt');
    fs.writeFileSync(file, synonyms.join("\n"));
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
