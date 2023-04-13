missing_episodes = {
    server: null,
    metadata_xml: null,

    init: function (metadata_xml, server, type) {
        missing_episodes.server = server;;
        missing_episodes.insertSwitch();
        if (type === "season") {
            missing_episodes.processEpisodes(type, metadata_xml);
        }
        else if (type === "show") {
            missing_episodes.processSeasons(type, metadata_xml);
        }
    },

    processEpisodes: async (type, metadata_xml) => {
        var site = "imdb";
        utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Lauching TMDB API (Site: " + site + ") (Type: " + type + ")");
        var imdb_id = await tmdb_api.getId(site, type, metadata_xml);
        if (imdb_id) {
            utils.debug("Missing Episodes [async] (processEpisodes) Plugin: TMDB API returned the following IMDB ID (" + imdb_id + ")");
            var show_id = imdb_id;
        }
        else {
            utils.debug("Missing Episodes [async] (processEpisodes) Plugin: IMDB ID not found, falling back to show name");
            utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Attempting searching via Trakt API");
            trakt_id = await trakt_api.getTraktId(type, metadata_xml);
            if (trakt_id) {
                var show_id = trakt_id;
            }
            else {
                utils.debug("Missing Episodes [async] (processSeasons) Plugin: Trakt ID not found... Aborting.")
                return
            }
        }

        var directory_metadata = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0];
        var season_metadata_id = directory_metadata.getAttribute("ratingKey");
        var season_num = directory_metadata.getAttribute("index");

        utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Finding all existing episodes");

        // store current page hash so plugin doesn't insert tiles if page changed
        var current_hash = location.hash;

        var present_episodes = await missing_episodes.getPresentEpisodes(season_metadata_id);
        utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Existing episodes populated: ")
        utils.debug(present_episodes);
        var all_episodes = await trakt_api.getAllMissing(show_id, type, season_num);
        if (Object.keys(all_episodes).length) {
            utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Season " + season_num + " - " + + present_episodes.length + "/" + Object.keys(all_episodes[season_num].episodes).length + " currently present")
            utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Processing missing episodes")
            var tiles_to_insert = {};
            for (var i = 0; i < Object.keys(all_episodes[season_num].episodes).length; i++) {
                var episode = all_episodes[season_num].episodes;
                if (present_episodes.indexOf(episode[i].number) === -1) {
                    utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Episode " + i + " is missing. Inserting in the list")
                    var episode_tile = missing_episodes.constructEpisodeTile(show_id, episode[i]);
                    tiles_to_insert[episode[i]["number"]] = episode_tile;
                }
                else {
                    utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Episode " + i + " is already present. Skipping.")
                }
            }
            // check if page changed before inserting tiles
            if (current_hash === location.hash) {

                utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Inserting episode tiles")
                missing_episodes.insertEpisodeTiles(tiles_to_insert);
            }
            else {
                utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Page changed before episode tiles could be inserted");
            }
        }
    },

    processSeasons: async (type, metadata_xml) => {
        var site = "imdb";
        utils.debug("Missing Episodes [async] (processSeasons) Plugin: Lauching TMDB API (Site: " + site + ") (Type: " + type + ")");
        var imdb_id = await tmdb_api.getId(site, type, metadata_xml);
        if (imdb_id) {
            utils.debug("Missing Episodes [async] (processSeasons) Plugin: TMDB API returned the following IMDB ID (" + imdb_id + ")");
            var show_id = imdb_id;
        }
        else {
            utils.debug("Missing Episodes [async] (processSeasons) Plugin: IMDB ID not found, attempting searching via Trakt")
            trakt_id = await trakt_api.getTraktId(type, metadata_xml);
            if (trakt_id) {
                var show_id = trakt_id;
            }
            else {
                utils.debug("Missing Episodes [async] (processSeasons) Plugin: Trakt ID not found... Aborting.")
                return
            }
        }

        var directory_metadata = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0];
        var show_metadata_id = directory_metadata.getAttribute("ratingKey");

        utils.debug("Missing Episodes [async] (processSeasons) Plugin: Finding all present seasons");

        // store current page hash so plugin doesn't insert tiles if page changed
        var current_hash = location.hash;
        var present_seasons = await missing_episodes.getPresentSeasons(show_metadata_id);
        var retry = 0
        while (present_seasons == null) {
            retry++
            if (retry < 10) {
                utils.debug("Missing Episodes [async] (processSeasons) Plugin: Current seasons not returned yet...[" + retry + "]");
            }
            else {
                utils.debug("Missing Episodes [async] (processSeasons) Plugin: Could not set current seasons... Aborting.");
                return
            }
        }

        utils.debug("Missing Episodes [async] (processSeasons) Plugin: Existing seasons populated, finding missing seasons")
        var all_seasons = await trakt_api.getAllMissing(show_id, "season");

        utils.debug("Missing Episodes [async] (processSeasons) Plugin: Processing missing seasons")
        var tiles_to_insert = {};
        for (var i = 0; i < all_seasons.length; i++) {
            var season = all_seasons[i];
            if (present_seasons.indexOf(season["number"]) === -1) {
                if (season["number"] == 0) {
                    // ignore specials
                    continue;
                }
                var season_tile = missing_episodes.constructSeasonTile(show_id, season);
                tiles_to_insert[season["number"]] = season_tile;
            }
        }

        // check if page changed before inserting tiles
        if (current_hash === location.hash) {
            missing_episodes.insertSeasonTiles(tiles_to_insert);
        }
        else {
            utils.debug("Missing Episodes [async] (processSeasons) Plugin: Page changed before season tiles could be inserted");
        }
    },

    getPresentEpisodes: async (season_metadata_id) => {
        utils.debug("Missing Episodes [async] (getPresentEpisodes) Plugin: Fetching season episodes xml");
        var episodes_metadata_xml_url = missing_episodes.server["uri"] + "/library/metadata/" + season_metadata_id + "/children?X-Plex-Token=" + missing_episodes.server["access_token"];

        var episodes_metadata_xml = await utils.getXML(episodes_metadata_xml_url);
        if (Object.keys(episodes_metadata_xml).length) {

            var episodes_xml = episodes_metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");
            var episodes = [];
            for (var i = 0; i < episodes_xml.length; i++) {
                episodes.push(parseInt(episodes_xml[i].getAttribute("index")));
            }
            return episodes;
        }
        else {
            return null
        }
    },

    getPresentSeasons: async (show_metadata_id) => {
        utils.debug("Missing Episodes [async] (getPresentSeasons) Plugin: Fetching seasons xml");
        var seasons_metadata_xml_url = missing_episodes.server["uri"] + "/library/metadata/" + show_metadata_id + "/children?X-Plex-Token=" + missing_episodes.server["access_token"];
        var seasons_metadata_xml = await utils.getXML(seasons_metadata_xml_url);
        var retry = 0
        while (seasons_metadata_xml == null) {
            retry++
            if (retry < 10) {
                utils.debug("Missing Episodes [async] (getPresentSeasons) Plugin: Seasons Metadata XML not returned yet...[" + retry + "]");
            }
            else {
                utils.debug("Missing Episodes [async] (getPresentSeasons) Plugin: Could not set Seasons Metadata XML... Aborting.");
                return
            }
        }
        var seasons_xml = seasons_metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
        var seasons = [];
        for (var i = 0; i < seasons_xml.length; i++) {
            var season_index = parseInt(seasons_xml[i].getAttribute("index"));
            if (!isNaN(season_index)) {
                seasons.push(season_index);
            }
        }
        return seasons;
    },

    constructEpisodeTile: function (show_name, episode) {
        var orig_episode_tile = document.querySelectorAll("[data-testid*=cellItem]")[0]
        var orig_poster_container = orig_episode_tile.childNodes[0]
        var orig_poster_tile = orig_poster_container.childNodes[0]
        var orig_poster = orig_poster_container.childNodes[0].childNodes[0]
        var orig_poster_badge = orig_poster_container.childNodes[1]
        var orig_poster_link = orig_poster_container.childNodes[2]
        var orig_episode_link = orig_episode_tile.childNodes[1]
        var orig_episode_number = orig_episode_tile.childNodes[2]

        var episode_tile = document.createElement("div");
        var poster_container = document.createElement("div");
        var poster_tile = document.createElement("div");
        var poster = document.createElement("div");
        var poster_badge = document.createElement("div");
        var poster_link = document.createElement("a");
        var episode_link = document.createElement("a");
        var episode_number = document.createElement("span");

        episode_tile.setAttribute("class", "missing_episode");
        poster_container.id = "poster_container";
        poster_tile.id = "poster_tile";
        poster.id = "poster";
        poster_badge.id = "poster_badge";
        poster_link.id = "poster_link";
        episode_link.id = "episode_link";
        episode_number.id = "episode_number";

        episode_tile.appendChild(poster_container);
        episode_tile.appendChild(episode_link);
        episode_tile.appendChild(episode_number);
        poster_container.appendChild(poster_tile);
        poster_container.appendChild(poster_badge);
        poster_container.appendChild(poster_link);
        poster_tile.appendChild(poster);

        poster_container.style.cssText = orig_poster_container.style.cssText
        poster_tile.style.cssText = orig_poster_tile.style.cssText
        poster.style.cssText = orig_poster.style.cssText
        poster_badge.style.cssText = orig_poster_badge.style.cssText
        poster_link.style.cssText = orig_poster_link.style.cssText
        episode_link.style.cssText = orig_episode_link.style.cssText
        episode_number.style.cssText = orig_episode_number.style.cssText

        episode_tile.style.width = "290px"
        episode_link.style.maxWidth = "100%"

        poster_container.setAttribute("class", orig_poster_container.getAttribute("class"));
        poster.setAttribute("class", orig_poster.getAttribute("class"));
        poster_badge.setAttribute("class", orig_poster_badge.getAttribute("class"));
        poster_link.setAttribute("class", orig_poster_link.getAttribute("class"));
        episode_link.setAttribute("class", orig_episode_link.getAttribute("class"));
        episode_number.setAttribute("class", orig_episode_number.getAttribute("class"));

        poster_container.style.backgroundColor = "Black";

        poster_link.setAttribute("href", "https://trakt.tv/shows/" + show_name + "/seasons/" + episode["season"] + "/episodes/" + episode["number"]);
        poster_link.setAttribute("target", "_blank");

        episode_link.innerText = episode["title"] || "TBA"
        episode_link.setAttribute("href", "https://trakt.tv/shows/" + show_name + "/seasons/" + episode["season"] + "/episodes/" + episode["number"]);
        episode_link.setAttribute("target", "_blank");

        poster.setAttribute("style", "background-image: url(" + (episode["screen"] || utils.getResourcePath("trakt/trakt_episode_background_unavailable.png")) + "); width: 100%; height: 100%; background-size: cover; background-position: center center; background-repeat: no-repeat; opacity: 0.5;");

        episode_number.innerText = "Episode " + episode["number"]
        return episode_tile;
    },

    constructSeasonTile: function (show_name, season) {
        var orig_season_tile = document.querySelectorAll("[data-testid*=cellItem]")[0]
        var orig_poster_container = orig_season_tile.childNodes[0]
        var orig_poster_tile = orig_poster_container.childNodes[0]
        var orig_poster = orig_poster_container.childNodes[0].childNodes[0]
        var orig_poster_badge = orig_poster_container.childNodes[1]
        var orig_poster_link = orig_poster_container.childNodes[2]
        var orig_season_link = orig_season_tile.childNodes[1]
        var orig_season_episodes = orig_season_tile.childNodes[2]

        var season_tile = document.createElement("div");
        var poster_container = document.createElement("div");
        var poster_tile = document.createElement("div");
        var poster = document.createElement("div");
        var poster_badge = document.createElement("div");
        var poster_link = document.createElement("a");
        var season_link = document.createElement("a");
        var season_episodes = document.createElement("span");

        season_tile.setAttribute("class", "missing_season");
        poster_container.id = "poster_container";
        poster_tile.id = "poster_tile";
        poster.id = "poster";
        poster_badge.id = "poster_badge";
        poster_link.id = "poster_link";
        season_link.id = "season_link";
        season_episodes.id = "season_episodes";

        season_tile.appendChild(poster_container);
        season_tile.appendChild(season_link);
        season_tile.appendChild(season_episodes);
        poster_container.appendChild(poster_tile);
        poster_container.appendChild(poster_badge);
        poster_container.appendChild(poster_link);
        poster_tile.appendChild(poster);

        season_tile.style.cssText = orig_season_tile.style.cssText
        poster_container.style.cssText = orig_poster_container.style.cssText
        poster_tile.style.cssText = orig_poster_tile.style.cssText
        poster.style.cssText = orig_poster.style.cssText
        poster_badge.style.cssText = orig_poster_badge.style.cssText
        poster_link.style.cssText = orig_poster_link.style.cssText
        season_link.style.cssText = orig_season_link.style.cssText
        season_episodes.style.cssText = orig_season_episodes.style.cssText

        poster_container.setAttribute("class", orig_poster_container.getAttribute("class"));
        poster.setAttribute("class", orig_poster.getAttribute("class"));
        poster_badge.setAttribute("class", orig_poster_badge.getAttribute("class"));
        poster_link.setAttribute("class", orig_poster_link.getAttribute("class"));
        season_link.setAttribute("class", orig_season_link.getAttribute("class"));
        season_episodes.setAttribute("class", orig_season_episodes.getAttribute("class"));

        season_tile.style.position = "relative";
        season_tile.style.float = "left";
        season_tile.style.marginRight = "20px";
        season_tile.style.marginBottom = "20px";
        season_tile.style.transform = "";
        season_tile.style.left = "0px";
        season_tile.style.top = "0px";

        poster_container.style.backgroundColor = "Black";

        poster_link.setAttribute("href", "https://trakt.tv/shows/" + show_name + "/seasons/" + season["number"]);
        poster_link.setAttribute("target", "_blank");

        season_link.innerText = "Season " + season["number"]
        season_link.setAttribute("href", "https://trakt.tv/shows/" + show_name + "/seasons/" + season["number"]);
        season_link.setAttribute("target", "_blank");

        poster.setAttribute("style", "background-image: url(" + (season["poster"] || utils.getResourcePath("trakt/trakt_season_background_unavailable.png")) + "); width: 100%; height: 100%; background-size: cover; background-position: center center; background-repeat: no-repeat; opacity: 0.5;");

        season_episodes.innerText = season["episodes"].length + " episodes"

        return season_tile;
    },

    insertEpisodeTiles: function (episode_tiles) {
        var episode_tile_list = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[0].parentElement.parentElement;
        episode_tile_list.style.padding = "0 40px 20px";
        var episode_tile_list_elements = episode_tile_list.children;
        var episodeCount = episode_tile_list_elements.length
        if (episodeCount <= 45) {
            // insert already present episodes into episode_tiles array
            for (var i = 0; i < episode_tile_list_elements.length; i++) {
                var episode_num = episode_tile_list_elements[i].querySelectorAll("[class*=MetadataPosterCardTitle-isSecondary]")[0].innerText.match(/\d+/);

                episode_tile_list_elements[i].removeAttribute("data-testid");
                episode_tile_list_elements[i].removeAttribute("style");
                episode_tile_list_elements[i].setAttribute("class", "existing_episode");
                episode_tile_list_elements[i].style.width = "290px"
                episode_tiles[episode_num] = episode_tile_list_elements[i];
            }

            // remove episode tile list node first
            var parent_node = episode_tile_list.parentNode;
            parent_node.removeChild(episode_tile_list);

            // iterate over all episode tiles, present and missing, to reinsert back into episode tile list in order
            var j = 0;
            for (var episode_number in episode_tiles) {
                var episode_tile = episode_tiles[episode_number];

                episode_tile_list.insertBefore(episode_tile, episode_tile_list_elements[j]);
                j++;
            }

            // reinsert episode tile list node
            parent_node.appendChild(episode_tile_list);
        }
        else {
            utils.debug("Missing Episodes (insertEpisodeTiles) Plugin: Episode count too high. Currently not supported due to the way Plex dynamically generates the list.");
        }
    },

    insertSeasonTiles: function (season_tiles) {
        setTimeout(function () {
            var season_tile_list = document.querySelectorAll("[class*=MetadataPosterListItem-card-]")[0].parentElement.parentElement;
            season_tile_list.style.padding = "0 50px 20px";
            var season_tile_list_elements = season_tile_list.children;

            // insert already present seasons into season_tiles array
            for (var i = 0; i < season_tile_list_elements.length; i++) {
                var season_num = season_tile_list_elements[i].querySelectorAll("[class*=MetadataPosterCardTitle-singleLineTitle]")[0].innerHTML.match(/\d+/);
                season_tile_list_elements[i].style.position = "relative";
                season_tile_list_elements[i].style.float = "left";
                season_tile_list_elements[i].style.marginRight = "20px";
                season_tile_list_elements[i].style.marginBottom = "20px";
                season_tile_list_elements[i].style.transform = "";
                season_tile_list_elements[i].style.left = "0px";
                season_tile_list_elements[i].style.top = "0px";

                season_tile_list_elements[i].removeAttribute("data-testid");
                season_tile_list_elements[i].setAttribute("class", "existing_season");

                if (season_num) {
                    season_tiles[season_num] = season_tile_list_elements[i];
                }
                else {
                    season_tiles["specials"] = season_tile_list_elements[i];
                }
            }

            // remove season tile list node first
            var parent_node = season_tile_list.parentNode;
            parent_node.removeChild(season_tile_list);

            // iterate over all season tiles, present and missing, to reinsert back into season tile list in order
            var j = 0;
            for (var season_number in season_tiles) {
                var season_tile = season_tiles[season_number];

                // Stick specials season first
                if (season_number === "specials") {
                    season_tile_list.insertBefore(season_tile, season_tile_list_elements[0]);
                }
                else {
                    season_tile_list.insertBefore(season_tile, season_tile_list_elements[j]);
                    j++;
                }
            }

            // reinsert season tile list node
            parent_node.appendChild(season_tile_list);

            parent_node.firstElementChild.style.height = "auto";
            var season_break = document.createElement("br");
            season_break.style.clear = "both";
            parent_node.appendChild(season_break);
        }, 1000);
    },

    insertSwitch: function () {
        button_template = document.body.querySelectorAll("[data-testid*=preplay-togglePlayedState]")[0];
        action_bar = document.querySelectorAll("[data-testid*=preplay-play]")[0].parentNode;
        var switch_container = document.createElement("button");

        switch_container.style.cssText = button_template.style.cssText
        switch_container.setAttribute("class", button_template.getAttribute("class"));
        switch_container.setAttribute("id", "missing-switch");
        switch_container.setAttribute("data-state", "show");
        switch_container.setAttribute("data-original-title", "Hide missing episodes/seasons");
        switch_container.addEventListener("click", missing_episodes.switchState, false);

        var glyph = document.createElement("i");
        glyph.setAttribute("class", "glyphicon eye-open");

        switch_container.appendChild(glyph);
        // insert switch before secondary actions dropdown
        action_bar.insertBefore(switch_container, document.querySelectorAll("[data-testid*=preplay-more]")[0]);
    },

    switchState: function () {
        var missing_switch = document.getElementById("missing-switch");
        var glyph = missing_switch.getElementsByTagName("i")[0];
        var state = missing_switch.getAttribute("data-state");

        var missing_episodes = document.getElementsByClassName("missing_episode");
        for (var i = 0; i < missing_episodes.length; i++) {
            if (state === "show") {
                missing_episodes[i].style.display = "none";
            }
            else {
                missing_episodes[i].style.display = "block";
            }
        }

        var missing_seasons = document.getElementsByClassName("missing_season");
        for (var i = 0; i < missing_seasons.length; i++) {
            if (state === "show") {
                missing_seasons[i].style.display = "none";
            }
            else {
                missing_seasons[i].style.display = "block";
            }
        }

        if (state === "show") {
            glyph.setAttribute("class", "glyphicon eye-close");
            missing_switch.setAttribute("data-state", "hide");
            missing_switch.setAttribute("data-original-title", "Show missing episodes/seasons");
        }
        else {
            glyph.setAttribute("class", "glyphicon eye-open");
            missing_switch.setAttribute("data-state", "show");
            missing_switch.setAttribute("data-original-title", "Hide missing episodes/seasons");
        }
    }
}