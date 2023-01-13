tvdb = {
    metadata_xml: null,

    init: function (metadata_xml, parent_element) {
        tvdb.insertTvdbLink(metadata_xml, parent_element);
    },

    constructTvdbLink: function (tvdb_id, parent_element) {
        var logo_url = utils.getResourcePath("tvdb/tvdb_logo.png");
        var tvdb_container_element = document.createElement("span");
        tvdb_container_element.setAttribute("id", "tvdb-container");
        template_check = parent_element.children[0].children[0].children[0]
        if (template_check) {
            tvdb_container_element.classList = template_check.classList
        }
        else {
            tvdb_container_element.classList = parent_element.children[0].classList
        }
        tvdb_container_element.style.backgroundColor = "transparent";

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

    insertTvdbLink: async (metadata_xml, parent_element) => {
        // insert tvdb link element to bottom of metadata container
        var type = "show";
        var site = "tvdb"
        utils.debug("TVDB Plugin: Lauching TMDB API (Site: " + site + ") (Type: " + type + ")");
        var tvdb_id = await tmdb_api.getId(site, type, metadata_xml);
        if (tvdb_id) {
            utils.debug("TVDB Plugin: TMDB API returned the following TVDB ID (" + tvdb_id + ")");
            var tvdb_link = tvdb.constructTvdbLink(tvdb_id, parent_element);
            utils.debug("TVDB Plugin: Inserting TVDB container into page");
            document.getElementById("Enhanced-Plex-Banner").appendChild(tvdb_link);
        }
        else {
            utils.debug("TVDB Plugin: TMDB API did not find the TVDB ID... Aborting.");
        }
    }
}