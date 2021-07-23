tmdb_api = {
    api_key: utils.getApiKey("tmdb"),

    getImdbId: function (tmdb_id, callback) {
        var api_url = "https://api.themoviedb.org/3/movie/" + tmdb_id + "?api_key=" + tmdb_api.api_key;

        utils.getJSONWithCache(api_url, function (tmdb_json) {
            var imdb_id = tmdb_json["imdb_id"];
            callback(imdb_id);
        });
    },

    getTmdbId: function (imdb_id, type, callback) {
        var api_url = "https://api.themoviedb.org/3/find/" + imdb_id + "?external_source=imdb_id&api_key=" + tmdb_api.api_key;

        utils.getJSONWithCache(api_url, function (tmdb_json) {
            var tmdb_id = tmdb_json[type + "_results"][0]["id"];
            callback(tmdb_id);
        });
    },

    getMovieCast: function (tmdb_id, callback) {
        var api_url = "https://api.themoviedb.org/3/movie/" + tmdb_id + "/credits?api_key=" + tmdb_api.api_key;

        utils.getJSON(api_url, function (tmdb_json) {
            var cast = tmdb_json["cast"];
            callback(cast);
        });
    },

    getActorDetails: function (actor_id, callback) {
        var api_url = "https://api.themoviedb.org/3/person/" + actor_id + "?api_key=" + tmdb_api.api_key;

        utils.getJSON(api_url, function (tmdb_json) {
            callback(tmdb_json);
        });
    }
}