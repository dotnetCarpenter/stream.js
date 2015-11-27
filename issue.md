After getting this package up to date, I had some more time playing around
with `stream.js` and I find it quite hard to use. I will give two examples.

I'm building a parser and it has a lexer which reads text and convert it to tokens.
The main work of the lexer is a recursive function. It didn't work with large
pieces of text as I ran into V8's too much recursion issue (exhausting the call stack).
So I switch from using an array that was passed on recursively as an accumulator to use `stream.js`.

```js
function lexer(str, options = { newline:false }) {
	if(str.length === 0) return new Stream
	if(regexWord.test(str)) {
		let word = regexWord.exec(str)[0],
			rest = str.substr(word.length)
		return new Stream(new Word(word), () => read(rest, options))
	}
	if(regexNewLine.test(str)) {
		let newline = regexNewLine.exec(str)[0],
			rest = str.substr(newline.length)
		if(options.newline)
			return new Stream(new NewLine(newline), () => read(rest, options))
		return read(rest, options)
	}
}
```
*Word and NewLine are token data types and Stream is `stream.js`*

After the tokenization I needed to get access to some of the tokens, enought to do something
meaningful and not too many to course a recursion issue. First I tried with `take`.

While that gave me some tokens, it didn't change the length of the stream. Imagine the
following:

```js
let stream = lexer(str, options)
let scheduleId = setInterval(() => {
	let tokens = stream.take(64)
	parse(tokens)

	if(stream.empty())
		clearInterval(scheduleId)
}, 0)
```

The parse function will get the same 64 tokens all the time. I then tried with `drop`.
This change the length of the `stream` but the parse function was still getting the same
tokens, over and over. Since my word list has pretty similar words, it took me a while
to figure out what was going on. The two functions `take` and `drop` need to be combined.

```js
let tokens = stream.take(64)
stream = stream.drop(64)
```

Fortunately, `stream.js` doesn't error when taking or dropping more from a stream than it
has, making the solution pretty easy.
However, since the only documentation `stream.js` has is the [website][2] and
source code, it took way longer than necessary to figure out.

Let's take [the code that sends JSON data to codecov][1] as the second example.
[sendtocodecov.js][1] reads the coverage.json file that is generated with `npm test`.
It then starts the codecov code in a child process and pipe the JSON data to its stdin
stream. It does that because the codecov code will throw an error if run locally,
complaining that it can't find the CODECOV_TOKEN environment variable. Resulting in a not
so pleasent error whenever we run the test suit with coverage.

```
Lines        : 83.93% ( 141/168 )
================================================================================
C:\Users\dotnet\Projects\opensource\stream.js\node_modules\codecov.io\lib\getConfiguration.js:27
      throw new Error("unknown service. could not get configuration");
      ^

Error: unknown service. could not get configuration
    at module.exports (C:\Users\dotnet\Projects\opensource\stream.js\node_modules\codecov.io\lib\getConfiguration.js:27:13)
    at sendToCodecov (C:\Users\dotnet\Projects\opensource\stream.js\node_modules\codecov.io\lib\sendToCodeCov.io.js:11:15)
    at Socket.<anonymous> (C:\Users\dotnet\Projects\opensource\stream.js\node_modules\codecov.io\bin\codecov.io.js:14:5)
    at emitNone (events.js:72:20)
    at Socket.emit (events.js:166:7)
    at endReadableNT (_stream_readable.js:905:12)
    at doNTCallback2 (node.js:452:9)
    at process._tickCallback (node.js:366:17)
npm ERR! Test failed.  See above for more details.
```

It works but it is written in an imperative style and since we can read the JSON
data as a stream, why not utilize `stream.js`?

We need to change the `fs.readFile` to create a stream and then we need to build our
`stream.js` stream from it.

By looking at the API we can try and guess what method will add to a stream. `add` is
there so let's try with that.

```js
var coverageDataStream = fs.createReadStream(coveragePath, { encoding: 'utf8' });
var stream = new Stream(null);
coverageDataStream.on('data', function(data) {
  stream.add(Stream.make(data));
});
coverageDataStream.on('end', function() {
  stream.print();
});
coverageDataStream.read();
```

The above will print nothing but `null`. We have to know that `stream.js` work with immutable
data, so any method wont mutate the stream but return a new stream object. If you have a FP
background that might be obvious, if not then you're left scratching your head. Knowing this,
we set the return stream of `add` to our stream variable.

`stream = stream.add(Stream.make(data));` 

This looks good. We're getting our data. But there is a `null` value right at the top. Let's
create an empty stream and add to that instead of our `null` stream. Turns out we can't.

```
C:\Users\dotnet\Projects\opensource\stream.js\lib\index.js:35
            throw new Error('Cannot use item() on an empty stream.');
```

Ok, but we can just take the value of interest, namely the second value. Instead of `print`
we use `console.log` to print out our desired data. `console.log(stream.item(1))` But this gives
us an error, `Error: Item index does not exist in stream.` It is now clear that `add` isn't
the right method to use. `add` will add a value to the `head` of our stream. But there is
also `append`. Let's see.

```js
var coverageDataStream = fs.createReadStream(coveragePath, { encoding: 'utf8' });
var stream = new Stream(null);
coverageDataStream.on('data', function(data) {
  stream = stream.append(Stream.make(data));
});
coverageDataStream.on('end', function() {
  console.log(stream.item(1))
});
coverageDataStream.read();
```

This of course only works if we read all the JSON data in one go. So let's quickly change
`item` to `drop(1)` and pass the stream to `pipeToCodeCov`.

A final solution could look like below. It still isn't FP as we have no pure functions but
it does use `stream.js`.

```js
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
  stream = stream.drop(1);
  pipeToCodeCov(stream);
});
coverageDataStream.read();

function pipeToCodeCov(jsonStream) {
  var codecov = 'node_modules/.bin/codecov';
  var child;
  var node = process.execPath;
  var codecov = path.resolve(__dirname, '..', codecov);
  child = spawn(node, [codecov], { stdio: 'pipe' });
  child.on('error', function(data) {
    console.error('codecov lib is not accessible');
  });
  child.stdout.on('data', function(data) {
    console.log(data.toString());
  });
  child.stdin.setEncoding = 'utf8';
  jsonStream.walk(function(json) {
    child.stdin.write(json);
  })
  child.stdin.end();
}
```

My main point is that `stream.js` seriously lacks documentation. I also feel that the
[website][2] could explain a little about how `stream.js` deals with immutable data.
Debugging `stream.js` to get answers, is like running through a maze. Don't get me wrong,
I really like `stream.js` and how its implementation doesn't rely on arrays. I'm just saying
that the learning curve is rather steep when you don't have a FP background, even though
the [website][2] is enjoyable to read but unfortunately not very comprehensive.

[1]: https://github.com/dionyziz/stream.js/blob/master/external/sendtocodecov.js
[2]: http://streamjs.org/
