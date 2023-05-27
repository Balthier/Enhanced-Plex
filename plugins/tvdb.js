tvdb = {
    metadata_xml: null,

    init: function (metadata_xml) {
        tvdb.insertTvdbLink(metadata_xml);
    },

    constructTvdbLink: function (tvdb_id) {
        var logo_url = utils.getResourcePath("tvdb/tvdb_logo.png");
        var tvdb_container_element = document.createElement("span");
        tvdb_container_element.setAttribute("id", "tvdb-container");
        tvdb_container_element.style.backgroundColor = "transparent";
        tvdb_container_element.classList.add("ep_container");

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
        tvdb_exists = document.getElementById("tvdb-container");
        if (tvdb_exists) {
            utils.debug("TVDB Plugin [async] (insertTvdbLink): TVDB already present on page. Skipping.");
        }
        else {
            var type = "show";
            var site = "tvdb";
            utils.debug("TVDB Plugin [async] (insertTvdbLink): Lauching TMDB API (Site: " + site + ") (Type: " + type + ")");
            var tvdb_id = await tmdb_api.getId(site, type, metadata_xml);
            if (tvdb_id) {
                utils.debug("TVDB Plugin [async] (insertTvdbLink): TMDB API returned the following TVDB ID (" + tvdb_id + ")");
                var tvdb_link = tvdb.constructTvdbLink(tvdb_id);
                utils.debug("TVDB Plugin [async] (insertTvdbLink): Inserting TVDB container into page");
                document.getElementById("ep_links").appendChild(tvdb_link);
            }
            else {
                utils.debug("TVDB Plugin [async] (insertTvdbLink): TMDB API did not find the TVDB ID... Aborting.");
            }
        }
    }
};