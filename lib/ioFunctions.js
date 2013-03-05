"use strict";

var fs = require('fs');
var path = require('path');

exports.copyFile = copyFile;
exports.redirectOutput = redirectOutput;
exports.announceSelf = announceSelf;
exports.enableAnnouncements = enableAnnouncements;

/**
 A collection of io-related utility functions

 @module ioFunctions
 **/

/**
 Copy a file to another location
 @method copyFile
 @param (String} source file to copy
 @param (String} target copy it to here
 @param cb {Function(err)} completion routine
 **/
function copyFile(source, target, cb) {
    var cbCalled = false;

    var rd = fs.createReadStream(source);
    rd.on("error", function(err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function(err) {
        done(err);
    });
    wr.on("close", function() {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
}

/**
 Redirect stdout and stderr to files
 @method redirectOutput
 @param (String} outfile file to redirect stdout to
 @param (String} errfile file to redirect stderr to (optional)
 @return {Function} function to close the file(s) and restore normal output
 **/
function redirectOutput(outfile, errfile) {
    var writeOut = process.stdout.write;
    var writeErr = process.stderr.write;
    var outfd = fs.openSync(outfile, "w");
    var errfd;
    if (outfile == errfile) {
        errfd = outfd;
    }
    else if (errfile) {
        try {
            errfd = fs.openSync(errfile, "w");
        }
        catch(err) {
            fs.closeSync(outfd);
            throw err;
        }
    }
    process.stdout.write = function(str, encoding, fd) {
        if (Buffer.isBuffer(str)) {
            str = str.toString(encoding);
        }
        fs.writeSync(outfd, str);
    }
    if (errfd) {
        process.stderr.write = function(str, encoding, fd) {
            if (Buffer.isBuffer(str)) {
                str = str.toString(encoding);
            }
            fs.writeSync(errfd, str);
        }
    }

    return function() {
        process.stdout.write = writeOut;
        process.stderr.write = writeErr;
    }
}


var announcmentsEnabled = true;

/**
 Announce a module's name and version on standard out
 @method announceSelf
 @param {String} dir directory of the calling script (its __dirname)
 @param (Boolean} force if trur, do this even if announcments are
 globally disbaled
 @return {Boolean} whether the module's name and version were found
 **/
function announceSelf(dir, force) {
    if (!announcmentsEnabled && !force) {
        return true;
    }
    var curdir = dir;
    while (true) {
        var packageFile = curdir + path.sep + "package.json";
        if (fs.existsSync(packageFile)) {
            var pkg = require(packageFile);
            console.log("module " + pkg.name + ", version " + pkg.version);
            return true;
        }

        var parentDir = path.normalize(path.resolve(curdir, ".."));
        if (parentDir == curdir) {
            return false;
        }
        curdir = parentDir;
    }
}

/**
 Enable or disable announcements of a module's name and version
 @method enableAnnouncements
 @param (Boolean} enable enable if true, disable if false
 globally disabled
 **/
function enableAnnouncements(enable) {
    announcmentsEnabled = enable;
}


