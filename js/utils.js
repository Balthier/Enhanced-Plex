utils = {
    debug: async (output) => {
        version = await utils.getExtensionVersion();
        debug_cache = await chrome.storage.sync.get("options_debug") || {};
        debug_unfiltered_cache = await chrome.storage.sync.get("options_debug_unfiltered") || {};
        debug = debug_cache["options_debug"];
        debug_unfiltered = debug_unfiltered_cache["options_debug_unfiltered"];
        if (debug === "true") {
            if (typeof output === "string") {
                if (debug_unfiltered === "false") {
                    if (typeof global_plex_token != "undefined") {
                        output = output.replace(global_plex_token, "XXXXXXXXXXXXXXXXXXXX");
                    }
                    output = output.replace(/X-Plex-Token=[\w\d]{20}/, "X-Plex-Token=XXXXXXXXXXXXXXXXXXXX");
                    output = output.replace(/\d+\.\d+\.\d+\.\d+/, "XXX.XXX.X.XX");
                }
                date = new Date();
                hours = ("0" + date.getHours()).slice(-2);
                minutes = ("0" + date.getMinutes()).slice(-2);
                seconds = ("0" + date.getSeconds()).slice(-2);
                milliseconds = ("0" + date.getMilliseconds()).slice(-2);
                now = hours + ":" + minutes + ":" + seconds + "." + milliseconds;
                console.log("[" + now + "] EnhancedPLEX (" + version + ") Debug: " + output);
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

    timer: ms => new Promise(res => setTimeout(res, ms)),

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

    storage_get_all: function (callback) {
        chrome.storage.sync.get(function (results) {
            global_settings = results;
            callback(results);
        });
    },

    cache_purge: async (category) => {
        types = ["sync", "local"];
        var i = 0;
        types.forEach(function (type) {
            if (type === "sync") {
                command = chrome.storage.sync;
            }
            else if (type === "local") {
                command = chrome.storage.local;
            }
            else {
                utils.debug("Utils [async] (cache_purge): WARNING! Unrecognised storage type: " + type);
                return;
            }
            command.get(null, function (data) {
                utils.debug("Utils [async] (cache_purge): Checking " + type + " storage...");
                for (var data_key in data) {
                    if (category) {
                        if (category == "stats") {
                            if (data_key.match(/^cache\-time\-stats.+/g) || data_key.match(/^stats.+/g)) {
                                utils.debug("Utils [async] (cache_purge): Removing the following entries from " + type + " storage");
                                command.remove(data_key);
                                utils.debug(data_key);
                            }
                        }
                        else if (category == "options") {
                            if (data_key.match(/^cache\-time\-options.+/g) || data_key.match(/^options.+/g)) {
                                utils.debug("Utils [async] (cache_purge): Removing the following entries from " + type + " storage");
                                command.remove(data_key);
                                utils.debug(data_key);
                            }
                        }
                    }
                    else {
                        if (data_key.match(/^cache\-time\-.+/g)) {
                            if (data_key.match(/^cache\-time\-options.+/g) || data_key.match(/^cache\-time\-stats.+/g)) {
                            }
                            else {
                                utils.debug("Utils [async] (cache_purge): Removing the following entries from " + type + " storage");
                                command.remove(data_key);
                                utils.debug(data_key);
                                var key = data_key.replace("cache-time-", "");
                                command.remove(key);
                                utils.debug(key);
                            }
                        }
                        else {
                            if (data_key.match(/^options.+/g) || data_key.match(/^stats.+/g)) {
                            }
                            else {
                                utils.debug("Utils [async] (cache_purge): Removing the following entries from " + type + " storage");
                                command.remove(data_key);
                                utils.debug(data_key);
                            }
                        }
                    }
                }
            });
        });
    },

    cache_get: async (key, type) => {
        var key = key.replace(/[^A-Za-z0-9_]/g, "_");
        if (type === "sync") {
            var command = chrome.storage.sync;
        }
        else if (type === "local") {
            var command = chrome.storage.local;
        }
        else {
            utils.debug("Utils [async] (cache_get): [" + key + "] - No type selected. Aborting...");
            return;
        }
        utils.debug("Utils [async] (cache_get): [" + key + "] - Retrieving from storage...");
        var cache_key = "cache-time-" + key;
        var expire_data = await command.get(cache_key) || {};
        if (Object.keys(expire_data).length) {
            var timestamp = Object.values(expire_data)[0];
            var time_now = new Date().getTime();
            var time_diff = time_now - timestamp;
            if (key == "sessionId") {
                expireTime = 1800000;
            }
            else {
                expireTime = 604800000;
            }
            if (time_diff > expireTime) {
                utils.debug("Utils [async] (cache_get): [" + key + "] - Found stale data, removing from " + type + " storage");
                command.remove(cache_key);
                command.remove(key);
            }
        }
        var response = await command.get(key) || {};
        //await utils.timer(200);
        if (Object.keys(response).length) {
            utils.debug("Utils [async] (cache_get):  [" + key + "] - Received the following response from " + type + " storage: ");
            utils.debug(response);
            utils.debug("Utils [async] (cache_get):  [" + key + "] - Returning the following to calling function:");
            utils.debug(response[key]);
            return response[key];
        }
        else {
            utils.debug("Utils [async] (cache_get):  [" + key + "] - No cache found in " + type + " storage");
            return;
        }
    },

    cache_set: async (key, value, type) => {
        if (type === "sync") {
            command = chrome.storage.sync;
        }
        else if (type === "local") {
            command = chrome.storage.local;
        }
        else {
            utils.debug("Utils [async] (cache_set): No type selected. Aborting...");
            return;
        }
        key = key.replace(/[^A-Za-z0-9_]/g, "_");
        utils.debug("Utils [async] (cache_set): [" + key + "] - Committing to cache in " + type + " storage with the value of: ");
        let object = {};
        object[key] = value;
        utils.debug(object);
        command.set(object);
        let cache_key = "cache-time-" + key;
        let time_now = new Date().getTime();
        utils.debug("Utils [async] (cache_set): [" + key + "] - Setting cache timestamp in " + type + " storage: " + cache_key);
        let cache_data = {};
        cache_data[cache_key] = time_now;
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
        key = "xml-cache-" + url;
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

    getJSON: async (api_url, api_custom_headers, service) => {
        let url = api_url;
        let custom_headers = api_custom_headers;
        utils.debug("Utils [async] (getJSON): Checking for JSON Cache for " + url);
        let key = "json-cache-" + url;
        let searchkey = key.replace(/[^A-Za-z0-9_]/g, "_");
        let cacheCheck = await utils.cache_get(searchkey, "local") || {};
        if (Object.keys(cacheCheck).length) {
            let data = {
                service: service,
                target: "cache"
            };

            google_api.sendTracking("API", data);

            utils.debug("Utils [async] (getJSON): Cache found for " + url);

            return cacheCheck;
        }
        else {
            // cache missed or stale, grabbing new data
            let data = {
                service: service,
                target: "live"
            };

            google_api.sendTracking("API", data);

            utils.debug("Utils [async] (getJSON): Fetching JSON from " + url);
            if (custom_headers) {
                var response = await fetch(url, {
                    method: 'GET',
                    headers: custom_headers
                });
            }
            else {
                var response = await fetch(url, {
                    method: 'GET'
                });
            }
            let json = await response.json();
            utils.debug("Utils (getJSON): Recieved JSON response");
            utils.debug(json);
            utils.cache_set(key, json, "local");
            return json;
        }
    }
};