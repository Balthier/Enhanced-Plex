tmdb_api = {
	getTmdbId: async (type, tmdb_key, metadata_xml) => {
		utils.debug("TMDB API: Setting Category, Title, and Year");
		if (type == "movie") {
			category = "movie";
			var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("year");
			var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("title");
		}
		else if ((type == "show") || (type == "seasons")) {
			category = "tv";
			var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("year");
			var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("title");
		}
		else if (type == "episodes") {
			category = "tv";
			var year = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("parentYear");
			var title = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("parentTitle");
		}
		utils.debug("TMDB API: Attempting search via TMDB using Category (" + category + ") Title (" + title + ") and Year (" + year + ")");
		api_url = "https://api.themoviedb.org/3/search/" + category + "?language=en-US&page=1&include_adult=false&query=" + title + "&first_air_date_year=" + year + "&api_key=" + tmdb_key;
		utils.debug("TMDB API: Connecting to endpoint " + api_url);
		response = await fetch(api_url);
		json = await response.json();
		try {
			var tmdb_id = await json.results[0].id;
		}
		catch {
			utils.debug("TMDB API: Unable to find TMDB ID");
			return
		}
		if (tmdb_id) {
			utils.debug("TMDB API: Returning TMDB ID to calling function - " + tmdb_id);
			return tmdb_id;
		}
		else {

		}
	},

	getId: async (site, type, metadata_xml) => {
		if (metadata_xml) {
			var tmdbelement = metadata_xml.querySelectorAll('[id^="tmdb"]')[0];
			var tvdbelement = metadata_xml.querySelectorAll('[id^="tvdb"]')[0];
			var imdbelement = metadata_xml.querySelectorAll('[id^="imdb"]')[0];
		}
		if (site == "tmdb") {
			utils.debug("TMDB API: Checking metadata for TMDB ID");
			if (tmdbelement) {
				tmdbid_check = tmdbelement.parentNode.parentNode.tagName;
				if (tmdbid_check == "MediaContainer") {
					tmdb_id = tmdbelement.id.replace("tmdb://", "");
					utils.debug("TMDB API: TMDB ID found in metadata - " + tmdb_id);
					return tmdb_id;
				}
				else {
					utils.debug("TMDB API: TMDB ID not found in metadata");
				}
			}
		}
		else if (site == "tvdb") {
			utils.debug("TMDB API: Checking metadata for TVDB ID");
			if (tvdbelement) {
				tvdbid_check = tvdbelement.parentNode.parentNode.tagName;
				if (tvdbid_check == "MediaContainer") {
					tvdb_id = tvdbelement.id.replace("tvdb://", "");
					utils.debug("TMDB API: TVDB ID found in metadata - " + tvdb_id);
					return tvdb_id;
				}
				else {
					utils.debug("TMDB API: TVDB ID not found in metadata");
				}
			}
		}
		else if (site == "imdb") {
			utils.debug("TMDB API: Checking metadata for IMDB ID");
			if (imdbelement) {
				imdbid_check = imdbelement.parentNode.parentNode.tagName;
				if (imdbid_check == "MediaContainer") {
					imdb_id = imdbelement.id.replace("imdb://", "");
					utils.debug("TMDB API: IMDB ID found in metadata - " + imdb_id);
					return imdb_id;
				}
				else {
					utils.debug("TMDB API: IMDB ID not found in metadata");
				}
			}
		}
		utils.debug("TMDB API: Retrieving TMDB API Key...");
		var tmdb_key = await utils.getApiKey("tmdb");
		var retry = 0
		while (tmdb_key == null) {
			retry++
			if (retry < 10) {
				utils.debug("TMDB API: TMDB API Key not returned yet...[" + retry + "]");
			}
			else {
				utils.debug("TMDB API: Could not set TMDB API Key... Aborting.");
				return
			}
		}
		utils.debug("TMDB API: Using TMDB API Key - (Key: " + tmdb_key + ")");
		var tmdb_id = await tmdb_api.getTmdbId(type, tmdb_key, metadata_xml);
		utils.debug("TMDB API: Recieved TMDB ID - " + tmdb_id);

		if (tmdb_id) {
			if (type == "movie") {
				base_url = "https://api.themoviedb.org/3/movie/";
			}
			else if ((type == "show") || (type == "seasons") || (type == "episodes")) {
				base_url = "https://api.themoviedb.org/3/tv/";

			}
			var api_url = base_url + tmdb_id + "/external_ids?api_key=" + tmdb_key;
			utils.debug("TMDB API: Connecting to endpoint " + api_url);
			response = await fetch(api_url);
			json = await response.json();
			if (site == "imdb") {
				var imdb_id = json.imdb_id;
				if (imdb_id) {
					utils.debug("TMDB API: IMDB ID found - " + imdb_id);
					return imdb_id;
				}
				else {
					utils.debug("TMDB API: IMDB ID not found... Aborting...");
				}
			}
			else if (site == "tvdb") {
				var tvdb_id = json.tvdb_id;
				if (tvdb_id) {
					utils.debug("TMDB API: TVDB ID found - " + tvdb_id);
					return tvdb_id;
				}
				else {
					utils.debug("TMDB API: TVDB ID not found... Aborting...");
				}
			}
			else {
				utils.debug("TMDB API: Unrecognised Site... Aborting...");
			}
		}
		else {
			utils.debug("TMDB API: TMDB ID not found... Aborting...");
		}
	}
}