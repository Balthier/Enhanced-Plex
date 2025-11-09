plugins = {
	imdb: async (metadata_xml, server, type, TraktData) => {
		imdb.init(TraktData);
	},
	tvdb: async (metadata_xml, server, type, TraktData) => {
		tvdb.init(TraktData);
	},
	tmdb: async (metadata_xml, server, type, TraktData) => {
		tmdb.init(TraktData);
	},
	trakt: async (metadata_xml, server, type, TraktData) => {
		trakt.init(TraktData);
	},
	missing_episodes: async (metadata_xml, server, type, TraktData) => {
		missing_episodes.init(metadata_xml, server, type, TraktData);
	},
	sonarr: async (metadata_xml, server, type, TraktData) => {
		sonarr.init(TraktData);
	},
	radarr: async (metadata_xml, server, type, TraktData) => {
		radarr.init(TraktData);
	},
};