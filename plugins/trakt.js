trakt = {
    metadata_xml: null,
    server: null,

    init: function (metadata_xml, type, server) {
        trakt.server = server;

        if ((type === "show") || (type === "movie") || (type === "episode") || (type === "season")) {
            utils.debug("Trakt Plugin (init): Processing Show/Movie...");
            trakt.processTarget(type, metadata_xml);
        }
        else {
            utils.debug("Trakt Plugin (init): Unknown Type... (Type: " + type + ")");
        }
    },

    processTarget: async (type, metadata_xml) => {
        var site = "imdb";
        utils.debug("Trakt Plugin [async] (processTarget): Lauching TMDB API (Site: " + site + ") (Type: " + type + ")");
        if (type === "episode") {
            var imdb_id = await tmdb_api.getId(site, type, metadata_xml, true);
        }
        else {
            var imdb_id = await tmdb_api.getId(site, type, metadata_xml);
        }
        utils.debug("Trakt Plugin [async] (processTarget): TMDB API returned the following IMDB ID (" + imdb_id + ")");
        if (type === "show") {
            var base_url = "http://trakt.tv/shows/";
            var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("year");
            var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("title");
        }
        else if (type == "season") {
            var base_url = "http://trakt.tv/shows/";
            var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("parentYear");
            var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("parentTitle");
            var directory_metadata = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0];
            var season_num = directory_metadata.getAttribute("index");
        }
        else if (type == "episode") {
            var base_url = "http://trakt.tv/shows/";
            var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("grandparentYear");
            var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("grandparentTitle");
            var directory_metadata = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0];
            var season_num = directory_metadata.getAttribute("parentIndex");
            var episode_num = directory_metadata.getAttribute("index");
        }
        else if (type === "movie") {
            var base_url = "http://trakt.tv/movies/";
            var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("year");
            var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("title");
        }
        if (imdb_id) {
            api_id = imdb_id;
            if (type === "season") {
                var url = base_url + imdb_id + "/seasons/" + season_num;
            }
            else if (type === "episode") {
                var url = base_url + imdb_id + "/seasons/" + season_num + "/episodes/" + episode_num;
            }
            else {
                var url = base_url + imdb_id;
            }

        }
        else {
            utils.debug("Trakt Plugin [async] (processTarget): IMDB ID not found, falling back to show name");
            utils.debug("Trakt Plugin [async] (processTarget): Got title - " + title);

            trakt_id = await trakt_api.getTraktId(type, metadata_xml);
            if (trakt_id) {
                api_id = trakt_id;
                if (type === "season") {
                    var url = base_url + trakt_id + "/seasons/" + season_num;
                }
                else if (type === "episode") {
                    var url = base_url + trakt_id + "/seasons/" + season_num + "/episodes/" + episode_num;
                }
                else {
                    var url = base_url + trakt_id;
                }
            }
            else {
                var base_url = "https://trakt.tv/search/?query=";
                if (year) {
                    var minYear = year - 1;
                    var maxYear = year - 1;
                    var url = base_url + title + "&years=" + minYear + "-" + maxYear;
                }
                else {
                    var url = base_url + title;
                }
            }
        }
        utils.debug("Trakt Plugin [async] (processTarget): Building link using - " + url);
        trakt.insertTraktInfo(url, type);
    },

    constructTraktLink: function (trakt_url) {
        var logo_url = utils.getResourcePath("trakt/trakt_logo.png");
        var trakt_container_element = document.createElement("span");
        var trakt_link_element = document.createElement("a");
        trakt_container_element.style.backgroundColor = "transparent";
        trakt_container_element.setAttribute("id", "trakt-container");
        trakt_container_element.classList.add("ep_container");

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

    insertTraktInfo: async (url, type) => {
        trakt_exists = document.getElementById("trakt-container");
        if (trakt_exists) {
            utils.debug("Trakt Plugin [async] (insertTraktInfo): Trakt already present on page. Skipping.");
        }
        else {
            // create trakt link element
            var trakt_container = trakt.constructTraktLink(url);
            // insert trakt link element to bottom of metadata container
            utils.debug("Trakt Plugin [async] (insertTraktInfo): Inserting trakt container into page");
            document.getElementById("ep_links").appendChild(trakt_container);
            parent_box = document.getElementById("ep_infobox");

            if ((type === "show") || (type === "movie")) {
                extras = await trakt_api.getInfo(api_id, type);
                if (extras.homepage) {
                    var homepage = document.createElement("p");
                    homepage.innerHTML = "<b>Homepage:</b> <a href='" + extras.homepage + "' target='_blank'>" + extras.homepage + "</a>";
                    parent_box.appendChild(homepage);
                }
                if (extras.status) {
                    var status_raw = extras.status;
                    words = status_raw.split(" ");
                    for (let i = 0; i < words.length; i++) {
                        words[i] = words[i][0].toUpperCase() + words[i].substr(1);
                    }
                    status_text = words.join(" ");
                    if (status_text == "Canceled") {
                        status_text = "Cancelled";
                    }
                    current_status = document.createElement("p");
                    current_status.innerHTML = "<b>Status:</b> " + status_text;
                    parent_box.appendChild(current_status);
                }
                if (extras.runtime) {
                    var runtime = document.createElement("p");
                    runtime.innerHTML = "<b>Runtime:</b> " + extras.runtime + " minutes";
                    parent_box.appendChild(runtime);
                }
                if (extras.network) {
                    var network = document.createElement("p");
                    network.innerHTML = "<b>Network:</b> " + extras.network;
                    parent_box.appendChild(network);
                }
                if (extras.first_aired) {
                    var aired = document.createElement("p");
                    first_aired = new Date(extras.first_aired).toLocaleDateString();
                    aired.innerHTML = "<b>First Aired:</b> " + first_aired;
                    parent_box.appendChild(aired);
                }
                if (extras.released) {
                    var aired = document.createElement("p");
                    released = new Date(extras.released).toLocaleDateString();
                    aired.innerHTML = "<b>Released:</b> " + released;
                    parent_box.appendChild(aired);
                }
                if (extras.trailer) {
                    var trailer = document.createElement("p");
                    trailer.innerHTML = "<b>Trailer:</b> <a href='" + extras.trailer + "' target='_blank'>" + extras.trailer + "</a>";
                    parent_box.appendChild(trailer);
                }
            }
        }
    }
};