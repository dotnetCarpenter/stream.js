#!/usr/bin/env node

var Stream = require('../lib/index');
var fs = require('fs');
var spawn = require('child_process').spawn;
var path = require('path');
var coveragePath = path.resolve(__dirname, '..', 'coverage/coverage.json');
/*fs.readFile(coveragePath, 'utf8', function(err, data) {
  if (err) {
    console.error(err);
    console.error('coverage data not found/read');
    process.exit(1);
  }
  pipeToCodeCov(data);
});*/
var coverageData = fs.createReadStream(coveragePath);
var stream = new Stream();
coverageData.on('data', stream.iterate);
coverageData.read();
function readData(data) {
  return new Stream(data, promise);
  function promise(data) {
    return readData(data);
  }
}
stream.print();
console.log(stream);

function pipeToCodeCov(json) {
  var codecov = 'external/testsendtocodecov.js';//'node_modules/.bin/codecov';
  var child;
  var node = process.execPath;
  var codecov = path.resolve(__dirname, '..', codecov)
  try { // TODO: test that we actually recieve/catch exeptions
    child = spawn(node, [codecov]);
  } catch (err) {
    console.error('codecov lib is not accessible');
    process.exit()
  }
  child.stdin.setEncoding = 'utf8';
  child.stdin.end(json + '\n');
}
