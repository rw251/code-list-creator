/* jshint node: true */
"use strict";

//Polyfill the array check for IE<9
var addIsArray = function(){
  Array.isArray = function(arg) {
    return Object.prototype.toString.call(arg) === '[object Array]';
  };
};
if (!Array.isArray) {
  addIsArray();
}

module.exports = {
  addIsArray : addIsArray
};
