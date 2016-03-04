var Graph = require('../scripts/Graph.js'),
  expect = require("chai").expect;

describe('Graph', function() {

  var g = new Graph();

  describe('Create', function(){
    it("creates a new graph", function(){
      expect(g).to.be.a('object');
    });

    it("has nodes", function(){
      expect(g).to.have.property("nodes").with.length(0);
    });
  });

});
