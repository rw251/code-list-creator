/* jshint esversion:6 */

var file = require('../scripts/file.js'),
  expect = require("chai").expect,
  fs = require('fs');

const DEFAULT_FILE = '.temp.default.json';
const SYNONYM_FILE = '.temp.synonyms.txt';

describe('file', function() {
  it("loads defaults if not exists", function() {
    expect(file.getDefaults(DEFAULT_FILE)).to.deep.equal({});

    describe('file', function() {
      it("sets new defaults", function() {
        file.setDefaults({
          name: "defaultName"
        }, DEFAULT_FILE);
        expect(file.getDefaults(DEFAULT_FILE)).to.deep.equal({
          name: "defaultName"
        });

        fs.unlinkSync(DEFAULT_FILE);
      });
    });
  });

  it("reads and writes synonyms", function() {
    expect(file.getSynonyms(SYNONYM_FILE)).to.be.a("array").with.length(0);

    file.writeSynonyms(["red", "crimson"], SYNONYM_FILE);

    expect(file.getSynonyms(SYNONYM_FILE)).to.be.a("array").with.length(2).and.to.include("red");

    fs.unlinkSync(SYNONYM_FILE);
  });
});
