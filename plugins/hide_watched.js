hide_watched = {
	init: function () {
		hide_watched.insertSwitch();
		hide_watched.findWatched();
	},

	insertSwitch: function () {
		if (document.getElementById("watched-switch")) {
			utils.debug("hide watched plugin: element already exists. Skipping");
			return;
		}
		button_template = document.body.querySelectorAll("[class*=ActionButton-iconActionButton-]")[0];
		action_bar = document.body.querySelectorAll("[class*=PrePlayActionBar-container]")[0];
		var switch_container = document.createElement("button");
		switch_container.setAttribute("id", "watched-switch");
		switch_container.setAttribute("data-state", "show");
		switch_container.setAttribute("data-original-title", "Hide watched episodes/seasons");
		switch_container.addEventListener("click", hide_watched.switchState, false);

		var glyph = document.createElement("i");
		glyph.setAttribute("class", "glyphicon eye-open");

		switch_container.appendChild(glyph);
		// insert switch before secondary actions dropdown
		document.getElementById("stats-page-link").parentElement.prepend(switch_container);


	},

	findWatched: function (watch_nodes) {
		var main = document.querySelectorAll('[data-qa-id^="hubTitle"]')
		var i
		for (i = 0; i < main.length; i++) {
			if (main[i].innerText == "Recently Added Movies" || main[i].innerText == "Recently Added TV") {
				var previousBtn = main[i].parentElement.parentElement.querySelectorAll('[aria-label^="Previous page"]')[0]
				previousBtn.addEventListener("click", hide_watched.findWatched, false);
				var recent_add = main[i].parentElement.parentElement.querySelectorAll('[data-qa-id^="cellItem"]');
				for (j = 0; j < recent_add.length; j++) {
					if (!j) {
						recent_add[j].style.marginLeft = "50px";
					}
					recent_add[j].style.position = "relative";
					recent_add[j].style.float = "left";
					recent_add[j].style.marginRight = "30px";
					recent_add[j].style.marginBottom = "20px";
					recent_add[j].style.transform = "";
					var watch_status = recent_add[j].querySelector("[class^=MetadataPosterCard-legacyUnwatchedTagMask]");
					if (!watch_status) {
						var overlay = document.createElement("div");
						recent_add[j].prepend(overlay);
						overlay.setAttribute("class", "watched-container");
						container_child = recent_add[j].childNodes;
						for (k = 0; k <= container_child.length + 1; k++) {
							overlay.append(container_child[1]);
						}
					}
				}
			}
		}
	},

	switchState: function () {
		var watched_switch = document.getElementById("watched-switch");
		var glyph = watched_switch.getElementsByTagName("i")[0];
		var state = watched_switch.getAttribute("data-state");

		var watched_episodes = document.getElementsByClassName("watched-container");
		for (var i = 0; i < watched_episodes.length; i++) {
			if (state === "show") {
				watched_episodes[i].style.display = "none";
			}
			else {
				watched_episodes[i].style.display = "block";
			}
		}

		if (state === "show") {
			glyph.setAttribute("class", "glyphicon eye-close");
			watched_switch.setAttribute("data-state", "hide");
			watched_switch.setAttribute("data-original-title", "Show watched items");
		}
		else {
			glyph.setAttribute("class", "glyphicon eye-open");
			watched_switch.setAttribute("data-state", "show");
			watched_switch.setAttribute("data-original-title", "Hide watched items");
		}
	}
}