# Graphyte

_Graphyte_ is a JavaScript based graph visualization library built with emphasis on customization and modularity. These design decisions led to a core framework responsible for interconnecting pluggable modules. Following that spirit, _Graphyte_ doesn’t offer ready-made visualizations like e.g. HighCharts or NVD3 which offer out-of-the-box solutions for standard charts. Instead, the intended audience of _Graphyte_ are developers who are looking for a solid library to create heavily customized graph visualizations. 

## Installation

```bash
npm install graphyte
```

## General Usage

_Graphyte_ is following the AMD module pattern using [RequireJS](http://requirejs.org):

```javascript
require.config({
  baseUrl: 'node_modules/graphyte',
  paths: {
    'd3': 'node_modules/d3/d3'
  }
});

require(['d3', 'js/core'], function(d3, graphyte) {
  var graph = graphyte()
    .width(800)
    .height(600)
    .debug(true);
});
```

## Examples

To run the examples in your browser:

```bash
cd node_modules/graphyte
npm install
npm start
```

## Testing

_Graphyte_ is using QUnit for testing its basic functionality:

```bash
cde node_modules/graphyte
npm install
npm test
```

## Documentation

See Wiki: <https://github.com/weblyzard/graphyte/wiki>
