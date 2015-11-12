define(['d3', 'js/util'], function(d3, util) {

  'use strict';

  var _collection = [];

  var map = function(list, parent) {
    d3.map(list).forEach(function(key, value) {
      list[key] = layout(value);
      list[key].graph(parent);
    });

    return list;
  };

  var layout = function(spec) {
    var _graph = null;

    var getter = function() {
      return null;
    };

    var setter = function() {
      if (!arguments.length) return null;
      return spec;
    };

    util.defaults(spec, {
      alpha: getter,
      bbox: getter,
      refresh: getter,
      start: getter,
      stop: getter,

      toString: function() {
        return 'Unknown Layout';
      }
    });

    spec.graph = function(value) {
      if (!arguments.length) return _graph;
      _graph = value;
      return spec;
    };

    return spec;
  };

  layout.add = function(list, parent) {
    // Be sure to have a real array, not an arguments object or the like
    list = (list.length === 0 ? [list] : Array.prototype.slice.call(list));
    _collection = map(list, parent);
    return layout;
  };

  layout.collection = function() {
    return _collection;
  };

  return layout;
});
