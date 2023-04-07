utils = {
    debug: async (output) => {
        debug_cache = await chrome.storage.sync.get("options_debug") || {}
        debug_unfiltered_cache = await chrome.storage.sync.get("options_debug_unfiltered") || {}
        debug = debug_cache["options_debug"]
        debug_unfiltered = debug_unfiltered_cache["options_debug_unfiltered"]
        if (debug === "true") {
            if (typeof output === "string") {
                if (debug_unfiltered === "false") {
                    if (typeof global_plex_token != "undefined") {
                        output = output.replace(global_plex_token, "XXXXXXXXXXXXXXXXXXXX");
                    }
                    output = output.replace(/X-Plex-Token=[\w\d]{20}/, "X-Plex-Token=XXXXXXXXXXXXXXXXXXXX");
                    output = output.replace(/\d+\.\d+\.\d+\.\d+/, "XXX.XXX.X.XX");
                }
                date = new Date()
                now = date.toLocaleTimeString();
                console.log("[" + now + "] EnhancedPLEX Debug: " + output);
            }
            else {
                // don't filter xml, use nodeType attribute to detect
                if (debug_unfiltered === "false" && !("nodeType" in output)) {
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
        var options_url = chrome.runtime.getURL("resources/extras/options.html");
        return options_url;
    },

    getStatsURL: function () {
        var stats_url = chrome.runtime.getURL("resources/extras/stats.html");
        return stats_url;
    },

    insertOverlay: function () {
        // don't run if overlay exists on page
        utils.debug("Utils (insertOverlay): Checking if overlay already exists before creating");
        var existing_overlay = document.getElementById("overlay");
        if (existing_overlay) {
            utils.debug("Utils (insertOverlay): Overlay already exists. Passing");
            return existing_overlay;
        }

        var overlay = document.createElement("div");
        overlay.setAttribute("id", "overlay");

        document.body.appendChild(overlay);
        utils.debug("Utils (insertOverlay): Inserted overlay");

        return overlay;
    },

    storage_get_all: function (callback) {
        chrome.storage.sync.get(function (results) {
            global_settings = results;
            callback(results);
        });
    },

    cache_purge: async () => {
        types = ["sync", "local"]
        var i = 0
        types.forEach(function (type) {
            if (type === "sync") {
                command = chrome.storage.sync
            }
            else if (type === "local") {
                command = chrome.storage.local
            }
            else {
                utils.debug("Utils [async] (cache_purge): WARNING! Unrecognised storage type: " + type);
                return
            }
            command.get(null, function (data) {
                utils.debug("Utils [async] (cache_purge): Checking " + type + " storage...");
                for (var data_key in data) {
                    if (data_key.match(/^cache\-time\-.+/g)) {
                        if (data_key.match(/^cache\-time\-options.+/g) || data_key.match(/^cache\-time\-stats.+/g)) {
                        }
                        else {
                            utils.debug("Utils [async] (cache_purge): Removing the following entries from " + type + " storage")
                            command.remove(data_key)
                            utils.debug(data_key)
                            var key = data_key.replace("cache-time-", "");
                            command.remove(key)
                            utils.debug(key)
                        }
                    }
                    else {
                        if (data_key.match(/^options.+/g) || data_key.match(/^stats.+/g)) {
                        }
                        else {
                            utils.debug("Utils [async] (cache_purge): Removing the following entries from " + type + " storage")
                            command.remove(data_key)
                            utils.debug(data_key)
                        }
                    }
                }
            })
        })
    },

    cache_get: async (key, type) => {
        if (type === "sync") {
            command = chrome.storage.sync
        }
        else if (type === "local") {
            command = chrome.storage.local
        }
        key = key.replace(/[^A-Za-z0-9_]/g, "_")
        utils.debug("Utils [async] (cache_get): Retrieving the following from cache: " + key);
        var cache_key = "cache-time-" + key
        var expire_data = await command.get(cache_key) || {};
        if (Object.keys(expire_data).length) {
            var timestamp = Object.values(expire_data)[0]
            var time_now = new Date().getTime()
            var time_diff = time_now - timestamp
            if (time_diff > 604800000) {
                utils.debug("Utils [async] (cache_get): Found stale data, removing " + key + " from " + type + " storage");
                command.remove(cache_key);
                command.remove(key);
            }
        }
        response = await command.get(key) || {};
        if (Object.keys(response).length) {
            utils.debug("Utils [async] (cache_get): Received the following response from " + type + " storage: ");
            utils.debug(response);
            utils.debug("Utils [async] (cache_get): Returning the following to calling function:");
            utils.debug(response[key]);
            return response[key];
        }
        else {
            utils.debug("Utils [async] (cache_get): No cache found for: " + key + " in " + type + " storage")
            return
        }
    },

    cache_set: async (key, value, type) => {
        if (type === "sync") {
            command = chrome.storage.sync
        }
        else if (type === "local") {
            command = chrome.storage.local
        }
        key = key.replace(/[^A-Za-z0-9_]/g, "_")
        utils.debug("Utils [async] (cache_set): Committing the following to cache in " + type + " storage: " + key + " With the value of: ");
        var object = {}
        object[key] = value
        utils.debug(object);
        command.set(object);
        var cache_key = "cache-time-" + key
        var time_now = new Date().getTime()
        utils.debug("Utils [async] (cache_set): Setting cache timestamp in " + type + " storage: " + cache_key);
        var cache_data = {}
        cache_data[cache_key] = time_now
        utils.debug(cache_data);
        command.set(cache_data);

    },

    getResourcePath: function (resource) {
        return chrome.runtime.getURL("resources/" + resource);
    },

    getApiKey: async (api_name) => {
        var file_path = utils.getResourcePath("api_keys/" + api_name + ".txt");
        var text;
        response = await fetch(file_path);
        text = await response.text();
        utils.debug("Utils [async] (getApiKey): Returning API Key for: " + api_name);
        return text;
    },

    getXML: async (url) => {
        utils.debug("Utils [async] (getXML): Fetching XML from " + url);
        response = await fetch(url);
        text = await response.text();
        var parser = new DOMParser();
        var xml = parser.parseFromString(text, "application/xml");
        utils.debug("Utils [async] (getXML): Recieved XML response " + url);
        utils.debug(xml);
        return xml;
    },

    getXML_test: async (url) => {
        utils.debug("Utils [async] (getXML_test): Checking for XML Cache for " + url);
        key = "xml-cache-" + url
        var cacheCheck = await utils.cache_get(key, "local") || {};
        if (Object.keys(cacheCheck).length) {
            return cacheCheck;
        }
        else {
            utils.debug("Utils [async] (getXML_test): Fetching XML from " + url);
            response = await fetch(url);
            text = await response.text();
            var parser = new DOMParser();
            var xml = parser.parseFromString(text, "application/xml");
            utils.debug("Utils [async] (getXML_test): Recieved XML response " + url);
            utils.debug(xml);
            utils.cache_set(key, xml, "local");
            return xml;
        }

    },

    getJSON: async (url, custom_headers) => {
        utils.debug("Utils [async] (getJSON): Checking for JSON Cache for " + url);
        key = "json-cache-" + url
        searchkey = key.replace(/[^A-Za-z0-9_]/g, "_")
        var cacheCheck = await utils.cache_get(searchkey, "local") || {};
        if (Object.keys(cacheCheck).length) {
            utils.debug("Utils [async] (getJSON): Cache found for " + url);
            return cacheCheck;
        }
        else {
            // cache missed or stale, grabbing new data
            utils.debug("Utils [async] (getJSON): Fetching JSON from " + url);
            response = await fetch(url, {
                method: 'GET',
                headers: custom_headers
            });
            json = await response.json();
            utils.debug("Utils (getJSON): Recieved JSON response");
            utils.debug(json);
            utils.cache_set(key, json, "local");
            return json;
        }
    }
}