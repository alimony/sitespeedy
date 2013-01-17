#!/usr/bin/env node

/*jshint camelcase:false, boss:true */

'use strict';

var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var compressor = require('yuicompressor');

// All file operations will be synchronous since the order they occur is
// significant when concatenating several files.

function hashForFilename(sourcePath) {
	console.log('Generating hash sum for ' + sourcePath + '...');
	var md5 = crypto.createHash('md5');
	var data = fs.readFileSync(sourcePath);
	md5.update(data);
	var md5string = md5.digest('hex').slice(0, 12);

	return md5string;
}

function compressInPlace(destinationPath) {
	compressor.compress(destinationPath, {
		type: path.extname(destinationPath).slice(1), // 'css' or 'js' based on file extension.
		o: destinationPath // Destination is same as source.
	}, function (error, data, extra) {
		if (error) {
			console.log(error);
		}
		if (extra) { // Warnings.
			console.log(extra);
		}
		fs.writeFileSync(destinationPath, data);
		console.log('Minified file written to ' + destinationPath);
	});
}

function compressMatchesToDestination(contents, pattern, destinationPath, excludedPaths) {
	// Remove any existing files.
	var basename = path.basename(destinationPath).split('.')[0];
	var basedir = path.dirname(destinationPath);
	var existingFiles = fs.readdirSync(basedir);
	var currentBasename;
	existingFiles.forEach(function (currentFile) {
		currentBasename = currentFile.split('.')[0];
		if (currentBasename === basename) {
			fs.unlinkSync(path.join(basedir, currentFile));
		}
	});

	var match;
	var currentPath;
	var sourcePath;
	while (match = pattern.exec(contents)) {
		currentPath = match[1];
		if (excludedPaths && excludedPaths.indexOf(currentPath) !== -1) {
			sourcePath = currentPath;
		}
		else {
			sourcePath = 'dev/' + currentPath;
		}
		fs.appendFileSync(destinationPath, fs.readFileSync(sourcePath));
		console.log('Added ' + sourcePath + ' to be minified.');
	}

	compressInPlace(destinationPath);
}

exports.concat_and_minify_css = function (contents) {
	var hash = hashForFilename('dev/css/style.css');
	var destinationPath = 'css/style.' + hash + '.min.css';
	var pattern = /<.*?href="(.*?)".*?>/gi;

	compressMatchesToDestination(contents, pattern, destinationPath);

	return '<link rel="stylesheet" href="' + destinationPath + '" />';
};

exports.concat_and_minify_js = function (contents) {
	var hash = hashForFilename('dev/js/sitespeedy.js');
	var destinationPath = 'js/sitespeedy.' + hash + '.min.js';
	var pattern = /<.*?src="(.*?)".*?>/gi;
	var excludedPaths = ['js/credentials.js'];

	compressMatchesToDestination(contents, pattern, destinationPath, excludedPaths);

	return '<script src="' + destinationPath + '"></script>';
};
