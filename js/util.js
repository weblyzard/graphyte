define(['d3'], function(d3) {

  'use strict';

  var enableAnimation = function() {
    // https://developer.mozilla.org/en/docs/Web/API/window.requestAnimationFrame
    window.requestAnimationFrame = window.requestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.msRequestAnimationFrame;
  };

  // less.js has pretty aggressive caching using localstorage
  // this helps deleting the cache when developing less styles
  var destroyLessCache = function(pathToCss) { // e.g. '/css/' or '/stylesheets/'
    var host = window.location.host;
    var protocol = window.location.protocol;
    var keyPrefix = protocol + '//' + host + pathToCss;
    for (var key in window.localStorage) {
      if (key.indexOf(keyPrefix) === 0) {
        delete window.localStorage[key];
      }
    }
  };

  var getId = function(type, name) {
    if (isNaN(getId.current++)) getId.current = 1;

    // Source for the regular expression: https://mathiasbynens.be/notes/html5-id-class
    // We don't allow : and . since jquery/d3 have issues with it – see
    // http://stackoverflow.com/questions/1077084/what-characters-are-allowed-in-dom-ids
    var re = new RegExp('[^\-_0-9A-z]+', 'g');
    name = String(name || '').toLowerCase().replace(re, '') || getId.current;
    return ['graphyte', type, name].join('-');
  };

  var isNumeric = function(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  };

  var arrayFrom = function() {
    return Array.prototype.slice.call(arguments);
  };

  var defaults = function(spec, defaults) {
    d3.map(defaults).forEach(function(key, value) {
      if (spec[key] === undefined) {
        spec[key] = value;
      }
    });
  };

  var reject = function(array, spec) {
    return array.filter(function(item) {
      for (var key in spec) {
        if (spec[key] && spec[key] !== item[key]) {
          return true;
        }
      }

      return false;
    });
  };

  // Vector Factory
  var Vector = function(x, y) {
    var vector = {
      x: x,
      y: y
    };

    // vector length
    vector.length = function() {
      return Math.sqrt(Math.pow(vector.x, 2) + Math.pow(vector.y, 2));
    };

    return vector;
  };

  var SparseConsole = function(settings) {
    var counter = 0;
    var lastDate = new Date();
    this.log = function() {
      var now = new Date();
      var limitCondition = counter < settings.limit;
      var delayCondition = now - lastDate > settings.delay;
      if (settings.limit) {
        if (settings.delay) {
          if (limitCondition && delayCondition) {
            console.log.apply(console, arguments);
            counter += 1;
            lastDate = now;
          }
        } else if (limitCondition) {
          console.log.apply(console, arguments);
          counter += 1;
        }
      } else if (settings.delay && delayCondition) {
        console.log.apply(console, arguments);
        lastDate = now;
      }
    };

    return this;
  };

  SparseConsole.getNextId = function() {
    var id = SparseConsole.getNextId.currentId || 0;
    return id += 1;
  };

  return {
    defaults: defaults,
    delayedConsole: new SparseConsole({ delay: 1000 }),
    destroyLessCache: destroyLessCache,
    enableAnimation: enableAnimation,
    arrayFrom: arrayFrom,
    getId: getId,
    isNumeric: isNumeric,
    limitedConsole: new SparseConsole({ limit: 3}),
    reject: reject,
    SparseConsole: SparseConsole,
    sparseConsole: new SparseConsole({ delay: 1000, limit: 3}),
    Vector: Vector
  };

});
