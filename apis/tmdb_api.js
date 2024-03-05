tmdb_api = {
	getTmdbId: async (type, tmdb_key, tmdb_name, metadata_xml) => {
		utils.debug("TMDB API [async] (getTmdbId): Setting Category, Title, and Year");
		if (type == "movie") {
			category = "movie";
			var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("year");
			var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("title");
		}
		else if (type == "show") {
			category = "tv";
			var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("year");
			var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("title");
		}
		else if (type == "season") {
			category = "tv";
			var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("parentYear");
			var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("parentTitle");
		}
		else if (type == "episode") {
			category = "tv";
			var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("grandparentYear");
			var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("grandparentTitle");
		}
		utils.debug("TMDB API [async] (getTmdbId): Attempting search via TMDB using Category (" + category + ") Title (" + title + ") and Year (" + year + ")");
		api_url = "https://api.themoviedb.org/3/search/" + category + "?language=en-US&page=1&include_adult=false&query=" + title + "&first_air_date_year=" + year + "&api_key=" + tmdb_key;
		utils.debug("TMDB API [async] (getTmdbId): Connecting to endpoint " + api_url);
		json = await utils.getJSON(api_url, null, "TMDB_API");
		utils.debug("JSON ID: " + json.results[0].id);
		try {
			var tmdb_id = json.results[0].id;
		}
		catch {
			utils.debug("TMDB API [async] (getTmdbId): Unable to find TMDB ID");
			return;
		}
		if (tmdb_id) {
			utils.debug("TMDB API [async] (getTmdbId): Returning TMDB ID to calling function - " + tmdb_id);
			utils.cache_set(tmdb_name, tmdb_id, "local");
			return tmdb_id;
		}
		else {

		}
	},

	getId: async (site, type, metadata_xml, skip_meta) => {
		if (metadata_xml) {
			if (!skip_meta) {
				var tmdbelement = metadata_xml.querySelectorAll('[id^="tmdb"]')[0];
				var tvdbelement = metadata_xml.querySelectorAll('[id^="tvdb"]')[0];
				var imdbelement = metadata_xml.querySelectorAll('[id^="imdb"]')[0];
			}
			if (type == "movie") {
				var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("title");
				utils.debug("TMDB API [async] (getId): Setting Movie Title to: " + title);
			}
			else if (type == "show") {
				var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("title");
				utils.debug("TMDB API [async] (getId): Setting Show Title to: " + title);
			}
			else if (type == "season") {
				var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("parentTitle");
				utils.debug("TMDB API [async] (getId): Setting Season Title to: " + title);
			}
			else if (type == "episode") {
				var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0].getAttribute("grandparentTitle");
				utils.debug("TMDB API [async] (getId): Setting Episode Title to: " + title);
			}
			title = title.replace(" ", "_");
			tmdb_name = title + "_tmdb_id";
			tvdb_name = title + "_tvdb_id";
			imdb_name = title + "_imdb_id";
		}
		if (site == "tmdb") {
			if (tmdbelement) {
				utils.debug("TMDB API [async] (getId): Checking metadata for TMDB ID");
				tmdbid_check = tmdbelement.parentNode.parentNode.tagName;
				if (tmdbid_check == "MediaContainer") {
					tmdb_id = tmdbelement.id.replace("tmdb://", "");
					utils.debug("TMDB API [async] (getId): TMDB ID found in metadata: " + tmdb_id);
					utils.cache_set(tmdb_name, tmdb_id, "local");
					return tmdb_id;
				}
				else {
					utils.debug("TMDB API [async] (getId): TMDB ID not found in metadata");
				}
			}
			else {
				cache_data = await utils.cache_get(tmdb_name, "local") || {};
				if (Object.keys(cache_data).length) {
					tmdb_id = cache_data;
					utils.debug("TMDB API [async] (getId): TMDB ID found in cached data: " + tmdb_id);
					return tmdb_id;
				}
			}
		}
		else if (site == "tvdb") {
			if (tvdbelement) {
				utils.debug("TMDB API [async] (getId): Checking metadata for TVDB ID");
				tvdbid_check = tvdbelement.parentNode.parentNode.tagName;
				if (tvdbid_check == "MediaContainer") {
					tvdb_id = tvdbelement.id.replace("tvdb://", "");
					utils.debug("TMDB API [async] (getId): TVDB ID found in metadata: " + tvdb_id);
					utils.cache_set(tvdb_name, tvdb_id, "local");
					return tvdb_id;
				}
				else {
					utils.debug("TMDB API [async] (getId): TVDB ID not found in metadata");
				}
			}
			else {
				cache_data = await utils.cache_get(tvdb_name, "local") || {};
				if (Object.keys(cache_data).length) {
					tvdb_id = cache_data;
					utils.debug("TMDB API [async] (getId): TVDB ID found in cached data: " + tvdb_id);
					return tvdb_id;
				}
			}
		}
		else if (site == "imdb") {
			if (imdbelement) {
				utils.debug("TMDB API [async] (getId): Checking metadata for IMDB ID");
				imdbid_check = imdbelement.parentNode.parentNode.tagName;
				if (imdbid_check == "MediaContainer") {
					imdb_id = imdbelement.id.replace("imdb://", "");
					utils.debug("TMDB API [async] (getId): IMDB ID found in metadata: " + imdb_id);
					utils.cache_set(imdb_name, imdb_id, "local");
					return imdb_id;
				}
				else {
					utils.debug("TMDB API [async] (getId): IMDB ID not found in metadata");
				}
			}
			else {
				imdb_cache_data = await utils.cache_get(imdb_name, "local") || {};
				if (Object.keys(imdb_cache_data).length) {
					imdb_id = imdb_cache_data;
					utils.debug("TMDB API [async] (getId): IMDB ID found in cached data: " + imdb_id);
					return imdb_id;
				}
			}
		}
		utils.debug("TMDB API [async] (getId): Retrieving TMDB API Key...");
		var tmdb_key = await utils.getApiKey("tmdb");
		var retry = 0;
		while (tmdb_key == null) {
			retry++;
			if (retry < 10) {
				utils.debug("TMDB API [async] (getId): TMDB API Key not returned yet...[" + retry + "]");
			}
			else {
				utils.debug("TMDB API [async] (getId): Could not set TMDB API Key... Aborting.");
				return;
			}
		}
		cache_data = await utils.cache_get(tmdb_name, "local") || {};
		if (Object.keys(cache_data).length) {
			tmdb_id = cache_data;
			utils.debug("TMDB API [async] (getId): TMDB ID found in cached data: " + tmdb_id);
		}
		if (!tmdb_id) {
			utils.debug("TMDB API [async] (getId): Using TMDB API Key - (Key: " + tmdb_key + ")");
			var tmdb_id = await tmdb_api.getTmdbId(type, tmdb_key, tmdb_name, metadata_xml);
		}

		if (tmdb_id) {
			utils.debug("TMDB API [async] (getId): Recieved TMDB ID - " + tmdb_id);
			if (type == "movie") {
				base_url = "https://api.themoviedb.org/3/movie/";
			}
			else if ((type == "show") || (type == "season") || (type == "episode")) {
				base_url = "https://api.themoviedb.org/3/tv/";

			}
			var api_url = base_url + tmdb_id + "/external_ids?api_key=" + tmdb_key;
			utils.debug("TMDB API [async] (getId): Connecting to endpoint " + api_url);
			json = await utils.getJSON(api_url, null, "TMDB_API");
			if (site == "imdb") {
				var imdb_id = json.imdb_id;
				if (imdb_id) {
					utils.debug("TMDB API [async] (getId): IMDB ID found - " + imdb_id);
					utils.cache_set(imdb_name, imdb_id, "local");
					return imdb_id;
				}
				else {
					utils.debug("TMDB API [async] (getId): IMDB ID not found... Aborting...");
				}
			}
			else if (site == "tvdb") {
				var tvdb_id = json.tvdb_id;
				if (tvdb_id) {
					utils.debug("TMDB API [async] (getId): TVDB ID found - " + tvdb_id);
					utils.cache_set(tvdb_name, tvdb_id, "local");
					return tvdb_id;
				}
				else {
					utils.debug("TMDB API [async] (getId): TVDB ID not found... Aborting...");
				}
			}
			else if (site == "tmdb") {
				var tmdb_id = json.id;
				if (tmdb_id) {
					utils.debug("TMDB API [async] (getId): TMDB ID found - " + tmdb_id);
					utils.cache_set(tmdb_name, tmdb_id, "local");
					return tmdb_id;
				}
				else {
					utils.debug("TMDB API [async] (getId): TMDB ID not found... Aborting...");
				}
			}
			else {
				utils.debug("TMDB API [async] (getId): Unrecognised Site: " + site + "... Aborting...");
			}
		}
		else {
			utils.debug("TMDB API [async] (getId): TMDB ID not found... Aborting...");
		}
	}
};