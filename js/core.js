define([
  'd3',
  'js/util',
  'js/vertex',
  'js/edge',
  'js/pajek',
  'js/dot',
  'layouts/abstract'
], function(
  d3,
  util,
  vertex,
  edge,
  pajek,
  dot,
  layout
) {

  'use strict';

  return function(config) {
    if (!config) config = {};

    util.enableAnimation();

    var _alpha = 0.01;
    var _arrows = false;
    var _canvas;
    var _data = {};
    var _debug = false;
    var _debugElement = null;
    var _dispatch = d3.dispatch('start', 'refresh', 'end');
    var _dragging = false;
    var _height = 600;
    var _edges = [];
    var _edgeLength = 15;
    var _root = null;
    var _running = false;
    var _selection = d3.select('body');
    var _time;
    var _width = 800;
    var _vertices = [];

    var _eventHandler = function() { };

    var graph = function(selection) {

      if (selection) {
        _selection = selection;
      }

      _selection.each(function(data) {
        // FIXME: Is this useful to set up the graph with edges data only?
        // (I.e. the vertices are only defined as two endpoints of each edge.)
        // Would it be more useful to set up the graph with vertices only?
        // (Which would mean no edges between the vertices.)
        // Or is this utterly useless, anyway?
        if (data) {
          graph.edges(data);
        }

        if (!d3.select(this).select('svg').node()) {
          var container = d3.select(this);
          var containerId = container.attr('id');
          if (!containerId) {
            containerId = util.getId('parent');
            container.attr('id', containerId);
          }

          var svg = container.append('svg')
            .attr({
              width: _width,
              height: _height,
              'pointer-events': 'all'
            });

          var canvas = svg.append('g').classed('canvas', true);

          if (_arrows) {
            // Add def for arrow
            svg.append('defs')
               .append('marker')
                .attr('id', 'graphyte-arrow-def')
                .attr('viewBox', '0 -5 10 10')
                .attr('refX', 10)
                .attr('refY', 0)
                .attr('markerWidth', 6)
                .attr('markerHeight', 6)
                .attr('orient', 'auto')
              .append('path')
                .attr('d', 'M0,-5L10,0L0,5 z');
          }

          layout.collection().forEach(function(l) {
            canvas.call(l);
          });
        }
      });

      if (!_canvas) _canvas = _selection.selectAll('.canvas');

      if (_debug && !_debugElement) {
        _debugElement = _canvas.append('g')
          .classed('graphyte-debug', true);
      } else if (!_debug && _debugElement) {
        _debugElement.remove();
        _debugElement = null;
      }

      graph.start();
    };

    var getId = function(data) {
      return util.getId(data.type, data.name);
    };

    var refresh = function() {
      graph.data.bbox = {
        left: 0,
        right: _width,
        top: 0,
        bottom: _height
      };

      _dispatch.refresh();

      if (!_dragging) {
        layout.collection().forEach(function(l) {
          l.refresh(_selection);
        });
      }

      var vertices = _canvas.selectAll('g.vertex');
      var edges = _canvas.selectAll('line.edge');

      vertices.attr('transform', function(vertex) {
        var center = _root || graph.center();

        if (!vertex.root) {
        } else if (vertex.root && _root) {
          center = graph.center();
          _root.x = _root.px = center.x;
          _root.y = _root.py = center.y;
        }

        var transform =  d3.transform();
        transform.translate = [vertex.x || center.x, vertex.y || center.y];
        return transform;
      });

      edges.attr({
        x1: function(edge) {
          return edge.source.x || 0;
        },

        y1: function(edge) {
          return edge.source.y || 0;
        },

        x2: function(edge) {
          if (_arrows) {
            var dx = edge.target.x - edge.source.x;
            var dy = edge.target.y - edge.source.y;
            var cos = dx && dy ? dx / Math.sqrt(dx * dx + dy * dy) : 0;
            return edge.target.x - edge.target.size * cos;
          }
          return edge.target.x || 0;
        },

        y2: function(edge) {
          if (_arrows) {
            var dx = edge.target.x - edge.source.x;
            var dy = edge.target.y - edge.source.y;
            var sin = dx && dy ? dy / Math.sqrt(dx * dx + dy * dy) : 0;
            return edge.target.y - edge.target.size * sin;
          }
          return edge.target.y || 0;
        }
      });

      if (_debug && _running && graph.count()) {
        // Visually debugging bounding boxes of vertices
        var bboxes = graph.vertices().map(function(vertex) {
          return graph.bbox(vertex);
        });

        var verticeRects = _debugElement.selectAll('.debug-vertex')
          .data(bboxes);

        verticeRects.enter()
          .append('rect')
          .attr({
            class: 'debug-vertex',
            fill: 'none',
            stroke: '#0f0'
          });

        verticeRects.attr({
          x: function(rect) {
            return rect.left;
          },

          y: function(rect) {
            return rect.top;
          },

          width: function(rect) {
            return rect.width;
          },

          height: function(rect) {
            return rect.height;
          }
        });

        // Visually debug bounding box of whole graph
        var graphRects = _debugElement.selectAll('.debug-graph')
          .data([graph.bbox()]);

        graphRects
          .enter()
          .append('rect')
          .attr({
            class: 'debug-graph',
            fill: 'none',
            stroke: '#0f0'
          });

        graphRects.attr({
          x: function(rect) {
            return rect.left;
          },

          y: function(rect) {
            return rect.top;
          },

          width: function(rect) {
            return rect.width;
          },

          height: function(rect) {
           return rect.height;
         }
        });
      }

      if (_alpha && _running) {
        var compoundAlpha = layout.collection().map(function(l) {
          return l.alpha();
        }).reduce(function(alpha1, alpha2) {
          return Math.max(alpha1, alpha2);
        });

        if (compoundAlpha < _alpha) {
          graph.stop();

          _dispatch.end();

          _eventHandler.call(graph, {
            type: 'freeze'
          });
        }
      }
    };

    var VertexCounter = function(collection) {
      return function countVertices(vertex, depth, result) {
        if (!arguments.length) throw 'Insufficient arguments';
        if (!util.isNumeric(depth)) depth = Infinity;
        if (!Array.isArray(result)) result = [];
        vertex[collection].forEach(function(vertex) {
          if (result.indexOf(vertex) < 0) {
            result.push(vertex);
            depth -= 1;
            if (depth > 0) {
              countVertices(vertex, depth, result);
            }
          }
        });

        return result;
      };
    };

    // FIXME: Needed? Good idea? Make private?
    graph.predecessors = VertexCounter('predecessors');
    graph.successors = VertexCounter('successors');

    graph.root = function(vertex) {
      if (!arguments.length) return _root;
      if (_root) {
        _root.root = _root.fixed = false;
      }

      if (vertex) {
        if (!graph.contains(vertex)) graph.add(vertex);

        var center = graph.center();
        vertex.x = vertex.px = center.x;
        vertex.y = vertex.py = center.y;

        vertex.root = vertex.fixed = true;
      }

      _root = vertex;
      return graph;
    };

    graph.time = function() {
      return _time;
    };

    graph.add = function(spec) {
      vertex(spec, graph);
      _vertices.push(spec);
      return spec;
    };

    graph.get = function(spec1, spec2) {
      if (!spec1) throw Error('Insufficient arguments');
      if (!spec1.name) return;
      if (!spec1.type) spec1.type = 'vertex';
      if (!spec2) {
        var vertices = graph.filter(spec1);
        return vertices[0];
      } else {
        if (!spec2.type) spec2.type = 'vertex';
        var edges = graph.filter({
          type: 'edge',
          source: graph.filter(spec1)[0],
          target: graph.filter(spec2)[0]
        });
        return edges[0];
      }

      return;
    };

    graph.remove = function(vertices) {
      if (!Array.isArray(vertices)) {
        vertices = util.arrayFrom(vertices);
      }

      vertices.forEach(function(dirty) {
        dirty.successors.forEach(function(vertex) {
          graph.disconnect(dirty, vertex);
        });

        dirty.predecessors.forEach(function(vertex) {
          graph.disconnect(vertex, dirty);
        });

        _vertices = util.reject(_vertices, dirty);
      });

      return graph;
    };

    graph.connect = function(source, target, spec) {
      if (!spec) spec = {};
      source = graph.get(source) || graph.add(source);
      target = graph.get(target) || graph.add(target);
      if (!graph.connects(source, target)) {
        spec.source = source;
        spec.target = target;

        _edges.push(edge(spec, graph));
        source.successors.push(target);
        target.predecessors.push(source);
        target.level = d3.min(target.predecessors.map(function(vertex) {
          return vertex.level;
        })) + 1;

        // The following lines distribute new vertices 90°-wise within edge
        // distance around their parent (or the window center)
        var x = source.x;
        var y = source.y;

        // Use the angle of the window diagonal as offset (degrees)
        var slant = Math.atan(_width / _height) * 180 / Math.PI;

        // Add 90° for each successor (radians)
        var theta = (slant + (source.successors.length - 1) * 90 % 360) * Math.PI / 180;

        // Set new coordinates using a multiple of the edge distance
        // (based on the vertex’ level) and the calculated angle
        var distanceFactor = 1 / target.level;
        x += _edgeLength * distanceFactor * Math.cos(theta);
        y += _edgeLength * distanceFactor * Math.sin(theta);
        target.x = target.px = x;
        target.y = target.py = y;
      }

      return graph;
    };

    graph.disconnect = function(source, targets) {
      if (!source && !targets) {
        _edges.length = 0;
        _vertices.map(function(vertex) {
          vertex.successors.length = vertex.predecessors.length = 0;
        });
      }

      if (!Array.isArray(targets)) targets = Array.prototype.slice.call(arguments, 1);
      targets.forEach(function(target) {
        if (graph.connects(source, target)) {
          source.successors = util.reject(source.successors, target);
          target.predecessors = util.reject(target.predecessors, source);
          _edges = util.reject(_edges, graph.get(source, target));
        }
      });

      return graph;
    };

    graph.connects = function(source, target, direction) {
      var incoming = !!graph.get(source, target);
      if (direction) {
        var outgoing = !!graph.get(target, source);
        if (direction === 'any') {
          return incoming || outgoing;
        } else if (direction === 'both') {
          return incoming && outgoing;
        }
      }

      return incoming;
    };

    graph.indexOf = function(vertex) {
      return _vertices.map(getId).indexOf(vertex.name);
    };

    graph.contains = function(vertex) {
      return graph.indexOf(vertex) > -1;
    };

    graph.select = function(spec) {
      var items = graph.filter(spec);

      if (!items || items.length < 1) {
        return null;
      }

      var target = items[0];
      if (spec.type === 'vertex') {
        return _canvas.selectAll('g.vertex')
          .filter(function(vertex) {
            return vertex === target;
          });
      } else if (spec.type === 'edge') {
        return _canvas.selectAll('line')
          .filter(function(edge) {
            return edge === target;
          });
      }
    };

    graph.count = function() {
      return _vertices.length;
    };

    graph.filter = function(spec) {
      if (!spec) throw Error('Insufficent arguments');

      var collectionName = {
        vertex: 'vertices',
        edge: 'edges'
      }[spec.type];

      if (collectionName) {
        var collection = graph[collectionName]();

        return collection.filter(function(item) {
          for (var key in spec) {
            if (spec[key] && spec[key] !== item[key]) {
              return false;
            }
          }

          return true;
        });
      }

      return [];
    };

    graph.center = function() {
      return {
        x: _width / 2,
        y: _height / 2
      };
    };

    graph.reduce = function(threshold) {
      if (!util.isNumeric(threshold)) threshold = 0;
      _vertices.forEach(function(vertex) {
        var allDegree = vertex.predecessors.length + vertex.successors.length;

        if (!vertex.root && allDegree <= threshold) {
          graph.remove(vertex);
        }
      });

      return graph;
    };

    graph.start = function() {
      graph.stop();

      _time = new Date();
      _running = true;

      _selection.each(function(/*d, i*/) {
        var svg = d3.select(this).select('svg');
        if (_width - svg.attr('width') || _height - svg.attr('height')) {
          svg.attr({width: _width, height: _height});
          if (_root) {
            var center = graph.center();
            var dx = center.x - _root.x;
            var dy = center.y - _root.y;
            _root.px = _root.x = center.x;
            _root.py = _root.y = center.y;
            _vertices.forEach(function(vertex) {
              if (!vertex.root) {
                vertex.px = vertex.x += dx;
                vertex.py = vertex.y += dy;
              }
            });
          }
        }

        _dispatch.start();
      });

      var vertices = _canvas.selectAll('g.vertex')
        .data(_vertices, getId);

      var newVertices = vertices.enter()
        .insert('g', '.root')
        .classed('vertex', true)
        .classed('root', function(vertex) {
          return vertex.root;
        })
        .attr('id', getId)
        .on('mouseover', function(vertex) {
          d3.select(this).classed('focus', true);
          return vertex.eventHandler.call(graph, d3.event, vertex);
        })
        .on('mouseout', function(vertex) {
          d3.select(this).classed('focus', false);
          return vertex.eventHandler.call(graph, d3.event, vertex);
        })
        .on('mousedown', function(vertex) {
          _dragging = true;
          return vertex.eventHandler.call(graph, d3.event, vertex);
        })
        .on('mouseup', function(vertex) {
          _dragging = false;
          graph.start();
          return vertex.eventHandler.call(graph, d3.event, vertex);
        })
        .on('click', function(vertex) {
          if (vertex.timer) clearTimeout(vertex.timer);
          var event = d3.event;
          event.preventDefault();

          vertex.timer = setTimeout(function() {
            return vertex.eventHandler.call(graph, event, vertex);
          }, 250);

          return vertex.time;
        })
        .on('dblclick', function(vertex) {
          if (vertex.timer) clearTimeout(vertex.timer);
          return vertex.eventHandler.call(graph, d3.event, vertex);
        });

      newVertices.append('circle');

      layout.collection().forEach(function(l) {
        var drag = l.drag;
        if (!drag) return;
        newVertices.filter(function(vertex) {
          return !vertex.root;
        }).call(drag);
      });

      vertices.exit().remove();

      vertices.each(function(vertex) {
        d3.select(this).select('circle')
          .attr('r', vertex.size)
          .style(vertex.style);
      });

      var edges = _canvas.selectAll('line.edge')
        .data(_edges, getId);

      edges.enter()
        .insert('line', '.vertex')
        .attr('class', 'edge enter')
        .style('marker-end', _arrows ? 'url(#graphyte-arrow-def)' : null)
        .on('click', function(edge) {
          return edge.eventHandler.call(graph, d3.event, edge);
        })
        .on('dblclick', function(edge) {
          return edge.eventHandler.call(graph, d3.event, edge);
        })
        .on('mouseover', function(edge) {
          d3.select(d3.event.target).classed('focus', true);
          return edge.eventHandler.call(graph, d3.event, edge);
        })
        .on('mouseout', function(edge) {
          d3.select(d3.event.target).classed('focus', false);
          return edge.eventHandler.call(graph, d3.event, edge);
        });

      edges.exit().remove();

      edges.each(function(edge) {
        d3.select(this).style(edge.style);
      });

      layout.collection().forEach(function(l) {
        l.start(_selection);
      });

      d3.timer(refresh);
      return graph;
    };

    graph.stop = function() {
      if (_running) {
        layout.collection().forEach(function(l) {
          return l.stop();
        });

        _running = false;
      }

      return graph;
    };

    graph.clear = function() {
      graph.stop();
      graph.remove(_vertices);
      _canvas.selectAll('*').remove();
      _root = null;
      return graph;
    };

    graph.layout = function() {
      if (!arguments.length) return layout.collection();
      layout.add(arguments, graph);
      return graph;
    };

    graph.vertices = function(vertices) {
      if (!arguments.length) return _vertices;
      _vertices.length = 0;
      vertices.forEach(function(vertex) {
        graph.add(vertex);
      });

      return graph;
    };

    graph.edges = function(edges) {
      if (!arguments.length) return _edges;
      _edges.length = 0;

      edges.forEach(function(edge) {
        graph.connect(edge.source, edge.target, edge);
      });

      return graph;
    };

    graph.debug = function(value) {
      if (!arguments.length) return _debug;
      _debug = value;
      if (_debug) {
        window.d3 = d3;
        window.graph = graph;
        window.layout = layout;
      } else {
        window.d3 = window.graph = window.layout = null;
      }

      return graph;
    };

    graph.debug.element = function() {
      return _debugElement;
    };

    graph.alpha = function(value) {
      if (!arguments.length) return _alpha;
      _alpha = value;
      return graph;
    };

    graph.arrows = function(value) {
      if (!arguments.length) return _arrows;
      _arrows = value;
      return graph;
    };

    graph.canvas = function(value) {
      if (!arguments.length) return _canvas;
      _canvas = value;
      return graph;
    };

    graph.data = function(value) {
      if (!arguments.length) return _data;
      _data = value;
      return graph;
    };

    graph.eventHandler = function(value) {
      if (!arguments.length) return _eventHandler;
      _eventHandler = value;
      return graph;
    };

    graph.height = function(value) {
      if (!arguments.length) return _height;
      _height = value;
      return graph;
    };

    graph.selection = function(value) {
      if (!arguments.length) return _selection;
      _selection = value;
      return graph;
    };

    graph.width = function(value) {
      if (!arguments.length) return _width;
      _width = value;
      return graph;
    };

    graph.running = function() {
      return _running;
    };

    graph.maxEdgeLength = function() {
      return _edgeLength;
    };

    graph.on = function(type, handler) {
      return _dispatch.on(type, handler);
    };

    graph.bbox = function(vertex) {
      var compoundBbox = {
        top: Infinity,
        right: -Infinity,
        bottom: -Infinity,
        left: Infinity
      };

      var update = function(compoundBbox, bbox) {
        if (bbox) {
          if (bbox.top < compoundBbox.top) compoundBbox.top = bbox.top;
          if (bbox.right > compoundBbox.right) compoundBbox.right = bbox.right;
          if (bbox.bottom > compoundBbox.bottom) compoundBbox.bottom = bbox.bottom;
          if (bbox.left < compoundBbox.left) compoundBbox.left = bbox.left;
        }
      };

      if (!arguments.length) {
        graph.vertices().forEach(function(vertex) {
          update(compoundBbox, graph.bbox(vertex));
        });
      } else if (vertex && vertex.bbox) {
        update(compoundBbox, vertex.bbox());
        layout.collection().forEach(function(l) {
          update(compoundBbox, l.bbox(vertex));
        });
      } else {
        throw 'Insufficient arguments';
      }

      compoundBbox.width = compoundBbox.right - compoundBbox.left;
      compoundBbox.height = compoundBbox.bottom - compoundBbox.top;

      // Calculate the center of the compound bounding box
      compoundBbox.cx = compoundBbox.left + compoundBbox.width / 2;
      compoundBbox.cy = compoundBbox.top + compoundBbox.height / 2;

      // Define all points of the compound bounding box
      var points = [
        {x: compoundBbox.left, y: compoundBbox.top},
        {x: compoundBbox.right, y: compoundBbox.top},
        {x: compoundBbox.right, y: compoundBbox.bottom},
        {x: compoundBbox.left, y: compoundBbox.bottom}
      ];

      var maxDistance = 0;

      // Find out the point of the compound bounding box most far away from its center
      points.forEach(function(point) {
        var x = point.x - compoundBbox.cx;
        var y = point.y - compoundBbox.cy;
        maxDistance = Math.max(Math.sqrt(x * x + y * y), maxDistance);
      });

      compoundBbox.r = maxDistance;

      return compoundBbox;
    };

    graph.export = function(format) {
      if (format === 'pajek') {
        return pajek.toString(graph);
      } else if (format === 'dot') {
        return dot.toString(graph);
      }

      throw Error('Unknown format %s', format);
    };

    graph.import = function(data, arg1, arg2) {
      var format = 'pajek';
      var network;
      var result;

      if (arg1) {
        if (arg1.constructor === String) format = arg1;
        else if (arg1.constructor === Object) result = arg1;
      }

      if (arg2) {
        if (arg2.constructor === Object) result = arg2;
      }

      graph.stop();

      if (format === 'pajek') {
        network = pajek.fromString(data);
      } else if (format === 'dot') {
        network = dot.fromString(data);
      } else {
        throw Error('Unknown format %s', format);
      }

      if (!result) {
        graph.vertices(network.vertices);
        graph.edges(network.edges);
      } else {
        result.vertices = network.vertices;
        result.edges = network.edges;
      }

      return graph;
    };

    graph.toString = function() {
      return ['[Graph:', _width + 'x' + _height + ',', graph.count(), 'vertices]'].join(' ');
    };

    return graph;
  };
});
