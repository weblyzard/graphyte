define(function(require, exports, module) {
  'use strict';

  var dot = {};

  var checkDepencendies = function() {
    if (typeof graphlibDot === 'undefined') {
      throw Error('The GraphViz Dot Language library is not loaded. Add `<script src="/node_modules/graphlib-dot/dist/graphlib-dot.js"></script>` _before_ the script element for RequireJS.');
    }
  };

  dot.fromString = function(data) {

    checkDepencendies();

    var dotNetwork = graphlibDot.read(data);
    var dotNodes = dotNetwork.nodes();

    var network = {
      vertices: dotNodes.map(function(vertex) {
        return {
          name: vertex
        };
      })
    };

    network.edges = dotNetwork.edges().map(function(edge) {
      return {
        source: network.vertices.find(function(vertex) {
          return vertex.name === edge.v;
        }),
        target: network.vertices.find(function(vertex) {
          return vertex.name === edge.w;
        })
      };
    });

    return network;
  };

  dot.toString = function(graph) {

    checkDepencendies();

    var dotGraph = new graphlibDot.graphlib.Graph();

    graph.vertices().forEach(function(vertex) {
      dotGraph.setNode(vertex.name);
    });

    graph.edges().forEach(function(edge) {
      dotGraph.setEdge(edge.source.name, edge.target.name);
    });

    return graphlibDot.write(dotGraph);
  };

  return dot;
});
