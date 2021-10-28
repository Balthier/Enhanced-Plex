tvdb = {
    metadata_xml: null,

    init: function (metadata_xml) {
        tvdb.insertTvdbLink(metadata_xml);
    },

    constructTvdbLink: function (tvdb_id) {
        var logo_url = utils.getResourcePath("tvdb/tvdb_logo.png");
        var sister_containers = document.querySelectorAll("[class*=sprinkles_display_flex]")[2].children;
        var container_element_template = sister_containers[0];
        var tvdb_container_element = document.createElement("span");
        tvdb_container_element.setAttribute("id", "tvdb-container");
        tvdb_container_element.setAttribute("class", container_element_template.getAttribute("class"));

        // Set the class of the last element
        var last_sister = sister_containers[sister_containers.length - 1];
        last_sister.setAttribute("class", container_element_template.getAttribute("class"));

        // construct link
        var tvdb_element_link = document.createElement("a");
        tvdb_element_link.setAttribute("href", "http://thetvdb.com/?tab=series&id=" + tvdb_id);
        tvdb_element_link.setAttribute("target", "_blank");

        // construct logo
        var tvdb_element_img = document.createElement("img");
        tvdb_element_img.setAttribute("src", logo_url);
        tvdb_element_img.setAttribute("height", "20px");

        tvdb_element_link.appendChild(tvdb_element_img);
        tvdb_container_element.appendChild(tvdb_element_link);

        return tvdb_container_element;
    },

    insertTvdbLink: async (metadata_xml) => {
        // insert tvdb link element to bottom of metadata container
        var type = "show";
        var site = "tvdb"
        utils.debug("TVDB Plugin: Lauching TMDB API (Site: " + site + ") (Type: " + type + ")");
        var tvdb_id = await tmdb_api.getId(site, type, metadata_xml);
        if (tvdb_id) {
            utils.debug("TVDB Plugin: TMDB API returned the following TVDB ID (" + tvdb_id + ")");
            var tvdb_link = tvdb.constructTvdbLink(tvdb_id);
            utils.debug("TVDB Plugin: Inserting TVDB container into page");
            document.querySelectorAll("[class*=sprinkles_display_flex]")[2].appendChild(tvdb_link);
        }
        else {
            utils.debug("TVDB Plugin: TMDB API did not find the TVDB ID... Aborting.");
        }
    }
}