SiteSpeedy
==========

This is the source code repository for [sitespeedy.org](http://sitespeedy.org).

SiteSpeedy calculates an overall PageSpeed score for your website based on a weighted average of your most visited pages, using data from your Google Analytics account.

Development
-----------
All development happens in the `dev` directory. The site can be run locally by starting a web server there, e.g. `python -m SimpleHTTPServer` or similar. For the local site to work properly, there also has to be a valid OAuth client id. Just copy the file `<root>/js/credentials.js` to `dev/js/credentials.js` and change the new file according to the instructions in its comments.

Building
--------
To prepare the site for deployment, run `./build.sh`. This will concatenate and compress JavaScript and CSS, and replace the development OAuth credentials with the live ones (that are only valid for the host sitespeedy.org). This is done using [handled](https://github.com/alimony/handled) which relies on [node](http://nodejs.org) and the [yuicompressor](https://github.com/yui/yuicompressor) module. Any images are copied as is, without any special processing.

Deployment
----------
The site lives in a single `gh-pages` branch, meaning that whenever a git push happens, it will be deployed live as well. However, since the built site is in the root directory, it will only be updated if it has been re-built using `./build.sh`.