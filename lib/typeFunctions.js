"use strict";

var miscFunctions = require("./miscFunctions.js");

exports.type = type;
exports.isArray = isArray;
exports.coerce = coerce;
exports.introspect = introspect;

/**
 A collection of type-related utility functions

 @module typeFunctions
 **/

var TYPES =
{
    'undefined'        : 'undefined',
    'number'           : 'number',
    'boolean'          : 'boolean',
    'string'           : 'string',
    '[object Function]': 'function',
    '[object RegExp]'  : 'regexp',
    '[object Array]'   : 'array',
    '[object Date]'    : 'date',
    '[object Number]'  : 'number',
    '[object Boolean]' : 'boolean',
    '[object String]'  : 'string'
};
var TOSTRING = Object.prototype.toString;

/**
 Return true if the argument is an array
 @method isArray
 @static
 @param o ({Any}
 @return whether the parameter is an array
**/
function isArray(o) {
    return type(o) == "array";
}

/**
 Return the type of a value`
 @method type
 @static
 @param o {Any}
 @return {String} the type
 **/
function type(o) {
    return TYPES[TOSTRING.call(o)] || TYPES[typeof o] ||  (o ? 'object' : 'null');
}

/**
 Coerce an object to match a set of type definitions.  A best-case effort it made to convert properties of incorrect types.
 properties not found in the type definition are dropped.
 In the worst case the worst case, an empty object is returned.
 If the object passed is an array, each row is coerced.
 @method coerce
 @param (Object) obj Object to coerce
 @param (Object) types hierarchy of types to coerce object to
 @return {Object} object after coercion
 **/
function coerce(obj, types) {

    if (isArray(obj)) {
        var result = [];
        obj.forEach(function (row) {
            var resultRow = doCoerce(row, types);
            if (resultRow) {
                result.push(resultRow);
            }
        })
        return result;
    }
    else {
        var result = doCoerce(obj, types);
        return miscFunctions.hasValue(result) ? [resukt] : null;
    }

    function doCoerce(obj, types) {

        var objType = type(obj);
        var typeType = types.type;

        switch(objType) {
            case "array":
                var result = [];
                if (!isArray(obj)) {
                    obj = [obj];
                }
                obj.forEach(function (row) {
                    var resultRow = doCoerce(row, types.rowType);
                    if (resultRow) {
                        result.push(resultRow);
                    }
                });
                return result;

            case "object":
                if (typeIsScalar(typeType)) {
                    return null;
                }
                var result = {};
                switch (typeType) {
                    case "array":
                        return doCoerce([obj], types);

                    case "object":
                        break;

                    default:
                        return null;
                }
                for (var fieldName in types.fields) {
                    var fieldVal = obj[fieldName];
                    if (miscFunctions.hasValue(fieldVal)) {
                        var fieldDesc = types.fields[fieldName];
                        var coercedVal = doCoerce(fieldVal, fieldDesc);
                        if (miscFunctions.hasValue(coercedVal)) {
                            result[fieldName] = coercedVal;
                        }
                    }
                }
                if (typeType == "array") {
                    result =[result];
                }
                return result;

            case "string":
                switch(typeType) {
                    case "string":
                        return obj;

                    case "number":
                        var num = Number(obj);
                        return num == NaN ? null : num;

                    case "boolean":
                        var lower = obj.toLowerCase();
                        switch (lower) {
                            case "false":
                                return false;
                            case "true":
                                return true;
                            default:
                                return null;
                        }

                    case "date":
                        return new Date(obj);

                    default:
                        return null;
                }

            case "number":
                switch(typeType) {
                    case "number":
                        return obj;

                    case "string":
                        return obj.toString();

                    case "date":
                        return new Date(obj);

                    default:
                        return null;
                }

            case "boolean":
                switch(typeType) {
                    case "boolean":
                        return obj;

                    case "string":
                        return obj.toString();

                    default:
                        return null;
                }

            case "date":
                switch(typeType) {
                    case "date":
                        return obj;

                    case "number":
                        return obj.getTime();

                    case "string":
                        return date.toString();

                    default:
                        return null;
                }


            default:
                return null;


        }
    }
}

/**
 Create a collection of types by introspection on a JavaScript object.
 @method introspect
 @param (Object) obj Object to introspect
 @return {Object} collection of type descriptions
 **/
function introspect(obj) {
    var content = getObjectType(obj);
    if (!content) {
        return null;
    }
    else if (typeIsScalar(content)) {
        return content;
    }
    else if (typeIsArray(content)) {
        var rowType = null;
        obj.forEach(function(row) {
            var newRowType = introspect(row);
            if (newRowType) {
                if (rowType) {
                    rowType = promoteType(rowType, newRowType);
                }
                else {
                    rowType = newRowType;
                }
            }
        });
        if (rowType) {
            content.rowType = rowType;
        }
        else {
            content = null;
        }
        return content;
    }
    else {
        content.fields = {};
        for (var name in obj) {
            var field = introspect(obj[name]);
            if (field) {
                content.fields[name] = field;
            }
        }
        return content;
    }

    function getObjectType(object) {
        if (!miscFunctions.hasValue(object)) {
            return null;
        }
        var ttype = type(object);
        switch(ttype) {
            case "number":
            case "boolean":
            case "string":
            case "date":
            case 'field':

                return {type: ttype};

            case "regexp":
                return {type: "string"};

            case "array":
                if (obj.length == 0) {
                    return null;
                }
                return {type : "array"};

            case "object":
                return {type :"object"};
        }
    }

    function promoteType(type1, type2) {
        var t1;
        var t2;
        var array = false;
        var rettype = {};

        if (typeIsArray(type1)) {
            t1 = type1.rowType;
            array = true;
        }
        else {
            t1 = type1;
        }
        if (typeIsArray(type2)) {
            t2 = type2.rowType;
            array = true;
        }
        else {
            t2 = type2;
        }
        var scalar = typeIsScalar(type1);
        if (scalar != typeIsScalar(type2)) {
            throw new Error("The data contains inconsistent uses of types.")
        }
        if (scalar) {
            if (t1.type == t2.type) {
                rettype.type = t1.type;
            }
            else {
                rettype.type = "string";
            }
        }
        else {
            rettype.type = "object";
            rettype.fields = mergeFields(t1.fields, t2.fields);
        }
        return array ? {type: "array", rowType : rettype} : rettype;
    }

    function mergeFields(fields1, fields2) {
        var retfields = {};
        for (var name in fields1) {
            var f1 = fields1[name];
            var f2 = fields2[name];
            if (!f2) {
                retfields[name] = f1;
            }
            else {
                retfields[name] = promoteType(f1, f2);
            }
            for (var name in fields2) {
                if (!fields1[name]) {
                    retfields[name] = fields2[name];
                }
            }
        }

        return retfields;
    }
}


function typeIsScalar(type) {
    switch (type.type) {
        case "number":
        case "boolean":
        case "string":
        case "date":
            return true;

        default:
            return false;
    }
}

function typeIsArray(type) {
    return type.type == "array";
}





