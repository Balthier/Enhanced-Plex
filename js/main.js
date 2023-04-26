var show_update_text = false;
var update_text = "EnhancedPLEX. Made from the ashes of Transmogrify"

// Hopefully these will make it easier to update in future Plex for Web updates.
var PlexForWebURL = new RegExp(/https:\/\/app\.plex\.tv\/desktop\/?\#\!\/?/);
var plexforweb = PlexForWebURL.test(document.URL)

if (plexforweb) {
    // Plex for Web
    var MainPageDetection = new RegExp(/(.*)\/desktop\/?\#\!\/?$/);
    var LibraryPageDetection = new RegExp(/(.*)com.plexapp.plugins.library(.*)$/);
    var TVMoviePageDetection = new RegExp(/(.*)\/server\/(.*)details(.*)$/);
    var MainPageLoaded = "button";
    var LibraryPageLoaded = "MetadataPosterCard-cardContainer";
    var TVPageLoaded = "PrePlayListTitle-titleContainer";
    var MoviePageLoaded = "metadata-title";
    var StatsButtonParent = "NavBar-right";
    var StatsButtonContainer = "NavBarActivityButton-container"
    var plexParentBanner = "metadata-starRatings";
    var MinPfWVersion = "41052"
    var MinPfWVersionDisp = "4.105.2"
}
else {
    // Local Plex
    var MainPageDetection = new RegExp(/(.*)\/web\/index.html\#\!\/$/);
    var LibraryPageDetection = new RegExp(/(.*)com.plexapp.plugins.library(.*)$/);
    var TVMoviePageDetection = new RegExp(/(.*)\/server\/(.*)details(.*)$/);
    var MainPageLoaded = "button";
    var LibraryPageLoaded = "MetadataPosterCard-cardContainer";
    var TVPageLoaded = "PrePlayListTitle-titleContainer";
    var MoviePageLoaded = "preplay-mainTitle";
    var StatsButtonParent = "NavBar-right";
    var StatsButtonContainer = "NavBarActivityButton-button"
    var plexParentBanner = "preplay-thirdTitle";
    var MinPfWVersion = "41001"
    var MinPfWVersionDisp = "4.100.1"
}

var UnmatchedDetection = new RegExp(/^local\:\/\//);
var PlexBannerID = "Enhanced-Plex-Banner"

function minReqs() {
    utils.debug("Main (minReqs): Checking minimum requirements");
    var versionRegex = new RegExp(/plex-\d\.\d{3}\.\d/);
    var PfWRaw = document.head.getElementsByTagName('link')[0].href;
    var PfWVersionDisp = (PfWRaw.match(versionRegex))[0].replace("plex-", "")
    var PfWVersion = PfWVersionDisp.replace(/\./g, "");
    if (PfWVersion < MinPfWVersion) {
        utils.debug("Main (minReqs): Plex for Web version is " + PfWVersionDisp + " which is below the minimum required version: " + MinPfWVersionDisp)
        versionerror = "Plex for Web version is " + PfWVersionDisp + " which is below the minimum required version: " + MinPfWVersionDisp;
        level = "error"
    }
    else if (PfWVersion > MinPfWVersion) {
        utils.debug("Main (minReqs): Plex for Web version is " + PfWVersionDisp + " which is higher than the currently tested version: " + MinPfWVersionDisp)
        versionerror = "Plex for Web version is " + PfWVersionDisp + " which is higher than the currently tested version: " + MinPfWVersionDisp + " - Please report any issues via the Known Issues link on the Options page";
        level = "warn"
    }
    else {
        utils.debug("Main (minReqs): Plex for Web version is " + PfWVersionDisp + " which is meets the minimum required version: " + MinPfWVersionDisp)
        versionerror = false;
    }
    if (versionerror) {
        return [versionerror, level]
    }
    else {
        return versionerror
    }
}

function insertErrorBar(level, details) {
    if (document.getElementById("error-details")) {
        utils.debug("Main (insertErrorBar): Error already present. Skipping.");
        return;
    }
    var rightnavbars = document.body.querySelectorAll("[class*=" + CSS.escape(StatsButtonContainer) + "]");
    var nav_bar_right = rightnavbars[0];

    var error_link = document.createElement("a");
    error_link.setAttribute("id", "error-toggle");
    error_link.setAttribute("href", "#")

    var error_img = document.createElement("img");
    error_link.appendChild(error_img)

    var error_details = document.createElement("div");
    error_details.setAttribute("id", "error-details");
    error_details.setAttribute("title", "EnhancedPLEX Error");

    if (level == "warn") {
        var img_loc = utils.getResourcePath("info-icon.png")
        error_img.setAttribute("src", img_loc)
        error_details.innerText = "EnhancedPlex Warning: " + details
    }
    else if (level == "error") {
        var img_loc = utils.getResourcePath("error-icon.png")
        error_img.setAttribute("src", img_loc)
        error_details.innerText = "EnhancedPlex Error: " + details
    }
    else {
        utils.debug("Main (insertErrorBar): Unknown error level specified: " + level)
        return
    }

    var container = document.createElement("div");
    container.setAttribute("id", "error-container");
    container.appendChild(error_link)
    container.appendChild(error_details);
    nav_bar_right.parentElement.prepend(container);

    document.getElementById("error-toggle").addEventListener("click", function () {
        toggleErrorDetails()
    })
}

function toggleErrorDetails() {
    error_element = document.getElementById("error-details")
    current_display = window.getComputedStyle(error_element).display
    if ((current_display == "none") || (!current_display)) {
        utils.debug("Main (toggleErrorDetails): Details currently hidden. Displaying...")
        error_element.style.display = "block"
    }
    else {
        utils.debug("Main (toggleErrorDetails): Details currently set to: " + current_display + " - Hiding...")
        error_element.style.display = "none"
    }
}

function runOnReady() {
    versiondata = minReqs();
    if (versiondata) {
        versionerror = versiondata[0]
        level = versiondata[1]
    }
    utils.debug("Main (runOnReady): runOnReady called. Starting watch");
    var page_url = document.URL;
    var interval = window.setInterval(function () {
        if (plexforweb) {
            utils.debug("Main (runOnReady): Plex for Web URL detected")
        }
        else {
            utils.debug("Main (runOnReady): Local Plex URL detected")
        }
        if (document.URL != page_url) {
            utils.debug("Main (runOnReady): Document URL is not the same as Page URL. Clearing Interval..")
            window.clearInterval(interval);
        }
        if (MainPageDetection.test(document.URL)) {
            utils.debug("Main (runOnReady): Main page detected. Checking if ready...");
            if (document.getElementsByTagName(MainPageLoaded).length > 0) {
                if (versionerror) {
                    insertErrorBar(level, versionerror);
                    if (level == "error") {
                        window.clearInterval(interval);
                        return
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
                    window.clearInterval(interval);
                    return
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
                    window.clearInterval(interval);
                    return
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
        var plex_token = localStorage["myPlexAccessToken"];
        utils.debug("Main (getPlexToken): plex_token fetched from localStorage - " + localStorage["myPlexAccessToken"]);
        return plex_token;
    }
}

function insertLoadingIcon() {
    var rightnavbars = document.body.querySelectorAll("[class*=" + CSS.escape(StatsButtonContainer) + "]");
    var nav_bar_right = rightnavbars[0];
    var img = document.createElement("img");
    img.setAttribute("src", utils.getResourcePath("loading_extension.gif"));
    img.setAttribute("id", "loading-extension");

    nav_bar_right.insertBefore(img, nav_bar_right.firstChild);
}

function removeLoadingIcon() {
    var loading_icon = document.getElementById("loading-extension");
    if (loading_icon) {
        loading_icon.parentNode.removeChild(loading_icon);
    }
}

function insertBannerTemplate() {
    var existing_banner = document.getElementById("Enhanced-Plex-Banner");
    if (existing_banner) {
        utils.debug("Main [async] (insertBannerTemplate): Banner already exists on page. Skipping.");
    }
    else {
        utils.debug("Main [async] (insertBannerTemplate): Banner not present. Constructing.");
        var insert_target = document.querySelectorAll("[data-testid*=" + CSS.escape(plexParentBanner) + "]")[0];
        var banner_element = document.createElement("span");
        banner_element.setAttribute("id", PlexBannerID);
        var info_box = document.createElement("div");
        info_box.setAttribute("id", "ep_infobox");
        info_box.classList.add("ep_box")
        banner_element.appendChild(info_box);

        var heading = document.createElement("h1")
        heading.innerText = "Additional Information";
        heading.classList.add("ep_h1");
        info_box.appendChild(heading);

        var links_box = document.createElement("div");
        links_box.setAttribute("id", "ep_links");
        links_box.classList.add("ep_box")
        links_box.innerHTML = "<b>Links: </b> <br>"
        banner_element.appendChild(links_box);

        utils.debug("Main [async] (insertBannerTemplate): Inserting Banner");

        if (plexforweb) {
            var plex_parent = insert_target.parentNode.parentNode
            plex_parent.appendChild(banner_element);

        }
        else {
            insert_target.after(banner_element);
        }
    }
}

async function getServerAddresses(requests_url, plex_token) {
    cache_data = await utils.cache_get("options_server_addresses", "sync") || {}
    if (Object.keys(cache_data).length) {
        server_addresses = cache_data
    }
    else {
        var xml_lookup_tag_name = "Device";
        var request_path = "/resources?includeHttps=1";
        var requests_url = "https://plex.tv/pms"
        var servers_xml = await utils.getXML(requests_url + request_path + "&X-Plex-Token=" + plex_token) || {};
        if (Object.keys(servers_xml).length) {
            var devices = servers_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName(xml_lookup_tag_name);
            var server_addresses = {};
            for (var i = 0; i < devices.length; i++) {
                const device = devices[i];
                var serverCheck = device.getAttribute("provides")
                if (serverCheck.includes("server")) {
                    const name = device.getAttribute("name");
                    const machine_identifier = device.getAttribute("clientIdentifier");
                    const access_token = device.getAttribute("accessToken");
                    const connections = device.getElementsByTagName("Connection");
                    for (j = 0; j < connections.length; j++) {
                        uri = connections[j].getAttribute("uri");
                        test = await utils.getXML(uri + "?X-Plex-Token=" + access_token) || {};
                        if (Object.keys(test).length) {
                            utils.debug("Main [async] (getServerAddresses): Connection success... Adding to list.. (" + uri + ")");
                            server_addresses[machine_identifier] = {
                                "name": name,
                                "machine_identifier": machine_identifier,
                                "access_token": access_token,
                                "uri": uri
                            }
                        }
                        else {
                            utils.debug("Main [async] (getServerAddresses): Could not get a response from the connection... Aborting.");
                        }
                    }
                }
                serverCheck = null
            }
            utils.cache_set("options_server_addresses", server_addresses, "sync")
        }
    }
    utils.debug("Main [async] (getServerAddresses): Server Addresses collected..");
    utils.debug(server_addresses);
    return server_addresses;
}

function processLibrarySections(sections_xml) {
    var directories = sections_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
    var dir_metadata = {};
    for (var i = 0; i < directories.length; i++) {
        var type = directories[i].getAttribute("type");
        var section_num = directories[i].getAttribute("path").match(/\/(\d+)$/)[1];
        var machine_identifier = directories[i].getAttribute("machineIdentifier");

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
    settings = await chrome.storage.sync.get()
    utils.debug("Main [async] (main): Running main()");

    // show popup if updated
    //checkIfUpdated();

    var page_url = document.URL;
    var plex_token = getPlexToken();

    // add observer for fast user switching functionality, to reload token and server addresses
    var observer = new MutationObserver(function (mutations) {
        observer.disconnect();

        utils.debug("Main [async] (main): User switched");
        runOnReady();
    });

    // use plex.tv for API requests if we have plex token
    var requests_url = "https://plex.tv/pms";
    utils.debug("Main [async] (main): Requests_url set as " + requests_url);

    var server_addresses = await getServerAddresses(requests_url, plex_token) || {};
    const timer = ms => new Promise(res => setTimeout(res, ms))
    await timer(100);
    if (Object.keys(server_addresses).length) {

        // insert stats page link
        if (settings["options_stats_link"] === "true") {
            utils.debug("Main [async] (main): Stats plugin is enabled");
            stats.init();
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
            var page_identifier = page_url.match(/\/media\/(.[^\/]+)(.*)source\=(\d+)/);
            var machine_identifier = page_identifier[1];
            var section_num = page_identifier[3];
            utils.debug("Main [async] (main): Machine identifier - " + machine_identifier);
            utils.debug("Main [async] (main): Library section - " + section_num);

            // get library sections xml
            var library_sections_url = requests_url + "/system/library/sections?X-Plex-Token=" + plex_token;
            var sections_xml = await utils.getXML(library_sections_url) || {};
            if (Object.keys(sections_xml).length) {
                var library_sections = processLibrarySections(sections_xml);
                var server;
                if (server_addresses) {
                    server = server_addresses[machine_identifier];
                }
                else {
                    server = {};
                }
                var section = library_sections[machine_identifier][section_num]
            };
        }

        // check if on movie/tv show details page
        else if (TVMoviePageDetection.test(page_url)) {
            insertBannerTemplate();
            utils.debug("Main [async] (main): We are on a Movie/TV show details page");
            var page_identifier = page_url.match(/\/server\/(.[^\/]+)(.*)%2Flibrary%2Fmetadata%2F(\d+)/);
            var machine_identifier = page_identifier[1];
            var parent_item_id = page_identifier[3];
            utils.debug("Main [async] (main): Metadata id - " + parent_item_id);

            var server = server_addresses[machine_identifier];

            // construct metadata xml link
            utils.debug("Main [async] (main): Fetching metadata for id - " + parent_item_id);

            var metadata_xml_url = server["uri"] + "/library/metadata/" + parent_item_id + "?X-Plex-Token=" + server["access_token"];

            // fetch metadata xml asynchronously
            var metadata_xml = await utils.getXML(metadata_xml_url) || {};

            utils.debug(metadata_xml)
            const timer = ms => new Promise(res => setTimeout(res, ms))
            await timer(100);
            if (Object.keys(metadata_xml).length) {
                if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory").length > 0) {
                    guid = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("guid")
                    if (UnmatchedDetection.test(guid)) {
                        utils.debug("Main [async] (main): TV Show does not appear to be Matched. Skipping");
                        return
                    }
                    // we're on a tv show page
                    utils.debug("Main [async] (main): We are on a TV show index page");

                    if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("type") === "show") {
                        // we're on the root show page
                        utils.debug("Main [async] (main): We are on root show page");

                        // insert imdb link
                        if (settings["options_imdb_shows_link"] === "true") {
                            utils.debug("Main [async] (main): imdb_shows is enabled");
                            imdb.init(metadata_xml, "show");
                        }
                        else {
                            utils.debug("Main [async] (main): imdb_shows is disabled");
                        }

                        // create trakt link
                        if (settings["options_trakt_shows_link"] === "true") {
                            utils.debug("Main [async] (main): trakt_shows is enabled");
                            trakt.init(metadata_xml, "show", server);
                        }
                        else {
                            utils.debug("Main [async] (main): trakt_shows is disabled");
                        }

                        // create tvdb link
                        if (settings["options_tvdb_link"] === "true") {
                            utils.debug("Main [async] (main): TVDB plugin is enabled");
                            tvdb.init(metadata_xml);
                        }
                        else {
                            utils.debug("Main [async] (main): TVDB plugin is disabled");
                        }

                        // insert missing seasons
                        if (settings["options_missing_episodes"] === "true") {
                            utils.debug("Main [async] (main): Missing Episodes plugin is enabled");
                            missing_episodes.init(metadata_xml, server, "show");
                        }
                        else {
                            utils.debug("Main [async] (main): Missing Episodes plugin is disabled");
                        }
                    }
                    else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("type") === "season") {
                        // we're on the season page
                        utils.debug("Main [async] (main): We are on a season page");

                        // insert imdb link
                        if (settings["options_imdb_shows_link"] === "true") {
                            utils.debug("Main [async] (main): imdb_shows is enabled");
                            imdb.init(metadata_xml, "season");
                        }
                        else {
                            utils.debug("Main [async] (main): imdb_shows is disabled");
                        }

                        // create trakt link
                        if (settings["options_trakt_shows_link"] === "true") {
                            utils.debug("Main [async] (main): trakt_shows is enabled");
                            trakt.init(metadata_xml, "season", server);
                        }
                        else {
                            utils.debug("Main [async] (main): trakt_shows is disabled");
                        }

                        // create tvdb link
                        if (settings["options_tvdb_link"] === "true") {
                            utils.debug("Main [async] (main): TVDB plugin is enabled");
                            tvdb.init(metadata_xml);
                        }
                        else {
                            utils.debug("Main [async] (main): TVDB plugin is disabled");
                        }

                        // insert missing episodes
                        if (settings["options_missing_episodes"] === "true") {
                            utils.debug("Main [async] (main): Missing Episodes plugin is enabled");
                            missing_episodes.init(metadata_xml, server, "season");
                        }
                        else {
                            utils.debug("Main [async] (main): Missing Episodes plugin is disabled");
                        }
                    }
                }
                else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("type") === "movie") {
                    guid = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("guid")
                    if (UnmatchedDetection.test(guid)) {
                        utils.debug("Main [async] (main): Movie does not appear to be Matched. Skipping");
                        return
                    }
                    // we're on a movie page
                    utils.debug("Main [async] (main): We are on a movie page");

                    // insert imdb link
                    if (settings["options_imdb_movies_link"] === "true") {
                        utils.debug("Main [async] (main): imdb_movies is enabled");
                        imdb.init(metadata_xml, "movie");
                    }
                    else {
                        utils.debug("Main [async] (main): imdb_movies is disabled");
                    }

                    // insert tmdb link
                    if (settings["options_tmdb_link"] === "true") {
                        utils.debug("Main [async] (main): TMDB plugin is enabled");
                        tmdb.init(metadata_xml);
                    }
                    else {
                        utils.debug("Main [async] (main): TMDB plugin is disabled");
                    }

                    // create trakt link
                    if (settings["options_trakt_movies_link"] === "true") {
                        utils.debug("Main [async] (main): trakt_movies is enabled");
                        trakt.init(metadata_xml, "movie", server);
                    }
                    else {
                        utils.debug("Main [async] (main): trakt_movies is disabled");
                    }
                }
                else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("type") === "episode") {
                    guid = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("guid")
                    if (UnmatchedDetection.test(guid)) {
                        utils.debug("Main [async] (main): Episode does not appear to be Matched. Skipping");
                        return
                    }
                    // we're on an episode page
                    utils.debug("Main [async] (main): We are on an episode page");

                    // create trakt link
                    if (settings["options_trakt_shows_link"] === "true") {
                        utils.debug("Main [async] (main): trakt_shows is enabled");
                        trakt.init(metadata_xml, "episode", server);
                    }
                    else {
                        utils.debug("Main [async] (main): trakt_shows is disabled");
                    }
                }
            }
            else {
                utils.debug("Main [async] (main): Could not set Metadata XML... Aborting.");
                return
            }
        }
    }
    else {
        utils.debug("Main [async] (main): Could not retrieve server addresses... Aborting.");
        return
    }
}

// because Plex/Web uses JS to change pages Chrome extensions don't run on every
// page load as expected. To fix this we run the script every time the window
// url hash changes.
window.onhashchange = function () {
    utils.debug("Main (window.onhashchange): Page change detected");
    runOnReady();
}
utils.debug("Main: Starting EnhancedPlex");
runOnReady();