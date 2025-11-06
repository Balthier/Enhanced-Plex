sonarr = {
	init: function (TraktData) {
		sonarr.insertLink(TraktData);
	},

	insertLink: async (TraktData) => {
		const sonarr_exists = document.getElementById("sonarr-container");
		if (sonarr_exists) {
			utils.debug("Sonarr Plugin [async] (insertLink): Sonarr already present on page. Skipping.");
		}
		else {
			const SonarrURL = await sonarr_api.getSeriesURL(TraktData);
			utils.debug("Sonarr Plugin [async] (insertLink): Sonarr API returned the following URL (" + SonarrURL + ")");

			const logo_url = utils.getResourcePath("sonarr/sonarr_logo.png");
			const sonarr_container = document.createElement("span");
			sonarr_container.setAttribute("id", "sonarr-container");
			sonarr_container.classList.add("ep_container");

			// construct link
			const sonarr_element_link = document.createElement("a");
			sonarr_element_link.setAttribute("id", "sonarr-link");
			sonarr_element_link.setAttribute("href", SonarrURL);
			sonarr_element_link.setAttribute("target", "_blank");
			sonarr_container.style.backgroundColor = "transparent";

			// construct logo
			const sonarr_element_img = document.createElement("img");
			sonarr_element_img.setAttribute("src", logo_url);
			sonarr_element_img.setAttribute("height", "20px");

			sonarr_element_link.appendChild(sonarr_element_img);
			sonarr_container.appendChild(sonarr_element_link);
			utils.debug("Sonarr Plugin [async] (insertLink): Inserting Sonarr container into page");
			document.getElementById("ep_links").appendChild(sonarr_container);
		}
	}
};