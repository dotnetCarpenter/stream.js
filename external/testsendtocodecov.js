var fs = require("fs")
var path = require("path")

process.stdin.resume();
process.stdin.setEncoding('utf8');

var input = '';

process.stdin.on('data', function(chunk) {
    input += chunk;
    console.log("test send to codecov recieving data")

    /*if(Math.round(Math.random() * 3) === 2) {
      console.error("Random errors happen")
      process.exit(1)
    }*/
});

process.stdin.on('end', function() {
  fs.writeFile(path.resolve(__dirname,"output.txt"), input, "utf8");
  try {
    JSON.parse(input)
  } catch(err) {
    console.error("JSON is not valid: ", err)
    process.exit(1)
  }
  console.log("test send to codecov done")
  setInterval(function(){}, 1000)
})
