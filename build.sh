#!/bin/sh

# This build script will process the contents of the dev directory and output
# the resulting files in the root directory, which is where the deployed
# application lives.

handled/handled.js dev/index.html &&
mv index.handled.html index.html &&
echo "Renamed handled file to index.html" &&
rm -rf img/* && cp dev/img/* img &&
echo "Copied all images."
echo "Done!"
