sonarr = {
    metadata_xml: null,

    init: function (metadata_xml, server, type) {
        sonarr.insertLink(metadata_xml);
    },

    constructLink: function (url) {
        var logo_url = utils.getResourcePath("sonarr/sonarr_logo.png");
        var sonarr_container_element = document.createElement("span");
        sonarr_container_element.setAttribute("id", "sonarr-container");
        sonarr_container_element.classList.add("ep_container");

        // construct link
        var sonarr_element_link = document.createElement("a");
        sonarr_element_link.setAttribute("id", "sonarr-link");
        sonarr_element_link.setAttribute("href", url);
        sonarr_element_link.setAttribute("target", "_blank");
        sonarr_container_element.style.backgroundColor = "transparent";

        // construct logo
        var sonarr_element_img = document.createElement("img");
        sonarr_element_img.setAttribute("src", logo_url);
        sonarr_element_img.setAttribute("height", "20px");

        sonarr_element_link.appendChild(sonarr_element_img);
        sonarr_container_element.appendChild(sonarr_element_link);

        return sonarr_container_element;
    },

    insertLink: async (metadata_xml) => {
        sonarr_exists = document.getElementById("sonarr-container");
        if (sonarr_exists) {
            utils.debug("Sonarr Plugin [async] (insertLink): Sonarr already present on page. Skipping.");
        }
        else {
            var type = "movie";
            var site = "sonarr";
            utils.debug("Sonarr Plugin [async] (insertLink): Lauching Sonarr API (Site: " + site + ") (Type: " + type + ")");
            var url = await sonarr_api.getSeriesURL(metadata_xml);
            utils.debug("Sonarr Plugin [async] (insertLink): Sonarr API returned the following URL (" + url + ")");
            // insert themoviedb link element to bottom of metadata container
            var sonarr_container = sonarr.constructLink(url);
            utils.debug("Sonarr Plugin [async] (insertLink): Inserting Sonarr container into page");
            document.getElementById("ep_links").appendChild(sonarr_container);
        }
    }
};