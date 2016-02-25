var parse = require('csv-parse'),
  fs = require('fs'),
  transform = require('stream-transform'),
  path = require('path');

var parser = parse({ delimiter: '|', trim: true, quote: "" });

var getParent = function(code){
  //get code like G30.. and return G3...
  var f = code.indexOf('.');
  return f>-1 ? code.substr(0,f-1)+'.'+code.substr(f) : code.substr(0,code.length-1) + '.';
};

var transformer = transform(function(data, callback) {
  setImmediate(function() {
    var parent = getParent(data[0]);
    var rtn = [null, data[0]+'\t' +data[1]+ '\t' + parent +'\n'];
    if(data[2]) rtn.push(data[0]+'\t' +data[2]+ '\t' + parent +'\n');
    if(data[3]) rtn.push(data[0]+'\t' +data[3]+ '\t' + parent +'\n');
    callback.apply(this, rtn);
  });
}, { parallel: 20 });

console.time('Elapsed');

transformer.on('readable', function() {
  while ((row = transformer.read()) !== null) {
    return row;
  }
});

transformer.on('error', function(err) {
  console.log(err.message);
});

var input = fs.createReadStream(path.join('dicts', 'unidrug.rc'));
var output = fs.createWriteStream(path.join('processed', 'unidrug.rc.js.dict.txt'));
output.on('finish', function(){
  console.timeEnd('Elapsed');
});

input.pipe(parser).pipe(transformer).pipe(output);
