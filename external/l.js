var Stream = require("../lib/index.js")
var log = console.log
var s = Stream.make(1,2,3)
s.print()
log("add 'hello'")
s = s.append(Stream.make('hello'))
s.print()
log("append 'world'")
s = s.add(Stream.make('world'))
s.print()
