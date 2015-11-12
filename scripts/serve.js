var path = require('path');
var connect = require('connect');
var serve = require('serve-static');

var dir = path.join(__dirname, '..');

connect()
  .use(serve(dir))
  .listen(8000);

module.exports = require('open');
