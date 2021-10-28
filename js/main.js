var show_update_text = false;
var update_text = "EnhancedPLEX. Made from the ashes of Transmogrify"
var settings;
var global_plex_token;
var global_server_addresses;
// Hopefully these will make it easier to update in future Plex for Web updates.
var MainPageDetection = new RegExp(/https:\/\/app\.plex\.tv\/desktop\/?\#\!\/?$/);
var LibraryPageDetection = new RegExp(/\/desktop(.*)\/media\/(.*)com.plexapp.plugins.library(.*)$/);
var TVMoviePageDetection = new RegExp(/\/desktop(.*)\/server\/(.*)details(.*)$/);
var MainPageLoaded = "button";
var LibraryPageLoaded = "MetadataPosterCard-cardContainer";
var TVMoviePageLoaded = "MetadataPosterListItem-card-";
var StatsButtonParent = "NavBar-right";


function checkIfUpdated() {
    var last_version = settings["last_version"];
    var version = utils.getExtensionVersion();

    if (last_version != version && show_update_text) {
        showUpdatePopup();
        settings["last_version"] = version;
        utils.storage_set("last_version", version);
    }
}

function showUpdatePopup() {
    var options_url = utils.getOptionsURL();
    var stats_url = utils.getStatsURL();
    var formatted_update_text = update_text.replace("%OPTIONSURL%", options_url).replace("%STATSPAGEURL%", stats_url);
    showPopup("New update! - " + formatted_update_text);
}

function closePopup() {
    var popup_container = document.getElementById("update-box");
    popup_container.parentNode.removeChild(popup_container);

    var overlay = document.getElementById("overlay");
    overlay.style.display = "none";
    overlay.removeEventListener("click", closePopup, false);
}

function showPopup(messsage) {
    var overlay = utils.insertOverlay();
    overlay.style.display = "block";

    var popup_container = document.createElement("div");
    popup_container.setAttribute("class", "update-box");
    popup_container.setAttribute("id", "update-box")

    var logo = document.createElement("img");
    logo.setAttribute("src", utils.getResourcePath("icon_transparent.png"));

    var message = document.createElement("p");
    message.innerHTML = messsage;

    popup_container.appendChild(logo);
    popup_container.appendChild(message);
    overlay.appendChild(popup_container);

    var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    if (is_firefox) {
        try {
            document.getElementById("options-page-link").addEventListener("click", utils.openOptionsPage, false);
        }
        catch (e) {
        }
        try {
            document.getElementById("stats-page-link").addEventListener("click", utils.openStatsPage, false);
        }
        catch (e) {
        }
    }
    overlay.addEventListener("click", closePopup, false);
}

function runOnReady() {
    utils.debug("Main: runOnReady called. Starting watch");
    var page_url = document.URL;
    var interval = window.setInterval(function () {
        if (document.URL != page_url) {
            window.clearInterval(interval);
        }
        if (MainPageDetection.test(document.URL)) {
            utils.debug("Main: Main page detected. Checking if ready...");
            if (document.getElementsByTagName(MainPageLoaded).length > 0) {
                utils.debug("Main: Instance of " + MainPageLoaded + " detected. Page is ready");
                window.clearInterval(interval);
                main();
            }
        }
        // page is ready when certain elements exist.
        // check if on library section
        else if (LibraryPageDetection.test(document.URL)) {
            if (document.body.querySelectorAll("[class*=" + CSS.escape(LibraryPageLoaded) + "]").length > 0) {
                utils.debug("Main: Instance of " + LibraryPageLoaded + "detected. Page is ready");
                window.clearInterval(interval);
                main();
            }
        }
        // check if on movie/tv show details page
        else if (TVMoviePageDetection.test(document.URL)) {
            if (document.body.querySelectorAll("[class*=" + CSS.escape(TVMoviePageLoaded) + "]").length > 0) {
                utils.debug("Main: Instance of " + TVMoviePageLoaded + "detected. Page is ready");
                window.clearInterval(interval);
                main();
            }
        }
        else {
            utils.debug("Main: runOnReady not on recognized page");
            window.clearInterval(interval);
        }
    }, 0);
}

function insertPlexToken() {
    var plex_token = PLEXWEB.myPlexAccessToken;
    if (plex_token) {
        document.body.setAttribute("data-plextoken", plex_token);
    }
}

function getPlexToken() {
    if (global_plex_token) {
        utils.debug("Main: plex_token is cached - " + global_plex_token);

        return global_plex_token;
    }
    else if (localStorage["myPlexAccessToken"]) {
        global_plex_token = localStorage["myPlexAccessToken"];
        utils.debug("Main: plex_token fetched from localStorage - " + localStorage["myPlexAccessToken"]);

        return localStorage["myPlexAccessToken"];
    }
    else {
        var plex_token = document.body.getAttribute("data-plextoken");

        if (plex_token === null) {
            // remove existing script if run before
            if (document.getElementById("plex-token-script")) {
                document.body.removeChild(document.getElementById("plex-token-script"));
            }

            utils.debug("Main: Inserting plex_token into document body");
            var script = document.createElement("script");
            script.setAttribute("id", "plex-token-script")
            script.appendChild(document.createTextNode("(" + insertPlexToken + ")();"));
            document.body.appendChild(script);

            plex_token = document.body.getAttribute("data-plextoken");
        }

        global_plex_token = plex_token;
        utils.debug("Main: plex_token fetched from document body - " + plex_token);

        return plex_token;
    }
}

function insertLoadingIcon() {
    var rightnavbars = document.body.querySelectorAll("[class*=" + CSS.escape(StatsButtonParent) + "]");
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

async function getServerAddresses(requests_url, plex_token) {
    var xml_lookup_tag_name = "Device";
    var request_path = "/resources?includeHttps=1";
    var requests_url = "https://plex.tv/pms"
    var plex_token = "R3a3TWxFpDAktk6_T36C"
    var servers_xml = await utils.getXML(requests_url + request_path + "&X-Plex-Token=" + plex_token);
    var retry = 0
    while (servers_xml == null) {
        retry++
        if (retry < 10) {
            utils.debug("Main: Servers XML not returned yet...[" + retry + "]");
        }
        else {
            utils.debug("Main: Could not set Servers XML... Aborting.");
        }
    }
    var devices = servers_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName(xml_lookup_tag_name);

    for (var i = 0; i < devices.length; i++) {

        const device = devices[i];
        const name = device.getAttribute("name");
        const machine_identifier = device.getAttribute("clientIdentifier");
        const access_token = device.getAttribute("accessToken");

        connections = device.getElementsByTagName("Connection");
        var server_addresses = {};
        var i = 0;
        while (i < connections.length) {
            uri = connections[i].getAttribute("uri");
            test = await utils.getXML(uri + "?X-Plex-Token=" + access_token);
            var retry = 0
            while (test == null) {
                retry++
                if (retry < 10) {
                    utils.debug("Main: Waiting for response...[" + retry + "]");
                }
                else {
                    utils.debug("Main: Could not get a response from the connection... Aborting.");
                }
            }
            if (test) {
                utils.debug("Main: Connection success... Adding to list.. (" + uri + ")");
                server_addresses[machine_identifier] = {
                    "name": name,
                    "machine_identifier": machine_identifier,
                    "access_token": access_token,
                    "uri": uri
                }
                utils.background_storage_set("server_addresses", server_addresses);
                return server_addresses;
            }
            i++
        }
    }
    utils.debug("Main: Server Addresses collected..");
    utils.debug(server_addresses);
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

    utils.debug("Main: Parsed library sections");
    utils.debug(dir_metadata);
    return dir_metadata;
}

async function main() {
    utils.debug("Main: Running main()");

    // show popup if updated
    checkIfUpdated();

    var page_url = document.URL;
    var plex_token = getPlexToken();

    // add observer for fast user switching functionality, to reload token and server addresses
    var observer = new MutationObserver(function (mutations) {
        observer.disconnect();

        utils.debug("Main: User switched");
        global_server_addresses = null;
        global_plex_token = null;
        runOnReady();
    });

    // use plex.tv for API requests if we have plex token
    var requests_url = "https://plex.tv/pms";
    utils.debug("Main: Requests_url set as " + requests_url);

    var server_addresses = await getServerAddresses(requests_url, plex_token);
    var retry = 0
    while (server_addresses == null) {
        retry++
        if (retry < 10) {
            utils.debug("Main: Server Addresses not returned yet...[" + retry + "]");
        }
        else {
            utils.debug("Main: Could not retrieve server addresses... Aborting.");
            return
        }
    }
    // insert stats page link
    if (settings["stats_link"] === "on") {
        utils.debug("Main: Stats plugin is enabled");
        stats.init();
    }
    else {
        utils.debug("Main: Stats plugin is disabled");
    }

    // check if on dashboard page
    if (MainPageDetection.test(page_url)) {
        utils.debug("Main: Detected we are on dashboard page");
        /*if (settings["hide_watched"] === "on") {
            utils.debug("Main: hide_watched plugin is enabled");
            hide_watched.init();
        }
        else {
            utils.debug("Main: hide_watched plugin is disabled");
        }*/
        // only purge caches when viewing main page
        utils.purgeStaleCaches();
    }

    // check if on library section
    else if (LibraryPageDetection.test(page_url)) {
        utils.debug("Main: We are in library section");
        var page_identifier = page_url.match(/\/media\/(.[^\/]+)(.*)source\=(\d+)/);
        var machine_identifier = page_identifier[1];
        var section_num = page_identifier[3];
        utils.debug("Main: Machine identifier - " + machine_identifier);
        utils.debug("Main: Library section - " + section_num);

        // get library sections xml
        var library_sections_url = requests_url + "/system/library/sections?X-Plex-Token=" + plex_token;
        var sections_xml = await utils.getXML(library_sections_url);
        var retry = 0
        while (sections_xml == null) {
            retry++
            if (retry < 10) {
                utils.debug("Main: Sections XML not returned yet...[" + retry + "]");
            }
            else {
                utils.debug("Main: Could not set Sections XML... Aborting.");
                return
            }
        }
        var library_sections = processLibrarySections(sections_xml);
        var server;
        if (server_addresses) {
            server = server_addresses[machine_identifier];
        }
        else {
            server = {};
        }
        var section = library_sections[machine_identifier][section_num];
    }

    // check if on movie/tv show details page
    else if (TVMoviePageDetection.test(page_url)) {
        utils.debug("Main: We are on a Movie/TV show details page");
        var page_identifier = page_url.match(/\/server\/(.[^\/]+)(.*)%2Flibrary%2Fmetadata%2F(\d+)/);
        var machine_identifier = page_identifier[1];
        var parent_item_id = page_identifier[3];
        utils.debug("Main: Metadata id - " + parent_item_id);

        var server = server_addresses[machine_identifier];

        // construct metadata xml link
        utils.debug("Main: Fetching metadata for id - " + parent_item_id);

        var metadata_xml_url = server["uri"] + "/library/metadata/" + parent_item_id + "?X-Plex-Token=" + server["access_token"];

        // fetch metadata xml asynchronously
        var metadata_xml = await utils.getXML(metadata_xml_url);
        var retry = 0
        while (metadata_xml == null) {
            retry++
            if (retry < 10) {
                utils.debug("Main: Metadata XML not returned yet...[" + retry + "]");
            }
            else {
                utils.debug("Main: Could not set Metadata XML... Aborting.");
                return
            }
        }

        if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory").length > 0) {
            // we're on a tv show page
            utils.debug("Main: We are on a TV show index page");

            if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("type") === "show") {
                // we're on the root show page
                utils.debug("Main: We are on root show page");

                // insert imdb link
                if (settings["imdb_shows"] === "on") {
                    utils.debug("Main: imdb_shows is enabled");
                    imdb.init(metadata_xml, "show");
                }
                else {
                    utils.debug("Main: imdb_shows is disabled");
                }

                // create trakt link
                if (settings["trakt_shows"] === "on") {
                    utils.debug("Main: trakt_shows is enabled");
                    trakt.init(metadata_xml, "show", server);
                }
                else {
                    utils.debug("Main: trakt_shows is disabled");
                }

                // create tvdb link
                if (settings["tvdb_link"] === "on") {
                    utils.debug("Main: TVDB plugin is enabled");
                    tvdb.init(metadata_xml);
                }
                else {
                    utils.debug("Main: TVDB plugin is disabled");
                }

                // insert missing seasons
                if (settings["missing_episodes"] === "on") {
                    utils.debug("Main: Missing Episodes plugin is enabled");
                    missing_episodes.init(metadata_xml, server, "seasons");
                }
                else {
                    utils.debug("Main: Missing Episodes plugin is disabled");
                }
            }
            else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("type") === "season") {
                // we're on the season page
                utils.debug("Main: We are on a season page");

                // insert missing episodes
                if (settings["missing_episodes"] === "on") {
                    utils.debug("Main: Missing Episodes plugin is enabled");
                    missing_episodes.init(metadata_xml, server, "episodes");
                }
                else {
                    utils.debug("Main: Missing Episodes plugin is disabled");
                }
            }
        }
        else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("type") === "movie") {
            // we're on a movie page
            utils.debug("Main: We are on a movie page");

            // insert imdb link
            if (settings["imdb_movies"] === "on") {
                utils.debug("Main: imdb_movies is enabled");
                imdb.init(metadata_xml, "movie");
            }
            else {
                utils.debug("Main: imdb_movies is disabled");
            }

            // insert tmdb link
            if (settings["tmdb_link"] === "on") {
                utils.debug("Main: TMDB plugin is enabled");
                tmdb.init(metadata_xml);
            }
            else {
                utils.debug("Main: TMDB plugin is disabled");
            }

            // create trakt link
            if (settings["trakt_movies"] === "on") {
                utils.debug("Main: trakt_movies is enabled");
                trakt.init(metadata_xml, "movie", server);
            }
            else {
                utils.debug("Main: trakt_movies is disabled");
            }
        }
        else if (metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("type") === "episode") {
            // we're on an episode page

            // create trakt link
            if (settings["trakt_shows"] === "on") {
                utils.debug("Main: trakt_shows is enabled");
                trakt.init(metadata_xml, "episode", server);
            }
            else {
                utils.debug("Main: trakt_shows is disabled");
            }
        }
    }
}

// set the default options for extension
utils.setDefaultOptions(function (stored_settings) {
    settings = stored_settings;

    // Plex/Web uses a lot of JS to manipulate the DOM so the only way to tell when
    // plex's JS has finished is to check for the existance of certain elements.
    runOnReady();
});

// because Plex/Web uses JS to change pages Chrome extensions don't run on every
// page load as expected. To fix this we run the script every time the window
// url hash changes.
window.onhashchange = function () {
    utils.debug("Main: Page change detected");
    runOnReady();
}