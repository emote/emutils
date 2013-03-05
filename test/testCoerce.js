"use strict"

var emutils = require('../lib/emutils');
var assert = require('assert');

var types = {
    address:
    {
        name : "address",
        content:
            [
                {
                    name : "streetAddress",
                    type : "StreetAddress"
                } ,
                {
                    name : "city",
                    jsonType : "string"
                },
                {
                    name : "state",
                    jsonType : "string"
                },
                {
                    name : "permanent",
                    jsonType : "boolean"
                },
                {
                    name : "occupants",
                    type : "fullName",
                    maxOccurs : -1
                }
            ]
    },
    StreetAddress :
    {
        name : "StreetAddress",
        content:
            [
                {
                    name : "number",
                    jsonType: "number"
                },
                {
                    name : "street",
                    jsonType : "string"
                }
            ]
    },
    fullName :
    {
        name : "fullName",
        content:
            [
                {
                    name : "first",
                    jsonType: "string"
                },
                {
                    name : "last",
                    jsonType : "string"
                }
            ]
    }
}

function checkEquality(o1, o2) {

    doCheckEquality("", o1, o2);

    function doCheckEquality(name, o1, o2) {
        var t1 = emutils.type(o1);
        var t2 = emutils.type(o2);

        if (t1 != t2) {
            throw              new Error("Type mismatch(" + name + "): " + t1 + " vs. " + t2);
        }
        switch(t1) {
            case "boolean":
            case "number":
            case "string":
            case "null":
            case "undefined":
            case "regexp":
            case "date":
                if (o1 != o2) {
                    throw new Error("Value mismatch(" + name + "): " + o1 + " vs. " + o2);
                }
                return;

            case "object":
                for (var fname in o1) {
                    doCheckEquality(name + "." + fname, o1[fname], o2[fname]);
                }
                for (var fname in o2) {
                    if (o1[fname] != undefined) {
                        doCheckEquality(name + "." + fname, o1[fname], o2[fname]);
                    }
                }
                return;

            case "array":
                if (o1.length != o2.length) {
                    throw new Error("Length mismatch(" + name + "): " + o1.length + " vs. " + o2.length);
                }
                o1.forEach(function(row, index) {
                   doCheckEquality(name + '[' + index + ']', row, o2[index]);
                });
        }
    }
}

var o1 = {
        streetAddress :
        {
            number : 1600,
            street : "Pennsylvania Avenue"
        },
        city : "Washington",
        state: "DC",
        permanent: false,
        occupants: [{first : "Barack", last: "Obama"}]
    }

var o2 = {
    streetAddress : [
        {
            number : "1600",
            street : "Pennsylvania Avenue"
        },
        {
            number : 1704,
            street : "Virgina Avenue"
        }
    ],
    city : ["Washington", "Georgetown"],
    state: "DC",
    permanent: "false",
    highRent: true,
    occupants: {first : "Barack", last: "Obama"}
}

var o3 = {
    streetAddress :
    {
        number : 10,
        street : "Downing Street"
    },
    city : "London",
    state: "England",
}

var failed;

checkEquality(o1, emutils.coerce(o1, "address",  types));
checkEquality(o1, emutils.coerce(o2, "address",  types));
try {
    checkEquality(o1, emutils.coerce(o3, "address",  types));
    failed = false;
}
catch(ex) {
    failed = true;
}
assert(failed);

checkEquality([o3, o1], emutils.coerce([o3, o2], "address",  types));