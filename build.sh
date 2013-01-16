#!/bin/sh

handled/handled.js dev/index.html &&
rm -rf img/* && cp dev/img/* img &&
mv index.handled.html index.html
