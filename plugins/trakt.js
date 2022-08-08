trakt = {
    metadata_xml: null,
    server: null,

    init: function (metadata_xml, type, server) {
        trakt.server = server;

        if ((type === "show") || (type === "movie")) {
            utils.debug("Trakt Plugin: Processing Show/Movie...");
            trakt.processTarget(type, metadata_xml);
        }
        else if (type === "episode") {
            utils.debug("Trakt Plugin: Processing Episode...");
            trakt.processEpisode();
        }
        else {
            utils.debug("Trakt Plugin: Unknown Type... (Type: " + type + ")");
        }
    },

    processTarget: async (type, metadata_xml) => {
        var site = "imdb";
        utils.debug("Trakt Plugin: Lauching TMDB API (Site: " + site + ") (Type: " + type + ")");
        var imdb_id = await tmdb_api.getId(site, type, metadata_xml);
        utils.debug("Trakt Plugin: TMDB API returned the following IMDB ID (" + imdb_id + ")");
        if ((type === "show") || (type == "seasons")) {
            var base_url = "http://trakt.tv/shows/"
            var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("year");
            var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("title");
        }
        else if (type == "episodes") {
            var base_url = "http://trakt.tv/shows/"
            var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("parentYear");
            var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("parentTitle");
        }
        else if (type === "movie") {
            var base_url = "http://trakt.tv/movies/"
            var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("year");
            var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("title");
        }
        if (imdb_id) {
            var url = base_url + imdb_id;
        }
        else {
            utils.debug("Trakt Plugin: IMDB ID not found, falling back to show name");
            utils.debug("Trakt Plugin: Got title - " + title);

            trakt_id = await trakt_api.getTraktId(type, metadata_xml);
            if (trakt_id) {
                var url = base_url + trakt_id;
            }
            else {
                var base_url = "https://trakt.tv/search/?query="
                if (year) {
                    var minYear = year - 1
                    var maxYear = year - 1
                    var url = base_url + title + "&years=" + minYear + "-" + maxYear;
                }
                else {
                    var url = base_url + title
                }
            }
        }
        utils.debug("Trakt Plugin: Building link using - " + url);
        trakt.insertTraktLink(url);
    },

    constructTraktLink: function (trakt_url) {
        var logo_url = utils.getResourcePath("trakt/trakt_logo.png");
        var trakt_container_element = document.createElement("span");
        var trakt_link_element = document.createElement("a");

        trakt_container_element.setAttribute("id", "trakt-container");
        trakt_link_element.setAttribute("id", "trakt-link");
        trakt_link_element.setAttribute("href", trakt_url);
        trakt_link_element.setAttribute("target", "_blank");

        // construct logo
        var trakt_element_img = document.createElement("img");
        trakt_element_img.setAttribute("src", logo_url);
        trakt_element_img.setAttribute("height", "20px");

        trakt_link_element.appendChild(trakt_element_img);
        trakt_container_element.appendChild(trakt_link_element);

        return trakt_container_element;
    },

    insertTraktLink: function (url) {
        // create trakt link element
        var trakt_container = trakt.constructTraktLink(url);

        // insert trakt link element to bottom of metadata container
        utils.debug("Trakt Plugin: Inserting trakt container into page");
        //document.querySelectorAll("[class*=sprinkles_display_flex]")[2].appendChild(trakt_container);
        document.querySelectorAll("[data-testid*=preplay-thirdTitle]")[0].children[0].appendChild(trakt_container);
    }
}