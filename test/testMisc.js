"use strict"

var emutils = require('../lib/emutils');
var assert = require('assert');

// test the mergeIntoBuffer function
var buf = emutils.mergeIntoBuffer("abc", new Buffer("def"), "ghi");
assert.equal(buf.toString(), "abcdefghi");
assert.ok(Object.getPrototypeOf(buf).writeInt8);  // buf is a Buffer