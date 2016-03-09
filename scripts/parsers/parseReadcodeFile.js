/* jshint node: true */
"use strict";

var parse = require('csv-parse'),
  fs = require('fs'),
  path = require('path'),
  utils = require('./utils.js');

var parser = parse({ delimiter: ',', trim: true });

console.time('Elapsed');

var input = fs.createReadStream(path.join('dicts', 'Corev2.all'));
var output = fs.createWriteStream(path.join('processed', 'Corev2.all.js.dict.txt'));
output.on('finish', function(){
  console.timeEnd('Elapsed');
});

input.pipe(parser).pipe(utils.transformer).pipe(output);
