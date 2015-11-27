#!/usr/bin/env node

'use strict';

var Stream = require('../lib/index');
var fs = require('fs');
var spawn = require('child_process').spawn;
var path = require('path');
var coveragePath = path.resolve(__dirname, '..', 'coverage/coverage.json');
var coverageDataStream = fs.createReadStream(coveragePath, { encoding: 'utf8' });
var stream = new Stream(null);

coverageDataStream.on('data', function(data) {
  stream = stream.append(Stream.make(data));
});
coverageDataStream.on('end', function() {
  //console.log(stream.item(1))
  stream = stream.drop(1);
  pipeToCodeCov(stream);
});
coverageDataStream.read();

function pipeToCodeCov(jsonStream) {
  var codecov = 'external/testsendtocodecov.js';//'node_modules/.bin/codecov';
  var child;
  var node = process.execPath;
  var codecov = path.resolve(__dirname, '..', codecov);

  child = spawn(node, [codecov], { stdio: 'pipe', encoding:'utf8' });
  child.stderr.on('data', function(err) {
    console.error('codecov lib is not accessible: ', err.toString());
  });
  child.stdout.on('data', function(data) {
    console.log(data.toString());
  });

  jsonStream.walk(function(json) {
    child.stdin.write(json);
  })
  child.stdin.end();
}
