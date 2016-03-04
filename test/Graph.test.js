var Graph = require('../scripts/Graph.js'),
  expect = require("chai").expect;

describe('Graph', function() {
  describe('Create', function(){
    it("creates a new graph", function(){
      var g = new Graph();
      expect(g).to.be.a('object');
    });
  });
});
