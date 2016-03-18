'use strict'

const util = require('util');
const streamjs = require('./lib/stream.js')
const l = console.log

l(memoryUsage())

let numbers = streamjs.makeNaturalNumbers()
l(memoryUsage())

l('create 101 natural numbers')
l(numbers.item(100))
l(memoryUsage())

l('create 1001 natural numbers')
l(numbers.item(1000))
l(memoryUsage())

numbers = null
l('null numbers variable')
setTimeout(compose(memoryUsage, l), 10000)


function memoryUsage() {
  return util.inspect(mapBytes(process.memoryUsage()))
}

function mapBytes(table) {
  // interpred each numeric value in *table* as bytes and
  // convert it upwards in unites so that the number has
  // maximum 4 digits. Fix the number with 2 decimals.
  const unitList = ['B', 'KB', 'MB', 'GB', 'TB']
  return mapCollection(table, value => conversion(value))
  
  function conversion(value, units = 0) {
    if(String(value|0).length < 5) return value.toFixed(2) + unitList[units]
    return conversion(value/1024, units + 1)
  }
}

function mapCollection(collection, f) {
  const ret = {}
  eachCollection(collection, (value, key) => {
    ret[key] = f(value)
  })
  return ret
}
function eachCollection(collection, f) {
  for(let property in collection)
    f(collection[property], property)
}

function compose(...f) {
  return () =>
    f.reduce(
      (value,f) =>
        f(value),
        f.shift()()
    )
}