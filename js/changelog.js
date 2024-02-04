title_element = document.getElementsByTagName("title")[0];
extension_version = utils.getExtensionVersion();
title_element.innerHTML = "EnhancedPLEX (" + extension_version + ") Changelog";

data = {
    Title: document.title,
    Location: document.location.pathname
};

google_api.sendTracking("page_view", data);