#!/usr/bin/env node

/*jshint camelcase:false, boss:true */

'use strict';

var fs = require('fs');
var compressor = require('yuicompressor');

function compressInPlace(path) {
	var type;
	if (path.indexOf('.css') !== -1) {
		type = 'css';
	}
	else if (path.indexOf('.js') !== -1) {
		type = 'js';
	}
	else {
		console.log('Unknown file type, need .css or .js');
		process.exit(1);
	}
	compressor.compress(path, {
		type: type,
		o: path // Output file is same as input file, minifying it in place.
	}, function (error, data, extra) {
		if (error) {
			console.log(error);
		}
		if (extra) {
			console.log(extra);
		}
		fs.writeFileSync(path, data);
		console.log('Minified file written to ' + path);
	});
}

exports.concat_and_minify_css = function (contents) {
	// We will run synchronous calls here, since the order of things is actually
	// important when concatenating the files.

	var destinationPath = 'css/style.min.css';

	// Look for all CSS file paths in in the HTML input.
	var re = /<.*?href="(.*?)".*?>/gi;
	var match;
	var sourcePath;
	while (match = re.exec(contents)) {
		sourcePath = 'dev/' + match[1];
		fs.appendFileSync(destinationPath, fs.readFileSync(sourcePath));
		console.log('Added ' + sourcePath + ' to be minified.');
	}
	compressInPlace(destinationPath);

	return '<link rel="stylesheet" href="' + destinationPath + '" />';
};

exports.concat_and_minify_js = function (contents) {
	var destinationPath = 'js/sitespeedy.min.js';
	var re = /<.*?src="(.*?)".*?>/gi;
	var match;
	var sourcePath;
	while (match = re.exec(contents)) {
		// Instead of dev credentials, use the existing deploy credentials
		// already in the destination folder.
		if (match[1].indexOf('credentials') !== -1) {
			sourcePath = match[1];
		}
		else {
			sourcePath = 'dev/' + match[1];
		}
		fs.appendFileSync(destinationPath, fs.readFileSync(sourcePath));
		console.log('Added ' + sourcePath + ' to be minified.');
	}
	compressInPlace(destinationPath);

	return '<script src="js/' + destinationPath + '"></script>';
};
