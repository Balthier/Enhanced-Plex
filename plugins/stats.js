stats = {
	init: function () {
		utils.debug("Stats plugin (init): Starting...");
		if (document.getElementById("stats-page-link")) {
			utils.debug("Stats plugin (init): Link already exists. Passing");
			return;
		}
		utils.debug("Stats plugin (init): Adding Stats Link");
		const buttoncontainer = document.getElementById("button-container");

		const stats_link = document.createElement("a");
		stats_link.setAttribute("id", "stats-page-link");
		stats_link.setAttribute("title", "EnhancedPLEX stats");
		stats_link.setAttribute("href", utils.getStatsURL());
		stats_link.setAttribute("target", "_blank");

		const stats_glyph = document.createElement("i");
		stats_glyph.setAttribute("class", "glyphicon charts");

		stats_link.appendChild(stats_glyph);
		const container = document.createElement("div");
		container.setAttribute("id", "stats-page-container");
		container.setAttribute("class", "nav-button");

		container.appendChild(stats_link);

		if (buttoncontainer) {
			buttoncontainer.append(container);
		} else {
			utils.debug("Stats plugin (init): Error - Could not find insertion point.");
		}
	}
};
