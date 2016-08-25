var lunr = require('elasticlunr'),
  fs = require('fs'),
  es = require("event-stream"),
  path = require('path'),
  jsonfile = require('jsonfile');

/*console.time("load graph");
var file = './processed/data_graph.json';
jsonfile.readFile(file, function(err, obj) {
  console.timeEnd("load graph");
  var graph = obj;
  file = './processed/data_index.json';
  console.time("load index file");
  jsonfile.readFile(file, function(err, obj) {
    console.timeEnd("load index file");
    console.time("load index");
    var idx = lunr.Index.load(obj);
    console.timeEnd("load index");
    console.time("search:myocardial infarction");
    console.log(idx.search('myocardial infarction').map(function(v) {
      return v; //graph[v.ref];
    }).length);
    console.timeEnd("search:myocardial infarction");

    console.time("search:myocardial");
    console.log(idx.search('myocardial').map(function(v) {
      return [v.ref,graph[v.ref].d];//return v; //graph[v.ref];
    }));
    console.timeEnd("search:myocardial");

    console.time("search:infarction");
    console.log(idx.search('infarction').map(function(v) {
      return [v.ref,graph[v.ref].d];
    }).length);
    console.timeEnd("search:infarction");

    console.time("search:myocard");
    console.log(idx.search('myocard').map(function(v) {
      return v; //graph[v.ref];
    }).length);
    console.timeEnd("search:myocard");

  });
});*/
var files = [path.join('processed', 'Corev2.all.js.dict.txt'), path.join('processed', 'unidrug.rc.js.dict.txt')];
var idx = lunr(function() {
  this.addField('desc');
  this.addField('code');
  this.setRef('id');
});

var start = Date.now();
var graph = {},
  c, d, p, els;
files.forEach(function(file) {
  var i = 0;
  s = fs.createReadStream(file)
    .pipe(es.split())
    .pipe(es.mapSync(function(line) {

        // pause the readstream
        s.pause();

        (function() {
          els = line.split('\t');

          if(els.length!==3) {
            console.log("The following line doesn't have 3 fields:");
            console.log(line);
            s.resume();
          }
          c = els[0];
          d = els[1];
          p = els[2];

          if(!graph[c]) graph[c]={p:p,d:d};
          else {
            if(d.length > graph[c].d.length) graph[c].d = d;
            if(typeof(graph[c].p)==="string" && graph[c].p!=p) graph[c].p = [graph[c].p, p];
            else if(typeof(graph[c].p)!=="string" && graph[c].p.indexOf(p)===-1) graph[c].p.push(p);
          }

          idx.addDoc({
            desc: d,
            code: c,
            id: c
          });
          // resume the readstream
          s.resume();

        })();
      })
      .on('error', function() {
        console.log('Error while reading file.');
      })
      .on('end', function() {
        console.log('Read entirefile.');
        console.log("Elapsed: " + (Date.now() - start) + "ms");

        console.time("search:myocardial infarction");
        console.log(idx.search('myocardial infarction').map(function(v){
          return graph[v.ref];
        }).length);
        console.timeEnd("search:myocardial infarction");

        console.time("search:myocardial");
        console.log(idx.search('myocardial').map(function(v){
          return graph[v.ref];
        }).length);
        console.timeEnd("search:myocardial");

        console.time("search:infarct");
        console.log(idx.search('infarct').map(function(v){
          return graph[v.ref];
        }).length);
        console.timeEnd("search:infarct");

        console.time("search:myocard");
        console.log(idx.search('myocard').map(function(v){
          return graph[v.ref];
        }).length);
        console.timeEnd("search:myocard");

        var fileIdx = './processed/data_index.json';
        var fileGraph = './processed/data_graph.json';

        jsonfile.writeFile(fileIdx, idx.toJSON(), function (err) {
          console.error(err);
        });

        jsonfile.writeFile(fileGraph, graph, function (err) {
          console.error(err);
        });
      })
    );
});
