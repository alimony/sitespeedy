#!/bin/sh

handled/handled.js dev/index.html &&
mv index.handled.html index.html &&
echo "Renamed handled file to index.html" &&
rm -rf img/* && cp dev/img/* img &&
echo "Copied all images."
echo "Done!"
