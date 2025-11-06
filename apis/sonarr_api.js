sonarr_api = {
	setHeaders: async () => {
		utils.debug("Sonarr API [async] (setHeaders): Retrieving Sonarr API Key...");
		const sonarr_key = await utils.cache_get("options_sonarr_api_key", "sync");
		const custom_headers = {
			'accept': 'application/json',
			'Content-Type': 'application/json',
			'X-Api-Key': sonarr_key,
		};
		return custom_headers;
	},
	getSeriesURL: async (TraktData) => {
		const tvdb_id = TraktData.IDs.TVDB;
		const base_url = await utils.cache_get("options_sonarr_api_url", "sync");
		const custom_headers = await sonarr_api.setHeaders();
		if (tvdb_id) {
			utils.debug("Sonarr API [async] (getSeriesURL): TMDB API returned the following TVDB ID (" + tvdb_id + ")");
			const api_url = base_url + "/api/v3/series?tvdbid=" + tvdb_id;
			const dimensions = Math.round((window.screen.width * window.devicePixelRatio)) + "x" + Math.round((window.screen.height * window.devicePixelRatio));
			const api_data = await utils.getBGRequest({
				action: "fetchData",
				url: api_url,
				custom_headers: custom_headers,
				service: "Sonarr_API",
				dimensions: dimensions
			});
			if (api_data) {
				const sonarr_titleSlug = api_data[0].titleSlug;
				if (sonarr_titleSlug) {
					const SonarrURL = base_url + "/series/" + sonarr_titleSlug;
					utils.debug("Sonarr API [async] (getSeriesURL): returning URL - " + SonarrURL);
					return SonarrURL;
				}
			}
		}
		else {
			utils.debug("Sonarr API [async] (getSeriesURL): Could not find the TVDB ID... Aborting.");
			return null;
		}
	}
};