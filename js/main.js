// Hopefully these will make it easier to update in future Plex for Web updates.
let MainPageDetection;
let LibraryPageDetection;
let TVMoviePageDetection;
let MainPageLoaded;
let LibraryPageLoaded;
let TVPageLoaded;
let MoviePageLoaded;
let StatsButtonParent;
let StatsButtonContainer;
let plexParentBanner;
let MinPfWVersionDisp;
let MinPfWVersion;
let TraktData;

const UnmatchedDetection = new RegExp(/^local\:\/\//);
const PlexBannerID = "Enhanced-Plex-Banner";
const PlexForWebURL = new RegExp(/https:\/\/app\.plex\.tv\/desktop\/?\#\!\/?/);
const plexforweb = PlexForWebURL.test(document.URL);
const TVMain = {
	"imdb_shows_link": "imdb",
	"trakt_shows_link": "trakt",
	"tvdb_link": "tvdb",
	"missing_episodes": "missing_episodes",
	"sonarr_api": "sonarr"
};
const TVSeason = {
	"imdb_shows_link": "imdb",
	"trakt_shows_link": "trakt",
	"tvdb_link": "tvdb",
	"missing_episodes": "missing_episodes"
};
const TVEpisode = {
	"trakt_shows_link": "trakt"
};
const MovieMain = {
	"imdb_movies_link": "imdb",
	"tmdb_link": "tmdb",
	"trakt_movies_link": "trakt",
	"radarr_api": "radarr"
};

if (plexforweb) {
	// Plex for Web
	MainPageDetection = new RegExp(/(.*)\/desktop\/?\#\!\/?$/);
	LibraryPageDetection = new RegExp(/(.*)com.plexapp.plugins.library(.*)$/);
	TVMoviePageDetection = new RegExp(/(.*)\/server\/(.*)details(.*)$/);
	MainPageLoaded = "button";
	LibraryPageLoaded = "MetadataPosterCard-cardContainer";
	TVPageLoaded = "PrePlayListTitle-titleContainer";
	MoviePageLoaded = "metadata-title";
	StatsButtonParent = "NavBar-right";
	StatsButtonContainer = "NavBarActivityButton-container";
	plexParentBanner = "metadata-starRatings";
	MinPfWVersionDisp = "4.145.1";
	MinPfWVersion = (MinPfWVersionDisp).replaceAll(".", "");
}
else {
	// Local Plex
	MainPageDetection = new RegExp(/(.*)\/web\/index.html\#\!\/?$/);
	LibraryPageDetection = new RegExp(/(.*)com.plexapp.plugins.library(.*)$/);
	TVMoviePageDetection = new RegExp(/(.*)\/server\/(.*)details(.*)$/);
	MainPageLoaded = "button";
	LibraryPageLoaded = "MetadataPosterCard-cardContainer";
	TVPageLoaded = "PrePlayListTitle-titleContainer";
	MoviePageLoaded = "metadata-title";
	StatsButtonParent = "NavBar-right";
	StatsButtonContainer = "NavBarActivityButton-container";
	plexParentBanner = "metadata-starRatings";
	MinPfWVersionDisp = "4.145.1";
	MinPfWVersion = (MinPfWVersionDisp).replaceAll(".", "");
}

function minReqs() {
	utils.debug("Main (minReqs): Checking minimum requirements");
	const versionRegex = new RegExp(/plex-\d\.\d{3}\.\d/);
	const PfWRaw = document.head.getElementsByTagName('link')[0].href;
	const PfWVersionDisp = (PfWRaw.match(versionRegex))[0].replace("plex-", "");
	const PfWVersion = PfWVersionDisp.replace(/\./g, "");
	let level;
	let versionerror;
	if (PfWVersion < MinPfWVersion) {
		level = "error";
		utils.debug("Main (minReqs) [" + level + "]: Plex for Web version is " + PfWVersionDisp + " which is below the minimum required version: " + MinPfWVersionDisp);
		versionerror = "Plex for Web version is " + PfWVersionDisp + " which is below the minimum required version: " + MinPfWVersionDisp;
	}
	else if (PfWVersion > MinPfWVersion) {
		level = "warn";
		utils.debug("Main (minReqs) [" + level + "]: Plex for Web version is " + PfWVersionDisp + " which is higher than the currently tested version: " + MinPfWVersionDisp);
		versionerror = "Plex for Web version is " + PfWVersionDisp + " which is higher than the currently tested version: " + MinPfWVersionDisp + " - Please report any issues via the Known Issues link on the Options page";
	}
	else {
		utils.debug("Main (minReqs): Plex for Web version is " + PfWVersionDisp + " which meets the minimum required version: " + MinPfWVersionDisp);
		versionerror = false;
	}
	if (versionerror) {
		return [versionerror, level];
	}
	else {
		return versionerror;
	}
}

async function insertErrorBar(level, details) {
	const ver_mismatch_icon = await utils.cache_get("options_ver_mismatch_icon", "sync") || {};
	if (ver_mismatch_icon == "true") {
		if (document.getElementById("error-details")) {
			utils.debug("Main (insertErrorBar): Error already present. Skipping.");
			return;
		}
		const nav_bar_right = document.body.querySelector("[class*=" + CSS.escape(StatsButtonContainer) + "]");

		const error_link = document.createElement("a");
		error_link.setAttribute("id", "error-toggle");

		const error_img = document.createElement("img");
		error_link.appendChild(error_img);

		const error_details = document.createElement("div");
		error_details.setAttribute("id", "error-details");
		error_details.setAttribute("title", "EnhancedPLEX Error");

		if (level == "warn") {
			const img_loc = utils.getResourcePath("info-icon.png");
			error_img.setAttribute("src", img_loc);
			error_details.innerText = "EnhancedPlex Warning: " + details;
		}
		else if (level == "error") {
			const img_loc = utils.getResourcePath("error-icon.png");
			error_img.setAttribute("src", img_loc);
			error_details.innerText = "EnhancedPlex Error: " + details;
		}
		else {
			utils.debug("Main (insertErrorBar): Unknown error level specified: " + level);
			return;
		}

		const errorcontainer = document.createElement("div");
		errorcontainer.setAttribute("id", "error-container");
		errorcontainer.setAttribute("class", "nav-button");
		errorcontainer.appendChild(error_link);

		const container = document.createElement("div");
		container.setAttribute("id", "button-container");
		container.setAttribute("class", nav_bar_right.className);
		container.appendChild(error_details);
		container.appendChild(errorcontainer);

		nav_bar_right.parentElement.prepend(container);

		document.getElementById("error-toggle").addEventListener("click", function () {
			toggleErrorDetails();
		});
	}
}

function toggleErrorDetails() {
	error_element = document.getElementById("error-details");
	current_display = window.getComputedStyle(error_element).display;
	if ((current_display == "none") || (!current_display)) {
		utils.debug("Main (toggleErrorDetails): Details currently hidden. Displaying...");
		error_element.style.display = "block";
	}
	else {
		utils.debug("Main (toggleErrorDetails): Details currently set to: " + current_display + " - Hiding...");
		error_element.style.display = "none";
	}
}

function runOnReady() {
	versiondata = minReqs();
	if (versiondata) {
		versionerror = versiondata[0];
		level = versiondata[1];
	}
	utils.debug("Main (runOnReady): runOnReady called. Starting watch");
	const page_url = document.URL;
	const interval = window.setInterval(function () {
		if (plexforweb) {
			utils.debug("Main (runOnReady): Plex for Web URL detected");
		}
		else {
			utils.debug("Main (runOnReady): Local Plex URL detected");
		}
		if (document.URL != page_url) {
			utils.debug("Main (runOnReady): Document URL is not the same as Page URL. Clearing Interval..");
			window.clearInterval(interval);
		}
		if (MainPageDetection.test(document.URL)) {
			utils.debug("Main (runOnReady): Main page detected. Checking if ready...");
			if (document.getElementsByTagName(MainPageLoaded).length > 0) {
				if (versionerror) {
					insertErrorBar(level, versionerror);
					if (level == "error") {
						window.clearInterval(interval);
						return;
					}
				}
				utils.debug("Main (runOnReady): Instance of " + MainPageLoaded + " detected. Page is ready");
				window.clearInterval(interval);
				main();
			}
		}
		// page is ready when certain elements exist.
		// check if on library section
		else if (LibraryPageDetection.test(document.URL)) {
			utils.debug("Main (runOnReady): Library page detected. Checking if ready...");
			if (document.body.querySelectorAll("[class*=" + CSS.escape(LibraryPageLoaded) + "]").length > 0) {
				if (versionerror) {
					insertErrorBar(level, versionerror);
					if (level == "error") {
						window.clearInterval(interval);
						return;
					}
				}
				utils.debug("Main (runOnReady): Instance of " + LibraryPageLoaded + " detected. Page is ready");
				window.clearInterval(interval);
				main();
			}
		}
		// check if on movie/tv show details page
		else if (TVMoviePageDetection.test(document.URL)) {
			utils.debug("Main (runOnReady): TV/Movie page detected. Checking if ready...");
			if ((document.body.querySelectorAll("[class*=" + CSS.escape(TVPageLoaded) + "]").length > 0) || (document.body.querySelectorAll("[data-testid*=" + CSS.escape(MoviePageLoaded) + "]").length > 0)) {
				if (versionerror) {
					insertErrorBar(level, versionerror);
					if (level == "error") {
						window.clearInterval(interval);
						return;
					}
				}
				utils.debug("Main (runOnReady): Instance of " + TVPageLoaded + " or " + MoviePageLoaded + "detected. Page is ready");
				window.clearInterval(interval);
				main();
			}
		}
		else {
			utils.debug("Main (runOnReady): runOnReady not on recognized page");
			window.clearInterval(interval);
		}
	}, 1000);
}

function getPlexToken() {
	if (localStorage["myPlexAccessToken"]) {
		const plex_token = localStorage["myPlexAccessToken"];
		utils.debug("Main (getPlexToken): plex_token fetched from localStorage:");
		utils.debug(plex_token);
		return plex_token;
	}
}

function toggleLoadingIcon(option) {
	if (option == "on") {
		const nav_bar_right = document.body.querySelector("[class*=" + CSS.escape(StatsButtonContainer) + "]");
		const img = document.createElement("img");
		img.setAttribute("src", utils.getResourcePath("loading_stats.gif"));
		img.setAttribute("id", "loading-extension");
		img.setAttribute("height", "30px");

		utils.debug("Main (toggleLoadingIcon): Inserting Loading icon");
		nav_bar_right.insertBefore(img, nav_bar_right.firstChild);
	}
	else if (option == "off") {
		const loading_icon = document.getElementById("loading-extension");
		if (loading_icon) {
			utils.debug("Main (toggleLoadingIcon): Removing Loading icon");
			loading_icon.parentNode.removeChild(loading_icon);
		}
	}
}

function insertBannerTemplate() {
	const existing_banner = document.getElementById("Enhanced-Plex-Banner");
	if (existing_banner) {
		utils.debug("Main [async] (insertBannerTemplate): Banner already exists on page. Skipping.");
	}
	else {
		utils.debug("Main [async] (insertBannerTemplate): Banner not present. Constructing.");
		const insert_target = document.querySelectorAll("[data-testid*=" + CSS.escape(plexParentBanner) + "]")[0];
		const banner_element = document.createElement("span");
		banner_element.setAttribute("id", PlexBannerID);
		const info_box = document.createElement("div");
		info_box.setAttribute("id", "ep_infobox");
		info_box.classList.add("ep_box");
		banner_element.appendChild(info_box);

		const heading = document.createElement("h1");
		heading.innerText = "Additional Information";
		heading.classList.add("ep_h1");
		info_box.appendChild(heading);

		const links_box = document.createElement("div");
		links_box.setAttribute("id", "ep_links");
		links_box.classList.add("ep_box");
		links_box.innerHTML = "<b>Links: </b> <br>";
		banner_element.appendChild(links_box);

		utils.debug("Main [async] (insertBannerTemplate): Inserting Banner");

		if (plexforweb) {
			const plex_parent = insert_target.parentNode.parentNode;
			plex_parent.appendChild(banner_element);

		}
		else {
			const plex_parent = insert_target.parentNode.parentNode;
			plex_parent.appendChild(banner_element);
		}
	}
}

function processLibrarySections(sections_xml) {
	const directories = sections_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
	const dir_metadata = {};
	for (let i = 0; i < directories.length; i++) {
		const type = directories[i].getAttribute("type");
		const section_num = directories[i].getAttribute("path").match(/\/(\d+)$/)[1];
		const machine_identifier = directories[i].getAttribute("machineIdentifier");

		if (machine_identifier in dir_metadata) {
			dir_metadata[machine_identifier][section_num] = { "type": type, "section_num": section_num };
		}
		else {
			dir_metadata[machine_identifier] = {};
			dir_metadata[machine_identifier][section_num] = { "type": type, "section_num": section_num };
		}
	}

	utils.debug("Main (processLibrarySections): Parsed library sections");
	utils.debug(dir_metadata);
	return dir_metadata;
}

async function main() {
	settings = await chrome.storage.sync.get();
	utils.debug("Main [async] (main): Running main()");

	const page_url = document.URL;
	const plex_token = getPlexToken();

	// add observer for fast user switching functionality, to reload token and server addresses
	const observer = new MutationObserver(function (mutations) {
		observer.disconnect();

		utils.debug("Main [async] (main): User switched");
		runOnReady();
	});

	// use plex.tv for API requests if we have plex token
	const requests_url = "https://plex.tv/pms";

	const server_addresses = await utils.getServerAddresses(plex_token, plexforweb) || {};
	const timer = ms => new Promise(res => setTimeout(res, ms));
	await timer(100);
	if (Object.keys(server_addresses).length) {

		// insert stats page link
		if (settings["options_stats_link"] === "true") {
			utils.debug("Main [async] (main): Stats plugin is enabled");
			toggleLoadingIcon("on");
			stats.init();
			toggleLoadingIcon("off");
		}
		else {
			utils.debug("Main [async] (main): Stats plugin is disabled");
		}

		// check if on dashboard page
		if (MainPageDetection.test(page_url)) {
			utils.debug("Main [async] (main): Detected we are on dashboard page");
			// only purge caches when viewing main page
		}

		// check if on library section
		else if (LibraryPageDetection.test(page_url)) {
			utils.debug("Main [async] (main): We are in library section");
			const page_identifier = page_url.match(/\/media\/(.[^\/]+)(.*)source\=(\d+)/);
			const machine_identifier = page_identifier[1];
			const machine_identifier_local = page_identifier[1] + "_local";
			const section_num = page_identifier[3];
			utils.debug("Main [async] (main): Machine identifier - " + machine_identifier);
			utils.debug("Main [async] (main): Library section - " + section_num);

			// get library sections xml
			const library_sections_url = requests_url + "/system/library/sections?X-Plex-Token=" + plex_token;
			const sections_xml = await utils.getXML(library_sections_url) || {};
			if (Object.keys(sections_xml).length) {
				const library_sections = processLibrarySections(sections_xml);
				let server;
				if (server_addresses) {
					server = server_addresses[machine_identifier_local] || server_addresses[machine_identifier];
				}
				else {
					server = {};
				}
				const section = library_sections[machine_identifier][section_num];
			};
		}

		// check if on movie/tv show details page
		else if (TVMoviePageDetection.test(page_url)) {
			insertBannerTemplate();
			utils.debug("Main [async] (main): We are on a Movie/TV show details page");
			const page_identifier = page_url.match(/\/server\/(.[^\/]+)(.*)%2Flibrary%2Fmetadata%2F(\d+)/);
			const machine_identifier = page_identifier[1];
			const machine_identifier_local = page_identifier[1] + "_local";
			const parent_item_id = page_identifier[3];
			utils.debug("Main [async] (main): Metadata id - " + parent_item_id);
			let server;
			if (server_addresses) {
				server = server_addresses[machine_identifier_local] || server_addresses[machine_identifier];
			}
			else {
				server = {};
			}

			// construct metadata xml link
			utils.debug("Main [async] (main): Fetching metadata for id - " + parent_item_id);

			const metadata_xml_url = server["uri"] + "/library/metadata/" + parent_item_id + "?X-Plex-Token=" + server["access_token"];

			// fetch metadata xml asynchronously
			const metadata_xml = await utils.getXML(metadata_xml_url) || {};

			const timer = ms => new Promise(res => setTimeout(res, ms));
			await timer(100);
			if (Object.keys(metadata_xml).length) {
				if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory").length > 0) {
					guid = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("guid");
					if (UnmatchedDetection.test(guid)) {
						utils.debug("Main [async] (main): TV Show does not appear to be Matched. Skipping");
						return;
					}
					// we're on a tv show page
					utils.debug("Main [async] (main): We are on a TV show index page");

					if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("type") === "show") {
						// we're on the root show page
						utils.debug("Main [async] (main): We are on root show page");

						TraktData = await trakt_api.getSourceData(metadata_xml, "show", server);
						for (const option in TVMain) {
							settings_name = "options_" + option;
							if (settings[settings_name] === "true") {
								plugin = TVMain[option];
								utils.debug("Main [async] (main): " + option + " plugin is enabled. Running....");
								plugins[plugin](metadata_xml, server, "show", TraktData);
							}
						}
					}
					else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("type") === "season") {
						// we're on the season page
						utils.debug("Main [async] (main): We are on a season page");

						TraktData = await trakt_api.getSourceData(metadata_xml, "season", server);
						for (const option in TVSeason) {
							settings_name = "options_" + option;
							if (settings[settings_name] === "true") {
								plugin = TVSeason[option];
								utils.debug("Main [async] (main): " + option + " plugin is enabled. Running....");
								plugins[plugin](metadata_xml, server, "season", TraktData);
							}
						}
					}
				}
				else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("type") === "episode") {
					guid = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("guid");
					if (UnmatchedDetection.test(guid)) {
						utils.debug("Main [async] (main): Episode does not appear to be Matched. Skipping");
						return;
					}
					// we're on an episode page
					utils.debug("Main [async] (main): We are on an episode page");

					TraktData = await trakt_api.getSourceData(metadata_xml, "episode", server);
					for (const option in TVEpisode) {
						settings_name = "options_" + option;
						if (settings[settings_name] === "true") {
							plugin = TVEpisode[option];
							utils.debug("Main [async] (main): " + option + " plugin is enabled. Running....");
							plugins[plugin](metadata_xml, server, "episode", TraktData);
						}
					}
				}
				else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("type") === "movie") {
					guid = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("guid");
					if (UnmatchedDetection.test(guid)) {
						utils.debug("Main [async] (main): Movie does not appear to be Matched. Skipping");
						return;
					}
					// we're on a movie page
					utils.debug("Main [async] (main): We are on a movie page");

					TraktData = await trakt_api.getSourceData(metadata_xml, "movie", server);
					for (const option in MovieMain) {
						settings_name = "options_" + option;
						if (settings[settings_name] === "true") {
							plugin = MovieMain[option];
							utils.debug("Main [async] (main): " + option + " plugin is enabled. Running....");
							plugins[plugin](metadata_xml, server, "movie", TraktData);
						}
					}
				}
			}
			else {
				utils.debug("Main [async] (main): Could not set Metadata XML... Aborting.");
				return;
			}
		}
	}
	else {
		utils.debug("Main [async] (main): Could not retrieve server addresses... Aborting.");
		return;
	}
}

// because Plex/Web uses JS to change pages Chrome extensions don't run on every
// page load as expected. To fix this we run the script every time the window
// url hash changes.
window.onhashchange = function () {
	utils.debug("Main (window.onhashchange): Page change detected");
	runOnReady();
};
utils.debug("Main: Starting EnhancedPlex");
runOnReady();