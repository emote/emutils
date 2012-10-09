"use strict"

var emutils = require('../lib/emutils');
var assert = require('assert');

var allTypes =
{
    n : 12,
    b : true,
    s : "abc",
    d: new Date(),
    arr :
        [1, false, "def", new Date()],
    nu : null
};

assert.equal("number", emutils.type(12));
assert.equal("number", emutils.type(new Number(12)));
assert.equal("number", emutils.type(allTypes.n));
assert.equal("number", emutils.type(allTypes.arr[0]));

assert.equal("boolean", emutils.type(true));
assert.equal("boolean", emutils.type(new Boolean(false)));
assert.equal("boolean", emutils.type(allTypes.b));
assert.equal("boolean", emutils.type(allTypes.arr[1]));

assert.equal("string", emutils.type("qwerty"));
assert.equal("string", emutils.type(new String("abcde")));
assert.equal("string", emutils.type(allTypes.s));
assert.equal("string", emutils.type(allTypes.arr[2]));

assert.equal("date", emutils.type(new Date()));
assert.equal("date", emutils.type(allTypes.d));
assert.equal("date", emutils.type(allTypes.arr[3]));

assert.equal("object", emutils.type(allTypes));

assert.equal("array", emutils.type(allTypes.arr));

assert.equal("null", emutils.type(null));
assert.equal("null", emutils.type(allTypes.nu));

assert.equal("undefined", emutils.type(allTypes.noSuchField));

assert.equal("function", emutils.type(emutils.type));
