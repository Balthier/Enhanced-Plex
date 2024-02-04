function saveOption(name, value) {
    option = "options_" + name;
    utils.debug("Options: Setting " + option + " to " + value);
    utils.cache_set(option, value, "sync");
}

async function restoreOptions() {
    var options = ["tmdb_link", "tvdb_link", "missing_episodes", "stats_link", "trakt_movies_link", "trakt_shows_link", "imdb_shows_link", "imdb_movies_link", "sonarr_api", "sonarr_api_url", "sonarr_api_key", "radarr_api", "radarr_api_url", "radarr_api_key", "debug", "debug_unfiltered"];
    for (i = 0; i < options.length; i++) {
        option_name = options[i];
        option = "options_" + option_name;
        utils.debug("Options [async] (restoreOptions): Retrieving cache for " + option);
        cache_data = await utils.cache_get(option, "sync") || {};
        if (Object.keys(cache_data).length) {
            utils.debug("Options [async] (restoreOptions): Cache found.");
            value = cache_data;
        }
        else {
            if (option_name == "debug" || option_name == "debug_unfiltered" || option_name == "sonarr_api" || option_name == "radarr_api") {
                utils.debug("Options [async] (restoreOptions): No cache found. Setting option to disabled by default");
                utils.cache_set(option, "false", "sync");
                value = "false";
            }
            else if (option_name.includes("_key") || option_name.includes("_url")) {
                utils.debug("Options [async] (restoreOptions): No cache found. Setting option to unset by default");
                utils.cache_set(option, "", "sync");
                value = "";
            }
            else {
                utils.debug("Options [async] (restoreOptions): No cache found. Setting option to enabled by default");
                utils.cache_set(option, "true", "sync");
                value = "true";
            }
        }
        if (value == "true") {
            onOff = "on";
        }
        else if (value == "false") {
            onOff = "off";
        }
        else {
            onOff = "NA";
        }
        if (onOff == "NA") {
            textfield = document.querySelector("input#" + options[i]);
            textfield.value = value;
        }
        else {
            id = options[i] + "_" + onOff;
            utils.debug("Options [async] (restoreOptions): Setting the HTML element on " + id);
            checkbox = document.getElementById(id);
            checkbox.checked = value;
        }
    }
    refreshExtraOptions();
}

function refreshExtraOptions() {
    var debug_extra_options = document.querySelectorAll("#debug-extra");
    var sonarr_url = document.querySelectorAll("#sonarr-extra");
    var radarr_url = document.querySelectorAll("#radarr-extra");
    if (document.getElementById("debug_on").checked) {
        for (var i = 0; i < debug_extra_options.length; i++) {
            debug_extra_options[i].style.display = "block";
        }
    }
    else {
        for (var i = 0; i < debug_extra_options.length; i++) {
            debug_extra_options[i].style.display = "none";
        }
    }
    if (document.getElementById("sonarr_api_on").checked) {
        for (var i = 0; i < debug_extra_options.length; i++) {
            sonarr_url[i].style.display = "block";
        }
    }
    else {
        for (var i = 0; i < debug_extra_options.length; i++) {
            sonarr_url[i].style.display = "none";
        }
    }
    if (document.getElementById("radarr_api_on").checked) {
        for (var i = 0; i < debug_extra_options.length; i++) {
            radarr_url[i].style.display = "block";
        }
    }
    else {
        for (var i = 0; i < debug_extra_options.length; i++) {
            radarr_url[i].style.display = "none";
        }
    }
}

utils.storage_get_all(async function (settings) {
    utils.debug("Options [async] (utils.storage_get_all): Restoring options.");
    await restoreOptions();

    // add click listener on all inputs to automatically save changes
    var input_elements = document.getElementsByTagName('input');
    for (var i = 0; i < input_elements.length; i++) {
        if (input_elements[i].type === "url") {
            input_elements[i].addEventListener("change", function (e) {
                if (e.target.checkValidity()) {
                    raw_value = e.target.value;
                    e.target.style.border = "1px solid #E69533";
                    value = raw_value.replace(/\/$/, "");
                    e.target.value = value;
                    element_name = this.name;
                    saveOption(element_name, value);
                }
                else {
                    e.target.style.border = "3px solid red";
                }
            });
        }
        else if (input_elements[i].type === "text") {
            input_elements[i].addEventListener("change", function (e) {
                value = e.target.value;
                element_name = this.name;
                saveOption(element_name, value);
            });
        }
        else if (input_elements[i].type === "radio") {
            input_elements[i].addEventListener("click", function () {
                element_id = this.id;
                if (element_id.match(/on$/g)) {
                    value = "true";
                }
                else if (element_id.match(/off$/g)) {
                    value = "false";
                }
                element_name = this.name;
                saveOption(element_name, value);
                refreshExtraOptions();
            });
        }
    }

    // add click listener to clear cache
    cache_element = document.getElementById("clear-cache");
    cache_element.addEventListener("click", function (e) {
        this.innerHTML = "Cleared";
        utils.cache_purge();

        var button = this;
        setTimeout(function () {
            button.innerHTML = "Clear cache";
        }, 1500);
    });

    version_element = document.getElementById("ext_version");
    title_element = document.getElementsByTagName("title")[0];
    extension_version = utils.getExtensionVersion();
    title_element.innerHTML = "EnhancedPLEX (" + extension_version + ") options";
    version_element.innerHTML = "Version: <b>v" + extension_version + "</b>";

    data = {
        Title: document.title,
        Location: document.location.pathname
    };

    google_api.sendTracking("page_view", data);

});
