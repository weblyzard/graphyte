define([
  'd3',
  'layouts/abstract',
  'js/zoombehaviorboundaries'
], function(d3, layout, zoomBehaviorBoundaries) {

  'use strict';

  return function() {
    var _center;
    var _container;
    var _graph;
    var _height;
    var _root;
    var _width;
    var _zbb;
    var _zoom;

    var zoom = function(canvas) {
      _graph = zoom.graph();
      _root = _graph.root();
      _center = _root || _graph.center();
      _height = _graph.height();
      _width = _graph.width();
      _zbb = zoomBehaviorBoundaries();

      // FIXME: replace hard-coded ID
      _zbb.wrapper('#graph');
      _zoom = d3.behavior.zoom()
        .scaleExtent([1, 4])
        .on('zoom', _zbb);

      var canvasNode = canvas.node();
      var parent = d3.select(canvasNode.parentNode);

      // Wrap the canvas in a new group used for zooming in and out
      _container = parent.insert('g')
        .classed('zoomer', true)
        .attr({width: _width, height: _height})
        .append(function() {
          return canvasNode;
        });

      parent.call(_zoom);
      return zoom;
    };

    zoom.refresh = function() {
      var bbox = _graph.bbox();

      // Based on the graphs bounding box, we have to create an extended one
      // which has the root vertex in its center, so we are able to fit the graph
      // into the parent window without translating the graph, only scaling it.
      var o1x = _center.x - bbox.left;
      var o2x = bbox.right - _center.x;
      var o1y = _center.y - bbox.top;
      var o2y = bbox.bottom - _center.y;

      // Here we set a margin by percentage of the original graph width before
      // we had pixel values here but that obviously didn't lead to consistent
      // results with smaller and larger graphs.
      var margin = 0.05;
      var factorX = _width / (Math.max(o1x, o2x) * 2 * (1 + margin));
      var factorY = _height / (Math.max(o1y, o2y) * 2 * (1 + margin));
      var scale = Math.min(factorX, factorY);

      if (scale) {
        var extent = _zoom.scaleExtent();
        scale = extent ? Math.min(scale, extent[1]) : 1;

        var centerX = _width / 2;
        var centerY = _height / 2;
        var tx = centerX - centerX * scale;
        var ty = centerY - centerY * scale;

        var transform = d3.transform();
        transform.scale = scale;
        transform.translate = [tx, ty];

        // Trying to avoid autozoom jittering
        var currentScale = d3.transform(_container.attr('transform')).scale[0];
        var desiredScale = Math.abs(transform.scale / currentScale - 1);
        if (desiredScale > 0.01) {
          _container.attr('transform', transform);
        }
      }

      return zoom;
    };

    zoom.start = function() {
      _zoom.translate([0, 0]).scale(1);
      return zoom;
    };

    zoom.toString = function() {
      return 'MU Zoom Layout';
    };

    return layout(zoom);
  };

});
