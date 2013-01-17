#!/usr/bin/env node

/*jshint camelcase:false, boss:true */

'use strict';

// All file operations will be synchronous since the order they occur is
// significant when concatenating several files.

var path = require('path');
var fs = require('fs');
var compressor = require('yuicompressor');

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
	var destinationPath = 'css/style.min.css';
	var pattern = /<.*?href="(.*?)".*?>/gi;

	compressMatchesToDestination(contents, pattern, destinationPath);

	return '<link rel="stylesheet" href="' + destinationPath + '" />';
};

exports.concat_and_minify_js = function (contents) {
	var destinationPath = 'js/sitespeedy.min.js';
	var pattern = /<.*?src="(.*?)".*?>/gi;
	var excludedPaths = ['js/credentials.js'];

	compressMatchesToDestination(contents, pattern, destinationPath, excludedPaths);

	return '<script src="' + destinationPath + '"></script>';
};
