tvdb = {
	init: function (TraktData) {
		tvdb.insertTvdbLink(TraktData);
	},

	insertTvdbLink: function (TraktData) {
		const tvdb_exists = document.getElementById("tvdb-container");
		if (tvdb_exists) {
			utils.debug("TVDB Plugin (insertTvdbLink): TVDB already present on page. Skipping.");
		}
		else {
			const tvdb_id = TraktData.IDs.TVDB;
			if (tvdb_id) {
				utils.debug("TVDB Plugin (insertTvdbLink): TMDB API returned the following TVDB ID (" + tvdb_id + ")");
				const logo_url = utils.getResourcePath("tvdb/tvdb_logo.png");
				const tvdb_container = document.createElement("span");
				tvdb_container.setAttribute("id", "tvdb-container");
				tvdb_container.style.backgroundColor = "transparent";
				tvdb_container.classList.add("ep_container");

				// construct link
				const tvdb_element_link = document.createElement("a");
				tvdb_element_link.setAttribute("href", "https://thetvdb.com/?tab=series&id=" + tvdb_id);
				tvdb_element_link.setAttribute("target", "_blank");

				// construct logo
				const tvdb_element_img = document.createElement("img");
				tvdb_element_img.setAttribute("src", logo_url);
				tvdb_element_img.setAttribute("height", "20px");

				tvdb_element_link.appendChild(tvdb_element_img);
				tvdb_container.appendChild(tvdb_element_link);

				utils.debug("TVDB Plugin (insertTvdbLink): Inserting TVDB container into page");
				document.getElementById("ep_links").appendChild(tvdb_container);
			}
			else {
				utils.debug("TVDB Plugin (insertTvdbLink): TMDB API did not find the TVDB ID... Aborting.");
			}
		}
	}
};