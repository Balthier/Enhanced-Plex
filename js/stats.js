function sortObj(obj) {
	return Object.keys(obj).sort().reduce(function (result, key) {
		result[key] = obj[key];
		return result;
	}, {});
}

function setProgress(current, total, loadType, cached) {
	const loadingTextElement = document.getElementById("loading-text");
	if (!cached) {
		loadingTextElement.innerHTML = "<h2>LOADING</h2></br>Loading " + loadType + " Library Data: " + current + "/" + total + "</br><i>Larger libraries will take time to process</i>";
	}
	else {
		loadingTextElement.innerHTML = "<h2>LOADING</h2></br>Loading " + loadType + " Cached Library Data: " + current + "/" + total + "</br><i>Larger libraries will take time to process</i>";
	}
}

async function generateShowData(uri, plex_token, section_keys, show_categories, show_categories_cached) {
	const loadType = "Show";
	let total;
	if (Array.isArray(show_categories_cached) && show_categories_cached.length) {
		utils.debug("Stats [async] (generateShowData): Retreiving show data from cache for cached show categories");
		total = section_keys.length;
		const cached = true;
		let i = 0;
		for (const show_category_cached of show_categories_cached) {
			setProgress(i, total, loadType, cached);
			const chartId = show_category_cached;
			const key = "stats_" + chartId;
			const result = await utils.cache_get(key, "local");
			utils.debug("Stats [async] (generateShowData): Generating chart for " + chartId);
			generateChart(result, chartId);
			i++;
		}
	}
	if (Array.isArray(show_categories) && show_categories.length) {
		utils.debug("Stats [async] (generateShowData): Generating show data for non-cached show categories");
		const shows = [];
		const showsNull = [];
		const episodes = [];
		const show_genres = [];
		total = section_keys.length;
		const cached = false;
		let i = 0;
		for (const section_key of section_keys) {
			setProgress(i, total, loadType, cached);
			const library_section_url = uri + "/library/sections/" + section_key + "/all?X-Plex-Token=" + plex_token;
			const library_section_episodes_url = uri + "/library/sections/" + section_key + "/all?type=4&X-Plex-Token=" + plex_token;
			const section_xml = await utils.getXML(library_section_url);
			const section_episode_xml = await utils.getXML(library_section_episodes_url);
			const section_name = section_xml.getElementsByTagName("MediaContainer")[0].getAttribute("librarySectionTitle");
			const shows_xml = section_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
			for (const show_xml of shows_xml) {
				const show_data = {};
				show_data["name"] = show_xml.getAttribute("title");
				show_data["section"] = section_name;
				show_data["year"] = show_xml.getAttribute("year");
				let rawdate = new Date(show_xml.getAttribute("addedAt") * 1000).toISOString().slice(0, 7);
				show_data["addedAt"] = rawdate;
				show_data["audienceRating"] = show_xml.getAttribute("audienceRating");
				if (show_data["audienceRating"]) {
					show_data["audienceRating"] = Math.floor(show_data["audienceRating"]);
					if (show_data["audienceRating"] < 10) {
						show_data["audienceRating"] = show_data["audienceRating"] + "-" + (show_data["audienceRating"] + 1);
					}
				}
				show_data["contentRating"] = show_xml.getAttribute("contentRating");
				shows.push(show_data);

				const genres = show_xml.getElementsByTagName("Genre");
				for (const genre of genres) {
					const genre_data = {};
					genre_data["genre"] = genre.getAttribute("tag");
					show_genres.push(genre_data);
				}
			}
			const episodes_xml = section_episode_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");
			for (const episode_xml of episodes_xml) {
				const episode_data = {};
				episode_data["name"] = episode_xml.getAttribute("title");
				episode_data["ep_year"] = episode_xml.getAttribute("originallyAvailableAt");
				let rawdate = new Date(episode_xml.getAttribute("addedAt") * 1000).toISOString().slice(0, 7);
				episode_data["ep_addedAt"] = rawdate;
				episode_data["ep_resolution"] = episode_xml.getElementsByTagName("Media")[0].getAttribute("videoResolution");
				if (episode_data["ep_resolution"] === "sd") {
					episode_data["ep_resolution"] = "SD";
				}
				else {
					episode_data["ep_resolution"] = episode_data["ep_resolution"] + "p";
				}
				episodes.push(episode_data);
			}
			i++;
		}
		for (const show_category of show_categories) {
			const chartId = show_category;
			let count;
			if (chartId === "ShowsByAiredYear") {
				count = shows.reduce((acc, o) => (acc[o.year] = (acc[o.year] || 0) + 1, acc), {});
			}
			else if (chartId === "ShowsByAddedAt") {
				const precount = shows.reduce((acc, o) => (acc[o.addedAt] = (acc[o.addedAt] || 0) + 1, acc), {});
				count = sortObj(precount);
			}
			else if (chartId === "ShowsByGenre") {
				count = show_genres.reduce((acc, o) => (acc[o.genre] = (acc[o.genre] || 0) + 1, acc), {});
			}
			else if (chartId === "ShowsByContentRating") {
				count = shows.reduce((acc, o) => (acc[o.contentRating] = (acc[o.contentRating] || 0) + 1, acc), {});
			}
			else if (chartId === "ShowsByAudienceRating") {
				count = shows.reduce((acc, o) => (acc[o.audienceRating] = (acc[o.audienceRating] || 0) + 1, acc), {});
			}
			else if (chartId === "EpisodesByResolution") {
				count = episodes.reduce((acc, o) => (acc[o.ep_resolution] = (acc[o.ep_resolution] || 0) + 1, acc), {});
			}
			else if (chartId === "EpisodesOverTime") {
				count = {};
				total = 0;
				let deduped = episodes.reduce((acc, o) => (acc[o.ep_addedAt] = (acc[o.ep_addedAt] || 0) + 1, acc), {});
				let dates = Object.keys(deduped).sort();
				for (const date of dates) {
					let value = deduped[date];
					total = total + value;
					count[date] = total;
				}
			}
			else if (chartId === "ShowsByNullValues") {
				for (const show of shows) {
					let item = show;
					if ((!item.contentRating) || (!item.audienceRating) || (!item.year)) {
						showsNull.push(item);
					}
				}
				count = showsNull;
			}
			utils.debug("Stats [async] (generateShowData): Generating chart for " + chartId);
			generateChart(count, chartId);
			const key = "stats_" + chartId;
			utils.cache_set(key, count, "local");
		}
	}
}

async function generateMovieData(uri, plex_token, section_keys, movie_categories, movie_categories_cached) {
	const loadType = "Movie";
	let total;
	if (Array.isArray(movie_categories_cached) && movie_categories_cached.length) {
		utils.debug("Stats [async] (generateMovieData): Retreiving movie data from cache for cached movie categories");
		total = section_keys.length;
		const cached = true;
		let i = 0;
		for (const movie_category_cached of movie_categories_cached) {
			setProgress(i, total, loadType, cached);
			const chartId = movie_category_cached;
			const key = "stats_" + chartId;
			const result = await utils.cache_get(key, "local");
			utils.debug("Stats [async] (generateMovieData): Generating chart for " + chartId);
			generateChart(result, chartId);
			i++;
		}
	}
	if (Array.isArray(movie_categories) && movie_categories.length) {
		utils.debug("Stats [async] (generateMovieData): Generating movie data for non-cached movie categories");
		const movies = [];
		const moviesNull = [];
		const movie_genres = [];
		total = section_keys.length;
		const cached = false;
		let i = 0;
		for (const section_key of section_keys) {
			setProgress(i, total, loadType, cached);
			const library_section_url = uri + "/library/sections/" + section_key + "/all?X-Plex-Token=" + plex_token;
			const section_xml = await utils.getXML(library_section_url);
			const section_name = section_xml.getElementsByTagName("MediaContainer")[0].getAttribute("librarySectionTitle");
			const movies_xml = section_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");
			for (const movie_xml of movies_xml) {
				const movie_data = {};
				movie_data["name"] = movie_xml.getAttribute("title");
				movie_data["section"] = section_name;
				movie_data["year"] = movie_xml.getAttribute("year");
				const rawdate = new Date(movie_xml.getAttribute("addedAt") * 1000).toISOString().slice(0, 7);
				movie_data["addedAt"] = rawdate;
				movie_data["resolution"] = movie_xml.getElementsByTagName("Media")[0].getAttribute("videoResolution");
				movie_data["audienceRating"] = movie_xml.getAttribute("audienceRating");
				if (movie_data["audienceRating"]) {
					movie_data["audienceRating"] = Math.floor(movie_xml.getAttribute("audienceRating"));
					if (movie_data["audienceRating"] < 10) {
						movie_data["audienceRating"] = movie_data["audienceRating"] + "-" + (movie_data["audienceRating"] + 1);
					}
				}
				movie_data["contentRating"] = movie_xml.getAttribute("contentRating");
				if (movie_data["resolution"] === "sd") {
					movie_data["resolution"] = "SD";
				}
				else {
					movie_data["resolution"] = movie_data["resolution"] + "p";
				}
				movies.push(movie_data);
				const genres = movie_xml.getElementsByTagName("Genre");
				for (const genre of genres) {
					const genre_data = {};
					genre_data["genre"] = genre.getAttribute("tag");
					movie_genres.push(genre_data);
				}
			}
			i++;
		}
		for (const movie_category of movie_categories) {
			const chartId = movie_category;
			let count;
			if (chartId === "MoviesByReleaseYear") {
				count = movies.reduce((acc, o) => (acc[o.year] = (acc[o.year] || 0) + 1, acc), {});
			}
			else if (chartId === "MoviesByAddedAt") {
				const precount = movies.reduce((acc, o) => (acc[o.addedAt] = (acc[o.addedAt] || 0) + 1, acc), {});
				count = sortObj(precount);
			}
			else if (chartId === "MoviesByGenre") {
				count = movie_genres.reduce((acc, o) => (acc[o.genre] = (acc[o.genre] || 0) + 1, acc), {});
			}
			else if (chartId === "MoviesByResolution") {
				count = movies.reduce((acc, o) => (acc[o.resolution] = (acc[o.resolution] || 0) + 1, acc), {});
			}
			else if (chartId === "MoviesByAudienceRating") {
				count = movies.reduce((acc, o) => (acc[o.audienceRating] = (acc[o.audienceRating] || 0) + 1, acc), {});
			}
			else if (chartId === "MoviesByContentRating") {
				count = movies.reduce((acc, o) => (acc[o.contentRating] = (acc[o.contentRating] || 0) + 1, acc), {});
			}
			else if (chartId === "MoviesOverTime") {
				count = {};
				let deduped = movies.reduce((acc, o) => (acc[o.addedAt] = (acc[o.addedAt] || 0) + 1, acc), {});
				let dates = Object.keys(deduped).sort();
				for (const date of dates) {
					const value = deduped[date];
					total = total + value;
					count[date] = total;
				}
			}
			else if (chartId === "MoviesByNullValues") {
				for (const movie of movies) {
					let item = movie;
					if ((!item.contentRating) || (!item.audienceRating) || (!item.year)) {
						moviesNull.push(item);
					}
				}
				utils.debug(moviesNull);
				count = moviesNull;
			}
			utils.debug("Stats [async] (generateMovieData): Generating chart for " + chartId);
			generateChart(count, chartId);
			const key = "stats_" + chartId;
			utils.cache_set(key, count, "local");
		}
	}
}

function generateChart(FullData, chartId) {
	if (chartId.includes("NullValues")) {
		let chartElm = "#" + chartId;
		let table = new DataTable(chartElm);
		table.clear();
		for (const DataPoint of FullData) {
			let item = DataPoint;
			if ((!item.contentRating) || (!item.audienceRating) || (!item.year)) {
				table.row.add([item['section'], item['name'], item['year'], item['audienceRating'], item['contentRating']]);
			}
		}
		table.draw();
	}
	else {
		const xValues = Object.keys(FullData);
		const yValues = Object.values(FullData);
		let chartType;
		let plugin_legend_display;
		let barColours;
		let maintainAspectRatio;
		let responsive;
		let total;
		if (chartId.includes("Year")) {
			chartType = "bar";
		}
		else if (chartId.includes("AddedAt")) {
			chartType = "line";
		}
		else if (chartId.includes("OverTime")) {
			chartType = "line";
		}
		else if (chartId.includes("Genre")) {
			chartType = "bar";
		}
		else if (chartId.includes("ContentRating")) {
			chartType = "bar";
		}
		else if (chartId.includes("AudienceRating")) {
			chartType = "pie";
		}
		else if (chartId.includes("Resolution")) {
			chartType = "pie";
		}
		if (chartType === "pie") {
			plugin_legend_display = true;
		}
		else if (chartType === "line") {
			plugin_legend_display = false;
		}
		else if (chartType === "bar") {
			plugin_legend_display = false;
		}
		if ((chartType === "bar") || (chartType === "line")) {
			if (chartType === "bar") {
				barColours = [];
				total = Math.max.apply(Math, yValues);
				for (let i = 0; i < xValues.length; i++) {
					const value = yValues[i];
					const percentage = (value * 100) / total;
					const hue = (percentage / 100) * 120;
					const colour = `hsl(${hue}, 100%, 50%)`;
					barColours.push(colour);
				}
			}
			if (chartType === "line") {
				barColours = "rgb(240,228,66)";
			}
			maintainAspectRatio = false;
			responsive = true;
		}
		if (chartType === "pie") {
			barColours = [];
			total = Math.max.apply(Math, yValues);
			for (let i = 0; i < xValues.length; i++) {
				const r = Math.floor(Math.random() * 255);
				const g = Math.floor(Math.random() * 255);
				const b = Math.floor(Math.random() * 255);
				const colour = "rgb(" + r + "," + g + "," + b + ")";
				barColours.push(colour);
			}
			maintainAspectRatio = false;
			aspectRatio = 1;
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
}

function setLoading(value) {
	if (value === true) {
		const element = document.getElementById("loading-container");
		element.style.display = "block";
	}
	else {
		const Container = document.getElementById("loading-container");
		Container.style.display = "none";
		const element = document.getElementById("loading-text");
		element.innerHTML = "Loading Complete";
	}
}

async function updateData() {
	setLoading(true);
	utils.debug("Stats [async] (updateData): Retrieving items from cache");
	const { uri, plex_token } = await getPlexBasics();
	await getData(uri, plex_token, true);
	setLoading(false);
}

async function insertRefreshButton(last_updated) {
	const container = document.getElementById("refresh-data-container");
	container.innerHTML = 'Last Updated: ' + last_updated + ' (<a id="refresh-data" href="#">Refresh Data</a>)';
	document.getElementById("refresh-data").addEventListener("click", function () {
		updateData();
	});
}

async function getData(uri, plex_token, update_flag) {
	const debug = false;
	let show_categories_all;
	let movie_categories_all;
	let show_section_keys;
	let movie_section_keys;
	if (debug) {
		utils.debug("Stats [async] (getData): STATS DEBUG ON");
		show_categories_all = [];
		movie_categories_all = ["MoviesByNullValues"];
		show_section_keys = [];
		movie_section_keys = ["6"];
	}
	else {
		show_categories_all = [
			"ShowsByAiredYear",
			"ShowsByGenre",
			"ShowsByAudienceRating",
			"ShowsByContentRating",
			"EpisodesByResolution",
			"ShowsByAddedAt",
			"ShowsByNullValues",
			"EpisodesOverTime"
		];
		movie_categories_all = [
			"MoviesByReleaseYear",
			"MoviesByGenre",
			"MoviesByAudienceRating",
			"MoviesByContentRating",
			"MoviesByResolution",
			"MoviesByAddedAt",
			"MoviesByNullValues",
			"MoviesOverTime"
		];
		show_section_keys = [];
		movie_section_keys = [];
	}
	const show_categories_cached = [];
	const movie_categories_cached = [];
	const show_categories = Object.values(show_categories_all);
	const movie_categories = Object.values(movie_categories_all);
	const library_url = uri + "/library/sections/?X-Plex-Token=" + plex_token;
	const library_xml_full = await utils.getXML(library_url);
	const library_xml = library_xml_full.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
	if (library_xml === null) {
		utils.debug("Stats [async] (getData): library_xml invalid. Exiting.");
		return;
	}
	if (debug) {

	}
	else {
		for (const library of library_xml) {
			const type = library.getAttribute("type");
			const key = library.getAttribute("key");
			if (type === "movie") {
				movie_section_keys.push(key);
			}
			if (type === "show") {
				show_section_keys.push(key);
			}
		}
	}
	let last_updated;
	if (update_flag === false) {
		for (const show_category of show_categories_all) {
			const chartId = show_category;
			const key = "stats_" + chartId;
			utils.debug("Stats [async] (getData): Checking cache for: " + key);
			const cache_check = await utils.cache_get(key, "local") || {};

			if (Object.keys(cache_check).length) {
				utils.debug("Stats [async] (getData): Cache found for: " + key);
				show_categories_cached.push(chartId);
				const loc = show_categories.indexOf(chartId);
				show_categories.splice(loc, 1);
			}
		}

		utils.debug("Stats [async] (getData): No cache found for Show Categories: ");
		utils.debug(show_categories);
		utils.debug("Stats [async] (getData): Cache found for Show Categories: ");
		utils.debug(show_categories_cached);

		for (const movie_category of movie_categories_all) {
			const chartId = movie_category;
			const key = "stats_" + chartId;
			utils.debug("Stats [async] (getData): Checking cache for: " + key);
			const cache_check = await utils.cache_get(key, "local") || {};
			if (Object.keys(cache_check).length) {
				utils.debug("Stats [async] (getData): Cache found for: " + key);
				movie_categories_cached.push(chartId);
				const loc = movie_categories.indexOf(chartId);
				movie_categories.splice(loc, 1);
			}
		}
		utils.debug("Stats [async] (getData): No cache found for Movie Categories: ");
		utils.debug(movie_categories);
		utils.debug("Stats [async] (getData): Cache found for Movie Categories: ");
		utils.debug(movie_categories_cached);
	}
	else {
		const all_canvas = document.getElementsByTagName("canvas");
		for (const canvas of all_canvas) {
			const canvasId = canvas.getAttribute("id");
			const chart = Chart.getChart(canvasId);
			if (chart) {
				chart.destroy();
			}
		}
		last_updated = (new Date()).toLocaleString();
		utils.cache_set("stats_lastupdated", last_updated, "local");
	}
	const last_updated_check = await utils.cache_get("stats_lastupdated", "local") || {};
	if (Object.keys(last_updated_check).length) {
		last_updated = last_updated_check;
	}
	else {
		last_updated = (new Date()).toLocaleString();
		utils.cache_set("stats_lastupdated", last_updated, "local");
	}

	await insertRefreshButton(last_updated);
	await generateShowData(uri, plex_token, show_section_keys, show_categories, show_categories_cached);
	await generateMovieData(uri, plex_token, movie_section_keys, movie_categories, movie_categories_cached);
}

async function getPlexBasics() {
	const pms_servers = await utils.getServerAddresses();

	// check to make sure user has opened plex/web first so we can receive server addresses
	if (!pms_servers) {
		return;
	}
	const servers = pms_servers;
	utils.debug("Stats (getPlexBasics): Server addresses fetched:");
	utils.debug(servers);
	const machine_identifier = Object.values(servers)[0].machine_identifier;
	const machine_identifier_local = machine_identifier + "_local";
	const uri = servers[machine_identifier_local].uri || server_addresses[machine_identifier].uri;
	utils.debug("Stats (getPlexBasics): Grabbing Access Token");
	const plex_token = Object.values(servers)[0].access_token;

	return { uri, plex_token };
}

async function main() {
	const title_element = document.getElementsByTagName("title")[0];
	const extension_version = await utils.getExtensionInfo("version");
	title_element.innerHTML = "EnhancedPLEX (" + extension_version + ") Stats";

	const data = {
		Title: document.title,
		Location: document.location.pathname
	};

	google_api.sendTracking("page_view", data);
	setLoading(true);
	utils.debug("Stats (main): Retrieving items from cache");
	const { uri, plex_token } = await getPlexBasics();
	await getData(uri, plex_token, false);
	setLoading(false);
};

document.addEventListener('DOMContentLoaded', function () {
	if (typeof main === 'function') {
		main();
	} else {
		console.error("Initialization failed: 'main' function is missing.");
	}
});