define(['d3', 'layouts/abstract'], function(d3, layout) {

  'use strict';

  return function() {

    var radial = function() {
      return radial;
    };

    radial.refresh = function() {
      var graph = radial.graph();

      graph.vertices().forEach(function(vertex) {
        if (!vertex.root) {
          var c = graph.center();
          var dx = vertex.x - c.x;
          var dy = vertex.y - c.y;
          var v = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
          var annulus = vertex.level * graph.maxEdgeLength();
          if (v < annulus) {
            var dv = annulus - v;
            var x = dx / v;
            var y = dy / v;
            vertex.x += x * dv;
            vertex.y += y * dv;
          }
        }
      });

      return radial;
    };

    radial.toString = function() {
      return 'MU Radial Layout';
    };

    return layout(radial);
  };
});

