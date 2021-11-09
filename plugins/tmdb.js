tmdb = {
    metadata_xml: null,

    init: function (metadata_xml) {
        tmdb.metadata_xml = metadata_xml;

        tmdb.getTmdbId();
    },

    getTmdbId: async () => {
        utils.debug("tmdb plugin: Checking metadata for TMDB id");
        tmdbelement = imdb.metadata_xml.querySelectorAll('[id^="tmdb"]')[0];
        if (tmdbelement) {
            tmdbid_check = tmdbelement.parentNode.parentNode.tagName;
        }
        else {
            tmdbid_check = null;
        }
        if (tmdbid_check == "MediaContainer") {
            tmdb_id = tmdbelement.id.replace("tmdb://", "");
            utils.debug("tmdb plugin: tmdb id found - " + tmdb_id);
            tmdb.insertTmdbLink(tmdb_id);
        }
        else {
            movie_year = tvdb.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("year");
            movie_title = tvdb.metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("title");
            utils.debug("tmdb plugin: tmdb id not found. Attempting manual search. (" + movie_title + ") and year (" + movie_year + ")");
            var api_url = "https://api.themoviedb.org/3/search/movie?language=en-US&page=1&include_adult=false&query=" + movie_title + "&first_air_date_year=" + movie_year + "&api_key=" + tmdb_api.api_key;
            utils.debug("tmdb plugin: Connecting to endpoint" + api_url);
            response = await fetch(api_url);
            json = await response.json();
            var tmdb_id = await json.results[0].id;
            if (tmdb_id) {
                utils.debug("tmdb plugin: tmdb id found - " + tmdb_id);
                tmdb.insertTmdbLink(tmdb_id);
            }
        }
    },

    insertTmdbLink: function (tmdb_id) {
        // insert themoviedb link element to bottom of metadata container
        var tmdb_container = tmdb.constructTmdbLink(tmdb_id);
        utils.debug("tmdb plugin: Inserting tmdb container into page");
        document.querySelectorAll("[data-testid*=preplay-thirdTitle]")[0].children[0].appendChild(tmdb_container);
    },

    constructTmdbLink: function (tmdb_id) {
        var sister_containers = document.querySelectorAll("[data-testid*=preplay-thirdTitle]")[0].children[0].children;
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
    }
}