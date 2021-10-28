var global_settings;

utils = {
    debug: function (output) {
        if (global_settings["debug"] === "on") {
            if (typeof output === "string") {
                if (global_settings["debug_unfiltered"] === "off") {
                    if (typeof global_plex_token != "undefined") {
                        output = output.replace(global_plex_token, "XXXXXXXXXXXXXXXXXXXX");
                    }
                    output = output.replace(/X-Plex-Token=[\w\d]{20}/, "X-Plex-Token=XXXXXXXXXXXXXXXXXXXX");
                    output = output.replace(/\d+\.\d+\.\d+\.\d+/, "XXX.XXX.X.XX");
                }

                console.log("EnhancedPLEX Debug: " + output);
            }
            else {
                // don't filter xml, use nodeType attribute to detect
                if (global_settings["debug_unfiltered"] === "off" && !("nodeType" in output)) {
                    // clone object so we can filter out values
                    var output_ = {};
                    for (var key in output) {
                        if (output.hasOwnProperty(key)) {
                            output_[key] = output[key];
                        }
                    }

                    if ("access_token" in output_) {
                        output_["access_token"] = "XXXXXXXXXXXXXXXXXXXX";
                    }
                    if ("uri" in output_) {
                        output_["uri"] = "XXX.XXX.X.XX";
                    }

                    console.log(output_);
                }
                else {
                    console.log(output);
                }
            }
        }
    },

    getExtensionVersion: function () {
        var version = chrome.runtime.getManifest()["version"];
        return version;
    },

    getOptionsURL: function () {
        var options_url = chrome.runtime.getURL("resources/options/options.html");
        return options_url;
    },

    getStatsURL: function () {
        var stats_url = chrome.runtime.getURL("resources/stats/stats.html");
        return stats_url;
    },

    insertOverlay: function () {
        // don't run if overlay exists on page
        utils.debug("Utils: Checking if overlay already exists before creating");
        var existing_overlay = document.getElementById("overlay");
        if (existing_overlay) {
            utils.debug("Utils: Overlay already exists. Passing");
            return existing_overlay;
        }

        var overlay = document.createElement("div");
        overlay.setAttribute("id", "overlay");

        document.body.appendChild(overlay);
        utils.debug("Utils: Inserted overlay");

        return overlay;
    },

    background_storage_set: function (key, value) {
        chrome.runtime.sendMessage({ "type": "set", "key": key, "value": value });
    },

    background_storage_get: function (key, callback) {
        chrome.runtime.sendMessage({ "type": "get", "key": key }, function (results) {
            callback(results);
        });
    },

    storage_set: function (key, value) {
        var hash = {};
        hash[key] = value;
        chrome.storage.sync.set(hash);
    },

    storage_get: function (key, callback) {
        chrome.storage.sync.get(key, function (result) {
            var value = result[key];
            callback(value);
        });
    },

    storage_get_all: function (callback) {
        chrome.storage.sync.get(function (results) {
            global_settings = results;
            callback(results);
        });
    },

    local_storage_set: function (key, value) {
        var hash = {};
        hash[key] = value;
        chrome.storage.local.set(hash);
    },

    local_storage_get: function (key) {
        result = chrome.storage.local.get(key);
        if (result) {
            var value = result[key];
            return value;
        }
    },

    local_storage_remove: function (key) {
        chrome.storage.local.remove(key);
    },

    cache_set: function (key, data) {
        cache_keys = utils.local_storage_get("cache_keys")
        if (!cache_keys) {
            cache_keys = {};
        }
        // store cached url keys with timestamps
        cache_keys[key] = { "timestamp": new Date().getTime() };
        utils.local_storage_set("cache_keys", cache_keys);

        // store cached data with url key
        utils.local_storage_set(key, data);
    },

    cache_get: function (key) {
        var data = utils.local_storage_get(key)
        if (data) {
            utils.debug("Utils: Cache hit");
            return data
        }
        else {
            utils.debug("Utils: Cache miss");
            return
        }
    },

    purgeStaleCaches: function (force) {
        utils.local_storage_get("cache_keys", function (cache_keys) {
            // check if there is any cached data yet
            if (!cache_keys) {
                utils.debug("Utils: No cached data, skipping cache purge");
                return;
            }

            var time_now = new Date().getTime();

            // iterate over cache keys and check if stale
            for (var key in cache_keys) {
                var timestamp = cache_keys[key]["timestamp"];

                // 3 day cache
                if (time_now - timestamp > 259200000 || force) {
                    utils.debug("Utils: Found stale data, removing " + key);
                    utils.local_storage_remove(key);

                    delete cache_keys[key];
                    utils.local_storage_set("cache_keys", cache_keys);
                }
            }
        });
    },

    getResourcePath: function (resource) {
        return chrome.runtime.getURL("resources/" + resource);
    },

    getApiKey: async (api_name) => {
        var file_path = utils.getResourcePath("api_keys/" + api_name + ".txt");
        var text;
        response = await fetch(file_path);
        text = await response.text();
        return text;
    },
    getXML: async (url) => {
        utils.debug("Utils: Fetching XML from " + url);
        response = await fetch(url);
        text = await response.text();
        var parser = new DOMParser();
        var xml = parser.parseFromString(text, "application/xml");
        utils.debug("Utils: Recieved XML response " + url);
        utils.debug(xml);
        return xml;
    },

    getXMLOld: function (url, callback) {
        utils.debug("Fetching XML from " + url);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = function (e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    utils.debug("Recieved XML response");
                    utils.debug(xhr.responseXML);
                    callback(xhr.responseXML);
                }
                else {
                    callback(xhr.statusText);
                }
            }
        };
        xhr.onerror = function () {
            callback(xhr.statusText);
        };
        xhr.send();
    },

    getXMLWithTimeout: function (url, timeout) {
        utils.debug("Utils: Fetching XML from " + url);
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onload = function (e) {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    utils.debug("Utils: Recieved XML response from " + url);
                    utils.debug(xhr.responseXML);
                    return xhr.responseXML;
                }
                else {
                    return xhr.statusText;
                }
            }
        };
        xhr.onerror = function () {
            return xhr.statusText;
        };
        xhr.timeout = timeout;
        xhr.ontimeout = function () {
            return xhr.statusText;
        };
        xhr.send();
    },

    getJSONWithCache: async (url, custom_headers) => {
        utils.debug("Utils: Checking for JSON Cache for " + url);
        var cacheCheck = await utils.cache_get("cache-" + url);
        if (cacheCheck) {
            return cacheCheck;
        }
        else {
            // cache missed or stale, grabbing new data
            var data = await utils.getJSON(url, custom_headers);
            if (data) {
                utils.cache_set("cache-" + url, data);
                return data;
            }
        }
    },

    getJSON: async (url, custom_headers) => {
        var data
        utils.debug("Utils: Fetching JSON from " + url);
        response = await fetch(url, {
            method: 'GET',
            headers: custom_headers
        });
        if (response.ok) {
            json = await response.json();
            utils.debug("Utils: Recieved JSON response");
            utils.debug(json);
            //data = JSON.parse(json);
        }
        //return data
        return json
    },

    setDefaultOptions: function (callback) {
        utils.storage_get_all(function (settings) {
            if (!("missing_episodes" in settings)) {
                utils.storage_set("missing_episodes", "on");
            }
            if (!("trakt_movies" in settings)) {
                utils.storage_set("trakt_movies", "on");
            }

            if (!("trakt_shows" in settings)) {
                utils.storage_set("trakt_shows", "on");
            }
            if (!("imdb_movies" in settings)) {
                utils.storage_set("imdb_movies", "on");
            }

            if (!("imdb_shows" in settings)) {
                utils.storage_set("imdb_shows", "on");
            }

            if (!("tmdb_link" in settings)) {
                utils.storage_set("tmdb_link", "on");
            }

            if (!("tvdb_link" in settings)) {
                utils.storage_set("tvdb_link", "off");
            }

            if (!("stats_link" in settings)) {
                utils.storage_set("stats_link", "on");
            }
            /*if (!("hide_watched" in settings)) {
                utils.storage_set("hide_watched", "on");
            }*/

            if (!("last_version" in settings)) {
                utils.storage_set("last_version", "");
            }

            if (!("debug" in settings)) {
                utils.storage_set("debug", "off");
            }

            if (!("debug_unfiltered" in settings)) {
                utils.storage_set("debug_unfiltered", "off");
            }

            if (callback) {
                callback(settings);
            }
        });
    }
}