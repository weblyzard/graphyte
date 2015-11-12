define([
  'lodash',
  'jquery',
  'qunit',
  'js/core',
  'layouts/satellites'
], function(
  _,
  $,
  QUnit,
  graphyte,
  satellitesLayout
) {

  'use strict';

  return function() {

    var graph;
    var vertex1;
    var vertex2;
    var vertex3;
    var counter;

    QUnit.module(null, {
      beforeEach: function() {
        graph = graphyte();
        vertex1 = {};
        vertex2 = {name: 2};
        vertex3 = {name: 3};
        counter = 0;
      },

      afterEach: function() {
        graph = null;
      }
    });

    QUnit.test('Instantiating new graph', function(assert) {
      assert.ok(graph, 'New graph is created');
      assert.equal(graph.count(), 0,
        'No vertices are defined, array length is zero');
      assert.ok(graph.vertices().constructor, Array, 'Nodes array is exposed');
      assert.ok(graph.edges().constructor, Array, 'Edges array is exposed');
      assert.equal(graph.make, undefined, 'make() method is not exposed');
    });

    QUnit.test('Adding and removing vertices', function(assert) {
      assert.equal(graph.add(vertex1), vertex1, 'Add a single vertex');
      assert.notEqual(graph.root(), vertex1, 'Root vertex is undefined');
      assert.equal(graph.count(), ++counter, 'vertex count incremented');
      assert.equal(graph.contains(vertex1), true, 'Graph now contains vertex');
      assert.equal(graph.remove(vertex1), graph, 'Remove the vertex');
      assert.equal(graph.contains(vertex1), false,
        'Graph does not contain vertex anymore');
      assert.equal(graph.count(), --counter, 'vertex count decremented');
      assert.equal(graph.count(), 0, 'Graph is empty');
    });

    QUnit.test('Connecting and disconnecting vertices', function(assert) {
      assert.equal(graph.connect(vertex1, vertex2), graph,
        'Connect two vertices');
      assert.equal(graph.count(), 2, 'Graph now contains two vertices');
      assert.equal(graph.contains(vertex1, vertex2), true,
        'Graph contains both very vertices');
      assert.equal(graph.connects(vertex1, vertex2), true,
        'Nodes are connected in one direction');
      assert.equal(graph.connects(vertex2, vertex1), false,
        'Nodes are not connected in other direction');
      assert.equal(graph.connects(vertex1, vertex2, 'any'), true,
        'Nodes are connected in any direction');
      assert.equal(graph.connects(vertex2, vertex1, 'any'), true,
        'Nodes are connected in any direction');
      assert.equal(graph.connects(vertex1, vertex2, 'both'), false,
        'Nodes are not connected bidirectionally');
      assert.equal(vertex1.successors.indexOf(vertex2) > -1, true,
        'vertex is now contained in other vertex’s list of successor vertices');
      assert.equal(vertex1.predecessors.indexOf(vertex2) < 0, true,
        'vertex is not contained in other vertex’s list of predecessor vertices');
      assert.equal(vertex2.predecessors.indexOf(vertex1) > -1, true,
        'Other vertex’s list of predecessor vertices now contains vertex');
      assert.equal(vertex2.successors.indexOf(vertex1) < 0, true,
        'Other vertex’s list of successor vertices does not contain vertex');
      assert.ok(graph.connect(vertex2, vertex1),
        'Connect the very same vertices in other direction');
      assert.equal(graph.connects(vertex2, vertex1), true,
        'Nodes now are connected in other direction, too');
      assert.equal(graph.connects(vertex1, vertex2, {direction: 'both'}), true,
        'Nodes are connected bidirectionally now');
      assert.equal(graph.count(), 2, 'vertex count incremented');
      assert.equal(vertex1.successors.length, 1,
        'List of successor vertices incremented');
      assert.equal(vertex2.predecessors.length, 1,
        'List of predecessor vertices incremented');
      assert.equal(vertex1.successors[0], vertex2,
        'Reference to successor vertex is correct');
      assert.equal(vertex2.predecessors[0], vertex1,
        'Reference to predecessor vertex is correct');
      assert.equal(graph.connect(vertex1, vertex2), graph,
        'Connect the very same two vertices again');
      assert.equal(graph.count(), 2,
        'vertex count not incremented (preventing redundancy)');
      assert.equal(vertex1.successors.length, 1,
        'List of successor vertices not incremented');
      assert.equal(graph.connect(vertex1, vertex3), graph,
        'Connect one new vertex with existing one');
      assert.equal(graph.count(), 3, 'vertex count incremented');
      assert.equal(vertex1.successors.length, 2,
        'vertex contains two successors');
      assert.equal(graph.disconnect(vertex1, vertex2), graph,
        'Disconnect vertices in one direction');
      assert.equal(graph.connects(vertex1, vertex2), false,
        'Nodes are disconnected in one direction now');
      assert.equal(graph.connects(vertex2, vertex1), true,
        'Nodes are still connected in other direction');
      assert.equal(graph.remove(vertex3), graph,
        'Remove one vertex from graph');
      assert.equal(graph.count(), 2,
        'vertex count decremented');
      assert.equal(graph.connects(vertex1, vertex3), false,
        'Nodes are not connected anymore');
      assert.equal(!!_.find(graph.vertices(), vertex3), false,
        'vertex is not contained in graph’s list of vertices anymore');
      assert.equal(vertex3.predecessors.indexOf(vertex1), -1,
        'vertex is removed from other vertex’s list of predecessor vertices');
      assert.equal(vertex1.successors.indexOf(vertex3), -1,
        'vertex is removed from other vertex’s list of successor vertices');
    });

    QUnit.test('Adding and removing edges', function(assert) {
      assert.equal(graph.connect(vertex1, vertex2).connect(vertex1, vertex3), graph,
        'Connect one vertex with two other ones');
      assert.equal(graph.edges().length, 2, 'Edge count incremented');
      assert.equal(!!_.find(graph.edges(), {source: vertex1, target: vertex2}), true,
        'Edge between first pair of vertices exists in graph’s list of edges');
      assert.equal(!!_.find(graph.edges(), {source: vertex1, target: vertex3}), true,
        'Edge between second pair of vertices exists');
      assert.equal(!!_.find(graph.edges(), {source: vertex2, target:vertex1}), false,
        'Edge in other direction between first pair of vertices does not exist');
      assert.equal(!!_.find(graph.edges(), {source: vertex3, target:vertex1}), false,
        'Edge in other direction between second pair of vertices does not exist');
      assert.equal(!!_.find(graph.edges(), {source: vertex2, target:vertex3}), false,
        'Edge between third pair of vertices does not exist');
      assert.equal(!!_.find(graph.edges(), {source: vertex3, target:vertex2}), false,
        'Edge in other direction between thid pair of vertices does not exist');
      assert.ok(graph.connect(vertex2, vertex1),
        'Connect one vertex back to its parent bidirectionally');
      assert.equal(!!_.find(graph.edges(), {source: vertex2, target:vertex1}), true,
        'Edge in other direction between first pair of vertices now exists');
      assert.ok(graph.disconnect(vertex1, vertex3), 'Disconnect two vertices');
      assert.equal(graph.edges().length, 2, 'Edge count decremented');
      assert.equal(!!_.find(graph.edges(), {source: vertex1, target: vertex3}), false,
        'Edge is removed from graph’s list of edges');
      assert.ok(graph.remove(vertex2), 'Remove a vertex');
      assert.equal(!!_.find(graph.edges(), {source: vertex1, target: vertex2}), false,
        'All edges from the removed vertex are removed from the graph’s list of edges');
    });

    QUnit.test('Root vertex', function(assert) {
      var rootvertex = {root: true};
      assert.ok(graph.root(vertex1), 'Set the root vertex');
      assert.equal(vertex1.root, true, 'vertex is root vertex');
      assert.equal(graph.root(), vertex1, 'Root vertex was set correctly');
      assert.ok(graph.root(vertex2), 'Set another root vertex');
      assert.ok(graph.root(), vertex2, 'Root vertex was set correctly');
      assert.equal(vertex2.root, true, 'Other vertex is root vertex now');
      assert.equal(vertex1.root, false, 'Former root vertex is not root anymore');
      assert.ok(graph.add(rootvertex), 'Add a vertex with root property');
      assert.notEqual(graph.root(), rootvertex, 'Root vertex remains unchanged');
      assert.equal(rootvertex.root, false, 'Root property is corrected');
      assert.equal(vertex2.root, true, 'Root vertex remains');
    });

    QUnit.test('Counting in a linear graph', function(assert) {
      var vertexWithSatellite = {satellite: true};

      assert.equal(
        graph.connect(vertex1, vertex2)
          .connect(vertex2, vertex3)
          .connect(vertex3, vertexWithSatellite),
        graph, 'Create a graph with four vertices, connected in a row.'
      );

      assert.equal(graph.count(), 4, 'Count all vertices');
      assert.equal(vertex1.successors.length, 1,
        'Count direct successor vertices of root vertex');
      assert.equal(graph.successors(vertex1).length, 3,
        'Count all successor vertices of root vertex');
      assert.equal(graph.successors(vertex1, 1).length, 1,
        'Count successor vertices of root vertex, limited to one degree of separation');
      assert.equal(graph.successors(vertex1, 2).length, 2,
        'Count successor vertices of root vertex, limited to two degrees of separation');
      assert.equal(graph.successors(vertex1, 3).length, 3,
        'Count successor vertices of root vertex, limited to three degrees of separation');
      assert.equal(graph.successors(vertex2).length, 2,
        'Count all successor vertices of a successor of root vertex');
      assert.equal(graph.successors(vertex2, 1).length, 1,
        'Count successor vertices of a successor of root vertex, limited to one degree of separation');
      assert.equal(graph.successors(vertex2, 2).length, 2,
        'Count successor vertices of a successor of root vertex, limited to two degrees of separation');
      assert.equal(graph.successors(vertex2, 3).length, 2,
        'Count successor vertices of a successor of root vertex, ' +
        'limited to three degrees of separation (more than available)');
      assert.equal(graph.successors(vertex3).length, 1,
        'Count all successor vertices of a successor’s successor of root vertex');
      assert.equal(graph.successors(vertexWithSatellite).length, 0,
        'Count all successor vertices of the outermost vertex');

      assert.equal(vertex1.predecessors.length, 0,
        'Count direct predecessor vertices of root vertex');
      assert.equal(vertex2.predecessors.length, 1,
        'Count direct predecessor vertices of successor vertex of root vertex');
      assert.equal(graph.predecessors(vertex1).length, 0,
        'Count predecessor vertices of root vertex');
      assert.equal(graph.predecessors(vertex1, 3).length, 0,
        'Count predecessor vertices of root vertex, limited to three ' +
        'degrees of separation (more than available)');
      assert.equal(graph.predecessors(vertex2).length, 1,
        'Count all predecessor vertices of a successor of root vertex');
      assert.equal(graph.predecessors(vertex2, 1).length, 1,
        'Count predecessor vertices of a successor of root vertex, ' +
        'limited to one degree of separation');
      assert.equal(graph.predecessors(vertex3).length, 2,
        'Count predecessor vertices of a successor’s successor of root vertex');
      assert.equal(graph.predecessors(vertex3, 1).length, 1,
        'Count predecessor vertices of a successor’s successor of root vertex, ' +
        'limited to one degree of separation');
      assert.equal(graph.predecessors(vertexWithSatellite).length, 3,
        'Count predecessor vertices of the outermost vertex');
      assert.equal(graph.predecessors(vertexWithSatellite, 1).length, 1,
        'Count predecessor vertices of the outermost vertex, limited to one degree of separation');
      assert.equal(graph.predecessors(vertexWithSatellite, 2).length, 2,
        'Count predecessor vertices of the outermost vertex, limited to two degrees of separation');
      assert.equal(graph.predecessors(vertexWithSatellite, 3).length, 3,
        'Count predecessor vertices of the outermost vertex, limited to three degrees of separation');
    });

    QUnit.test('Counting in a branched graph (tree)', function(assert) {
      var vertexWithSatellite = {satellite: true};
      assert.equal(
        graph.connect(vertex1, vertex2)
          .connect(vertex1, vertex3)
          .connect(vertex3, vertexWithSatellite),
        graph, 'Create a graph with four vertices, in a tree-like structure.'
      );

      assert.equal(graph.count(), 4, 'Count all vertices');
      assert.equal(vertex1.successors.length, 2, 'Count direct successor vertices of root vertex');
      assert.equal(graph.successors(vertex1, 1).length, 2,
        'Count successor vertices of root vertex, limited to one degree of separation');
      assert.equal(graph.successors(vertex2, 1).length, 0,
        'Count successor vertices of a successor of root vertex, limited to one degree of separation');
      assert.equal(graph.successors(vertex3, 1).length, 1,
        'Count successor vertices of another successor of root vertex, limited to one degree of separation');
      assert.equal(graph.predecessors(vertex3, 1).length, 1,
        'Count predecessor vertices of another successor of root vertex, limited to one degree of separation');
      assert.equal(graph.predecessors(vertex3, 2).length, 1,
        'Count predecessor vertices of another successor of root vertex, limited to two degrees of separation');
      assert.equal(graph.predecessors(vertexWithSatellite, 3).length, 2,
        'Count predecessor vertices of the outermost vertex, limited to three degrees of separation');
    });

    QUnit.test('Counting in a recursively connected graph', function(assert) {
      var vertexWithSatellite = {satellite: true};
      assert.equal(
        graph.connect(vertex1, vertex2)
          .connect(vertex1, vertex3)
          .connect(vertex1, vertexWithSatellite)
          .connect(vertex2, vertex3)
          .connect(vertex3, vertexWithSatellite)
          .connect(vertexWithSatellite, vertex1),
        graph, 'Create a graph with four vertices, recursively connected.'
      );

      assert.equal(graph.count(), 4);
      assert.equal(vertex1.successors.length, 3);
      assert.equal(vertex3.successors.length, 1);
      assert.equal(graph.successors(vertex1).length, 4);
      assert.equal(graph.successors(vertex1, 1).length, 3);
      assert.equal(graph.successors(vertexWithSatellite).length, 4);
      assert.equal(graph.successors(vertexWithSatellite, 1).length, 1);

      assert.equal(vertex1.predecessors.length, 1);
      assert.equal(vertex3.predecessors.length, 2);
      assert.equal(graph.predecessors(vertex1).length, 4);
      assert.equal(graph.predecessors(vertexWithSatellite).length, 4);
    });

    QUnit.test('Removing vertices in recursively connected graph', function(assert) {
      var rootvertex = {root: true};
      assert.equal(graph.root(rootvertex), graph, 'Setting up root vertex');
      assert.equal(graph.connect(rootvertex, vertex2), graph,
        'Connecting two vertices');
      assert.equal(graph.connect(vertex1, vertex3), graph,
        'Connecting another vertex to the root vertex');
      assert.equal(graph.connect(graph.vertices()[1], graph.vertices()[2]), graph,
        'Connection the two non-root vertices');
      assert.equal(graph.connect(graph.vertices()[1], vertex3), graph,
        'Connecting another successor vertex to one of the non-root vertices');
      assert.equal(graph.remove(graph.vertices()[1].successors), graph,
        'Removing the two successors of the one non-root vertex');
      assert.equal(graph.vertices().length, 2, 'Two vertices shall remain');
    });

    QUnit.test('Directions', function(assert) {
      assert.equal(graph.connect(vertex1, vertex2), graph,
        'Connecting two vertices');
      assert.equal(graph.connects(vertex1, vertex2), true,
        'Checking for connection in original direction');
      assert.equal(graph.connects(vertex2, vertex1), false,
        'Checking for reverse connection');
      assert.equal(graph.connects(vertex1, vertex2, 'any'), true,
        'Checking for connection in original direction but actually ignoring direction');
      assert.equal(graph.connects(vertex2, vertex1, 'any'), true,
        'Checking for connection in reverse direction but actually ignoring direction');
      assert.equal(graph.connects(vertex2, vertex1, 'both'), false,
        'Checking for connection requiring both directions');
      assert.equal(graph.connect(vertex2, vertex1), graph,
        'Establishing reverse connection');
      assert.equal(graph.connects(vertex1, vertex2), true,
        'Checking for connection in original direction');
      assert.equal(graph.connects(vertex1, vertex2, 'any'), true,
        'Checking for connection in original direction but actually ignoring direction');
      assert.equal(graph.connects(vertex2, vertex1, 'any'), true,
        'Checking for connection in reverse direction but actually ignoring direction');
      assert.equal(graph.connects(vertex2, vertex1, 'both'), true,
        'Checking for connection requiring both directions');
    });

    QUnit.test('Selection and manipulation', function(assert) {
      var vertexA = {name: 'a', entityType: 'vowel', size: 3};
      var vertexB = {name: 'b', entityType: 'consonant'};
      var vertexC = {name: 'c', entityType: 'consonant'};
      var vertexE = {name: 'e', entityType: 'vowel'};
      var vertexU = {name: 'ü', entityType: 'umlaut'};
      assert.equal(graph.connect(vertexA, vertexB).connect(vertexA, vertexC), graph,
        'Adding and connecting three vertices');
      assert.equal(graph.connect(vertexB, vertexE).connect(vertexB, vertexU), graph,
        'Connecting one vertex with two additional ones');
      var selection = graph.filter({type: 'vertex'});
      assert.ok(selection, 'Selecting all vertices');
      assert.equal(selection.constructor, Array, 'Selection is an array');
      assert.equal(selection.length, 5, 'Selection contains all vertices');
      assert.equal(graph.count(), 5,
        'Count starting with undefined vertex (collection) is correct');
      var count = graph.count(selection);
      assert.ok(count, 'Getting the count of all selected vertices');
      assert.equal(count.constructor, Number, 'Count is returned as a number');
      assert.equal(count, 5, 'Count is correct');
      selection = graph.filter({type: 'edge'});
      assert.ok(selection, 'Selecting all edges');
      assert.equal(selection.length, 4, 'Selection contains all edges');
      selection = graph.filter({type: 'vertex', name: 'b'});
      assert.ok(selection, 'Selecting one vertex by name');
      assert.equal(selection.length, 1, 'Selection contains one vertex');
      assert.equal(selection[0], vertexB, 'First item in selection equals original vertex');
      assert.equal(graph.successors(selection[0]).length, 2, 'Count successors of selection');

      // FIXME: This fails due to the async nature of D3 rendering the SVG elements
      //assert.equal($('svg .circle').attr('r'), 5, 'Verifying attribute of SVG element');

      selection = graph.filter({type: 'vertex', entityType: 'consonant'});
      assert.ok(selection, 'Selecting vertices by custom property');
      assert.equal(selection.length, 2, 'Selection contains desired items');
    });

    QUnit.test('Self-referential edges', function(assert) {
      assert.equal(graph.connect(vertex1, vertex1), graph);
      assert.equal(graph.connects(vertex1, vertex1), true);
      assert.equal(graph.count(), 1);
      assert.equal(vertex1.successors.length, 1);
      assert.equal(graph.successors(vertex1).length, 1);
      assert.equal(vertex1.predecessors.length, 1);
      assert.equal(graph.predecessors(vertex1).length, 1);
    });

    QUnit.test('Import and export', function(assert) {
      graph.connect(vertex1, vertex2)
        .connect(vertex1, vertex3)
        .connect(vertex2, {});

      var exportedData = graph.export();
      var importedData = {};

      graph.import(exportedData, importedData);

      assert.expect(10);

      graph.vertices().forEach(function(vertex, index) {
        assert.deepEqual({
          name: vertex.name,
          size: vertex.size,
          x: vertex.x,
          y: vertex.y
        }, importedData.vertices[index]);
      });

      graph.edges().forEach(function(edge, index) {
        ['source', 'target'].forEach(function(key) {
          var vertex = edge[key];
          assert.deepEqual({
            name: vertex.name,
            size: vertex.size,
            x: vertex.x,
            y: vertex.y
          }, importedData.edges[index][key]);
        });
      });
    });

    QUnit.test('Layout with satellites', function(assert) {
      var satellites = satellitesLayout();
      graph.layout(satellites);
      var vertexWithSatellite = {satellite: true};
      assert.equal(graph.add(vertexWithSatellite), vertexWithSatellite,
        'Add a vertex with satellite');
      assert.equal(satellites.vertices().length, 1,
        'One satellite is added to the array of satellites');
      assert.equal(graph.count(), 1,
        'vertex count incremented by 1 (satellite is not counted)');
      assert.equal(graph.remove(vertexWithSatellite), graph,
        'Remove a vertex with satellite');
      assert.equal(graph.satellites().length, 0, 'Satellites array is empty');
      assert.equal(graph.count(), 0, 'Graph is empty');

      var vertexWithSatellite = {satellite: true};
      assert.ok(graph.add(vertex1), 'Add a vertex');
      assert.ok(graph.add(vertexWithSatellite), 'Add a vertex with a satellite');
      assert.equal(graph.vertices().length, 2, 'There are two vertices now');
      var satellites = graph.satellites();
      assert.equal(satellites.length, 1, 'There is one satellite vertex');
      assert.equal(vertexWithSatellite.satellite, satellites[0],
        'The vertex’s satellite property is set to the new satellite vertex');
      assert.equal(satellites[0].vertex, vertexWithSatellite,
        'The satellite vertex’s vertex property is set to the vertex');
      graph.remove(vertexWithSatellite);
      assert.equal(graph.satellites().length, 0,
        'Satellite vertex is removed when corresponding vertex is removed');
    });

    /*
    function wait(millis) {
      return $.Deferred(function(deferred) {
        setTimeout(deferred.resolve, millis);
      });
    }

    QUnit.test('Instantiating in debug mode', function (assert) {
      graph = ForceDirectedGraph({debug: true});
      graph();
      assert.equal(graph.canvas.constructor, Array , 'Canvas property is exposed in debug mode');
      assert.equal(graph.force.constructor, Object, 'Force property is exposed in debug mode');
      assert.equal(graph.make.constructor, Function, 'make() method is exposed in debug mode');
      assert.equal(graph.satellites.constructor, Array, 'Satellites array is exposed in debug mode');
    });

    QUnit.test('Rendering graph', function (assert) {
      d3.select('#graph').call(graph);
      var container = $('#graph svg');
      assert.ok(container.length > 0, 'SVG element was added to the DOM');
      assert.equal(container.attr('width'), 800, 'Width of the SVG element is correct');
      assert.equal(container.attr('height'), 600, 'Height of the SVG element is correct');
    });

    QUnit.test('Drawing the graph', function (assert) {
      var done = assert.async();
      graph.clear();
      d3.select('body')
        .append('div')
        .classed('graph', true) // We care about restoring the DOM ourselves
        .call(graph);
      assert.equal(graph.connect(vertex1, vertex2), graph, 'Connecting one vertex with two others');
      //assert.equal(graph.update(), graph, 'Updating the graph');
      assert.equal(graph.start(), graph, 'Drawing the graph');
      assert.equal($('svg .canvas').children().length, 3, 'SVG element now contains three children');
      assert.equal($('svg line.edge').length, 1, 'SVG element contains one line element with the edge class');
      assert.equal($('svg g.vertex').length, 2, 'SVG element contains another group element');
      assert.equal($('svg g.vertex.root').length, 1, 'One of the group elements has the root class');
      assert.equal($('svg g.vertex circle.circle').length, 2, 'The group elements contain a circle element each');
      assert.equal($('svg .circle').eq(0).attr('r'), 3, 'The radius of the first circle equals 3');
      assert.equal($('svg .circle').eq(1).attr('r'), 3, 'The radius of the second circle equals 3');
      //assert.equal(graph.resize(800, 600), graph, 'Resizing the graph');
      //assert.equal($('svg').width(), 800, 'Modified width of SVG element is correct');
      //assert.equal($('svg').height(), 600, 'Modified height of SVG element is correct');
      assert.equal(graph.remove(vertex2), graph, 'Removing one of the vertices');
      assert.equal(graph.start(), graph, 'Updating the graph');
      // To be sure the DOM is updated on the next assert we do this asynchronously
      setTimeout(function () {
        assert.equal($('svg .circle').length, 1, 'Only one circle element remains');
        d3.select('.graph').remove();
        done();
      }, 0);
    });
    */
  };
});
