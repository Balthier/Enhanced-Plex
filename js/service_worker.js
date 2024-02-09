importScripts('./utils.js');
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        chrome.tabs.create({ url: "/resources/extras/options.html" });
    }
    else if (details.reason === "update") {
        // When extension is updated
        chrome.tabs.create({ url: "/resources/extras/changelog.html" });
        version = utils.getExtensionVersion();
        if (version == "3.0.0") {
            utils.cache_purge("stats");
        }
    }
    else if (details.reason === "chrome_update") {
        // When browser is updated
    }
    else if (details.reason === "shared_module_update") {
        // When a shared module is updated
    }
});