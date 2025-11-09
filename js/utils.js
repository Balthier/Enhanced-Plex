utils = {
	debug: async (output) => {
		const version = await utils.getExtensionInfo("version");
		const debug_cache = await chrome.storage.sync.get("options_debug") || {};
		const debug_unfiltered_cache = await chrome.storage.sync.get("options_debug_unfiltered") || {};
		const debug = debug_cache["options_debug"];
		const debug_unfiltered = debug_unfiltered_cache["options_debug_unfiltered"];
		if (debug === true) {
			if (typeof output === "string") {
				if (debug_unfiltered === false) {
					if (typeof global_plex_token != "undefined") {
						output = output.replace(global_plex_token, "XXXXXXXXXXXXXXXXXXXX");
					}
					if (typeof localStorage["myPlexAccessToken"] != "undefined") {
						output = output.replace(localStorage["myPlexAccessToken"], "XXXXXXXXXXXXXXXXXXXX");
					}
					output = output.replace(/X-Plex-Token=[\w\d]{20}/, "X-Plex-Token=XXXXXXXXXXXXXXXXXXXX");
					output = output.replace(/\d+\.\d+\.\d+\.\d+/, "XXX.XXX.X.XX");
					output = output.replace(/https\:\/\/\d+\-\d+\-\d+\-\d+/, "https://XXX-XXX-XXX-XXX");
				}
				const date = new Date();
				const hours = ("0" + date.getHours()).slice(-2);
				const minutes = ("0" + date.getMinutes()).slice(-2);
				const seconds = ("0" + date.getSeconds()).slice(-2);
				const milliseconds = ("0" + date.getMilliseconds()).slice(-2);
				const now = hours + ":" + minutes + ":" + seconds + "." + milliseconds;
				console.log("[" + now + "] EnhancedPLEX (" + version + ") Debug: " + output);
			}
			else {
				// don't filter xml, use nodeType attribute to detect
				if (debug_unfiltered === false && !("nodeType" in output)) {
					// clone object so we can filter out values
					const output_ = { ...output };

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

	getExtensionInfo: function (attribute) {
		const info = chrome.runtime.getManifest()[attribute];
		return info;
	},

	getOptionsURL: function () {
		const options_url = chrome.runtime.getURL("resources/extras/options.html");
		return options_url;
	},

	getStatsURL: function () {
		const stats_url = chrome.runtime.getURL("resources/extras/stats.html");
		return stats_url;
	},

	cache_purge: async (category) => {
		const types = ["sync", "local"];

		for (const type of types) {
			let command;
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
			const data = await command.get(null);
			utils.debug("Utils [async] (cache_purge): Checking " + type + " storage...");

			const keysToRemove = [];

			for (const data_key in data) {
				let shouldRemove = false;

				if (category) {
					if (category == "stats") {
						if (data_key.match(/^cache\-time\-stats.+/g) || data_key.match(/^stats.+/g)) {
							shouldRemove = true;
						}
					} else if (category == "options") {
						if (data_key.match(/^cache\-time\-options.+/g) || data_key.match(/^options.+/g)) {
							shouldRemove = true;
						}
					}

					if (shouldRemove) {
						keysToRemove.push(data_key);
					}
				} else {
					if (data_key.match(/^cache\-time\-.+/g)) {
						if (!(data_key.match(/^cache\-time\-options.+/g) || data_key.match(/^cache\-time\-stats.+/g))) {
							keysToRemove.push(data_key);
							const key = data_key.replace("cache-time-", "");
							keysToRemove.push(key);
						}
					} else if (!(data_key.match(/^options.+/g) || data_key.match(/^stats.+/g))) {
						keysToRemove.push(data_key);
					}
				}
			}
			if (keysToRemove.length > 0) {
				utils.debug(`Utils [async] (cache_purge): Batch removing ${keysToRemove.length} entries from ${type} storage.`);
				await command.remove(keysToRemove);
			}
		}
	},

	cache_get: async (rawkey, type) => {
		const key = rawkey.replace(/[^A-Za-z0-9_]/g, "_");
		const storageMap = {
			"sync": chrome.storage.sync,
			"local": chrome.storage.local
		};
		const command = storageMap[type];

		if (!command) {
			utils.debug(`Utils [async] (cache_get): [${key}] - Invalid type selected: ${type}. Aborting...`);
			return undefined;
		}
		utils.debug("Utils [async] (cache_get): [" + key + "] - Retrieving from storage...");
		const cache_key = `cache-time-${key}`;
		const expire_data = await command.get(cache_key) || {};
		const timestamp = expire_data[cache_key];
		if (timestamp) {
			const time_now = new Date().getTime();
			const time_diff = time_now - timestamp;
			let expireTime;
			if (key == "sessionId") {
				expireTime = 1800000;
			}
			else {
				expireTime = 604800000;
			}
			if (key.match(/^options\_.+/g) || key.match(/^stats\_.+/g)) {

			}
			else if (time_diff > expireTime) {
				utils.debug("Utils [async] (cache_get): [" + key + "] - Found stale data, removing from " + type + " storage");
				await command.remove(cache_key);
				await command.remove(key);
			}
		}
		const response = await command.get(key) || {};
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

	cache_set: async (rawkey, value, type) => {
		const key = rawkey.replace(/[^A-Za-z0-9_]/g, "_");
		const storageMap = {
			"sync": chrome.storage.sync,
			"local": chrome.storage.local
		};
		const command = storageMap[type];

		if (!command) {
			utils.debug(`Utils [async] (cache_set): [${key}] - Invalid type selected: ${type}. Aborting...`);
			return undefined;
		}


		utils.debug("Utils [async] (cache_set): [" + key + "] - Committing to cache in " + type + " storage with the value of: ");

		const object = {};
		object[key] = value;

		utils.debug(object);

		await command.set(object);
		const cache_key = "cache-time-" + key;
		const time_now = new Date().getTime();
		utils.debug("Utils [async] (cache_set): [" + key + "] - Setting cache timestamp in " + type + " storage: " + cache_key);
		const cache_data = {};
		cache_data[cache_key] = time_now;
		utils.debug(cache_data);
		await command.set(cache_data);

	},

	getResourcePath: function (resource) {
		return chrome.runtime.getURL("resources/" + resource);
	},

	getApiKey: async (api_name) => {
		const file_path = utils.getResourcePath("api_keys/" + api_name + ".txt");
		const response = await fetch(file_path);
		const text = await response.text();
		utils.debug("Utils [async] (getApiKey): Returning API Key for: " + api_name);
		return text;
	},

	getXML: async (url) => {
		utils.debug("Utils [async] (getXML): Fetching XML from " + url);
		const response = await fetch(url);
		const text = await response.text();
		const parser = new DOMParser();
		const xml = parser.parseFromString(text, "application/xml");
		utils.debug("Utils [async] (getXML): Recieved XML response " + url);
		utils.debug(xml);
		return xml;
	},

	getBGRequest: async (message) => {
		return new Promise((resolve, reject) => {
			chrome.runtime.sendMessage(message, (response) => {
				console.log(response.data);
				if (chrome.runtime.lastError) {
					return reject(chrome.runtime.lastError);
				}
				if (!response) {
					return reject(new Error("Service Worker sent no response object."));
				}
				if (response.error) {
					return reject(new Error(response.error));
				}
				resolve(response.data);
			});
		});
	},

	getJSON: async (api_url, api_custom_headers, service, dimensions) => {
		let url = api_url;
		let custom_headers = api_custom_headers;
		utils.debug("Utils [async] (getJSON): Checking for JSON Cache for " + url);
		let key = "json-cache-" + url;
		let searchkey = key.replace(/[^A-Za-z0-9_]/g, "_");
		let cacheCheck = await utils.cache_get(searchkey, "local") || {};
		let response;
		if (Object.keys(cacheCheck).length) {
			let data = {
				service: service,
				target: "cache"
			};

			google_api.sendTracking("API", data, dimensions);

			utils.debug("Utils [async] (getJSON): Cache found for " + url);

			return cacheCheck;
		}
		else {
			// cache missed or stale, grabbing new data
			let data = {
				service: service,
				target: "live"
			};

			google_api.sendTracking("API", data, dimensions);

			utils.debug("Utils [async] (getJSON): Fetching JSON from " + url);
			try {
				if (custom_headers) {
					response = await fetch(url, {
						method: 'GET',
						headers: custom_headers
					});
				}
				else {
					response = await fetch(url, {
						method: 'GET'
					});
				}
				let json = await response.json();
				utils.debug("Utils (getJSON): Recieved JSON response");
				utils.debug(json);
				utils.cache_set(key, json, "local");
				return json;
			}
			catch (error) {
				utils.debug("Utils[async](getJSON): Error: " + error);
				return null;
			}
		}
	},

	getServerAddresses: async (plex_token, https) => {
		utils.debug("Utils[async] (getServerAddresses): Checking cache for rr_servers");
		const cache_data = await utils.cache_get("rr_servers", "sync") || {};
		let server_addresses;
		if (Object.keys(cache_data).length) {
			server_addresses = cache_data;
		}
		else {
			utils.debug("Utils[async] (getServerAddresses): Getting Servers from Plex");
			const requests_url = "https://plex.tv/pms/resources?includeHttps=1&X-Plex-Token=" + plex_token;
			const servers_xml = await utils.getXML(requests_url) || {};
			let server_addresses;
			if (Object.keys(servers_xml).length) {
				const devices = servers_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Device");
				server_addresses = {};
				for (const device of devices) {
					const serverCheck = device.getAttribute("provides");
					if (serverCheck.includes("server")) {
						const plex_name = device.getAttribute("name");
						const access_token = device.getAttribute("accessToken");
						const connections = device.getElementsByTagName("Connection");
						for (const connection of connections) {
							const protocol = connection.getAttribute("protocol");
							const serverIsHttps = protocol.includes("https");
							const localattr = connection.getAttribute("local");
							const machine_identifier = device.getAttribute("clientIdentifier");
							let name;
							let uri;
							let test;
							if (localattr == true) {
								name = device.getAttribute("clientIdentifier") + "_local";
								uri = "https://" + connection.getAttribute("address") + ":" + connection.getAttribute("port");
							}
							else {
								name = device.getAttribute("clientIdentifier");
								uri = connection.getAttribute("uri");
							}
							try {
								if (https && serverIsHttps) {
									test = await utils.getXML(uri + "?X-Plex-Token=" + access_token) || {};
								}
								else if (!https) {
									test = await utils.getXML(uri + "?X-Plex-Token=" + access_token) || {};
								}
								else {
									utils.debug("Utils [async] (getServerAddresses) {" + uri + "}: Protocol mismatch. Both client and server must be using the same security (http/https)");
									test = {};
								}
							}
							catch {
								if (localattr) {
									utils.debug("Utils [async] (getServerAddresses) {" + uri + "}: Failed to connect locally via HTTPS. Trying Plex Proxy.");
									try {
										uri = connection.getAttribute("uri");
										test = await utils.getXML(uri + "?X-Plex-Token=" + access_token) || {};
									}
									catch {
										if (!https) {
											utils.debug("Utils [async]  (getServerAddresses) {" + uri + "}: Failed to connect via Plex Proxy. Trying local HTTP");
											uri = "http://" + connection.getAttribute("address") + ":" + connection.getAttribute("port");
											try {
												test = await utils.getXML(uri + "?X-Plex-Token=" + access_token) || {};
											}
											catch {
												utils.debug("Utils [async] (getServerAddresses) {" + uri + "}: Failed to connect via HTTP.");
											}
										}
										else {
											utils.debug("Utils [async] (getServerAddresses) {" + uri + "}: Skipping HTTP check, as client is using HTTPS");
											test = {};
										}
									}
								}
								else {
									test = {};
								}
							}
							if (Object.keys(test).length) {
								utils.debug("Utils [async]  (getServerAddresses) {" + uri + "}: Connection success... Adding to list.. (" + uri + ")");
								server_addresses[name] = {
									"name": plex_name,
									"machine_identifier": machine_identifier,
									"access_token": access_token,
									"uri": uri
								};
							}
							else {
								utils.debug("Utils [async]  (getServerAddresses) {" + uri + "}: Could not get a response from the connection... Aborting.");
							}
						}
					}
				}
				await utils.cache_set("rr_servers", server_addresses, "sync");
			}
		}
		utils.debug("Utils [async] (getServerAddresses): Server Addresses collected..");
		utils.debug(server_addresses);
		return server_addresses;
	},

	convertISOtoStd: function (isoDateString) {
		const dateObject = new Date(isoDateString);

		// 1. Get UTC components
		const year = dateObject.getUTCFullYear();
		// Month is 0-indexed (0 = Jan, 9 = Oct), so add 1
		const month = dateObject.getUTCMonth() + 1;
		const day = dateObject.getUTCDate();

		// 2. Pad single digits with a leading zero
		const formattedMonth = String(month).padStart(2, '0');
		const formattedDay = String(day).padStart(2, '0');

		// 3. Combine into the desired format
		const formattedDate = `${year}-${formattedMonth}-${formattedDay}`;
		return formattedDate;
	}
};