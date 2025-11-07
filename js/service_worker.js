importScripts('../apis/google_api.js');
importScripts('./utils.js');
chrome.runtime.onInstalled.addListener(async function (details) {
	if (details.reason === "install") {
		chrome.tabs.create({ url: "/resources/extras/options.html" });
	}
	else if (details.reason === "update") {
		// When extension is updated
		const changelog_pop = await utils.cache_get("options_changelog_pop", "sync") || {};
		if (changelog_pop == true) {
			chrome.tabs.create({ url: "/resources/extras/changelog.html" });
		}
		const version = await utils.getExtensionInfo("version");
		if (version == "3.0.0") {
			utils.cache_purge("stats");
		}
		else if (version == "3.4.0") {
			console.log("Checking for old values");
			chrome.storage.sync.get(null, (items) => {
				if (!items || typeof items !== 'object') {
					console.error("Storage data not found or invalid.");
					return;
				}
				const fixedItems = Object.fromEntries(
					Object.entries(items).map(([key, value]) => [
						key,
						(typeof value === 'string' && (value === 'true' || value === 'false'))
							? JSON.parse(value)
							: value
					])
				);

				console.log("Original items:", items);
				console.log("Corrected items:", fixedItems);
			});
		}
	}
	else if (details.reason === "chrome_update") {
		// When browser is updated
	}
	else if (details.reason === "shared_module_update") {
		// When a shared module is updated
	}
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "fetchData") {
		(async () => {
			try {
				const url = message.url;
				const headers = message.custom_headers || {};
				const service = message.service;
				const dimensions = message.dimensions;
				const data = await utils.getJSON(url, headers, service, dimensions);
				sendResponse({ data: data });

			} catch (error) {
				console.error("Service Worker Fetch Error:", error);
				sendResponse({ error: error.message || "An unknown error occurred during fetch." });
			}
		})();
		return true;
	}
});