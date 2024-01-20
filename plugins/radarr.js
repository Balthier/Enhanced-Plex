radarr = {
    metadata_xml: null,

    init: function (metadata_xml, server, type) {
        radarr.insertLink(metadata_xml);
    },

    constructLink: function (url) {
        var logo_url = utils.getResourcePath("radarr/radarr_logo.png");
        var radarr_container_element = document.createElement("span");
        radarr_container_element.setAttribute("id", "radarr-container");
        radarr_container_element.classList.add("ep_container");

        // construct link
        var radarr_element_link = document.createElement("a");
        radarr_element_link.setAttribute("id", "radarr-link");
        radarr_element_link.setAttribute("href", url);
        radarr_element_link.setAttribute("target", "_blank");
        radarr_container_element.style.backgroundColor = "transparent";

        // construct logo
        var radarr_element_img = document.createElement("img");
        radarr_element_img.setAttribute("src", logo_url);
        radarr_element_img.setAttribute("height", "20px");

        radarr_element_link.appendChild(radarr_element_img);
        radarr_container_element.appendChild(radarr_element_link);

        return radarr_container_element;
    },

    insertLink: async (metadata_xml) => {
        radarr_exists = document.getElementById("radarr-container");
        if (radarr_exists) {
            utils.debug("Radarr Plugin [async] (insertLink): Radarr already present on page. Skipping.");
        }
        else {
            var type = "movie";
            var site = "radarr";
            utils.debug("Radarr Plugin [async] (insertLink): Lauching Radarr API (Site: " + site + ") (Type: " + type + ")");
            var url = await radarr_api.getSeriesURL(metadata_xml);
            utils.debug("Radarr Plugin [async] (insertLink): Radarr API returned the following URL (" + url + ")");
            // insert themoviedb link element to bottom of metadata container
            var radarr_container = radarr.constructLink(url);
            utils.debug("Radarr Plugin [async] (insertLink): Inserting Radarr container into page");
            document.getElementById("ep_links").appendChild(radarr_container);
        }
    }
};