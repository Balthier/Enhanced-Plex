radarr_api = {
	setHeaders: async () => {
		utils.debug("Radarr API [async] (setHeaders): Retrieving Radarr API Key...");
		const radarr_key = await utils.cache_get("options_radarr_api_key", "sync");
		const custom_headers = {
			'accept': 'application/json',
			'Content-Type': 'application/json',
			'X-Api-Key': radarr_key
		};
		return custom_headers;
	},
	getSeriesURL: async (TraktData) => {
		const tmdb_id = TraktData.IDs.TMDB;
		if (tmdb_id) {
			utils.debug("Radarr API [async] (getSeriesURL): Using TMDB ID (" + tmdb_id + ")");
			const base_url = await utils.cache_get("options_radarr_api_url", "sync");
			const custom_headers = await radarr_api.setHeaders();
			const api_url = base_url + "/api/v3/movie?tmdbid=" + tmdb_id;
			const dimensions = Math.round((window.screen.width * window.devicePixelRatio)) + "x" + Math.round((window.screen.height * window.devicePixelRatio));
			const api_data = await utils.getBGRequest({
				action: "fetchData",
				url: api_url,
				custom_headers: custom_headers,
				service: "Radarr_API",
				dimensions: dimensions
			});
			if (api_data) {
				const radarr_titleSlug = api_data[0].titleSlug;
				if (radarr_titleSlug) {
					const RadarrURL = base_url + "/movie/" + radarr_titleSlug;
					utils.debug("Radarr API [async] (getSeriesURL): returning URL - " + RadarrURL);
					return RadarrURL;
				}
			}
		}
		else {
			utils.debug("Radarr API [async] (getSeriesURL): Could not find the TVDB ID... Aborting.");
			return null;
		}
	}
};