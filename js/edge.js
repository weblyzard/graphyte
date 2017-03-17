define(function(require) {
  var util = require('js/util');

  'use strict';

  var edge = function(spec, graph) {

    util.defaults(spec, {
      name: [spec.source.name, spec.target.name].join('-'),
      source: spec.source,
      target: spec.target,
      eventHandler: graph.eventHandler(),
      style: {}
    });

    spec.type = 'edge';

    if (!spec.name) spec.name = util.getId(spec.type);

    spec.toString = function() {
      return ['[Edge', this.source.name, '→', this.target.name + ']'].join(' ');
    };

    return spec;
  };

  return edge;
});
