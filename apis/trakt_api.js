trakt_api = {
	getSourceData: async (PlexData, Item_Type, ServerDetails) => {
		let MetaBase;
		let SearchType;
		let Item_Year;
		let Item_Name;
		if (Item_Type == "show") {
			MetaBase = PlexData.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0];
			SearchType = "show";

			Item_Year = MetaBase.getAttribute("year");
			Item_Name = MetaBase.getAttribute("title");
		}
		else if (Item_Type == "season") {
			MetaBase = PlexData.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0];
			SearchType = "show";

			Item_Year = MetaBase.getAttribute("parentYear");
			Item_Name = MetaBase.getAttribute("parentTitle");
		}
		else if (Item_Type == "episode") {
			MetaBase = PlexData.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0];
			SearchType = "show";
			const GrandparentKey = MetaBase.getAttribute("grandparentKey");
			const GrandparentURL = `${ServerDetails.uri}${GrandparentKey}?X-Plex-Token=${ServerDetails.access_token}`;
			const GrandparentData = await utils.getXML(GrandparentURL);
			Item_Year = GrandparentData.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("year");
			Item_Name = MetaBase.getAttribute("grandparentTitle");
		}
		else if (Item_Type == "movie") {
			MetaBase = PlexData.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video")[0];
			SearchType = "movie";

			Item_Year = MetaBase.getAttribute("year");
			Item_Name = MetaBase.getAttribute("title");
		}

		const Cache_Name = "TraktData_" + Item_Name;
		const Dimensions = Math.round((window.screen.width * window.devicePixelRatio)) + "x" + Math.round((window.screen.height * window.devicePixelRatio));
		const Cached_Data = await utils.cache_get(Cache_Name, "local");
		if (!Cached_Data) {
			const Trakt_Key = await utils.getApiKey("trakt");
			const TraktHeaders = {
				'Content-Type': 'application/json',
				'trakt-api-version': '2',
				'trakt-api-key': Trakt_Key
			};
			// Get Trakt Slug/ID
			const SearchURL = "https://api.trakt.tv/search?type=" + SearchType + "&year=" + Item_Year + "&fields=title&query=" + Item_Name;
			const SearchResponse = await utils.getBGRequest({
				action: "fetchData",
				url: SearchURL,
				custom_headers: TraktHeaders,
				service: "Trakt_API",
				dimensions: Dimensions
			});
			const SearchResult = SearchResponse[0] || null;
			const Item_TraktSlug = SearchResult[SearchType].ids.slug;
			const Item_TraktID = SearchResult[SearchType].ids.trakt;

			// Get Main Trakt Data
			const DataURL = "https://api.trakt.tv/" + SearchType + "s/" + Item_TraktSlug + "/?extended=full";
			const DataResponse = await utils.getBGRequest({
				action: "fetchData",
				url: DataURL,
				custom_headers: TraktHeaders,
				service: "Trakt_API",
				dimensions: Dimensions
			});

			const Item_IMDBID = DataResponse.ids.imdb;
			const Item_TMDBID = DataResponse.ids.tmdb;
			const Item_Homepage = DataResponse.homepage;
			const Item_Status = DataResponse.status;
			const Item_Runtime = DataResponse.runtime;
			const Item_Trailer = DataResponse.trailer;

			let DataContainer;
			if (SearchType == "show") {
				const Item_TVDBID = DataResponse.ids.tvdb;
				const Item_Network = DataResponse.network;
				const Item_Released = await utils.convertISOtoStd(DataResponse.first_aired);

				// Get Trakt Season & Episode Data
				const SeasonURL = "https://api.trakt.tv/shows/" + Item_TraktSlug + "/seasons/?extended=full,episodes";
				const SeasonResponse = await utils.getBGRequest({
					action: "fetchData",
					url: SeasonURL,
					custom_headers: TraktHeaders,
					service: "Trakt_API",
					dimensions: Dimensions
				});
				const SeasonList = SeasonResponse;
				let SeasonContainer = [];
				for (const Season of SeasonList) {

					const Item_Season_Number = Season.number;
					const Item_Season_IMDBID = null;
					const Item_Season_TMDBID = Season.ids.tmdb;
					const Item_Season_TVDBID = Season.ids.tvdb;
					const Item_Season_TraktID = Season.ids.trakt;
					const Item_Season_Network = Season.network;
					const Item_Season_FirstAired = await utils.convertISOtoStd(Season.first_aired);

					const EpisodeList = Season.episodes;
					let EpisodeContainer = [];
					for (const Episode of EpisodeList) {
						const Item_Episode_Number = Episode.number;
						const Item_Episode_IMDBID = Episode.ids.imdb;
						const Item_Episode_TMDBID = Episode.ids.tmdb;
						const Item_Episode_TVDBID = Episode.ids.tvdb;
						const Item_Episode_TraktID = Episode.ids.trakt;
						const Item_Episode_FirstAired = await utils.convertISOtoStd(Episode.first_aired);
						const Item_Episode_Runtime = Episode.runtime;
						const Item_Episode_AfterCredits = Episode.after_credits;
						const Item_Episode_DuringCredits = Episode.during_credits;
						const Item_Episode_Type = Episode.episode_type;
						EpisodeContainer.push({
							"Season": Item_Season_Number,
							"Number": Item_Episode_Number,
							"Type": Item_Episode_Type,
							"FirstAired": Item_Episode_FirstAired,
							"IDs": {
								"TVDB": Item_Episode_TVDBID,
								"IMDB": Item_Episode_IMDBID,
								"Trakt": Item_Episode_TraktID,
								"TMDB": Item_Episode_TMDBID,
							},
							"Runtime": Item_Episode_Runtime,
							"AfterCredits": Item_Episode_AfterCredits,
							"BeforeCredits": Item_Episode_DuringCredits
						});
					}

					SeasonContainer.push({
						"Number": Item_Season_Number,
						"FirstAired": Item_Season_FirstAired,
						"IDs": {
							"TVDB": Item_Season_TVDBID,
							"IMDB": Item_Season_IMDBID,
							"Trakt": Item_Season_TraktID,
							"TMDB": Item_Season_TMDBID,
						},
						"Episodes": EpisodeContainer
					});
				}
				DataContainer = {
					"Name": Item_Name,
					"Type": SearchType,
					"Year": Item_Year,
					"IDs": {
						"TVDB": Item_TVDBID,
						"IMDB": Item_IMDBID,
						"Trakt": Item_TraktID,
						"TraktSlug": Item_TraktSlug,
						"TMDB": Item_TMDBID,
					},
					"Homepage": Item_Homepage,
					"Status": Item_Status,
					"Runtime": Item_Runtime,
					"Network": Item_Network,
					"FirstReleased": Item_Released,
					"Trailer": Item_Trailer,
					"Seasons": SeasonContainer
				};
			}
			else if (SearchType == "movie") {
				const Item_Released = DataResponse.released;
				const Item_AfterCredits = DataResponse.after_credits;
				const Item_DuringCredits = DataResponse.during_credits;

				DataContainer = {
					"Name": Item_Name,
					"Type": SearchType,
					"Year": Item_Year,
					"IDs": {
						"IMDB": Item_IMDBID,
						"Trakt": Item_TraktID,
						"TraktSlug": Item_TraktSlug,
						"TMDB": Item_TMDBID,
					},
					"Homepage": Item_Homepage,
					"Status": Item_Status,
					"Runtime": Item_Runtime,
					"FirstReleased": Item_Released,
					"Trailer": Item_Trailer,
					"AfterCredits": Item_AfterCredits,
					"DuringCredits": Item_DuringCredits
				};

			}
			await utils.cache_set(Cache_Name, DataContainer, "local");
			return DataContainer;
		}
		else {
			return Cached_Data;
		}
	}
};