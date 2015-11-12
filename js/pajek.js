define(function(require, exports, module) {
  'use strict';

  var quote = function(str) {
    var regex = /('|")/g;
    return '"' + String(str).replace(regex, '\\$1') + '"';
  };

  var pajek = {};

  pajek.fromString = function(data) {
    var mode;
    var vertices = [];
    var edges = [];
    var sections = data.split(/(?:\r|\n|\r\n){2}/g);

    sections.forEach(function(section) {
      var lines = section.split(/(?:\r|\n|\r\n)/g);
      lines.forEach(function(line) {
        line = String(line).trim();
        if (!line) return;
        if (line.startsWith('*')) {
          if (line.toLowerCase().startsWith('*vertices')) {
            mode = 'vertex';
          } else if (line.toLowerCase().startsWith('*edges')) {
            mode = 'edge';
          }
          return;
        }

        if (mode === 'vertex') {
          var parts = line.split(/\s/);
          parts.shift();

          var name = [];
          var part;

          do {
            part = parts.shift();
            name.push(part);
          } while (part && !part.endsWith('"'));

          vertices.push({
            name: name.join(' ').replace(/"([^"]+)"/, '$1'),
            x: parseFloat(parts.shift()),
            y: parseFloat(parts.shift()),
            size: parseFloat(parts.shift())
          });
        } else if (mode === 'edge') {
          var parts = line.split(/\s/);
          edges.push({
            source: parseInt(parts[1], 10) - 1,
            target: parseInt(parts[2], 10) - 1,
            weight: parseFloat(parts[3])
          });
        }
      });

      edges = edges.map(function(edge) {
        edge.source = vertices[edge.source];
        edge.target = vertices[edge.target];
        return edge;
      });
    });

    return {
      vertices: vertices,
      edges: edges
    };
  };

  pajek.toString = function(graph) {
    var vertices = graph.vertices();
    var edges = graph.edges();
    var result = ['*Vertices', vertices.length, '\n'];

    var add = function(s, addLineBreak) {
      if (addLineBreak) s = String(s) + '\n';
      result.push(s);
      return result;
    };

    add.LINEBREAK = true;

    vertices.forEach(function(vertex, index) {
      add(index + 1);
      add(quote(vertex.name || vertex.id));
      add(vertex.x || 0);
      add(vertex.y || 0);
      add(vertex.size, add.LINEBREAK); // FIXME: Abusing the z-coordinate for the size
    });

    add('\n*Edges', true);

    edges.forEach(function(edge, index) {
      var source = vertices.indexOf(edge.source);
      var target = vertices.indexOf(edge.target);
      if (source > -1 && target > -1) {
        add(index + 1);
        add(source + 1);
        add(target + 1);
        add(edge.weight || 1, true);
      }
    });

    return result.join(' ');
  };

  return pajek;
});
