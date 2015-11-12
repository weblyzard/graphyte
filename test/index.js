'use strict';

require.config({
  baseUrl: '../',
  paths: {
    d3: 'node_modules/d3/d3.min',
    jquery: 'node_modules/jquery/dist/jquery.min',
    lodash: 'node_modules/lodash-amd/index',
    require: 'node_modules/requirejs/requirejs',
    'idiom/zoombehaviorboundaries': 'js/zoombehaviorboundaries',
    qunit: 'node_modules/qunitjs/qunit/qunit'
  },
  packages: [{
    name: 'lodash',
    location: 'node_modules/lodash-amd'
  }],
  shim: {
    d3: {
      exports: 'd3'
    },
    jquery: {
      exports: '$'
    },
    qunit: {
      exports: 'QUnit'
    }
  }
});

require(['qunit', 'test/test'], function(QUnit, test) {
  test();
  QUnit.load();
  QUnit.start();
});
