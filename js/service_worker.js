// Cross-browser compatibility
if (typeof browser === "undefined") {
	var browser = chrome;
}

// Handle script imports for cross-browser compatibility
if (typeof importScripts !== 'undefined') {
	// Chrome service worker context
	importScripts('../apis/google_api.js');
	importScripts('./utils.js');
} else {
	// Firefox context - scripts should be loaded via manifest
}

browser.runtime.onInstalled.addListener(async function (details) {
	if (details.reason === "install") {
		browser.tabs.create({ url: "/resources/extras/options.html" });
	}
	else if (details.reason === "update") {
		// When extension is updated
		const changelog_pop = await utils.cache_get("options_changelog_pop", "sync") || {};
		if (changelog_pop == true) {
			browser.tabs.create({ url: "/resources/extras/changelog.html" });
		}
		const version = await utils.getExtensionInfo("version");
		if (version == "3.0.0") {
			utils.cache_purge("stats");
		}
		else if (version == "3.4.2") {
			console.log("Checking for old values");
			browser.storage.sync.get(null, (items) => {
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

				browser.storage.sync.set(fixedItems, () => {
					if (browser.runtime.lastError) {
						console.error("Error saving corrected data:", browser.runtime.lastError);
						return;
					}
					console.log("Original items:", items);
					console.log("Corrected items:", fixedItems);
				});
			});
		}
	}
});

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
	// Handle Firefox vs Chrome parameter order differences
	// Chrome: (message, sender, sendResponse)
	// Firefox: (message, sendResponse, sender)
	if (typeof sender !== 'object') {
		// Firefox case: sender is actually sendResponse
		const temp = sendResponse;
		sendResponse = sender;
		sender = temp;
	}

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