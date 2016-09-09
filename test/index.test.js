/* jshint esversion:6 */

var db = require('../scripts/db.js'),
  expect = require("chai").expect;

describe('db', function() {

  before(function(done) {
    // runs before all tests in this block
    db.create('testdb', function() {
      db.processDictionaryFiles('testdb', 'test/testdb', function() {
        done();
      });
    });
  });

  describe('#getFromSynonyms()', function() {

    it("should deal with apostrophe", function(done) {
      db.getFromSynonyms({ synonyms: ["felty's"] }, 'testdb', function(err, val) {
        if (err) done(err);
        else done();
      });
    });

    it("should deal with special characters", function(done) {
      db.getFromSynonyms({ synonyms: ["felty's", "fel ty's", "felty-s"] }, 'testdb', function(err, val) {
        if (err) done(err);
        else done();
      });
    });

    it("should not treat hypenated words as negators", function(done) {
      db.getFromSynonyms({ synonyms: ["co-pilot"] }, 'testdb', function(err, val) {
        if (err) done(err);
        else {
          //get list of nodes from graph
          var nodes = val[0].nodes();
          var descriptions = nodes.map(function(v) {
            return val[0].node(v).description.join("|");
          }).join("|");
          expect(descriptions).to.contain('co-pilot');
          done();
        }
      });
    });
  });

  after(function() {
    // runs before all tests in this block
    //db.destroy('testdb');
  });

});
