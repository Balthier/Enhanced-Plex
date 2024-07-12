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

    insertSwitch: function () {
        button_template = document.body.querySelectorAll("[data-testid*=preplay-togglePlayedState]")[0];
        action_bar = document.querySelectorAll("[data-testid*=preplay-play]")[0].parentNode;
        var switch_container = document.createElement("button");

        switch_container.style.cssText = button_template.style.cssText;
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
    },

    // Season Functions
    processSeasons: async (type, metadata_xml) => {
        var site = "imdb";
        utils.debug("Missing Episodes [async] (processSeasons) Plugin: Lauching TMDB API (Site: " + site + ") (Type: " + type + ")");
        var imdb_id = await tmdb_api.getId(site, type, metadata_xml);
        if (imdb_id) {
            utils.debug("Missing Episodes [async] (processSeasons) Plugin: TMDB API returned the following IMDB ID (" + imdb_id + ")");
            var show_id = imdb_id;
        }
        else {
            utils.debug("Missing Episodes [async] (processSeasons) Plugin: IMDB ID not found, attempting searching via Trakt");
            trakt_id = await trakt_api.getTraktId(type, metadata_xml);
            if (trakt_id) {
                var show_id = trakt_id;
            }
            else {
                utils.debug("Missing Episodes [async] (processSeasons) Plugin: Trakt ID not found... Aborting.");
                return;
            }
        }

        var directory_metadata = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0];
        var show_metadata_id = directory_metadata.getAttribute("ratingKey");

        utils.debug("Missing Episodes [async] (processSeasons) Plugin: Finding all present seasons");

        // store current page hash so plugin doesn't insert tiles if page changed
        var current_hash = location.hash;
        var present_seasons = await missing_episodes.getPresentSeasons(show_metadata_id);
        var retry = 0;
        while (present_seasons == null) {
            retry++;
            if (retry < 10) {
                utils.debug("Missing Episodes [async] (processSeasons) Plugin: Current seasons not returned yet...[" + retry + "]");
            }
            else {
                utils.debug("Missing Episodes [async] (processSeasons) Plugin: Could not set current seasons... Aborting.");
                return;
            }
        }

        utils.debug("Missing Episodes [async] (processSeasons) Plugin: Existing seasons populated, finding missing seasons");
        var all_seasons = await trakt_api.getAllMissing(show_id, "season");

        utils.debug("Missing Episodes [async] (processSeasons) Plugin: " + present_seasons.length + "/" + all_seasons.length + " currently present");
        utils.debug("Missing Episodes [async] (processSeasons) Plugin: Processing missing seasons");
        var tiles_to_insert = {};
        for (var i = 0; i < all_seasons.length; i++) {
            var season = all_seasons[i];
            if (all_seasons.length == "1") {
                i = i + 1;
            }
            if (all_seasons[0].number == "1") {
                j = i + 1;
            }
            else {
                j = i;
            }
            if (present_seasons.indexOf(season["number"]) === -1) {
                utils.debug("Missing Episodes [async] (processSeasons) Plugin: Season " + j + " is missing. Inserting in the list");
                var season_tile = missing_episodes.constructSeasonTile(show_id, season);
                tiles_to_insert[season["number"]] = season_tile;
            }
            else {
                utils.debug("Missing Episodes [async] (processSeasons) Plugin: Season " + j + " is already present. Skipping.");
            }
        }

        // check if page changed before inserting tiles
        if (current_hash === location.hash) {
            await missing_episodes.insertSeasonTiles(tiles_to_insert, metadata_xml);
            missing_episodes.insertEpisodeCount(all_seasons);
        }
        else {
            utils.debug("Missing Episodes [async] (processSeasons) Plugin: Page changed before season tiles could be inserted");
        }
    },

    getPresentSeasons: async (show_metadata_id) => {
        utils.debug("Missing Episodes [async] (getPresentSeasons) Plugin: Fetching seasons xml");
        var seasons_metadata_xml_url = missing_episodes.server["uri"] + "/library/metadata/" + show_metadata_id + "/children?X-Plex-Token=" + missing_episodes.server["access_token"];
        var seasons_metadata_xml = await utils.getXML(seasons_metadata_xml_url);
        var retry = 0;
        while (seasons_metadata_xml == null) {
            retry++;
            if (retry < 10) {
                utils.debug("Missing Episodes [async] (getPresentSeasons) Plugin: Seasons Metadata XML not returned yet...[" + retry + "]");
            }
            else {
                utils.debug("Missing Episodes [async] (getPresentSeasons) Plugin: Could not set Seasons Metadata XML... Aborting.");
                return;
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

    constructSeasonTile: function (show_name, season) {
        var season_num = season["number"];
        var orig_Se_Container = document.querySelectorAll("[data-testid*=cellItem]")[0];

        var Se_Container = orig_Se_Container.cloneNode(true);
        var orig_Poster_Container = orig_Se_Container.childNodes[0];
        var orig_Poster_Img_Container = orig_Se_Container.childNodes[0].childNodes[0];
        var orig_Poster_Img = orig_Se_Container.childNodes[0].childNodes[0].childNodes[0];

        var Poster_Container = Se_Container.childNodes[0];
        var Poster_Img_Container = Se_Container.childNodes[0].childNodes[0];
        var Poster_Img = Se_Container.childNodes[0].childNodes[0].childNodes[0];
        var Poster_Img_Link = Se_Container.childNodes[0].childNodes[1];
        var Poster_BtmRt_Badge = Se_Container.childNodes[0].childNodes[2];
        var Se_Name_Link = Se_Container.childNodes[1];
        var Se_Num_Container = Se_Container.childNodes[2];

        Se_Container.setAttribute("id", "se_" + season_num);

        Se_Container.classList.add("Se_Container");
        Se_Container.classList.add("missing_season");
        Poster_Container.classList.add("Poster_Container");
        Poster_Img_Container.classList.add("Poster_Img_Container");
        Poster_Img.classList.add("Poster_Img");
        Poster_Img_Link.classList.add("Poster_Img_Link");
        Poster_BtmRt_Badge.classList.add("Poster_BtmRt_Badge");
        Se_Name_Link.classList.add("Se_Name_Link");
        Se_Num_Container.classList.add("Se_Num_Container");

        Se_Container.removeAttribute("style");
        Poster_Container.removeAttribute("style");
        Poster_Img_Container.removeAttribute("style");
        Poster_Img.removeAttribute("style");
        Poster_Img_Link.removeAttribute("style");
        Poster_BtmRt_Badge.removeAttribute("style");
        Se_Name_Link.removeAttribute("style");
        Se_Num_Container.removeAttribute("style");

        Se_Container.style.width = orig_Se_Container.style.width;
        Se_Container.style.height = orig_Se_Container.style.height;
        Poster_Container.style.width = orig_Poster_Container.style.width;
        Poster_Container.style.height = orig_Poster_Container.style.height;
        Poster_Img_Container.style.width = orig_Poster_Img_Container.style.width;
        Poster_Img_Container.style.height = orig_Poster_Img_Container.style.height;
        Poster_Img.style.width = orig_Poster_Img.style.width;
        Poster_Img.style.height = orig_Poster_Img.style.height;

        var Poster_TopRt_Badge_Container = Se_Container.childNodes[0].childNodes[3];
        if (Poster_TopRt_Badge_Container) {
            Se_Container.childNodes[0].removeChild(Poster_TopRt_Badge_Container);
        }
        var link = "https://trakt.tv/shows/" + show_name + "/seasons/" + season_num;
        Poster_Img.src = utils.getResourcePath("trakt/trakt_season_background_unavailable.png");
        Poster_Img_Link.setAttribute("href", link);
        Poster_Img_Link.setAttribute("target", "_blank");
        Poster_Img_Link.setAttribute("aria-label", show_name + ", " + "Season " + season_num);

        Se_Name_Link.innerText = "Season " + season_num;
        Se_Name_Link.setAttribute("href", link);
        Se_Name_Link.setAttribute("target", "_blank");
        Se_Name_Link.setAttribute("title", "Season " + season_num);

        Se_Num_Container.innerText = "0 / " + season["episodes"].length + " episodes";

        return Se_Container;
    },

    insertSeasonTiles: async (season_tiles, metadata_xml) => {
        var directory_metadata = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0];
        var show_metadata_id = directory_metadata.getAttribute("ratingKey");
        var seasons_metadata_xml_url = missing_episodes.server["uri"] + "/library/metadata/" + show_metadata_id + "/children?X-Plex-Token=" + missing_episodes.server["access_token"];
        var seasons_metadata_xml = await utils.getXML(seasons_metadata_xml_url);
        seasons_xml = seasons_metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
        seasons = {};
        for (var i = 0; i < seasons_xml.length; i++) {
            var season_index = parseInt(seasons_xml[i].getAttribute("index"));
            if (!isNaN(season_index)) {
                var season_title = seasons_xml[i].getAttribute("title").replace("&amp;", "&");
                seasons[season_title] = season_index;
            }
        }
        var sliderValue = document.querySelector("[role*=slider]");
        var sliderMultiplier = (sliderValue.ariaValueNow) - 1;
        var valueWInt = (sliderMultiplier) * 70 + 130;
        var valueW = valueWInt + "px";
        var valueHInt = (sliderMultiplier) * 105 + 251;
        var valueH = valueHInt + "px";
        var valueImgHInt = (sliderMultiplier) * 105 + 195;
        var valueImgH = valueImgHInt + "px";

        var season_tile_list = document.querySelectorAll("[data-testid*=cellItem]")[0].parentElement;
        var parent_node = document.querySelectorAll("[data-testid*=cellItem]")[0].parentElement.parentNode;
        season_tile_list.style.padding = "0 40px 20px";
        var season_tile_list_elements = season_tile_list.children;

        // insert already present seasons into season_tiles array
        for (var i = 0; i < season_tile_list_elements.length; i++) {
            var season_text = season_tile_list_elements[i].querySelectorAll("[data-testid*=metadataTitleLink]")[0].innerHTML.replace("&amp;", "&");
            var season_num = season_text.match(/\d+/) || seasons[season_text];
            var Se_Container = season_tile_list_elements[i];
            var Poster_Container = Se_Container.childNodes[0];
            var Poster_Img_Container = Se_Container.childNodes[0].childNodes[0];
            var Poster_Img = Se_Container.childNodes[0].childNodes[0].childNodes[0];
            var Poster_Img_Link = Se_Container.childNodes[0].childNodes[1];
            var Poster_BtmRt_Badge = Se_Container.childNodes[0].childNodes[2];
            var Se_Name_Link = Se_Container.childNodes[1];
            var Se_Num_Container = Se_Container.childNodes[2];

            Se_Container.removeAttribute("style");
            Poster_Container.removeAttribute("style");
            Poster_Img_Container.removeAttribute("style");
            Poster_Img.removeAttribute("style");
            Poster_Img_Link.removeAttribute("style");
            Poster_BtmRt_Badge.removeAttribute("style");
            Se_Name_Link.removeAttribute("style");
            Se_Num_Container.removeAttribute("style");

            Se_Container.setAttribute("id", "se_" + season_num);
            Se_Container.classList.add("Se_Container");
            Se_Container.classList.add("existing_season");
            Poster_Container.classList.add("Poster_Container");
            Poster_Img_Container.classList.add("Poster_Img_Container");
            Poster_Img.classList.add("Poster_Img");
            Poster_Img_Link.classList.add("Poster_Img_Link");
            Poster_BtmRt_Badge.classList.add("Poster_BtmRt_Badge");
            Se_Name_Link.classList.add("Se_Name_Link");
            Se_Num_Container.classList.add("Se_Num_Container");

            Se_Container.style.width = valueW;
            Se_Container.style.height = valueH;
            Poster_Container.style.width = valueW;
            Poster_Container.style.height = valueImgH;
            Poster_Img_Container.style.width = valueW;
            Poster_Img_Container.style.height = valueImgH;
            Poster_Img.style.width = valueW;
            Poster_Img.style.height = valueImgH;

            if (season_num > 0) {
                season_tiles[season_num] = season_tile_list_elements[i];
            }
            else {
                season_tiles["specials"] = season_tile_list_elements[i];
            }
        }

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

        sliderObserver = new MutationObserver((mutations) => {
            utils.debug("Missing Episodes (insertSeasonTiles) (sliderObserver) Plugin: Slider value change detected. Setting new Height & Width");
            var sliderMultiplier = (sliderValue.ariaValueNow) - 1;
            var valueWInt = (sliderMultiplier) * 70 + 130;
            var valueW = valueWInt + "px";
            var valueHInt = (sliderMultiplier) * 105 + 251;
            var valueH = valueHInt + "px";
            var valueImgHInt = (sliderMultiplier) * 105 + 195;
            var valueImgH = valueImgHInt + "px";

            var orig_Se_Container = document.querySelectorAll("[class*=_season]");

            for (var i = 0; i < orig_Se_Container.length; i++) {
                orig_Se_Container[i].style.width = valueW;
                orig_Se_Container[i].style.height = valueH;
                orig_Se_Container[i].childNodes[0].style.width = valueW;
                orig_Se_Container[i].childNodes[0].style.height = valueImgH;
                orig_Se_Container[i].childNodes[0].childNodes[0].style.width = valueW;
                orig_Se_Container[i].childNodes[0].childNodes[0].style.height = valueImgH;
                orig_Se_Container[i].childNodes[0].childNodes[0].childNodes[0].style.width = valueW;
                orig_Se_Container[i].childNodes[0].childNodes[0].childNodes[0].style.height = valueImgH;
            }
        });

        sliderObserver.observe(document.querySelector("[role*=slider]"), {
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-valuenow'],
        });

        parent_node.firstElementChild.style.height = "auto";
        var season_break = document.createElement("br");
        season_break.style.clear = "both";
        parent_node.appendChild(season_break);
    },

    insertEpisodeCount: async (all_seasons) => {
        await utils.timer(500);
        countnodelist = document.querySelectorAll("[class*=existing_season]>span[class*=MetadataPosterCardTitle-singleLineTitle]");
        seasonnodelist = document.querySelectorAll("[class*=existing_season]>a[class*=MetadataPosterCardTitle-singleLineTitle]");
        var retry = 0;
        while (countnodelist.length == 0 || countnodelist.length == 0) {
            retry++;
            await utils.timer(200);
            if (retry < 10) {
                utils.debug("Missing Episodes [async] (insertEpisodeCount) Plugin: Waiting for episode count...[" + retry + "]");
            }
            else {
                utils.debug("Missing Episodes [async] (insertEpisodeCount) Plugin: Could not set current episode count... Aborting.");
                return;
            }
            countnodelist = document.querySelectorAll("[class*=existing_season]>span[class*=MetadataPosterCardTitle-singleLineTitle]");
            seasonnodelist = document.querySelectorAll("[class*=existing_season]>a[class*=MetadataPosterCardTitle-singleLineTitle]");
        }
        for (var i = 0; i < countnodelist.length; i++) {
            var season = seasonnodelist[i].parentElement.id.replace("se_", "");
            var season_disp = season;
            var season_index = all_seasons.findIndex(item => item.number == season);
            var current_count = countnodelist[i].innerText.match(/\d+/);
            var season_total = all_seasons[season_index].episodes.length;
            utils.debug("Season: " + season_disp + " - Episodes: " + current_count + " / " + season_total + " Episodes");
            countnodelist[i].innerText = current_count + " / " + season_total + " episodes";
        }
    },

    // Episode Functions
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
                utils.debug("Missing Episodes [async] (processSeasons) Plugin: Trakt ID not found... Aborting.");
                return;
            }
        }

        var directory_metadata = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0];
        var season_metadata_id = directory_metadata.getAttribute("ratingKey");
        var season_num = directory_metadata.getAttribute("index");

        utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Finding all existing episodes for Season " + season_num);

        // store current page hash so plugin doesn't insert tiles if page changed
        var current_hash = location.hash;

        var present_episodes = await missing_episodes.getPresentEpisodes(season_metadata_id);
        utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Existing episodes populated: ");
        utils.debug(present_episodes);
        var all_episodes = await trakt_api.getAllMissing(show_id, type, season_num) || {};
        var season_check = all_episodes[0].episodes[0].season;
        if (season_check == 1) {
            season_disp = season_num;
            season_num = season_num - 1;
        }
        else if (String(season_check).match(/\d{4}/g)) {
            season_disp = season_num;
            season_num = all_episodes.findIndex(item => item.number == season_num);
        }
        else {
            season_disp = season_num;
        }
        if (Object.keys(all_episodes).length) {
            utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Season " + season_disp + " - " + + present_episodes.length + "/" + Object.keys(all_episodes[season_num].episodes).length + " currently present");
            utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Processing missing episodes");
            var tiles_to_insert = {};
            for (var i = 0; i < Object.keys(all_episodes[season_num].episodes).length; i++) {
                var episode = all_episodes[season_num].episodes;
                j = i + 1;
                if (present_episodes.indexOf(episode[i].number) === -1) {
                    utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Episode " + j + " is missing. Inserting in the list");
                    var episode_tile = missing_episodes.constructEpisodeTile(show_id, episode[i]);
                    tiles_to_insert[episode[i]["number"]] = episode_tile;
                }
                else {
                    utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Episode " + j + " is already present. Skipping.");
                }
            }
            // check if page changed before inserting tiles
            if (current_hash === location.hash) {

                utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Inserting episode tiles");
                missing_episodes.insertEpisodeTiles(tiles_to_insert);
            }
            else {
                utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Page changed before episode tiles could be inserted");
            }
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
            return null;
        }
    },

    constructEpisodeTile: function (show_name, episode) {
        ep = episode["number"];
        var orig_Ep_Container = document.querySelectorAll("[data-testid*=cellItem]")[0];

        var Ep_Container = orig_Ep_Container.cloneNode(true);
        var progressBar = Ep_Container.querySelectorAll("[class*=ProgressBar]")[0];

        if (progressBar) {
            progressBar.parentNode.removeChild(progressBar);
        }

        var orig_Poster_Container = orig_Ep_Container.childNodes[0];
        var orig_Poster_Img_Container = orig_Ep_Container.childNodes[0].childNodes[0];
        var orig_Poster_Img = orig_Ep_Container.childNodes[0].childNodes[0].childNodes[0];

        var Poster_Container = Ep_Container.childNodes[0];
        var Poster_Img_Container = Ep_Container.childNodes[0].childNodes[0];
        var Poster_Img = Ep_Container.childNodes[0].childNodes[0].childNodes[0];
        var Poster_Img_Link = Ep_Container.childNodes[0].childNodes[1];
        var Poster_BtmRt_Badge = Ep_Container.childNodes[0].childNodes[2];
        var Ep_Name_Link = Ep_Container.childNodes[1];
        var Ep_Num_Container = Ep_Container.childNodes[2];
        var Ep_Num_Link = Ep_Container.childNodes[2].childNodes[0];

        Ep_Container.setAttribute("id", "ep_" + ep);

        Ep_Container.classList.add("Ep_Container");
        Poster_Container.classList.add("Poster_Container");
        Poster_Img_Container.classList.add("Poster_Img_Container");
        Poster_Img.classList.add("Poster_Img");
        Poster_Img_Link.classList.add("Poster_Img_Link");
        Poster_BtmRt_Badge.classList.add("Poster_BtmRt_Badge");
        Ep_Name_Link.classList.add("Ep_Name_Link");
        Ep_Num_Container.classList.add("Ep_Num_Container");
        Ep_Num_Link.classList.add("Ep_Num_Link");

        Ep_Container.removeAttribute("style");
        Poster_Container.removeAttribute("style");
        Poster_Img_Container.removeAttribute("style");
        Poster_Img.removeAttribute("style");
        Poster_Img_Link.removeAttribute("style");
        Poster_BtmRt_Badge.removeAttribute("style");
        Ep_Name_Link.removeAttribute("style");
        Ep_Num_Container.removeAttribute("style");
        Ep_Num_Link.removeAttribute("style");

        Ep_Container.style.width = orig_Ep_Container.style.width;
        Ep_Container.style.height = orig_Ep_Container.style.height;
        Poster_Container.style.width = orig_Poster_Container.style.width;
        Poster_Container.style.height = orig_Poster_Container.style.height;
        Poster_Img_Container.style.width = orig_Poster_Img_Container.style.width;
        Poster_Img_Container.style.height = orig_Poster_Img_Container.style.height;
        Poster_Img.style.width = orig_Poster_Img.style.width;
        Poster_Img.style.height = orig_Poster_Img.style.height;

        var Poster_TopRt_Badge_Container = Ep_Container.childNodes[0].childNodes[3];
        if (Poster_TopRt_Badge_Container) {
            Ep_Container.childNodes[0].removeChild(Poster_TopRt_Badge_Container);
        }
        Ep_Container.classList.add("missing_episode");
        Poster_Img.src = utils.getResourcePath("trakt/trakt_episode_background_unavailable.png");
        Poster_Img_Link.setAttribute("href", "https://trakt.tv/shows/" + show_name + "/seasons/" + episode["season"] + "/episodes/" + episode["number"]);
        Poster_Img_Link.setAttribute("target", "_blank");
        Poster_Img_Link.setAttribute("aria-label", show_name + ", " + "Series " + episode["season"] + " Episode " + episode["number"] + ", " + episode["title"]);

        Ep_Name_Link.innerText = episode["title"] || "TBA";
        Ep_Name_Link.setAttribute("href", "https://trakt.tv/shows/" + show_name + "/seasons/" + episode["season"] + "/episodes/" + episode["number"]);
        Ep_Name_Link.setAttribute("target", "_blank");
        Ep_Name_Link.setAttribute("title", episode["title"]);

        Ep_Num_Link.innerText = "Episode " + episode["number"];
        Ep_Num_Link.setAttribute("href", "https://trakt.tv/shows/" + show_name + "/seasons/" + episode["season"] + "/episodes/" + episode["number"]);
        Ep_Num_Link.setAttribute("target", "_blank");
        Ep_Num_Link.setAttribute("title", episode["title"]);
        return Ep_Container;
    },

    insertEpisodeTiles: function (episode_tiles) {
        var sliderValue = document.querySelector("[role*=slider]");
        var sliderMultiplier = (sliderValue.ariaValueNow) - 1;
        var valueWInt = (sliderMultiplier) * 140 + 290;
        var valueW = valueWInt + "px";
        var valueHInt = (sliderMultiplier) * 78 + 219;
        var valueH = valueHInt + "px";
        var valueImgHInt = (sliderMultiplier) * 78 + 163;
        var valueImgH = valueImgHInt + "px";
        var hubTitle = document.querySelectorAll("[data-testid*=hubTitle]")[1].parentElement.parentElement;
        hubTitle.style.clear = "Both";
        var episode_tile_list = document.querySelectorAll("[data-testid*=cellItem]")[0].parentElement;
        var parent_node = document.querySelectorAll("[data-testid*=cellItem]")[0].parentElement.parentNode;
        episode_tile_list.style.padding = "0 40px 20px";
        var episode_tile_list_elements = episode_tile_list.childNodes;

        var episodeCount = episode_tile_list_elements.length;
        var EpCalc = 31 - (sliderMultiplier * 13);

        // insert already present episodes into episode_tiles array
        for (var i = 0; i < episode_tile_list_elements.length; i++) {
            var episode_num = episode_tile_list_elements[i].querySelectorAll("[class*=MetadataPosterCardTitle]")[1].innerText.match(/\d+/);

            var Ep_Container = episode_tile_list_elements[i];
            var Poster_Container = Ep_Container.childNodes[0];
            var Poster_Img_Container = Ep_Container.childNodes[0].childNodes[0];
            var Poster_Img = Ep_Container.childNodes[0].childNodes[0].childNodes[0];
            var Poster_Img_Link = Ep_Container.childNodes[0].childNodes[1];
            var Poster_BtmRt_Badge = Ep_Container.childNodes[0].childNodes[2];
            var Ep_Name_Link = Ep_Container.childNodes[1];
            var Ep_Num_Container = Ep_Container.childNodes[2];
            var Ep_Num_Link = Ep_Container.childNodes[2].childNodes[0];

            Ep_Container.setAttribute("id", "ep_" + episode_num);

            if (EpCalc > episodeCount) {
                Ep_Container.removeAttribute("style");
                Poster_Container.removeAttribute("style");
                Poster_Img_Container.removeAttribute("style");
                Poster_Img.removeAttribute("style");
                Poster_Img_Link.removeAttribute("style");
                Poster_BtmRt_Badge.removeAttribute("style");
                Ep_Name_Link.removeAttribute("style");
                Ep_Num_Container.removeAttribute("style");
                Ep_Num_Link.removeAttribute("style");
                Ep_Container.classList.add("Ep_Container");
            }

            Ep_Container.classList.add("existing_episode");
            Poster_Container.classList.add("Poster_Container");
            Poster_Img_Container.classList.add("Poster_Img_Container");
            Poster_Img.classList.add("Poster_Img");
            Poster_Img_Link.classList.add("Poster_Img_Link");
            Poster_BtmRt_Badge.classList.add("Poster_BtmRt_Badge");
            Ep_Name_Link.classList.add("Ep_Name_Link");
            Ep_Num_Container.classList.add("Ep_Num_Container");
            Ep_Num_Link.classList.add("Ep_Num_Link");

            Ep_Container.style.width = valueW;
            Ep_Container.style.height = valueH;
            Poster_Container.style.width = valueW;
            Poster_Container.style.height = valueImgH;
            Poster_Img_Container.style.width = valueW;
            Poster_Img_Container.style.height = valueImgH;
            Poster_Img.style.width = valueW;
            Poster_Img.style.height = valueImgH;

            episode_tiles[episode_num] = Ep_Container;
        }

        // iterate over all episode tiles, present and missing, to reinsert back into episode tile list in order
        var j = 0;
        for (var episode_number in episode_tiles) {
            var episode_tile = episode_tiles[episode_number];

            episode_tile_list.insertBefore(episode_tile, episode_tile_list_elements[j]);
            j++;
        }

        // reinsert episode tile list node
        parent_node.setAttribute("id", "Ep_Parent");
        parent_node.appendChild(episode_tile_list);

        if (EpCalc <= episodeCount) {
            utils.debug("Missing Episodes (insertEpisodeTiles) Plugin: Episode count too high at current zoom level. Currently not supported due to the way Plex dynamically generates the list.");
            var missing_eps = document.querySelectorAll("[class*=missing_episode]");
            var episodeCountMissing = missing_eps.length;
            for (i = 0; i < episodeCountMissing; i++) {
                missing_eps[i].style.display = "none";
            }
        }

        sliderObserver = new MutationObserver((mutations) => {
            utils.debug("Missing Episodes (insertEpisodeTiles) (sliderObserver) Plugin: Slider value change detected.");
            var sliderMultiplier = (sliderValue.ariaValueNow) - 1;
            var valueWInt = (sliderMultiplier) * 140 + 290;
            var valueW = valueWInt + "px";
            var valueHInt = (sliderMultiplier) * 78 + 219;
            var valueH = valueHInt + "px";
            var valueImgHInt = (sliderMultiplier) * 78 + 163;
            var valueImgH = valueImgHInt + "px";

            var episode_tile_list_elements = document.querySelectorAll("[class*=existing_episode]");
            var episodeCount = episode_tile_list_elements.length;
            var EpCalc = 31 - (sliderMultiplier * 13);
            if (EpCalc <= episodeCount) {
                utils.debug("Missing Episodes (insertEpisodeTiles) (sliderObserver) Plugin: Episode count too high at current zoom level. Currently not supported due to the way Plex dynamically generates the list.");
                var missing_eps = document.querySelectorAll("[class*=missing_episode]");
                var episodeCountMissing = missing_eps.length;
                for (i = 0; i < episodeCountMissing; i++) {
                    missing_eps[i].style.display = "none";
                }
                var existing_eps = document.querySelectorAll("[class*=existing_episode]");
                var episodeCountexisting = existing_eps.length;
                for (i = 0; i < episodeCountexisting; i++) {
                    existing_eps[i].classList.remove("Ep_Container");
                    existing_eps[i].style.willChange = "transform";
                    existing_eps[i].style.position = "absolute";
                }
            }
            else {
                var orig_Ep_Container = document.querySelectorAll("[class*=_episode]");
                utils.debug("Missing Episodes (insertEpisodeTiles) (sliderObserver) Plugin: Setting new Height & Width");
                for (var i = 0; i < orig_Ep_Container.length; i++) {
                    orig_Ep_Container[i].classList.add("Ep_Container");
                    orig_Ep_Container[i].removeAttribute("style");
                    orig_Ep_Container[i].style.width = valueW;
                    orig_Ep_Container[i].style.height = valueH;
                    orig_Ep_Container[i].childNodes[0].style.width = valueW;
                    orig_Ep_Container[i].childNodes[0].style.height = valueImgH;
                    orig_Ep_Container[i].childNodes[0].childNodes[0].style.width = valueW;
                    orig_Ep_Container[i].childNodes[0].childNodes[0].style.height = valueImgH;
                    orig_Ep_Container[i].childNodes[0].childNodes[0].childNodes[0].style.width = valueW;
                    orig_Ep_Container[i].childNodes[0].childNodes[0].childNodes[0].style.height = valueImgH;
                }
            }
        });

        sliderObserver.observe(document.querySelector("[role*=slider]"), {
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-valuenow'],
        });
    }
};