plugins = {
    start: async (plugin, metadata_xml, server, type) => {

    },
    imdb: async (metadata_xml, server, type) => {
        imdb.init(metadata_xml, server, type);
    },
    tvdb: async (metadata_xml, server, type) => {
        tvdb.init(metadata_xml, server, type);
    },
    tmdb: async (metadata_xml, server, type) => {
        tmdb.init(metadata_xml, server, type);
    },
    trakt: async (metadata_xml, server, type) => {
        trakt.init(metadata_xml, server, type);
    },
    missing_episodes: async (metadata_xml, server, type) => {
        missing_episodes.init(metadata_xml, server, type);
    },
    sonarr: async (metadata_xml, server, type) => {
        sonarr.init(metadata_xml, server, type);
    },
    radarr: async (metadata_xml, server, type) => {
        radarr.init(metadata_xml, server, type);
    },
};