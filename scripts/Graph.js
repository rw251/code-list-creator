//Polyfill the array check for IE<9
if (!Array.isArray) {
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
}

var Graph = function() {
  this.graph = {};

  this.nodes = function() {
    return Object.keys(this.graph);
  };

  this.hasNode = function(node) {
    return this.nodes().indexOf(node) > -1;
  };

  this.addNode = function(nodeName, node) {
    //Add node to graph if not already exists
    if (!this.hasNode(nodeName)) {
      if (node) {
        //adding an existing node
        this.graph[nodeName] = node;
      } else {
        //adding a new node
        this.graph[nodeName] = {
          description: [],
          children: [],
          parent: []
        };
      }
    }
  };

  this.prop = function(node, prop, value) {
    //Add node to graph if not already exists
    if (this.hasNode(node)) {
      if (value === undefined) {
        return this.graph[node][prop];
      } else {
        this.graph[node][prop] = value;
      }
    }
  };

  this.propDelete = function(node, prop) {
    //Add node to graph if not already exists
    if (this.hasNode(node)) {
      delete this.graph[node][prop];
    }
  };

  this.node = function(nodeName) {
    return this.graph[nodeName];
  };

  this.merge = function(graphs) {
    var self = this;
    if (!Array.isArray(graphs)) {
      graphs = [graphs];
    }
    graphs.forEach(function(graph) {
      graph.nodes().forEach(function(node) {
        self.addNode(node, graph.node(node));
      });
    });
  };

  this.included = function() {
    var self = this;
    return [].concat(this.nodes().filter(function(node) {
      return self.node(node).include;
    }));
  };

  this.excluded = function() {
    var self = this;
    return [].concat(this.nodes().filter(function(node) {
      return !self.node(node).include;
    }));
  };
};

Graph.merge = function(graphs) {
  var g = new Graph();
  g.merge(graphs);
  return g;
};

var toMeta = function(graphs) {
  //  var rtn =
};

module.exports = Graph;
