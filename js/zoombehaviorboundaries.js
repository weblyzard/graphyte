// zoombehaviorboundaries wrapped as a require.js module
define(function(require) {
  var $ = require('node_modules/jquery/dist/jquery');
  var d3 = require('d3');

  'use strict';

  var zoombehaviorboundaries = function() {
    // we want smooth zooming both with trackpads and mousewheels

    // however, there is no real way to clearly distinguish if the user is
    // using a seamless scrolling trackpad or a mouse' scrollwheel

    // therefore the following is a little hacky way to find out using
    // some parameters if the user's mousewheel events resemble more or less a
    // trackpad or mousewheel

    // if a user is using a mouse' scrollwheel we do a transition between the zooming states
    // seamless scrolling on trackpads doesn't need this, it's smooth by design

    // as a reference using Apple's Magic Trackpad the time delta between two mousewheel events
    // is between 30-40ms therefore we check if eventTimeDelta is bigger than 60ms
    // to trigger the transition. Additionaly we check for the standard wheelDelta

    var previousWheelTimeStamp = new Date().getTime();
    var previousWheelTimeStamp2 = new Date().getTime();
    var previousTranslateX = 0;
    var previousTranslateY = 0;
    var previousScale;
    var manualMove = false;
    var wrapperElement = '#wrapper';
    var canvas;
    var wrapper;

    function behavior(z) {
      var eventTimeDelta = 0;

      if (d3.event != null && d3.event.sourceEvent != null) {
        eventTimeDelta = d3.event.sourceEvent.timeStamp - previousWheelTimeStamp;
      }

      previousWheelTimeStamp2 = previousWheelTimeStamp;

      if (d3.event != null && d3.event.sourceEvent != null) {
        previousWheelTimeStamp = d3.event.sourceEvent.timeStamp;
      }

      var transitionDuration = 0;

      if (eventTimeDelta > 60 &&
        previousWheelTimeStamp !== previousWheelTimeStamp2 &&
        Math.abs(d3.event.sourceEvent.wheelDelta) >= 120) {
        transitionDuration = 250;
      }

      // limit panning to wrapper boundaries
      if ($(wrapperElement).position() !== undefined) {
        wrapper = {
          top: $(wrapperElement).position().top,
          left: $(wrapperElement).position().left,
          bottom: $(wrapperElement).position().top + $(wrapperElement)[0].getBoundingClientRect().height,
          right: $(wrapperElement).position().left + $(wrapperElement)[0].getBoundingClientRect().width,
        };
      }

      if ($(wrapperElement + ' .zoomer').position() !== undefined) {
        canvas = {
          top: $(wrapperElement + ' .zoomer').position().top,
          left: $(wrapperElement + ' .zoomer').position().left,
          bottom: $(wrapperElement + ' .zoomer').position().top +
            $(wrapperElement + ' .zoomer')[0].getBoundingClientRect().height,
          right: $(wrapperElement + ' .zoomer').position().left +
            $(wrapperElement + ' .zoomer')[0].getBoundingClientRect().width,
        };
      }

      // only apply if last movement were manual to and not by automatically updating display
      // otherwise this messes with previous state

      // we apply the following only when panning and ignore scaling
      if (d3.event && previousScale && d3.event.scale === previousScale) {
        if (canvas.top >= wrapper.top) {
          if (d3.event.translate[1] > previousTranslateY) {
            d3.event.translate[1] = previousTranslateY;
          }
        }

        if (canvas.left >= wrapper.left) {
          if (d3.event.translate[0] > previousTranslateX) {
            d3.event.translate[0] = previousTranslateX;
          }
        }

        if (canvas.bottom <= wrapper.bottom) {
          if (d3.event.translate[1] < previousTranslateY) {
            d3.event.translate[1] = previousTranslateY;
          }
        }

        if (canvas.right <= wrapper.right) {
          if (d3.event.translate[0] < previousTranslateX) {
            d3.event.translate[0] = previousTranslateX;
          }
        }
      }

      if (d3.event != null) {
        d3.select(wrapperElement + ' .zoomer')
            .transition()
            .delay(0)
            .duration(transitionDuration)
            .attr('transform',
          'translate(' + d3.event.translate + ')' + ' scale(' + d3.event.scale + ')');

        previousTranslateX = d3.event.translate[0];
        previousTranslateY = d3.event.translate[1];
        previousScale = d3.event.scale;

        manualMove = true;
      } else if (z) {
        d3.select(wrapperElement + ' .zoomer')
            .transition()
            .delay(0)
            .duration(250)
            .attr('transform',
          'translate(' + z.translate() + ')' + ' scale(' + z.scale() + ')');

        previousTranslateX = z.translate()[0];
        previousTranslateY = z.translate()[1];
        previousScale = z.scale();
      }
    }

    // chainable getter/setter methods
    behavior.manualMove = function(_) {
      if (!arguments.length) return manualMove;
      manualMove = _;
      return behavior;
    };

    behavior.previousTranslateX = function(_) {
      if (!arguments.length) return previousTranslateX;
      previousTranslateX = _;
      return behavior;
    };

    behavior.previousTranslateY = function(_) {
      if (!arguments.length) return previousTranslateY;
      previousTranslateY = _;
      return behavior;
    };

    behavior.wrapper = function(_) {
      if (!arguments.length) return wrapperElement;
      wrapperElement = _;
      return behavior;
    };

    return behavior;
  };

  return zoombehaviorboundaries;
});
