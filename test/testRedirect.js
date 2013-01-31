"use strict"

var emutils = require('../lib/emutils');
var assert = require('assert');
var fs = require('fs');

var revert = emutils.redirectOutput("out.tmp");
console.log("Hello");
console.log("World");
process.stderr.write(".\n");
var contents = fs.readFileSync("out.tmp");
assert.equal("Hello\nWorld\n", contents.toString());
revert();
console.log("..");
process.stderr.write("...\n");
contents = fs.readFileSync("out.tmp");
assert.equal("Hello\nWorld\n", contents.toString());
fs.unlinkSync("out.tmp")

revert = emutils.redirectOutput("out.tmp", "out.tmp");
console.log("Hello");
console.log("World");
process.stderr.write("Success\n");
contents = fs.readFileSync("out.tmp");
assert.equal("Hello\nWorld\nSuccess\n", contents.toString());
revert();
console.log("....");
process.stderr.write(".....\n");
contents = fs.readFileSync("out.tmp");
assert.equal("Hello\nWorld\nSuccess\n", contents.toString());
fs.unlinkSync("out.tmp")

revert = emutils.redirectOutput("out.tmp", "err.tmp");
console.log("Hello");
console.log("World");
process.stderr.write("Success\n");
contents = fs.readFileSync("out.tmp");
assert.equal("Hello\nWorld\n", contents.toString());
contents = fs.readFileSync("err.tmp");
assert.equal("Success\n", contents.toString());
revert();
console.log("......");
process.stderr.write(".......\n");
contents = fs.readFileSync("out.tmp");
assert.equal("Hello\nWorld\n", contents.toString());
contents = fs.readFileSync("err.tmp");
assert.equal("Success\n", contents.toString());
