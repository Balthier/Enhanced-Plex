title_element = document.getElementsByTagName("title")[0];
extension_version = utils.getExtensionInfo("version");
title_element.textContent = "EnhancedPLEX (" + extension_version + ") Changelog";

data = {
	Title: document.title,
	Location: document.location.pathname
};

google_api.sendTracking("page_view", data);