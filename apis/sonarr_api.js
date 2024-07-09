sonarr_api = {
    setHeaders: async () => {
        utils.debug("Sonarr API [async] (setHeaders): Retrieving Sonarr API Key...");
        var sonarr_key = await utils.cache_get("options_sonarr_api_key", "sync");
        await utils.timer(200);
        var retry = 0;
        while (sonarr_key == null) {
            retry++;
            if (retry < 10) {
                utils.debug("Sonarr API [async] (setHeaders): Sonarr API Key not returned yet...[" + retry + "]");
            }
            else {
                utils.debug("Sonarr API [async] (setHeaders): Could not set Sonarr API Key... Aborting.");
                return;
            }
            await utils.timer(200);
        }
        var custom_headers = {
            'accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Api-Key': sonarr_key
        };
        return custom_headers;
    },
    getSeriesURL: async (metadata_xml) => {
        var type = "show";
        var site = "tvdb";
        utils.debug("Sonarr API [async] (getSeriesURL): Lauching TMDB API (Site: " + site + ") (Type: " + type + ")");
        var tvdb_id = await tmdb_api.getId(site, type, metadata_xml);
        var base_url = await utils.cache_get("options_sonarr_api_url", "sync");
        var custom_headers = await sonarr_api.setHeaders();
        await utils.timer(200);
        var retry = 0;
        while (tvdb_id == null || base_url == null || custom_headers == null) {
            retry++;
            if (retry < 10) {
                utils.debug("Sonarr API [async] (getSeriesURL): Sonarr URL components not returned yet...[" + retry + "]");
            }
            else {
                utils.debug("Sonarr API [async] (getSeriesURL): Could not set Sonarr URL components... Aborting.");
                return;
            }
            await utils.timer(200);
        }
        if (tvdb_id) {
            utils.debug("Sonarr API [async] (getSeriesURL): TMDB API returned the following TVDB ID (" + tvdb_id + ")");
            var api_url = base_url + "/api/v3/series?tvdbid=" + tvdb_id;
            var api_data = await utils.getJSON(api_url, custom_headers, "Sonarr_API");
            var sonarr_titleSlug = api_data[0].titleSlug;
            if (sonarr_titleSlug) {
                var url = base_url + "/series/" + sonarr_titleSlug;
                utils.debug("Sonarr API [async] (getSeriesURL): returning URL - " + url);
                return url;
            }
        }
        else {
            utils.debug("Sonarr API [async] (getSeriesURL): Could not find the TVDB ID... Aborting.");
            return null;
        }
    }
};