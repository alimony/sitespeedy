(function () {
	'use strict';
	// Credentials for the Google API’s. These are specific to the domain name
	// for SiteSpeedy (sitespeedy.org) so they will not work out-of-the-box for
	// any other host, including localhost. To enable development on localhost
	// or any other domain you own, create a new OAuth client id through the
	// Google API Console: https://developers.google.com/console/help/
	// Here are some example settings for the client id creation dialog:
	//     Application type: Web Application
	//     Authorized Redirect URIs: (empty)
	//     Authorized JavaScript Origins (one per line): http://localhost:8000
	window.SITESPEEDY_CREDENTIALS = {
		clientId: '168282890157.apps.googleusercontent.com',
		apiKey: 'AIzaSyCLV4xGkRF4-mh2pd_nd-cJiaQeckr8xEU',
		scope: 'https://www.googleapis.com/auth/analytics.readonly'
	};
	window.SITESPEEDY_DEBUG = false;
}());
