"use strict"

var emutils = require('../lib/emutils');
var assert = require('assert');
var fs = require('fs');

var testDir = "/tmp/emutilsTestFileUtils";

// Create and/or clean up test directory
if (fs.existsSync(testDir)) {
    var stats = fs.statSync(testDir);
    if (stats.isDirectory()) {
        fs.readdirSync(testDir).forEach(function(file) {
            fs.unlinkSync(testDir + "/" + file);
        });
    }
    else {
        fs.unlinkSync(testDir);
        fs.mkdirSync(testDir);
    }
}
else {
    fs.mkdirSync(testDir);
}

var badFile = "/tmp/no/such/dir/bad.file";
var badFile2 = "/tmp/no/such/dir/bad.file.2";
var goodFile = testFile("file.good");
var goodFile2 = testFile("file.good.2");
var fileContents = "Hello, World\n";
fs.writeFileSync(goodFile, fileContents);

var called = [0, 0, 0, 0];

process.on('exit', function () {
    called.forEach(function(row, index) {
        if (row != 1) {
            console.log("testFile: callback for copyFile #" + index + " was called " + row + " times.");
        }
    });
});

emutils.copyFile(badFile, testFile("no.file"), function(err) {
    called[0]++;
    assert.ok(err, "No error from bad source file");
})

emutils.copyFile(goodFile, badFile, function(err) {
    called[1]++;
    assert.ok(err, "No error from bad target file");
})

emutils.copyFile(badFile2, badFile, function(err) {
    called[2]++;
    assert.ok(err, "No error from bad source and target files");
})

emutils.copyFile(goodFile, goodFile2, function(err) {
    called[3]++;
    assert.ok(!err, "Error from good source and target files");
    var contents = fs.readFileSync(goodFile2);
    assert.equal(fileContents, contents, "file has incorrect contents");
})

function testFile(name) {
    return testDir + '/' + name;
}


