chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason === "install") {
        chrome.tabs.create({ url: "/resources/extras/options.html" });
    } else if (details.reason === "update") {
        // When extension is updated
    } else if (details.reason === "chrome_update") {
        // When browser is updated
    } else if (details.reason === "shared_module_update") {
        // When a shared module is updated
    }
});