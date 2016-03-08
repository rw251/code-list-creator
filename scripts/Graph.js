require("./Array.js");

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
    if (this.hasNode(node)) {
      if (value === undefined) {
        return this.graph[node][prop];
      } else {
        this.graph[node][prop] = value;
      }
    }
  };

  this.propDelete = function(node, prop) {
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

  // For a graph G we return an array of connected subgraphs
  this.connectedSubgraphs = function() {
    var i, j, u, v, rtn = [],
      Q = [], G = this;

    G.nodes().forEach(function(node) {
      G.prop(node, "unvisited", true);
    });

    G.nodes().forEach(function(node) {
      if (!G.prop(node, "unvisited")) return;

      var subGraph = new Graph();
      Q.push(node);

      while (Q.length > 0) {
        u = Q.splice(0, 1)[0];
        subGraph.addNode(u, G.node(u));
        var edges = G.prop(u, "children").concat(G.prop(u, "parent"));
        for (i = 0; i < edges.length; i += 1) {
          v = edges[i];
          if (G.prop(v, "unvisited")) {
            G.propDelete(v, "unvisited");
            Q.push(v);
          }
        }
      }
      rtn.push(subGraph);
    });

    return rtn;
  };

  //dfs on tree to output all children
  this.getDescendents = function(v) {
    var i, j, u, status,
      rtn = [],
      G = this,
      Q = [].concat(G.prop(v, "children"));

    G.nodes().forEach(function(node) {
      G.prop(node, "unvisited", true);
    });

    while (Q.length > 0) {
      u = Q.splice(0, 1)[0];

      if (!G.prop(u, "unvisited")) continue;
      G.propDelete(u, "unvisited");

      rtn.push(u);

      for (i = G.prop(u, "children").length - 1; i >= 0; i -= 1) {
        v = G.prop(u, "children")[i];
        if (G.prop(v, "unvisited")) {
          Q.unshift(v);
        }
      }
    }
    return rtn;
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
