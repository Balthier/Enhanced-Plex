trakt_api = {
    setTraktHeaders: async () => {
        utils.debug("Trakt API [async] (setTraktHeaders): Retrieving Trakt API Key...");
        var trakt_key = await utils.getApiKey("trakt");
        var retry = 0;
        while (trakt_key == null) {
            retry++;
            if (retry < 10) {
                utils.debug("Trakt API [async] (setTraktHeaders): Trakt API Key not returned yet...[" + retry + "]");
            }
            else {
                utils.debug("Trakt API [async] (setTraktHeaders): Could not set Trakt API Key... Aborting.");
                return;
            }
        }
        custom_headers = {
            'Content-Type': 'application/json',
            'trakt-api-version': '2',
            'trakt-api-key': trakt_key
        };
        return custom_headers;
    },

    getInfo: async (show_name, type) => {
        var custom_headers = await trakt_api.setTraktHeaders();
        if (custom_headers) {
            if ((type === "show") || (type == "season") || (type == "episode")) {
                var api_url = "https://api.trakt.tv/shows/" + encodeURIComponent(show_name) + "/?extended=full";
            }
            else if (type === "movie") {
                var api_url = "https://api.trakt.tv/movies/" + encodeURIComponent(show_name) + "/?extended=full";
            }
            else {
                utils.debug("Trakt API [async] (getShowInfo): No type received.");
            }
            var data = await utils.getJSON(api_url, custom_headers, "Trakt_API") || {};
            if (Object.keys(data).length) {
                return data;
            }
            else {
                utils.debug("Trakt API [async] (getShowInfo): No data received.");
            }
        }
        else {
            utils.debug("Trakt API [async] (getShowInfo): Could not set Trakt headers... Aborting.");
        }
    },

    getTraktId: async (type, metadata_xml) => {
        utils.debug("Trakt API [async] (getTraktId): Setting custom Trakt headers");
        var custom_headers = await trakt_api.setTraktHeaders();
        if (custom_headers) {
            utils.debug("Trakt API [async] (getTraktId): Fetching title and year");
            if ((type === "show") || (type == "season")) {
                var metadata_root = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0];
            }
            else {
                var metadata_root = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0];
            }
            if (type === "show") {
                var category = "show";
                var year = metadata_root.getAttribute("year");
                var title = metadata_root.getAttribute("title");
            }
            else if (type == "season") {
                category = "show";
                var year = metadata_root.getAttribute("parentYear");
                var title = metadata_root.getAttribute("parentTitle");
            }
            else if (type == "episode") {
                var category = "show";
                var year = metadata_root.getAttribute("grandparentYear") || metadata_root.getAttribute("year");
                var title = metadata_root.getAttribute("grandparentTitle");
            }
            else if (type === "movie") {
                var category = "movie";
                var year = metadata_root.getAttribute("year");
                var title = metadata_root.getAttribute("title");
            }
            cache_title = title.replace(" ", "_");
            trakt_name = cache_title + "_trakt_id";
            utils.debug("Trakt API [async] (getTraktId): Checking cache for: " + cache_title);
            cache_data = await utils.cache_get(trakt_name, "local") || "";
            if (cache_data.toString().length) {
                trakt_id = cache_data;
                utils.debug("Trakt API [async] (getTraktId): Trakt ID found in cached data: " + trakt_id);
                return trakt_id;
            }

            var api_url = "https://api.trakt.tv/search?type=" + category + "&year=" + year + "&query=" + encodeURIComponent(title);
            utils.debug("Trakt API [async] (getTraktId): Searching Trakt API using endpoint: " + api_url);
            json = await utils.getJSON(api_url, custom_headers, "Trakt_API");
            try {
                trakt_id = json[0].show.ids.trakt;
                utils.debug("Trakt API [async] (getTraktId): Received Trakt ID (" + trakt_id + ")");
                utils.cache_set(trakt_name, trakt_id, "local");
            }
            catch {
                utils.debug("Trakt API [async] (getTraktId): Unable to find Trakt ID");
                return;
            }
            if (trakt_id) {
                utils.debug("Trakt API [async] (getTraktId): Returning Trakt ID to calling function - " + trakt_id);
                return trakt_id;
            }
            else {

            }
        }
        else {
            utils.debug("Trakt API [async] (getTraktId): Could not set Trakt headers... Aborting.");
        }
    },

    getAllMissing: async (show_name, type, season_num) => {
        var custom_headers = await trakt_api.setTraktHeaders();
        if (custom_headers) {
            if (type == "episode") {
                var api_url = "https://api.trakt.tv/shows/" + encodeURIComponent(show_name) + "/seasons/" + season_num;
            }
            else if (type == "season") {
                var api_url = "https://api.trakt.tv/shows/" + encodeURIComponent(show_name) + "/seasons?extended=episodes";
            }
            else {
                utils.debug("Trakt API [async] (getAllMissing): No type selected. Aborting...");
                return;
            }
            var data = await utils.getJSON(api_url, custom_headers, "Trakt_API") || {};
            if (Object.keys(data).length) {
                return data;
            }
            else {
                utils.debug("Trakt API [async] (getAllMissing): No data received.");
            }
        }
        else {
            utils.debug("Trakt API [async] (getAllMissing): Could not set Trakt headers... Aborting.");
        }
    },
};