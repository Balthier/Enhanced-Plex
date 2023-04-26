function saveOption(name, toggle) {
    option = "options_" + name
    if (toggle === true) {
        onOff = "true"
    }
    else {
        onOff = "false"
    }
    utils.debug("Options: Setting " + option + " to " + onOff)
    utils.cache_set(option, onOff, "sync")
}

async function restoreOptions() {
    var options = ["tmdb_link", "tvdb_link", "missing_episodes", "stats_link", "trakt_movies_link", "trakt_shows_link", "imdb_shows_link", "imdb_movies_link", "debug", "debug_unfiltered"]
    for (i = 0; i < options.length; i++) {
        option_name = options[i]
        option = "options_" + option_name
        utils.debug("Options [async] (restoreOptions): Retrieving cache for " + option)
        cache_data = await utils.cache_get(option, "sync") || {}
        if (Object.keys(cache_data).length) {
            utils.debug("Options [async] (restoreOptions): Cache found.")
            toggle = cache_data
        }
        else {
            if (option_name == "debug" || option_name == "debug_unfiltered") {
                utils.debug("Options [async] (restoreOptions): No cache found. Setting debug option to disabled by default")
                utils.cache_set(option, "false", "sync");
                toggle = "false";
            }
            else {
                utils.debug("Options [async] (restoreOptions): No cache found. Setting option to enabled by default")
                utils.cache_set(option, "true", "sync");
                toggle = "true";
            }
        }
        if (toggle == "true") {
            onOff = "on"
        }
        else {
            onOff = "off"
        }

        id = options[i] + "_" + onOff
        utils.debug("Options [async] (restoreOptions): Setting the HTML element on " + id)
        checkbox = document.getElementById(id)
        checkbox.checked = toggle
    }
    refreshDebugExtraOptions()
}

function refreshDebugExtraOptions() {
    var debug_extra_options = document.querySelectorAll("#debug-extra");
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
}

utils.storage_get_all(async function (settings) {
    utils.debug("Options [async] (utils.storage_get_all): Restoring options.")
    await restoreOptions();

    // add click listener on all inputs to automatically save changes
    var input_elements = document.getElementsByTagName('input');
    for (var i = 0; i < input_elements.length; i++) {
        input_elements[i].addEventListener("click", function () {
            element_id = this.id
            if (element_id.match(/on$/g)) {
                toggle = true
            }
            else if (element_id.match(/off$/g)) {
                toggle = false
            }
            element_name = this.name
            saveOption(element_name, toggle)
            refreshDebugExtraOptions()
        })
    }

    // add click listener to clear cache
    cache_element = document.getElementById("clear-cache")
    cache_element.addEventListener("click", function (e) {
        this.innerHTML = "Cleared";
        utils.cache_purge();

        var button = this;
        setTimeout(function () {
            button.innerHTML = "Clear cache";
        }, 1500);
    });

    version_element = document.getElementById("ext_version")
    extension_version = utils.getExtensionVersion()
    version_element.innerHTML = "Version: <b>v" + extension_version + "</b>"

})