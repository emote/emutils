"use strict"

var emutils = require('../lib/emutils');
var assert = require('assert');
var util = require('util');

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

var complex = {
    row : [
        {
            n : 12, s : "abc", subrow : {
                nn: 14.7, ii : 12
            }
        } ,
        {
            n : 1.2, b : true, s: 13, subrow : {
                bb: false
            }
        }
    ]
}

var expected =
{
    type: 'object',
    fields:
    {
        row:
        {
            type: 'array',
            rowType:
            {
                type: 'object',
                fields:
                {
                    n: {
                        type: 'number' },
                    b: {
                        type: 'boolean' },
                    s: {
                        type: 'string' },
                    subrow:
                    {
                        type: 'object',
                        fields:
                        {
                            nn: {
                                type: 'number' },
                            bb: {
                                type: 'boolean' },
                            ii: {
                                type: 'number' }
                        }
                    }
                }
            }
        }
    }
};

emutils.assertEquals(expected, emutils.introspect(complex));

var coerceTo = {
    type: "object",
    fields: {
        a : { type : "string"},
        b : { type : "number"} ,
        c : {
            type : "array",
            rowType : {
                type : "number"
            }
        },
        d : {
            type: "object",
            fields : {
                f1 : {type : "number"}
            }
        },
        e : {
            type : "array",
            rowType : {
                type : "object",
                fields: {
                    g1 : {type: "string"}
                }
            }
        }
    }
};

var data = [
    {a : 12, b : "7"},
    {a : "abc", b : false},
    {a : "", b : 27, c : [34, "12", true], d : {f1 : 34}} ,
    {a : null, e : [{g1: "ddd"}, {g1 : "eee"}]},
    {a : null, e : {g1: "hhh"}}
];

var coercedData = [
    { a: '12', b: 7 },
    { a: 'abc' },
    { a: '', b: 27, c: [ 34, 12 ], d: { f1: 34 } },
    { e: [ { g1: 'ddd' }, { g1: 'eee' } ] },
    { e: [ { g1: 'hhh' } ] }
]

emutils.assertEquals(coercedData, emutils.coerce(data, coerceTo));

