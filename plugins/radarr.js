radarr = {
	init: function (TraktData) {
		radarr.insertLink(TraktData);
	},
	insertLink: async (TraktData) => {
		const radarr_exists = document.getElementById("radarr-container");
		if (radarr_exists) {
			utils.debug("Radarr Plugin [async] (insertLink): Radarr already present on page. Skipping.");
		}
		else {
			const RadarrURL = await radarr_api.getSeriesURL(TraktData);
			utils.debug("Radarr Plugin [async] (insertLink): Radarr API returned the following URL (" + RadarrURL + ")");
			// insert themoviedb link element to bottom of metadata container

			const logo_url = utils.getResourcePath("radarr/radarr_logo.png");
			const radarr_container = document.createElement("span");
			radarr_container.setAttribute("id", "radarr-container");
			radarr_container.classList.add("ep_container");

			// construct link
			const radarr_element_link = document.createElement("a");
			radarr_element_link.setAttribute("id", "radarr-link");
			radarr_element_link.setAttribute("href", RadarrURL);
			radarr_element_link.setAttribute("target", "_blank");
			radarr_container.style.backgroundColor = "transparent";

			// construct logo
			const radarr_element_img = document.createElement("img");
			radarr_element_img.setAttribute("src", logo_url);
			radarr_element_img.setAttribute("height", "20px");

			radarr_element_link.appendChild(radarr_element_img);
			radarr_container.appendChild(radarr_element_link);

			utils.debug("Radarr Plugin [async] (insertLink): Inserting Radarr container into page");
			document.getElementById("ep_links").appendChild(radarr_container);
		}
	}
};