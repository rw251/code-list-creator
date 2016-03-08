var Graph = require('../scripts/Graph.js'),
  expect = require("chai").expect;

describe('Graph', function() {
  describe('Create', function() {
    var g = new Graph();

    it("creates a new graph", function() {
      expect(g).to.be.a('object');
    });

    it("with nodes", function() {
      expect(g).to.have.property("nodes").that.is.a("function");
      expect(g.nodes()).to.have.length(0);
    });

    it("and functions", function() {
      expect(g).to.have.property("hasNode").that.is.a("function");
      expect(g).to.have.property("addNode").that.is.a("function");
      expect(g).to.have.property("prop").that.is.a("function");
      expect(g).to.have.property("propDelete").that.is.a("function");
      expect(g).to.have.property("merge").that.is.a("function");
      expect(g).to.have.property("included").that.is.a("function");
      expect(g).to.have.property("excluded").that.is.a("function");
    });
  });

  describe("Edit", function() {
    var g = new Graph();

    it("adds nodes", function() {
      expect(g.nodes()).to.have.length(0);
      expect(g.hasNode("node1")).to.equal(false);
      expect(g.hasNode("node2")).to.equal(false);
      expect(g.hasNode("node3")).to.equal(false);
      g.addNode("node1");
      g.addNode("node2");
      expect(g.nodes()).to.have.length(2);
      expect(g.hasNode("node1")).to.equal(true);
      expect(g.hasNode("node2")).to.equal(true);
      expect(g.hasNode("node3")).to.equal(false);
    });

    it("duplicate nodes ignored", function() {
      var n = g.nodes().length;

      expect(g.hasNode("node10")).to.equal(false);

      g.addNode("node10", {
        stuff: false
      });
      g.addNode("node10");

      expect(g.nodes()).to.have.length(n + 1);
      expect(g.hasNode("node10")).to.equal(true);
      expect(g.node("node10")).to.have.property("stuff");

    });

    it("nodes have properties that can be created, edited and deleted", function() {
      g.addNode("node100");
      expect(g.prop("node100", "newprop")).to.equal(undefined);

      g.prop("node100", "newprop", "1000");
      expect(g.prop("node100", "newprop")).to.equal("1000");

      g.prop("node100", "newprop", 33);
      expect(g.prop("node100", "newprop")).to.equal(33);

      g.propDelete("node100", "newprop");
      expect(g.prop("node100", "newprop")).to.equal(undefined);

    });

    it("property edits on unknown nodes do nothing", function() {
      expect(g.hasNode("node1000")).to.equal(false);
      var tempFn = function() {
        g.prop("node1000", "newprop", 123);
      };
      expect(tempFn).to.not.throw(Error);
      expect(g.hasNode("node1000")).to.equal(false);
      var tempDeleteFn = function() {
        g.propDelete("node1000", "newprop");
      };
      expect(tempDeleteFn).to.not.throw(Error);
      expect(g.hasNode("node1000")).to.equal(false);
    });
  });

  describe("Review", function() {
    var g = new Graph();
    g.addNode("1", {
      include: true
    });
    g.addNode("2", {
      include: false
    });
    g.addNode("3", {
      include: true
    });
    g.addNode("4", {
      include: false
    });

    it("identifies included nodes", function() {
      expect(g.included()).to.have.length(2).and.to.include("1").and.to.include("3");
    });

    it("identifies excluded nodes", function() {
      expect(g.excluded()).to.have.length(2).and.to.include("2").and.to.include("4");
    });

  });

  describe("Merge", function() {
    var g1 = new Graph();
    g1.addNode("1", {
      include: true
    });
    g1.addNode("2", {
      include: false
    });
    var g2 = new Graph();
    g2.addNode("a", {
      include: true
    });
    g2.addNode("b", {
      include: false
    });

    it("merges", function(){
      var g3 = Graph.merge([g1,g2]);

      expect(g3.nodes()).to.have.length(4).and.to.include("1").and.to.include("a");
      expect(g3.included()).to.have.length(2).and.to.include("1").and.to.include("a");
      expect(g3.excluded()).to.have.length(2).and.to.include("2").and.to.include("b");
    });
  });

});
