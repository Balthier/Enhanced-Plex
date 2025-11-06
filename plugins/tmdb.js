tmdb = {
	init: function (TraktData) {
		tmdb.insertTmdbLink(TraktData);
	},

	insertTmdbLink: function (TraktData) {
		const tmdb_exists = document.getElementById("tmdb-container");
		if (tmdb_exists) {
			utils.debug("TMDB Plugin (insertTmdbLink): TMDB already present on page. Skipping.");
		}
		else {
			const tmdb_id = TraktData.IDs.TMDB;
			if (tmdb_id) {
				utils.debug("TMDB Plugin (insertTmdbLink): TMDB API returned the following TMDB ID (" + tmdb_id + ")");
				// insert themoviedb link element to bottom of metadata container
				const logo_url = utils.getResourcePath("tmdb/tmdb_logo.svg");
				const tmdb_container = document.createElement("span");
				tmdb_container.setAttribute("id", "tmdb-container");
				tmdb_container.classList.add("ep_container");

				// construct link
				const tmdb_element_link = document.createElement("a");
				tmdb_element_link.setAttribute("id", "tmdb-link");
				tmdb_element_link.setAttribute("href", "https://www.themoviedb.org/movie/" + tmdb_id);
				tmdb_element_link.setAttribute("target", "_blank");
				tmdb_container.style.backgroundColor = "transparent";

				// construct logo
				const tmdb_element_img = document.createElement("img");
				tmdb_element_img.setAttribute("src", logo_url);
				tmdb_element_img.setAttribute("height", "20px");

				tmdb_element_link.appendChild(tmdb_element_img);
				tmdb_container.appendChild(tmdb_element_link);
				utils.debug("TMDB plugin (insertTmdbLink): Inserting tmdb container into page");
				document.getElementById("ep_links").appendChild(tmdb_container);
			}
			else {
				utils.debug("TMDB Plugin (insertTmdbLink): No TMDB ID found. Skipping.");
			}
		}
	}
};