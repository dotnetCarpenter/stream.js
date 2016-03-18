const util = require('util');
const streamjs = require('./lib/stream.js')
const l = console.log


l(util.inspect(process.memoryUsage()))

const numbers = streamjs.makeNaturalNumbers()
l(util.inspect(process.memoryUsage()))

l(numbers.item(100))
l(util.inspect(process.memoryUsage()))

l(numbers.item(1000))
l(util.inspect(process.memoryUsage()))

function mapBytes(table) {
  const retTable = {}
  //TODO: interpred each numeric value in *table* as bytes and
  //      convert it upwards in unites so that the number has
  //      maximum 4 digits. Fix the number with 2 decimals.
  return retTable
}

function mapCollection(collection) {}
function eachCollection(collection) {}
