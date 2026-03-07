function saveOption(name, value) {
	const option = "options_" + name;
	utils.debug("Options: Setting " + option + " to " + value);
	utils.cache_set(option, value, "sync");
}

async function restoreOptions() {
	const options = Array.from(document.getElementsByClassName('option')).map(element => element.id);
	for (const option of options) {
		const option_name = "options_" + option;
		utils.debug("Options [async] (restoreOptions): Retrieving cache for " + option_name);

		let value = await utils.cache_get(option_name, "sync");
		if (value === undefined || value === null) {
			if (option == "debug" || option == "debug_unfiltered") {
				utils.debug("Options [async] (restoreOptions): No cache found. Setting option to disabled by default");
				value = false;
			} else if (option.includes("_key") || option.includes("_url")) {
				utils.debug("Options [async] (restoreOptions): No cache found. Setting option to unset by default");
				value = "";
			} else {
				utils.debug("Options [async] (restoreOptions): No cache found. Setting option to enabled by default");
				value = true;
			}
			await utils.cache_set(option_name, value, "sync");
		} else {
			utils.debug("Options [async] (restoreOptions): Cache found. Value: " + value + ", Type: " + typeof value);
		}
		if (typeof value === 'boolean') {
			const onOff = value ? "on" : "off";
			const id = option + "_" + onOff;

			utils.debug("Options [async] (restoreOptions): Setting the HTML element on " + id);

			const radio_button = document.getElementById(id);
			if (radio_button) {
				radio_button.checked = true;
			} else {
				utils.debug(`Options[async] (restoreOptions): Warning: Radio element not found for ID: ${id}`);
			}

		} else if (typeof value === 'string') {
			const textfield = document.querySelector(`input#${option}`) || document.querySelector(`textarea#${option}`);

			if (textfield) {
				textfield.value = value;
			} else {
				utils.debug(`Options[async] (restoreOptions): Warning: Text field element not found for ID: ${option}`);
			}
		}
	}
	refreshExtraOptions();
}

function refreshExtraOptions() {
	const debug_extra_options = document.getElementById("debug_unfiltered");
	const sonarr_url = document.getElementById("sonarr-extra");
	const radarr_url = document.getElementById("radarr-extra");

	if (document.getElementById("debug_on") && document.getElementById("debug_on").checked) {
		debug_extra_options.style.display = "block";
	} else {
		debug_extra_options.style.display = "none";
	}

	if (document.getElementById("sonarr_api_on") && document.getElementById("sonarr_api_on").checked) {
		sonarr_url.style.display = "block";
	} else {
		sonarr_url.style.display = "none";
	}

	if (document.getElementById("radarr_api_on") && document.getElementById("radarr_api_on").checked) {
		radarr_url.style.display = "block";
	} else {
		radarr_url.style.display = "none";
	}
}

async function main() {
	utils.debug("Options [async] Options: Restoring options.");
	await restoreOptions();

	// add click listener on all inputs to automatically save changes
	const input_elements = document.getElementsByTagName('input');
	for (const element of input_elements) {
		if (element.type === "url") {
			element.addEventListener("change", function (e) {
				if (e.target.checkValidity()) {
					const raw_value = e.target.value;
					e.target.style.border = "1px solid #E69533";

					const value = raw_value.replace(/\/$/, "");
					e.target.value = value;

					const element_name = this.name;
					saveOption(element_name, value);
				}
				else {
					e.target.style.border = "3px solid red";
				}
			});
		}
		else if (element.type === "text") {
			element.addEventListener("change", function (e) {
				const value = e.target.value;
				const element_name = this.name;
				saveOption(element_name, value);
			});
		}
		else if (element.type === "radio") {
			element.addEventListener("click", function () {
				const element_id = this.id;
				let value;
				if (element_id.match(/on$/g)) {
					value = true;
				}
				else if (element_id.match(/off$/g)) {
					value = false;
				}
				const element_name = this.name;
				saveOption(element_name, value);
				refreshExtraOptions();
			});
		}
	}
	const txtarea_elements = document.getElementsByTagName('textarea');
	for (const element of txtarea_elements) {
		element.addEventListener("change", function (e) {
			const value = e.target.value;
			const element_name = this.name;
			saveOption(element_name, value);
		});
	}

	const cache_element = document.getElementById("clear-cache");
	cache_element.addEventListener("click", function (e) {
		this.textContent = "Cleared";
		utils.cache_purge();

		const button = this;
		setTimeout(function () {
			button.textContent = "Clear cache";
		}, 1500);
	});

	const version_element = document.getElementById("ext_version");
	const title_element = document.getElementsByTagName("title")[0];
	const extension_version = utils.getExtensionInfo("version");
	title_element.textContent = "EnhancedPLEX (" + extension_version + ") options";
	version_element.textContent = "Version: v" + extension_version;

	const data = {
		Title: document.title,
		Location: document.location.pathname
	};

	google_api.sendTracking("page_view", data);
};

document.addEventListener('DOMContentLoaded', function () {
	if (typeof main === 'function') {
		main();
	} else {
		console.error("Initialization failed: 'main' function is missing.");
	}
});