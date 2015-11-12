define(['d3', 'layouts/abstract'], function(d3, layout) {

  'use strict';

  return function(/*config*/) {

    var force = function() {
      return force;
    };

    var _autoCharge = 0;
    var _engine = d3.layout.force();

    // Add force methods as-is to the wrapper method
    d3.map(_engine).forEach(function(key/*, value*/) {
      var method = _engine[key];
      if (method instanceof Function === false) return;
      force[key] = function() {
        if (!arguments.length) return method.call(this);
        method.apply(this, arguments);
        return force;
      };
    });

    force.on('tick', function() {
      // FIXME: Should we do something here?
    });

    force.on('end', function() {
      if (force.graph().debug()) {
        console.info('%s cooled down in %i milliseconds', force, new Date() -
          force.graph().time());
      }
    });

    force.start = function() {
      var graph = force.graph();
      force.nodes(graph.vertices());
      force.links(graph.edges());
      force.size([graph.width(), graph.height()]);
      _engine.start();
      return force;
    };

    force.engine = function() {
      return _engine;
    };

    force.autoCharge = function(value) {
      if (!arguments.length) return _autoCharge;
      _autoCharge = value;
      return force;
    };

    force.toString = function() {
      return 'D3 Force-Directed Layout Wrapper';
    };

    // Fixing terminology
    force.vertices = force.nodes;
    force.edges = force.links;
    force.edgeLength = force.linkDistance;
    force.edgeWeight = force.linkStrength;

    return layout(force);
  };
});
