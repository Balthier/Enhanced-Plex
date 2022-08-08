trakt_api = {
    setTraktHeaders: async () => {
        utils.debug("Trakt API: Retrieving Trakt API Key...");
        var trakt_key = await utils.getApiKey("trakt")
        var retry = 0
        while (trakt_key == null) {
            retry++
            if (retry < 10) {
                utils.debug("Trakt API: Trakt API Key not returned yet...[" + retry + "]");
            }
            else {
                utils.debug("Trakt API: Could not set Trakt API Key... Aborting.");
                return
            }
        }
        custom_headers = {
            'Content-Type': 'application/json',
            'trakt-api-version': '2',
            'trakt-api-key': trakt_key
        }
        return custom_headers
    },

    getTraktId: async (type, metadata_xml) => {
        var custom_headers = await trakt_api.setTraktHeaders();
        if (custom_headers) {
            if ((type === "show") || (type == "seasons")) {
                var category = "show";
                var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("year");
                var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("title");
            }
            else if (type == "episodes") {
                var category = "show";
                var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("parentYear");
                var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("parentTitle");
            }
            else if (type === "movie") {
                var category = "movie";
                var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("year");
                var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("title");
            }
            var api_url = "https://api.trakt.tv/search?type=" + category + "&year=" + year + "&query=" + encodeURIComponent(title);
            response = await fetch(api_url, {
                method: 'GET',
                headers: custom_headers
            });
            json = await response.json();
            try {
                utils.debug("Trakt API: Received Trakt ID (" + trakt_id + ")");
                trakt_id = json[0].show.ids.trakt
            }
            catch {
                utils.debug("Trakt API: Unable to find Trakt ID");
                return
            }
            if (trakt_id) {
                utils.debug("Trakt API: Returning Trakt ID to calling function - " + trakt_id);
                return trakt_id;
            }
            else {

            }
        }
        else {
            utils.debug("Trakt API: Could not set Trakt headers... Aborting.");
        }
    },

    getAllMissing: async (show_name, type, season_num) => {
        var custom_headers = await trakt_api.setTraktHeaders();
        if (custom_headers) {
            if (type == "episodes") {
                var api_url = "https://api.trakt.tv/shows/" + encodeURIComponent(show_name) + "/seasons/" + season_num;
            }
            else if (type == "seasons") {
                var api_url = "https://api.trakt.tv/shows/" + encodeURIComponent(show_name) + "/seasons?extended=episodes";
            }
            else {
                utils.debug("Trakt API: No type selected. Aborting...");
                return
            }
            var data = await utils.getJSON(api_url, custom_headers) || {};
            if (Object.keys(data).length) {
                return data;
            }
            else {
                utils.debug("Trakt API: No data received.")
            }
        }
        else {
            utils.debug("Trakt API: Could not set Trakt headers... Aborting.");
        }
    },
}