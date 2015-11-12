define(['d3', 'layouts/abstract'], function(d3, layout) {

  'use strict';

  return function() {

    var _vertices;

    function satellites() {
      return satellites;
    }

    satellites.start = function() {
      var graph = satellites.graph();
      var canvas = graph.canvas();

      _vertices = [];

      graph.vertices().forEach(function(vertex) {
        if (vertex && vertex.satellite) {
          var satellite = {
            type: 'satellite',
            id: vertex.id + '-satellite',
            vertex: vertex,
            fixed: true,
            size: vertex.size
          };

          vertex.satellite = satellite;
          _vertices.push(satellite);
        }
      });

      var domNodes = canvas.selectAll('.satellite')
        .data(_vertices, function(vertex) {
          return vertex.id;
        });

      domNodes.enter()
        .insert('circle', '.edge')
        .classed('satellite', true)
        .attr('r', 2)
        .attr('id', function(vertex) {
          return vertex.id;
        });

      domNodes.exit().remove();

      return satellites;
    };

    satellites.refresh = function() {
      var graph = satellites.graph();
      var canvas = graph.canvas();
      var width = graph.width();
      var height = graph.height();
      var center = graph.center();

      var domNodes = canvas.selectAll('.satellite');

      domNodes.attr({
        transform: function(satellite) {
          // re-position the satellites
          var ref = satellite.vertex;

          var x = ref.x;
          var y = ref.y;

          var sLeft = 10;
          var sRight = 50;
          var sTop = 10;
          var sBottom = 20;
          var dLeft = x - sLeft;
          var dRight = width - x - sRight;
          var dTop = y - sTop;
          var dBottom = height - y - sBottom;

          if (ref.x < width / 2) {
            if (ref.y < height / 2) {
              // top left
              if (dLeft < 0 && dTop < 0) {
                x = Math.min(sLeft, ref.x - 2);
                y = Math.min(sTop, ref.y - 2);
              } else if (dLeft < dTop) {
                x = Math.min(sLeft, ref.x - 2);
              } else {
                y = Math.min(sTop, ref.y - 2);
              }
            } else {
              // bottom left
              if (dLeft < 0 && dBottom < 0) {
                x = Math.min(sLeft, ref.x - 2);
                y = Math.max(height - sBottom, ref.y + 2);
              } else if (dLeft < dBottom) {
                x = Math.min(sLeft, ref.x - 2);
              } else {
                y = Math.max(height - sBottom, ref.y + 2);
              }
            }
          } else {
            if (ref.y < height / 2) {
              // top right
              if (dRight < 0 && dTop < 0) {
                x = Math.max(width - sRight, ref.x + 2);
                y = Math.min(sTop, ref.y - 2);
              } else if (dRight < dTop) {
                x = Math.max(width - sRight, ref.x + 2);
              } else {
                y = Math.min(sTop, ref.y - 2);
              }
            } else {
              // bottom right
              if (dRight < 0 && dBottom < 0) {
                x = Math.max(width - sRight, ref.x + 2);
                y = Math.max(height - sBottom, ref.y + 2);
              } else if (dRight < dBottom) {
                x = Math.max(width - sRight, ref.x + 2);
              } else {
                y = Math.max(height - sBottom, ref.y + 2);
              }
            }
          }

          satellite.x = x;
          satellite.y = y;
          var transform =  d3.transform();
          transform.translate = [satellite.x || center.x, satellite.y || center.y];
          return transform;
        }
      });
    };

    return layout(satellites);
  };

});
