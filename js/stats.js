function formattedDateString(timestamp) {
	var ms = timestamp * 1000;
	var date = new Date(timestamp);
	var formatted_date = date.toISOString().slice(0, 10);
	return formatted_date;
}

function sortObj(obj) {
	return Object.keys(obj).sort().reduce(function (result, key) {
		result[key] = obj[key];
		return result;
	}, {});
}

function setProgress(current, total, loadType, cached) {
	var loadingTextElement = document.getElementById("loading-text");
	if (!cached) {
		loadingTextElement.innerHTML = "<h2>LOADING</h2></br>Loading " + loadType + " Library Data: " + current + "/" + total + "</br><i>Larger libraries will take time to process</i>";
	}
	else {
		loadingTextElement.innerHTML = "<h2>LOADING</h2></br>Loading " + loadType + " Cached Library Data: " + current + "/" + total + "</br><i>Larger libraries will take time to process</i>";
	}
}

async function generateShowData(uri, plex_token, section_keys, show_categories, show_categories_cached) {
	loadType = "Show";
	if (Array.isArray(show_categories_cached) && show_categories_cached.length) {
		utils.debug("Stats [async] (generateShowData): Retreiving show data from cache for cached show categories");
		var total = section_keys.length;
		var cached = true;
		for (var k = 0; k < show_categories_cached.length; k++) {
			setProgress(k, total, loadType, cached);
			var chartId = show_categories_cached[k];
			var key = "stats_" + chartId;
			result = await utils.cache_get(key, "sync");
			count = result;
			utils.debug("Stats [async] (generateShowData): Generating chart for " + chartId);
			generateChart(count, chartId);
		}
	}
	if (Array.isArray(show_categories) && show_categories.length) {
		utils.debug("Stats [async] (generateShowData): Generating show data for non-cached show categories");
		var shows = [];
		var episodes = [];
		var show_genres = [];
		var total = section_keys.length;
		var cached = false;
		for (var j = 0; j < section_keys.length; j++) {
			setProgress(j, total, loadType, cached);
			var section_key = section_keys[j];
			const timer = ms => new Promise(res => setTimeout(res, ms));
			var library_section_url = uri + "/library/sections/" + section_key + "/all?X-Plex-Token=" + plex_token;
			var library_section_episodes_url = uri + "/library/sections/" + section_key + "/all?type=4&X-Plex-Token=" + plex_token;
			var section_xml = await utils.getXML(library_section_url);
			var section_episode_xml = await utils.getXML(library_section_episodes_url);
			await timer(100);
			var shows_xml = section_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
			for (var i = 0; i < shows_xml.length; i++) {
				var show_data = {};
				show_data["year"] = shows_xml[i].getAttribute("year");
				rawdate = new Date(shows_xml[i].getAttribute("addedAt") * 1000).toISOString().slice(0, 7);
				show_data["addedAt"] = rawdate;
				show_data["audienceRating"] = Math.floor(shows_xml[i].getAttribute("audienceRating"));
				if (show_data["audienceRating"] < 10) {
					show_data["audienceRating"] = show_data["audienceRating"] + "-" + (show_data["audienceRating"] + 1);
				}
				show_data["contentRating"] = shows_xml[i].getAttribute("contentRating");
				shows.push(show_data);

				var genres = shows_xml[i].getElementsByTagName("Genre");
				for (let i = 0; i < genres.length; i++) {
					var genre_data = {};
					genre_data["genre"] = genres[i].getAttribute("tag");
					show_genres.push(genre_data);
				}
			}
			var episode_xml = section_episode_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");
			for (var i = 0; i < episode_xml.length; i++) {
				var episode_data = {};
				episode_data["ep_year"] = episode_xml[i].getAttribute("originallyAvailableAt");
				//episode_data["ep_addedAt"] = formattedDateString(episode_xml[i].getAttribute("addedAt"));
				episode_data["ep_resolution"] = episode_xml[i].getElementsByTagName("Media")[0].getAttribute("videoResolution");
				if (episode_data["ep_resolution"] === "sd") {
					episode_data["ep_resolution"] = "SD";
				}
				else {
					episode_data["ep_resolution"] = episode_data["ep_resolution"] + "p";
				}
				episodes.push(episode_data);
			}
		}
		for (var k = 0; k < show_categories.length; k++) {
			chartId = show_categories[k];
			if (chartId === "ShowsByAiredYear") {
				var count = shows.reduce((acc, o) => (acc[o.year] = (acc[o.year] || 0) + 1, acc), {});
			}
			else if (chartId === "ShowsByAddedAt") {
				var precount = shows.reduce((acc, o) => (acc[o.addedAt] = (acc[o.addedAt] || 0) + 1, acc), {});
				var count = sortObj(precount);
			}
			else if (chartId === "ShowsByGenre") {
				var count = show_genres.reduce((acc, o) => (acc[o.genre] = (acc[o.genre] || 0) + 1, acc), {});
			}
			else if (chartId === "ShowsByContentRating") {
				var count = shows.reduce((acc, o) => (acc[o.contentRating] = (acc[o.contentRating] || 0) + 1, acc), {});
			}
			else if (chartId === "ShowsByAudienceRating") {
				var count = shows.reduce((acc, o) => (acc[o.audienceRating] = (acc[o.audienceRating] || 0) + 1, acc), {});
			}
			else if (chartId === "EpisodesByResolution") {
				var count = episodes.reduce((acc, o) => (acc[o.ep_resolution] = (acc[o.ep_resolution] || 0) + 1, acc), {});
			}
			utils.debug("Stats [async] (generateShowData): Generating chart for " + chartId);
			generateChart(count, chartId);
			var key = "stats_" + chartId;
			utils.cache_set(key, count, "sync");
		}
	}
}

async function generateMovieData(uri, plex_token, section_keys, movie_categories, movie_categories_cached) {
	var loadType = "Movie";
	if (Array.isArray(movie_categories_cached) && movie_categories_cached.length) {
		utils.debug("Stats [async] (generateMovieData): Retreiving movie data from cache for cached movie categories");
		var total = section_keys.length;
		var cached = true;
		for (var k = 0; k < movie_categories_cached.length; k++) {
			setProgress(k, total, loadType, cached);
			var chartId = movie_categories_cached[k];
			var key = "stats_" + chartId;
			result = await utils.cache_get(key, "sync");
			count = result;
			utils.debug("Stats [async] (generateMovieData): Generating chart for " + chartId);
			generateChart(count, chartId);
		}
	}
	if (Array.isArray(movie_categories) && movie_categories.length) {
		utils.debug("Stats [async] (generateMovieData): Generating movie data for non-cached movie categories");
		var movies = [];
		var total = section_keys.length;
		var cached = false;
		for (var j = 0; j < section_keys.length; j++) {
			setProgress(j, total, loadType, cached);
			var section_key = section_keys[j];
			const timer = ms => new Promise(res => setTimeout(res, ms));
			var library_section_url = uri + "/library/sections/" + section_key + "/all?X-Plex-Token=" + plex_token;
			var section_xml = await utils.getXML(library_section_url);
			await timer(100);
			var movies_xml = section_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");
			for (var i = 0; i < movies_xml.length; i++) {
				var movie_data = {};
				movie_data["year"] = movies_xml[i].getAttribute("year");
				rawdate = new Date(movies_xml[i].getAttribute("addedAt") * 1000).toISOString().slice(0, 7);
				movie_data["addedAt"] = rawdate;
				movie_data["resolution"] = movies_xml[i].getElementsByTagName("Media")[0].getAttribute("videoResolution");
				movie_data["audienceRating"] = Math.floor(movies_xml[i].getAttribute("audienceRating"));
				if (movie_data["audienceRating"] < 10) {
					movie_data["audienceRating"] = movie_data["audienceRating"] + "-" + (movie_data["audienceRating"] + 1);
				}
				movie_data["contentRating"] = movies_xml[i].getAttribute("contentRating");
				if (movie_data["resolution"] === "sd") {
					movie_data["resolution"] = "SD";
				}
				else {
					movie_data["resolution"] = movie_data["resolution"] + "p";
				}
				movies.push(movie_data);
				var genres = movies_xml[i].getElementsByTagName("Genre");
				for (let i = 0; i < genres.length; i++) {
					movie_data["genre"] = genres[i].getAttribute("tag");
					movies.push(movie_data);
				}
			}
		}
		for (var k = 0; k < movie_categories.length; k++) {
			chartId = movie_categories[k];
			if (chartId === "MoviesByReleaseYear") {
				var count = movies.reduce((acc, o) => (acc[o.year] = (acc[o.year] || 0) + 1, acc), {});
			}
			else if (chartId === "MoviesByAddedAt") {
				var precount = movies.reduce((acc, o) => (acc[o.addedAt] = (acc[o.addedAt] || 0) + 1, acc), {});
				var count = sortObj(precount);
			}
			else if (chartId === "MoviesByGenre") {
				var count = movies.reduce((acc, o) => (acc[o.genre] = (acc[o.genre] || 0) + 1, acc), {});
			}
			else if (chartId === "MoviesByResolution") {
				var count = movies.reduce((acc, o) => (acc[o.resolution] = (acc[o.resolution] || 0) + 1, acc), {});
			}
			else if (chartId === "MoviesByAudienceRating") {
				var count = movies.reduce((acc, o) => (acc[o.audienceRating] = (acc[o.audienceRating] || 0) + 1, acc), {});
			}
			else if (chartId === "MoviesByContentRating") {
				var count = movies.reduce((acc, o) => (acc[o.contentRating] = (acc[o.contentRating] || 0) + 1, acc), {});
			}
			utils.debug("Stats [async] (generateMovieData): Generating chart for " + chartId);
			generateChart(count, chartId);
			var key = "stats_" + chartId;
			utils.cache_set(key, count, "sync");
		}
	}
}

function generateChart(count, chartId) {
	var xValues = Object.keys(count);
	var yValues = Object.values(count);
	if (chartId.includes("Year")) {
		var chartType = "bar";
	}
	else if (chartId.includes("AddedAt")) {
		var chartType = "line";
	}
	else if (chartId.includes("Genre")) {
		var chartType = "bar";
	}
	else if (chartId.includes("ContentRating")) {
		var chartType = "bar";
	}
	else if (chartId.includes("AudienceRating")) {
		var chartType = "pie";
	}
	else if (chartId.includes("Resolution")) {
		var chartType = "pie";
	}
	if (chartType === "pie") {
		var plugin_legend_display = true;
	}
	else if (chartType === "line") {
		var plugin_legend_display = false;
	}
	else if (chartType === "bar") {
		var plugin_legend_display = false;
	}
	if ((chartType === "bar") || (chartType === "line")) {
		if (chartType === "bar") {
			var barColours = [];
			var total = Math.max.apply(Math, yValues);
			for (let i = 0; i < xValues.length; i++) {
				value = yValues[i];
				percentage = (value * 100) / total;
				hue = (percentage / 100) * 120;
				colour = `hsl(${hue}, 100%, 50%)`;
				barColours.push(colour);
			}
		}
		if (chartType === "line") {
			var barColours = "rgb(240,228,66)";
		}
		var maintainAspectRatio = false;
		var responsive = true;
	}
	if (chartType === "pie") {
		var barColours = [];
		var total = Math.max.apply(Math, yValues);
		for (let i = 0; i < xValues.length; i++) {
			var r = Math.floor(Math.random() * 255);
			var g = Math.floor(Math.random() * 255);
			var b = Math.floor(Math.random() * 255);
			colour = "rgb(" + r + "," + g + "," + b + ")";
			barColours.push(colour);
		}
		var maintainAspectRatio = false;
		var aspectRatio = 1;
	}
	new Chart(chartId, {
		type: chartType,
		data: {
			labels: xValues,
			datasets: [{
				backgroundColor: barColours,
				borderColor: 'rgba(255,255,255, 0.5)',
				data: yValues
			}]
		},
		options: {
			legend: { display: false },
			title: { display: false },
			plugins: {
				legend: plugin_legend_display,
				labels: {
					color: 'rgb(255, 255, 255)'
				},
			},
			maintainAspectRatio: maintainAspectRatio,
			aspectratio: aspectRatio,
			responsive: responsive
		}
	});
}

function setLoading(value) {
	if (value === true) {
		element = document.getElementById("loading-container");
		element.style.display = "block";
	}
	else {
		element = document.getElementById("loading-container");
		element.style.display = "none";
	}
}
async function getServerAddresses() {
	utils.debug("Stats [async] (getServerAddresses): Retrieving Server addresses");
	var response = await utils.cache_get("options_server_addresses", "sync");
	const timer = ms => new Promise(res => setTimeout(res, ms));
	await timer(100);
	utils.debug("Stats [async] (getServerAddresses): Received the following server addresses: ");
	utils.debug(response);
	return response;
}

async function updateData() {
	const timer = ms => new Promise(res => setTimeout(res, ms));
	await timer(100);
	setLoading(true);
	utils.debug("Stats [async] (updateData): Retrieving items from cache");
	var pms_servers = await getServerAddresses();

	// check to make sure user has opened plex/web first so we can receive server addresses
	if (!pms_servers) {
		return;
	}
	servers = pms_servers;
	utils.debug("Stats [async] (updateData): Server addresses fetched:");
	utils.debug(servers);
	utils.debug("Stats [async] (updateData): Selecting first Server");
	uri = Object.values(servers)[0].uri;
	utils.debug("Stats [async] (updateData): Grabbing Access Token");
	plex_token = Object.values(servers)[0].access_token;
	await getData(uri, plex_token, true);
	setLoading(false);
}

async function insertRefreshButton(last_updated) {
	var container = document.getElementById("refresh-data-container");
	container.innerHTML = 'Last Updated: ' + last_updated + ' (<a id="refresh-data" href="#">Refresh Data</a>)';
	document.getElementById("refresh-data").addEventListener("click", function () {
		updateData();
	});
}

async function getData(uri, plex_token, update_flag) {
	const show_categories_all = ["ShowsByAiredYear", "ShowsByGenre", "ShowsByAudienceRating", "ShowsByContentRating", "EpisodesByResolution", "ShowsByAddedAt"];
	const movie_categories_all = ["MoviesByReleaseYear", "MoviesByGenre", "MoviesByAudienceRating", "MoviesByContentRating", "MoviesByResolution", "MoviesByAddedAt"];
	const show_categories_cached = [];
	const movie_categories_cached = [];
	const show_categories = Object.values(show_categories_all);
	const movie_categories = Object.values(movie_categories_all);
	if (update_flag === false) {
		show_section_keys = [];
		movie_section_keys = [];
		var library_url = uri + "/library/sections/?X-Plex-Token=" + plex_token;
		var library_xml_full = await utils.getXML(library_url);
		library_xml = library_xml_full.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
		if (library_xml === null) {
			utils.debug("Stats [async] (getData): library_xml invalid. Exiting.");
			return;
		}
		for (let h = 0; h < library_xml.length; h++) {
			var type = library_xml[h].getAttribute("type");
			var key = library_xml[h].getAttribute("key");
			if (type === "movie") {
				movie_section_keys.push(key);
			}
			if (type === "show") {
				show_section_keys.push(key);
			}
		}
		var show_total = show_categories_all.length;
		const timer = ms => new Promise(res => setTimeout(res, ms));
		for (var m = 0; m < show_total; m++) {
			var chartId = show_categories_all[m];
			var key = "stats_" + chartId;
			utils.debug("Stats [async] (getData): Checking cache for: " + key);
			var cache_check = await utils.cache_get(key, "sync") || {};
			await timer(100);

			if (Object.keys(cache_check).length) {
				utils.debug("Stats [async] (getData): Cache found for: " + key);
				show_categories_cached.push(chartId);
				var loc = show_categories.indexOf(chartId);
				show_categories.splice(loc, 1);
			}
		}

		utils.debug("Stats [async] (getData): No cache found for Show Categories: ");
		utils.debug(show_categories);
		utils.debug("Stats [async] (getData): Cache found for Show Categories: ");
		utils.debug(show_categories_cached);

		var movie_total = movie_categories_all.length;
		for (var m = 0; m < movie_total; m++) {
			var chartId = movie_categories_all[m];
			var key = "stats_" + chartId;
			utils.debug("Stats [async] (getData): Checking cache for: " + key);
			var cache_check = await utils.cache_get(key, "sync") || {};
			if (Object.keys(cache_check).length) {
				utils.debug("Stats [async] (getData): Cache found for: " + key);
				movie_categories_cached.push(chartId);
				var loc = movie_categories.indexOf(chartId);
				movie_categories.splice(loc, 1);
			}
		}
		utils.debug("Stats [async] (getData): No cache found for Movie Categories: ");
		utils.debug(movie_categories);
		utils.debug("Stats [async] (getData): Cache found for Movie Categories: ");
		utils.debug(movie_categories_cached);
	}
	else {
		all_canvas = document.getElementsByTagName("canvas");
		for (let n = 0; n < all_canvas.length; n++) {
			var canvasId = all_canvas[n].getAttribute("id");
			var chart = Chart.getChart(canvasId);
			chart.destroy();
		}
		var last_updated = (new Date()).toLocaleString();
		utils.cache_set("stats_lastupdated", last_updated, "sync");
	}
	last_updated_check = {};
	var last_updated_check = await utils.cache_get("stats_lastupdated", "sync") || {};
	if (Object.keys(last_updated_check).length) {
		var last_updated = last_updated_check;
	}
	else {
		var last_updated = (new Date()).toLocaleString();
		utils.cache_set("stats_lastupdated", last_updated, "sync");
	}

	await insertRefreshButton(last_updated);
	await generateShowData(uri, plex_token, show_section_keys, show_categories, show_categories_cached);
	await generateMovieData(uri, plex_token, movie_section_keys, movie_categories, movie_categories_cached);
}

utils.storage_get_all(async function (settings) {
	title_element = document.getElementsByTagName("title")[0];
	extension_version = utils.getExtensionVersion();
	title_element.innerHTML = "EnhancedPLEX (" + extension_version + ") Stats";

	data = {
		Title: document.title,
		Location: document.location.pathname
	};

	google_api.sendTracking("page_view", data);
	const timer = ms => new Promise(res => setTimeout(res, ms));
	await timer(100);
	setLoading(true);
	utils.debug("Stats [async] (utils.storage_get_all): Retrieving items from cache");
	var pms_servers = await getServerAddresses();

	// check to make sure user has opened plex/web first so we can receive server addresses
	if (!pms_servers) {
		return;
	}
	servers = pms_servers;
	utils.debug("Stats [async] (utils.storage_get_all): Server addresses fetched:");
	utils.debug(servers);
	utils.debug("Stats [async] (utils.storage_get_all): Selecting first Server");
	uri = Object.values(servers)[0].uri;
	utils.debug("Stats [async] (utils.storage_get_all): Grabbing Access Token");
	plex_token = Object.values(servers)[0].access_token;
	await getData(uri, plex_token, false);
	setLoading(false);
});