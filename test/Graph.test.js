var Graph = require('../scripts/Graph.js'),
  expect = require("chai").expect;

describe('Graph', function() {

  var g = new Graph();

  describe('Create', function(){
    it("creates a new graph", function(){
      expect(g).to.be.a('object');
    });

    it("with nodes", function(){
      expect(g).to.have.property("nodes").with.length(0);
    });

    it("and functions", function(){
      expect(g).to.have.property("hasNode").that.is.a("function");
      expect(g).to.have.property("addNode").that.is.a("function");
      expect(g).to.have.property("prop").that.is.a("function");
      expect(g).to.have.property("propDelete").that.is.a("function");
      expect(g).to.have.property("merge").that.is.a("function");
      expect(g).to.have.property("included").that.is.a("function");
      expect(g).to.have.property("excluded").that.is.a("function");
    });
  });

});
