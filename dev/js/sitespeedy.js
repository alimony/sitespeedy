(function () {
	'use strict';

	//       _____  __  ______  _____  _____  _____  _____  _____  ___  __  __
	//      / ___/ / / /_  __/ / ___/ / ___/ / _  / / ___/ / ___/ /   \ \ \/ /
	//     / /__  / /   / /   / /__  / /__  / // / / /__  / /__  / // /  \  /
	//    /__  / / /   / /   / ___/ /__  / / ___/ / ___/ / ___/ / // /   / /
	//   ___/ / / /   / /   / /__  ___/ / / /    / /__  / /__  / // /   / /
	//  /____/ /_/   /_/   /____/ /____/ /_/    /____/ /____/ /____/   /_/
	//
	//    SiteSpeedy calculates an overall PageSpeed score for your website
	//         based on a weighted average of your most visited pages.

	function debug(message) {
		if (SITESPEEDY_DEBUG) {
			console.log(message);
		}
	}

	// These are used for querying Google Analytics.
	var selectedAccountId, selectedWebPropertyId, selectedProfileId;

	// When we have fetched the top pages to be analyzed, they will be stored
	// as objects with a 'url' property in an array. Each of the URL’s will
	// then be sent to PageSpeed, and the resulting score will be saved on the
	// originating object as a 'pageSpeedScore' property.
	var pages = [];
	var maxNumberOfPages = 10;

	// Any section can be given a 'loading' status.
	function setIsLoading(element, isLoading) {
		element.removeClass('loading');
		if (isLoading) {
			element.addClass('loading');
		}
	}

	// When clicking a <li>-element, it will always be set to selected, and
	// all other siblings hidden. Additionally, all following selector menus
	// will be emptied and hidden, ready for new content from the API calls.
	// We use the delegated form of event handler, to target not yet existing
	// elements too.
	$('.account-selector').on('click', 'li:not(.selected)', function (e) {
		e.preventDefault();
		var clickedElement = $(this);
		clickedElement.removeClass('selected').addClass('selected');
		var accountSelector = clickedElement.closest('.account-selector');
		accountSelector.find('li:not(.selected)').slideUp('fast');
		accountSelector.nextAll('.account-selector').slideUp('fast').empty();
	});

	// Unfortunately, the callback when the Google Javascript Client has
	// loaded is called as window['callback'] which means we can't pass an
	// object method (e.g. NAMESPACE.onGoogleClientLoad). We’ll just have to
	// put the callback in the global scope.
	window.onGoogleClientLoad = function () {
		gapi.client.setApiKey(SITESPEEDY_CREDENTIALS.apiKey);
		window.setTimeout(function () {
			checkAuth(true);
		}, 1);
	};

	$('#authorize-button').click(function (e) {
		e.preventDefault();
		checkAuth(false);
	});

	// If the user is already authorized, we will fetch the list of Analytics
	// accounts available to the current user. If not, we’ll show the
	// "Authorize" button.
	function checkAuth(immediate) {
		setIsLoading($('#authorization'), true);
		gapi.auth.authorize({
			'client_id': SITESPEEDY_CREDENTIALS.clientId,
			'scope': SITESPEEDY_CREDENTIALS.scope,
			'immediate': immediate
		}, handleAuthResult);
	}

	// TODO: Unfortunately, we get no callback if the user just closes the
	// authorization window instead of clicking the decline ("No thanks") button.
	// http://code.google.com/p/google-api-javascript-client/issues/detail?id=23
	function handleAuthResult(authResult) {
		if (authResult) {
			// The user is authorized, so load the Analytics API.
			$('#authorize-button').hide();
			gapi.client.load('analytics', 'v3', handleAnalyticsAPILoad);
		}
		else {
			// The user is not authorized, so show the "Authorize" button.
			setIsLoading($('#authorization'), false);
			$('#authorize-button').show();
		}
	}

	function handleAnalyticsAPILoad() {
		// Fetch the list of Analytics accounts available to the current user.
		setIsLoading($('#accounts'), true);
		gapi.client.analytics.management.accounts.list().execute(handleAccounts);
	}

	$('#log-out').click(function (e) {
		e.preventDefault();
		// Revoke authorization for the logged in user.
		$.get('https://accounts.google.com/o/oauth2/revoke', {
			'token': gapi.auth.getToken().access_token
		}).error(function () {
			// The call will purposedly fail because of same origin mismatch,
			// but we will still have revoked the authorization.
			// http://code.google.com/p/google-api-javascript-client/issues/detail?id=59
			window.setTimeout(function () {
				resetPage();
				checkAuth(true);
			}, 1);
		});
	});

	// This will reset all page elements to the inital state.
	function resetPage() {
		$('.initially-hidden').hide();
		$('#username').html('').hide();
	}

	// Getting to the profile containing the Analytics data we need consists
	// of three consecutive steps:
	//     1. Get an account from the user.
	//     2. Get a web property from that account.
	//     3. Get a profile from that web property.
	// Since these steps are almost identical, they will be handled by the same
	// function, with a few parameters to differentiate them.
	function handleResult(result, menuContainer, pluralForm, onLiClick) {
		var li;
		if (!result.code) {
			menuContainer.empty();
			if (result && result.items && result.items.length) {
				var sortedItems = _.sortBy(result.items, 'created').reverse();
				_.each(sortedItems, function (element) {
					li = $('<li />');
					li.attr('rel', element.id);
					li.text(element.name);
					li.one('click', onLiClick);
					menuContainer.append(li);
				});
			}
			else {
				li = $('<li />');
				li.text('No ' + pluralForm + ' found.');
				menuContainer.append(li);
			}
		}
		else {
			debug(result.message);
			li = $('<li />');
			li.text('Could not get ' + pluralForm + '.');
			menuContainer.append(li);
		}
		menuContainer.show();
	}

	function handleAccounts(result) {
		setIsLoading($('#authorization'), false);
		setIsLoading($('#accounts'), false);
		// Display the account username and log out button. This may
		// potentially be called multiple times if the user clicks the account
		// name, but the overhead of those additional calls is probably
		// smaller than checking state every time.
		$('#username').html(result.username).show();
		$('#log-out').show();
		handleResult(result, $('#accounts'), 'accounts', function () {
			setIsLoading($('#web-properties'), true);
			selectedAccountId = $(this).attr('rel');
			gapi.client.analytics.management.webproperties.list({
				'accountId': selectedAccountId
			}).execute(handleWebProperties);
		});
	}

	function handleWebProperties(result) {
		setIsLoading($('#web-properties'), false);
		handleResult(result, $('#web-properties'), 'web properties', function () {
			setIsLoading($('#profiles'), true);
			selectedWebPropertyId = $(this).attr('rel');
			gapi.client.analytics.management.profiles.list({
				'accountId': selectedAccountId,
				'webPropertyId': selectedWebPropertyId
			}).execute(handleProfiles);
		});
	}

	function handleProfiles(result) {
		setIsLoading($('#profiles'), false);
		handleResult(result, $('#profiles'), 'profiles', function () {
			$('#loading-ga-data').show();
			$('#status-message').html('Getting top URL’s…').show();
			selectedProfileId = $(this).attr('rel');
			// We will get the most viewed pages based on the last month’s analytics.
			var endDate = dateString(new Date());
			var startDate = new Date();
			startDate.setMonth(startDate.getMonth() - 1);
			startDate = dateString(startDate);
			// Finally, we are ready to fetch the most viewed pages from the selected profile.
			gapi.client.analytics.data.ga.get({
				'ids': 'ga:' + selectedProfileId,
				'start-date': startDate,
				'end-date': endDate,
				'dimensions': 'ga:hostname,ga:pagePath',
				'metrics': 'ga:pageviews',
				'sort': '-ga:pageviews',
				'max-results': maxNumberOfPages
			}).execute(handleAnalyticsResult);
		});
	}

	function handleAnalyticsResult(result) {
		if (!result.code) {
			if (result && result.rows && result.rows.length) {
				// We have the top URL’s, let’s save them and load PageSpeed.
				var pageURLs = _.map(result.rows, function (row) {
					// Combine the hostname and path to the the full URL.
					// TODO: If any custom filters are set up in Analytics that
					// displays the host name as part of the request URI, we
					// would end up with a duplicated host name, so only return
					// the path in such cases. There are probably much better
					// ways to solve this...
					var hostName = row[0];
					var pagePath = row[1];
					if (pagePath.indexOf(hostName) !== -1) {
						return pagePath;
					}
					else {
						return hostName + pagePath;
					}
				});
				_.each(pageURLs, function (element) {
					pages.push({ url: element });
				});
				gapi.client.load('pagespeedonline', 'v1', handlePageSpeedLoad);
			}
		}
	}

	function handlePageSpeedLoad() {
		$('#loading-ga-data').hide();
		$('#status-message').html('Getting PageSpeed data…');
		$('#progress-bar-container').show();
		_.each(pages, function (element, index) {
			// Dispatch all API calls at once.
			// TODO: We assume http protocol, maybe this should instead be checked somehow.
			var URL = 'http://' + element.url;
			gapi.client.pagespeedonline.pagespeedapi.runpagespeed({
				'url': URL
			}).execute(function (result) {
				handlePageSpeedResult(index, result);
			});
		});
	}

	function handlePageSpeedResult(index, result) {
		if (result.code) {
			// There was an error, so remove this URL from the page set.
			pages.splice(index, 1);
			debug('Error ' + result.code + ' - ' + result.message);
		}
		else {
			// For each incoming result, save the score and then see if we have
			// all the scores yet. Also, update the URL since we get a proper one
			// including protocol back from PageSpeed.
			pages[index].pageSpeedScore = result.score;
			pages[index].url = result.id;
		}
		var collectedScores = _.countBy(pages, function (element) {
			// This will return an object with the property 'true' counting the
			// number of scores we have, and 'false' counting how many remain.
			return _.has(element, 'pageSpeedScore');
		});
		// When no scores remain to be collected, there won’t be a 'false' property.
		if (_.has(collectedScores, 'false')) {
			// There are still scores to collect, display progress.
			$('#progress-bar').css('width', collectedScores['true'] / (pages.length - 1) * 100 + '%');
		}
		else {
			$('#progress-bar-container').hide();
			if (pages.length === 0) {
				// We have no data to analyze, exit.
				$('#status-message').html('Found no pages to analyze.');
				return;
			}
			$('#status-message').hide();
			// We have collected all the PageSpeed values, we will now weight
			// them so that the top page is considered most important and the
			// last page least.
			var weight = 0;
			var numberToDivideBy = 0;
			var total = 0;
			_.each(pages, function (element, index) {
				weight = pages.length - index;
				numberToDivideBy += weight;
				total += element.pageSpeedScore * weight;
			});
			// That’s it, we’re done.
			var siteSpeedyScore = Math.round(total / numberToDivideBy);
			var scoreElement = $('#score');
			scoreElement.html(siteSpeedyScore);
			// Colorize the score from red (0.0) to green (1.0) depending on its value.
			scoreElement.css('color', 'hsl(' + parseInt((siteSpeedyScore/100) * 120, 10) + ', 60%, 40%)');
			scoreElement.parent().show();
			var detailsContainer = $('#details tbody').empty();
			_.each(pages, function (element) {
				var decodedURL = decodeURIComponent(element.url);
				detailsContainer.append($(
					'<tr>' +
						'<td><a href="' + decodedURL + '" target="_blank">' + decodedURL + '</a></td>' +
						'<td>' + element.pageSpeedScore + '</td>' +
					'</tr>'
				));
			});
			$('#show-details-link').click(function (e) {
				e.preventDefault();
				$('#details').slideToggle('fast');
				var clickedElement = $(this);
				if (clickedElement.hasClass('expanded')) {
					clickedElement.html('Show details →').removeClass('expanded');
				}
				else {
					clickedElement.html('Hide details ←').addClass('expanded');
				}
			}).show();
		}
	}

	// Utility function to return a date object as an YYYY-MM-DD formatted string.
	function dateString(d) {
		function pad(n) {
			return n < 10 ? '0' + n : n;
		}
		return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
	}
}());
