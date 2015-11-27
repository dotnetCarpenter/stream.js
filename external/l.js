"use strict"

var Stream = require("../lib/index.js")
var log = console.log

/*var s = Stream.make(1,2,3)
s.print()
log("add 'hello'")
s = s.append(Stream.make('hello'))
s.print()
log("append 'world'")
s = s.add(Stream.make('world'))
s.print()
*/
let queue = new Stream
let l1 = [1,2,3]
let l2 = [3,2,1]
queue = queue.append(rec(l1))
queue = queue.append(rec(l2))
queue.print()

function rec(list) {
	if(list.length === 0) return new Stream
	let x = list[0],
			r = list.slice(1)
	return new Stream(x, () => rec(r))
}