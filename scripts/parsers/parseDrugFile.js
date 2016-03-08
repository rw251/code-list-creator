var parse = require('csv-parse'),
  fs = require('fs'),
  path = require('path'),
  utils = require('./utils.js');

var parser = parse({ delimiter: '|', trim: true, quote: "" });

console.time('Elapsed');

var input = fs.createReadStream(path.join('dicts', 'unidrug.rc'));
var output = fs.createWriteStream(path.join('processed', 'unidrug.rc.js.dict.txt'));
output.on('finish', function(){
  console.timeEnd('Elapsed');
});

input.pipe(parser).pipe(utils.transformer).pipe(output);
