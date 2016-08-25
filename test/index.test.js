/* jshint esversion:6 */

var db = require('../scripts/db.js'),
  expect = require("chai").expect;

describe('db', function() {
  describe('#getFromSynonyms()', function() {

    it("should deal with apostrophe", function(done) {
      db.getFromSynonyms({ synonyms: ["felty's"] }, function(err, val) {
        if (err) done(err);
        else done();
      });
    });

    it("should deal with special characters", function(done) {
      db.getFromSynonyms({ synonyms: ["felty's", "fel ty's", "felty-s"] }, function(err, val) {
        if (err) done(err);
        else done();
      });
    });
  });

});
