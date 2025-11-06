imdb = {
	init: function (TraktData) {
		imdb.insertImdbLink(TraktData);
	},
	insertImdbLink: function (TraktData) {
		const imdb_exists = document.getElementById("imdb-container");
		if (imdb_exists) {
			utils.debug("IMDB Plugin (insertImdbLink): IMDB already present on page. Skipping.");
		}
		else {
			const imdb_id = TraktData.IDs.IMDB;
			if (imdb_id) {
				utils.debug("IMDB Plugin (insertImdbLink): TMDB API returned the following IMDB ID (" + imdb_id + ")");
				const IMDB_URL = "http://www.imdb.com/title/" + imdb_id;
				// create imdb link element
				const logo_url = utils.getResourcePath("imdb/imdb_logo.png");
				const imdb_container = document.createElement("span");
				imdb_container.setAttribute("id", "imdb-container");
				imdb_container.style.backgroundColor = "transparent";
				imdb_container.classList.add("ep_container");
				// construct link
				const imdb_element_link = document.createElement("a");
				imdb_element_link.setAttribute("id", "imdb-link");
				imdb_element_link.setAttribute("href", IMDB_URL);
				imdb_element_link.setAttribute("target", "_blank");

				// construct logo
				const imdb_element_img = document.createElement("img");
				imdb_element_img.setAttribute("src", logo_url);
				imdb_element_img.setAttribute("height", "20px");

				imdb_element_link.appendChild(imdb_element_img);
				imdb_container.appendChild(imdb_element_link);

				// insert imdb link element to bottom of metadata container
				utils.debug("IMDB Plugin (insertImdbLink): Inserting IMDB container into page");
				document.getElementById("ep_links").appendChild(imdb_container);
			}
			else {
				utils.debug("IMDB Plugin (insertImdbLink): No IMDB ID found");
			}
		}
	}
};