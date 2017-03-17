define(function(require) {
  var d3 = require('d3');
  var layout = require('layouts/abstract');

  'use strict';

  return function() {

    var _alignment = 'parent';
    var _debug = false;
    var _lineHeight = 13;
    var _maxWidth = 0;
    var _maxLength = 18;
    var _outlines = true;

    var labels = function() {
      return labels;
    };

    var wrap = function(element, text) {
      var lines = text.split(' ');

      // Merge any lines which are < lineLength and add them as extra tspan (ie. create linebreaks)
      lines = lines.reduce(function(accumulator, line) {
        if (accumulator.length === 0) {
          accumulator.push(line);
        } else {
          var lastLine = accumulator[accumulator.length - 1];
          if (lastLine.length + line.length < _maxLength) {
            accumulator.pop();
            accumulator.push(lastLine + ' ' + line);
          } else {
            accumulator.push(line);
          }
        }

        return accumulator;
      }, []);

      lines.forEach(function(line, index) {
        var dy = index > 0 ? _lineHeight : 0;
        element.append('tspan')
          .attr({
            x: 0,
            dy: dy
          })
          .text(line);
      });

      return;
    };

    labels.start = function() {
      var graph = labels.graph();
      var canvas = graph.canvas();
      var vertexElements = canvas.selectAll('g.vertex')
        .data(graph.vertices(), function(vertex) {
          return vertex.name;
        });

      vertexElements.each(function(vertex) {
        var vertexElement = graph.select(vertex);
        vertexElement.selectAll('g.label').remove();

        var group = vertexElement.append('g')
          .classed('label', true);

        // We are switching the outlines off during _force calculation and on again afterwards.
        if (_outlines) {
          group.append('text')
            .classed('matte', true)
            .attr('y', '0.5em')
            .call(wrap, vertex.name);
        }

        group.append('text')
          .attr('y', '0.5em')
          .call(wrap, vertex.name);
      });

      // Do not display label mattes when using the force, Luke!
      canvas.selectAll('g.label .matte').style('display', 'none');
    };

    labels.stop = function() {
      var graph = labels.graph();
      var canvas = graph.canvas();

      canvas.selectAll('g.label .matte').each(function () {
        var label = d3.select(this);
        if (label.style('display') !== 'block') {
          label.style({
            display: 'block',
            opacity: 0
          }).transition().style('opacity', 1);
        }
      });

      return labels;
    };

    labels.refresh = function(selection) {
      var graph = labels.graph();
      var canvas = graph.canvas();
      var labelElements = selection.selectAll('.label');

      var translate = function(label, vertex) {
        var LABEL_OFFSET_X = 5;
        var LABEL_OFFSET_Y = 5;
        var origin = graph.root() || graph.center();

        if (_alignment === 'parent' && vertex.predecessors.length) {
          origin = vertex.predecessors[0];
        }

        var vertexBbox = vertex.bbox();
        var bbox = labels.bbox(vertex);
        var width = bbox.width + LABEL_OFFSET_X * 2;
        var height = bbox.height + LABEL_OFFSET_Y * 2;
        var halfWidth = width / 2;
        var halfHeight = height / 2;
        var dx = origin.x - vertex.x;
        var dy = origin.y - vertex.y;
        var slope = dx !== 0 ? dy / dx : dy > 0 ? halfHeight : -halfHeight;

        var signum = dx < 0 ? 1 : -1;
        var x = halfWidth * halfHeight / Math.sqrt(Math.pow(halfHeight, 2) +
          Math.pow(halfWidth, 2) * Math.pow(slope, 2)) * signum;
        var y = dx === 0 && dy === 0 ? -halfHeight : x * slope;

        var fx = x - halfWidth + LABEL_OFFSET_X - vertexBbox.width / 2;
        var fy = y - halfHeight + LABEL_OFFSET_Y + vertexBbox.height / 2;

        var transform = d3.transform();
        transform.translate = [fx, fy];
        return transform;
      };

      labelElements.attr({
        transform: function(vertex) {
          return translate(this, vertex);
        }
      });

      if (_debug && graph.running()) {
        var debugElement = graph.debug.element();

        var bboxes = graph.vertices().map(function(vertex) {
          return labels.bbox(vertex);
        });

        var debugRects = debugElement.selectAll('.layout-label')
          .data(graph.vertices(), function(vertex) {
            return vertex.name;
          });

        debugRects.enter()
          .append('rect')
          .attr({
            class: 'layout-label',
            fill: 'none',
            stroke: '#0f0'
          });

        debugRects.attr({
          x: function(vertex, index) {
            return bboxes[index].left;
          },

          y: function(vertex, index) {
            return bboxes[index].top;
          },

          width: function(vertex, index) {
            return bboxes[index].width;
          },

          height: function(vertex, index) {
            return bboxes[index].height;
          }
        });

        debugRects.exit().remove();
      }

      return labels;
    };

    labels.bbox = function(vertex) {
      var graph = labels.graph();
      var vertexElement = graph.select(vertex);
      var label = vertexElement.select('.label');
      var node = label.node();

      if (node) {
        var svgRect = node.getBBox();
        var translate = d3.transform(label.attr('transform')).translate;
        var vertexBbox = vertex.bbox();

        var bbox = {
          width: svgRect.width,
          height: svgRect.height,
          left: vertexBbox.cx + translate[0],
          top: vertexBbox.cy + translate[1]
        };

        bbox.right = bbox.left + bbox.width;
        bbox.bottom = bbox.top + bbox.height;
        return bbox;
      }
    };

    labels.alignment = function(value) {
      if (!arguments.length) return _alignment;
      _alignment = value;
      return labels;
    };

    labels.lineHeight = function(value) {
      if (!arguments.length) return _lineHeight;
      _lineHeight = value;
      return labels;
    };

    labels.maxLength = function(value) {
      if (!arguments.length) return _maxLength;
      _maxLength = value;
      return labels;
    };

    labels.outlines = function(value) {
      if (!arguments.length) return _outlines;
      _outlines = value;
      return labels;
    };

    labels.debug = function(value) {
      if (!arguments.length) return _debug;
      _debug = value;
      return labels;
    };

    labels.toString = function() {
      return 'MU Labels Layout';
    };

    return layout(labels);
  };

});
