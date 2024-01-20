radarr_api = {
    setHeaders: async () => {
        utils.debug("Radarr API [async] (setHeaders): Retrieving Radarr API Key...");
        var radarr_key = await utils.cache_get("options_radarr_api_key", "sync");
        await utils.timer(200);
        var retry = 0;
        while (radarr_key == null) {
            retry++;
            if (retry < 10) {
                utils.debug("Radarr API [async] (setHeaders): Radarr API Key not returned yet...[" + retry + "]");
            }
            else {
                utils.debug("Radarr API [async] (setHeaders): Could not set Radarr API Key... Aborting.");
                return;
            }
            await utils.timer(200);
        }
        var custom_headers = {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Api-Key': radarr_key
        };
        utils.debug(custom_headers);
        return custom_headers;
    },
    getSeriesURL: async (metadata_xml) => {
        var type = "movie";
        var site = "tmdb";
        utils.debug("Radarr API [async] (getSeriesURL): Lauching TMDB API (Site: " + site + ") (Type: " + type + ")");
        var tmdb_id = await tmdb_api.getId(site, type, metadata_xml);
        var base_url = await utils.cache_get("options_radarr_api_url", "sync");
        var custom_headers = await radarr_api.setHeaders();
        await utils.timer(200);
        var retry = 0;
        while (tmdb_id == null || base_url == null || custom_headers == null) {
            retry++;
            if (retry < 10) {
                utils.debug("Radarr API [async] (getSeriesURL): Radarr URL components not returned yet...[" + retry + "]");
            }
            else {
                utils.debug("Radarr API [async] (getSeriesURL): Could not set Radarr URL components... Aborting.");
                return;
            }
            await utils.timer(200);
        }
        if (tmdb_id) {
            utils.debug("Radarr API [async] (getSeriesURL): TMDB API returned the following TVDB ID (" + tmdb_id + ")");
            var api_url = base_url + "/api/v3/movie?tmdbid=" + tmdb_id;
            var api_data = await utils.getJSON(api_url, custom_headers);
            var radarr_titleSlug = api_data[0].titleSlug;
            if (radarr_titleSlug) {
                var url = base_url + "/movie/" + radarr_titleSlug;
                utils.debug("Radarr API [async] (getSeriesURL): returning URL - " + url);
                return url;
            }
        }
        else {
            utils.debug("Radarr API [async] (getSeriesURL): Could not find the TVDB ID... Aborting.");
            return null;
        }
    }
};