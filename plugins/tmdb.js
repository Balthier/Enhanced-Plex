tmdb = {
    metadata_xml: null,

    init: function (metadata_xml) {
        tmdb.insertTmdbLink(metadata_xml);
    },

    constructTmdbLink: function (tmdb_id) {
        var sister_containers = document.querySelectorAll("[class*=sprinkles_display_flex]")[2].children;
        var container_element_template = sister_containers[0];
        var logo_url = utils.getResourcePath("tmdb/tmdb_logo.svg");
        var tmdb_container_element = document.createElement("span");
        tmdb_container_element.setAttribute("id", "tmdb-container");
        tmdb_container_element.setAttribute("class", container_element_template.getAttribute("class"));

        // Set the class of the last element
        var last_sister = sister_containers[sister_containers.length - 1];
        last_sister.setAttribute("class", container_element_template.getAttribute("class"));

        // construct link
        var tmdb_element_link = document.createElement("a");
        tmdb_element_link.setAttribute("id", "tmdb-link");
        tmdb_element_link.setAttribute("href", "https://www.themoviedb.org/movie/" + tmdb_id);
        tmdb_element_link.setAttribute("target", "_blank");

        // construct logo
        var tmdb_element_img = document.createElement("img");
        tmdb_element_img.setAttribute("src", logo_url);
        tmdb_element_img.setAttribute("height", "20px");

        tmdb_element_link.appendChild(tmdb_element_img);
        tmdb_container_element.appendChild(tmdb_element_link);

        return tmdb_container_element;
    },

    insertTmdbLink: async (metadata_xml) => {
        var type = "movie";
        var site = "tmdb"
        utils.debug("TMDB Plugin: Lauching TMDB API (Site: " + site + ") (Type: " + type + ")");
        var tmdb_id = await tmdb_api.getId(site, type, metadata_xml);
        utils.debug("TMDB Plugin: TMDB API returned the following TMDB ID (" + tmdb_id + ")");
        // insert themoviedb link element to bottom of metadata container
        var tmdb_container = tmdb.constructTmdbLink(tmdb_id);
        utils.debug("TMDB plugin: Inserting tmdb container into page");
        document.querySelectorAll("[class*=sprinkles_display_flex]")[2].appendChild(tmdb_container);
    }
}