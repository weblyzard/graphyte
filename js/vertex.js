define([
  'd3',
  'js/svg',
  'js/util'
], function(
  d3,
  svg,
  util
) {

  'use strict';

  var vertex = function(spec, graph) {

    util.defaults(spec, {
      eventHandler: graph.eventHandler(),
      graph: graph,
      name: '',
      level: 0,
      size: 3,
      fixed: false,
      predecessors: [],

      shape: function() {
        return document.createElementNS(svg.NAMESPACE, 'circle');
      },

      style: {},
      successors: [],
      x: 0,
      y: 0
    });

    spec.root = false;
    spec.type = 'vertex';
    spec.name = spec.name ? String(spec.name) : util.getId(spec.type);

    spec.bbox = function() {
      var group = graph.select(this);
      var vertex = group.select('circle');
      var node = vertex.node();
      var svgRect = node.getBBox();
      var translate = d3.transform(group.attr('transform')).translate;

      var bbox = {
        width: svgRect.width,
        height: svgRect.height,
        left: translate[0] - svgRect.width / 2,
        top: translate[1] -  svgRect.height / 2
      };

      bbox.right = bbox.left + bbox.width;
      bbox.bottom = bbox.top + bbox.height;
      bbox.cx = bbox.left + bbox.width / 2;
      bbox.cy = bbox.top + bbox.height / 2;
      return bbox;
    };

    spec.toString = function() {
      return [
        '[Vertex', this.name + ':',
        this.successors.length,
        'outgoing,',
        this.predecessors.length,
        'incoming]'
      ].join(' ');
    };

    return spec;
  };

  return vertex;
});
