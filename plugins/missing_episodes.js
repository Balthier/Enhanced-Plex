missing_episodes = {
	init: async (metadata_xml, server, type, TraktData) => {
		missing_episodes.insertSwitch();
		console.log("Missing_Ep TraktData:");
		console.log(TraktData);
		if (type === "season") {
			missing_episodes.processEpisodes(server, metadata_xml, TraktData);
		}
		else if (type === "show") {
			missing_episodes.processSeasons(server, metadata_xml, TraktData);
		}
	},

	insertSwitch: function () {
		const button_template = document.body.querySelector("[data-testid*=preplay-more]");
		const action_bar = button_template.parentNode;
		const switch_container = document.createElement("button");

		switch_container.style.cssText = button_template.style.cssText;
		switch_container.setAttribute("class", button_template.getAttribute("class"));
		switch_container.setAttribute("id", "missing-switch");
		switch_container.setAttribute("data-state", "show");
		switch_container.setAttribute("data-original-title", "Hide missing episodes/seasons");
		switch_container.addEventListener("click", missing_episodes.switchState, false);

		const glyph = document.createElement("i");
		glyph.setAttribute("class", "glyphicon eye-open");

		switch_container.appendChild(glyph);
		// insert switch before secondary actions dropdown
		action_bar.insertBefore(switch_container, button_template);
	},

	switchState: function () {
		const missing_switch = document.getElementById("missing-switch");
		const glyph = missing_switch.getElementsByTagName("i")[0];
		const state = missing_switch.getAttribute("data-state");

		const missing_episodes = document.getElementsByClassName("missing_episode");
		for (let i = 0; i < missing_episodes.length; i++) {
			if (state === "show") {
				missing_episodes[i].style.display = "none";
			}
			else {
				missing_episodes[i].style.display = "block";
			}
		}

		const missing_seasons = document.getElementsByClassName("missing_season");
		for (let i = 0; i < missing_seasons.length; i++) {
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
	processSeasons: async (server, metadata_xml, TraktData) => {
		const TraktSlug = TraktData.IDs.TraktSlug;
		const show_metadata_id = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0].getAttribute("ratingKey");

		utils.debug("Missing Episodes [async] (processSeasons) Plugin: Finding all present seasons");

		// store current page hash so plugin doesn't insert tiles if page changed
		const current_hash = location.hash;
		const present_seasons = await missing_episodes.getPresentSeasons(server, show_metadata_id);

		utils.debug("Missing Episodes [async] (processSeasons) Plugin: Existing seasons populated, finding missing seasons");
		const all_seasons = TraktData.Seasons;


		if (present_seasons.length == all_seasons.length) {
			utils.debug("Missing Episodes [async] (processSeasons) Plugin: All Seasons are present - " + present_seasons.length + "/" + all_seasons.length);
		}
		else {
			utils.debug("Missing Episodes [async] (processSeasons) Plugin: " + present_seasons.length + "/" + all_seasons.length + " currently present");
			utils.debug("Missing Episodes [async] (processSeasons) Plugin: Processing missing seasons");
		}
		const tiles_to_insert = {};
		for (const Season of all_seasons) {
			const SeasonNum = Season["Number"];
			if (present_seasons.indexOf(SeasonNum) === -1) {
				utils.debug("Missing Episodes [async] (processSeasons) Plugin: Season " + SeasonNum + " is missing. Inserting in the list");
				const season_tile = missing_episodes.constructSeasonTile(TraktSlug, Season);
				tiles_to_insert[SeasonNum] = season_tile;
			}
		}

		// check if page changed before inserting tiles
		if (current_hash === location.hash) {
			await missing_episodes.insertSeasonTiles(server, tiles_to_insert, metadata_xml);
			await missing_episodes.insertEpisodeCount(all_seasons);
		}
		else {
			utils.debug("Missing Episodes [async] (processSeasons) Plugin: Page changed before season tiles could be inserted");
		}
	},

	getPresentSeasons: async (server, show_metadata_id) => {
		utils.debug("Missing Episodes [async] (getPresentSeasons) Plugin: Fetching seasons xml");
		const seasons_metadata_xml_url = server["uri"] + "/library/metadata/" + show_metadata_id + "/children?X-Plex-Token=" + server["access_token"]; // Can this be combined?
		const seasons_metadata_xml = await utils.getXML(seasons_metadata_xml_url);
		const seasons_xml = seasons_metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
		const seasons = [];
		for (const Season of seasons_xml) {
			const season_index = parseInt(Season.getAttribute("index"));
			if (!isNaN(season_index)) {
				seasons.push(season_index);
			}
		}
		return seasons;
	},

	constructSeasonTile: function (show_name, season) {
		const season_num = season["Number"];
		const orig_Se_Container = document.querySelectorAll("[data-testid*=cellItem]")[0];

		const Se_Container = orig_Se_Container.cloneNode(true);

		const Poster_Container = Se_Container.querySelector(':scope > div');
		const Se_Name_Link = Se_Container.querySelector("a[data-testid*=metadataTitleLink]");
		const Se_Num_Container = Se_Name_Link ? Se_Name_Link.nextElementSibling : null;
		const Poster_Img_Link = Poster_Container ? Poster_Container.querySelector("a[role='link'][aria-label]") : null;
		const Poster_Img = Poster_Container ? Poster_Container.querySelector("img") : null;
		const Poster_Img_Container = Poster_Container ? Poster_Container.querySelector(':scope > div:first-child') : null;
		const Poster_BtmRt_Badge = Poster_Container ? Poster_Container.querySelector('div:not(:first-child)') : null;
		const orig_Poster_Container = orig_Se_Container.querySelector(':scope > div');
		const orig_Poster_Img_Container = orig_Poster_Container ? orig_Poster_Container.querySelector(':scope > div:first-child') : null;
		const orig_Poster_Img = orig_Poster_Container ? orig_Poster_Container.querySelector('img') : null;

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

		const Poster_TopRt_Badge_Container = Se_Container.childNodes[0].childNodes[3];
		if (Poster_TopRt_Badge_Container) {
			Se_Container.childNodes[0].removeChild(Poster_TopRt_Badge_Container);
		}
		const link = "https://trakt.tv/shows/" + show_name + "/seasons/" + season_num;
		Poster_Img.src = utils.getResourcePath("trakt/trakt_season_background_unavailable.png");
		Poster_Img_Link.setAttribute("href", link);
		Poster_Img_Link.setAttribute("target", "_blank");
		Poster_Img_Link.setAttribute("aria-label", show_name + ", " + "Season " + season_num);

		Se_Name_Link.innerText = "Season " + season_num;
		Se_Name_Link.setAttribute("href", link);
		Se_Name_Link.setAttribute("target", "_blank");
		Se_Name_Link.setAttribute("title", "Season " + season_num);

		Se_Num_Container.innerText = "0 / " + season["Episodes"].length + " episodes";

		return Se_Container;
	},
	calculateSeasonSlider: function (sliderMultiplier) {
		const valueWInt = (sliderMultiplier) * 70 + 130;
		const valueW = valueWInt + "px";
		const valueHInt = (sliderMultiplier) * 105 + 251;
		const valueH = valueHInt + "px";
		const valueImgHInt = (sliderMultiplier) * 105 + 195;
		const valueImgH = valueImgHInt + "px";

		return { valueW, valueH, valueImgH };
	},
	insertSeasonTiles: async (server, season_tiles, metadata_xml) => {
		const directory_metadata = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0];
		const show_metadata_id = directory_metadata.getAttribute("ratingKey");
		const seasons_metadata_xml_url = server["uri"] + "/library/metadata/" + show_metadata_id + "/children?X-Plex-Token=" + server["access_token"]; // Can this be combined?
		const seasons_metadata_xml = await utils.getXML(seasons_metadata_xml_url);
		const seasons_xml = seasons_metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
		const seasons = {};
		for (const Season of seasons_xml) {
			const season_index = parseInt(Season.getAttribute("index"));
			if (!isNaN(season_index)) {
				const season_title = Season.getAttribute("title").replace("&amp;", "&");
				seasons[season_title] = season_index;
			}
		}
		const sliderValue = document.querySelector("[role*=slider]");
		const sliderMultiplier = (sliderValue.ariaValueNow) - 1;
		const { valueW, valueH, valueImgH } = missing_episodes.calculateSeasonSlider(sliderMultiplier);

		const season_tile_list = document.querySelectorAll("[data-testid*=cellItem]")[0].parentElement;
		season_tile_list.style.display = "flex";
		season_tile_list.style.flexWrap = "wrap";
		season_tile_list.style.width = "auto";
		season_tile_list.style.height = "auto";
		const parent_node = season_tile_list.parentNode;
		season_tile_list.style.padding = "0 40px 20px";
		const season_tile_list_elements = season_tile_list.children;

		// insert already present seasons into season_tiles array
		for (const season_tile_list_element of season_tile_list_elements) {
			const Se_Container = season_tile_list_element;
			const Se_Name_Link = Se_Container.querySelector("[data-testid*=metadataTitleLink]");
			const season_text = Se_Name_Link.innerHTML.replace("&amp;", "&");
			const season_num = season_text.match(/\d+/) || seasons[season_text];
			const Poster_Container = Se_Container.querySelector(':scope > div');
			const Poster_Img_Container = Poster_Container.querySelector(':scope > div:first-child');
			const Poster_Img = Poster_Container.querySelector('img');
			const Poster_Img_Link = Poster_Container.querySelector('a[role="link"]');
			// NOTE: This selection is tricky due to lack of unique attribute, but works based on structure
			const Poster_BtmRt_Badge = Poster_Container.querySelector('div:not(:first-child)');
			const Se_Num_Container = Se_Name_Link.nextElementSibling;

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
				season_tiles[season_num] = Se_Container;
			}
			else {
				season_tiles["specials"] = Se_Container;
			}
		}
		// iterate over all season tiles, present and missing, to reinsert back into season tile list in order
		const fragment = document.createDocumentFragment();
		for (const season_number in season_tiles) {
			const season_tile = season_tiles[season_number];

			if (season_number === "specials") {
				fragment.prepend(season_tile);
			}
			else {
				fragment.appendChild(season_tile);
			}
		}

		while (season_tile_list.firstChild) {
			season_tile_list.removeChild(season_tile_list.firstChild);
		}

		season_tile_list.appendChild(fragment);

		const sliderObserver = new MutationObserver((mutations) => {
			utils.debug("Missing Episodes (insertSeasonTiles) (sliderObserver) Plugin: Slider value change detected. Setting new Height & Width");

			const sliderMultiplier = parseFloat(sliderValue.ariaValueNow) - 1;
			const { valueW, valueH, valueImgH } = missing_episodes.calculateSeasonSlider(sliderMultiplier);

			const all_season_containers = document.querySelectorAll("[class*=Se_Container]");

			for (const season_container of all_season_containers) {
				const container = season_container;
				const pContainer = container.querySelector(':scope > div');
				const pImgContainer = pContainer ? pContainer.querySelector(':scope > div:first-child') : null;
				const pImg = pContainer ? pContainer.querySelector('img') : null;
				container.style.width = valueW;
				container.style.height = valueH;

				if (pContainer) {
					pContainer.style.width = valueW;
					pContainer.style.height = valueImgH;
				}
				if (pImgContainer) {
					pImgContainer.style.width = valueW;
					pImgContainer.style.height = valueImgH;
				}
				if (pImg) {
					pImg.style.width = valueW;
					pImg.style.height = valueImgH;
				}
			}
		});

		sliderObserver.observe(document.querySelector("[role*=slider]"), {
			subtree: true,
			attributes: true,
			attributeFilter: ['aria-valuenow'],
		});

		parent_node.firstElementChild.style.height = "auto";
		const season_break = document.createElement("br");
		season_break.style.clear = "both";
		parent_node.appendChild(season_break);
	},

	insertEpisodeCount: async (all_seasons) => {
		utils.debug("Missing Episodes [async] (insertEpisodeCount) Plugin: Inserting Episode count");
		const countnodelist = document.querySelectorAll("[class*=existing_season]>span[class*=MetadataPosterCardTitle-singleLineTitle]");
		for (const countnode of countnodelist) {
			const season = countnode.parentElement.id.replace("se_", "");
			const season_disp = season;
			const season_index = all_seasons.findIndex(item => item.Number == season);
			const current_count = countnode.innerText.match(/\d+/);
			const season_total = all_seasons[season_index].Episodes.length;
			utils.debug("Season: " + season_disp + " - Episodes: " + current_count + " / " + season_total + " Episodes");
			countnode.innerText = current_count + " / " + season_total + " episodes";
		}
	},

	// Episode Functions
	processEpisodes: async (server, metadata_xml, TraktData) => {
		const TraktSlug = TraktData.IDs.TraktSlug;
		const directory_metadata = metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory")[0];
		const season_metadata_id = directory_metadata.getAttribute("ratingKey");
		const season_num = directory_metadata.getAttribute("index");

		utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Finding all existing episodes for Season " + season_num);

		// store current page hash so plugin doesn't insert tiles if page changed
		const current_hash = location.hash;

		const present_episodes = await missing_episodes.getPresentEpisodes(server, season_metadata_id);
		utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Existing episodes populated: ");
		utils.debug(present_episodes);
		const target_season = TraktData.Seasons.find(s => s.Number == season_num);
		const all_episodes = target_season ? target_season.Episodes : [];
		console.log(all_episodes);

		const season_disp = season_num;
		if (all_episodes.length) {
			if (present_episodes.length == all_episodes.length) {
				utils.debug("Missing Episodes [async] (processEpisodes) Plugin: All episodes are present for Season " + season_disp + " - " + present_episodes.length + "/" + all_episodes.length);
			}
			else {
				utils.debug("Missing Episodes [async] (processSeasons) Plugin: " + present_episodes.length + "/" + all_episodes.length + " currently present");
				utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Processing missing episodes");
				const tiles_to_insert = {};
				let j = 1;
				for (const episode of all_episodes) {
					if (present_episodes.indexOf(episode.Number) === -1) {
						utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Episode " + j + " is missing. Inserting in the list");
						const episode_tile = missing_episodes.constructEpisodeTile(TraktSlug, episode);
						tiles_to_insert[episode["Number"]] = episode_tile;
					}
					else {
						utils.debug("Missing Episodes [async] (processEpisodes) Plugin: Episode " + j + " is already present. Skipping.");
					}
					j++;
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
		}
	},

	getPresentEpisodes: async (server, season_metadata_id) => {
		utils.debug("Missing Episodes [async] (getPresentEpisodes) Plugin: Fetching season episodes xml");
		const episodes_metadata_xml_url = server["uri"] + "/library/metadata/" + season_metadata_id + "/children?X-Plex-Token=" + server["access_token"];

		const episodes_metadata_xml = await utils.getXML(episodes_metadata_xml_url);
		if (Object.keys(episodes_metadata_xml).length) {

			const episodes_xml = episodes_metadata_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");
			const episodes = [];
			for (const episode_xml of episodes_xml) {
				episodes.push(parseInt(episode_xml.getAttribute("index")));
			}
			return episodes;
		}
		else {
			return null;
		}
	},

	constructEpisodeTile: function (show_name, episode) {
		const ep = episode["Number"];
		const orig_Ep_Container = document.querySelector("[data-testid*=cellItem]");

		const Ep_Container = orig_Ep_Container.cloneNode(true);
		const progressBar = Ep_Container.querySelectorAll("[class*=ProgressBar]")[0];

		if (progressBar) {
			progressBar.parentNode.removeChild(progressBar);
		}

		const orig_Poster_Container = orig_Ep_Container.querySelector(':scope > div');
		const orig_Poster_Img_Container = orig_Poster_Container.querySelector(':scope > div:first-child');
		const orig_Poster_Img = orig_Poster_Container.querySelector('img');

		// Query the cloned container's elements
		const Poster_Container = Ep_Container.querySelector(':scope > div');
		const Poster_Img_Container = Poster_Container.querySelector(':scope > div:first-child');
		const Poster_Img = Poster_Container.querySelector('img');
		const Poster_Img_Link = Poster_Container.querySelector('a[role="link"]');
		const Poster_BtmRt_Badge = Poster_Container.querySelector('div.MetadataPosterCard-bottomRightBadge-Y6Ry2h'); // Use class for specificity
		const Ep_Name_Link = Ep_Container.querySelector("[data-testid*=metadataTitleLink]");
		const Ep_Num_Container = Ep_Name_Link.nextElementSibling;
		const Ep_Num_Link = Ep_Num_Container.querySelector('a');

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

		const Poster_TopRt_Badge_Container = Ep_Container.querySelector('[class*="MetadataPosterCardBadge-topRightBadge"]');
		if (Poster_TopRt_Badge_Container) {
			Poster_TopRt_Badge_Container.remove();
		}
		Ep_Container.classList.add("missing_episode");
		Poster_Img.src = utils.getResourcePath("trakt/trakt_episode_background_unavailable.png");
		Poster_Img_Link.setAttribute("href", "https://trakt.tv/shows/" + show_name + "/seasons/" + episode["Season"] + "/episodes/" + episode["Number"]);
		Poster_Img_Link.setAttribute("target", "_blank");
		Poster_Img_Link.setAttribute("aria-label", show_name + ", " + "Series " + episode["Season"] + " Episode " + episode["Number"] + ", " + episode["Title"]);

		Ep_Name_Link.innerText = episode["Title"] || "TBA";
		Ep_Name_Link.setAttribute("href", "https://trakt.tv/shows/" + show_name + "/seasons/" + episode["Season"] + "/episodes/" + episode["Number"]);
		Ep_Name_Link.setAttribute("target", "_blank");
		Ep_Name_Link.setAttribute("title", episode["Title"]);

		Ep_Num_Link.innerText = "Episode " + episode["Number"];
		Ep_Num_Link.setAttribute("href", "https://trakt.tv/shows/" + show_name + "/seasons/" + episode["Season"] + "/episodes/" + episode["Number"]);
		Ep_Num_Link.setAttribute("target", "_blank");
		Ep_Num_Link.setAttribute("title", episode["Title"]);
		return Ep_Container;
	},
	calculateEpisodeSlider: function (sliderMultiplier) {
		const valueWInt = (sliderMultiplier) * 140 + 290;
		const valueW = valueWInt + "px";
		const valueHInt = (sliderMultiplier) * 78 + 219;
		const valueH = valueHInt + "px";
		const valueImgHInt = (sliderMultiplier) * 78 + 163;
		const valueImgH = valueImgHInt + "px";

		return { valueW, valueH, valueImgH };
	},
	insertEpisodeTiles: function (episode_tiles) {
		const sliderValue = document.querySelector("[role*=slider]");
		const sliderMultiplier = parseFloat(sliderValue.ariaValueNow) - 1;
		const { valueW, valueH, valueImgH } = missing_episodes.calculateEpisodeSlider(sliderMultiplier);
		const hubTitle = document.querySelector("[data-testid*=hubTitle]").parentElement.parentElement;
		hubTitle.style.clear = "Both";
		const episode_tile_list = document.querySelector("[data-testid*=cellItem]").parentElement;
		episode_tile_list.style.display = "flex";
		episode_tile_list.style.flexWrap = "wrap";
		episode_tile_list.style.width = "auto";
		episode_tile_list.style.height = "auto";
		const parent_node = episode_tile_list.parentNode;
		episode_tile_list.style.padding = "0 40px 20px";
		const episode_tile_list_elements = episode_tile_list.children;

		const episodeCount = episode_tile_list_elements.length;
		const EpCalc = 31 - (sliderMultiplier * 13);

		// insert already present episodes into episode_tiles array
		for (const episode_tile_list_element of episode_tile_list_elements) {
			const Ep_Container = episode_tile_list_element;

			// --- ROBUST QUERIES (Using stable structure) ---
			const Ep_Name_Link = Ep_Container.querySelector("[data-testid*=metadataTitleLink]");
			const Ep_Num_Container = Ep_Name_Link.nextElementSibling;
			const Ep_Num_Link = Ep_Num_Container.querySelector('a');

			const Poster_Container = Ep_Container.querySelector(':scope > div');
			const Poster_Img_Container = Poster_Container.querySelector(':scope > div:first-child');
			const Poster_Img = Poster_Container.querySelector('img');
			const Poster_Img_Link = Poster_Container.querySelector('a[role="link"]');
			const Poster_BtmRt_Badge = Poster_Container.querySelector('div.MetadataPosterCard-bottomRightBadge-Y6Ry2h');

			const episode_num = Ep_Num_Link.innerText.match(/\d+/);

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
		const fragment = document.createDocumentFragment();
		for (const episode_number in episode_tiles) {
			const episode_tile = episode_tiles[episode_number];

			fragment.appendChild(episode_tile);
		}

		while (episode_tile_list.firstChild) {
			episode_tile_list.removeChild(episode_tile_list.firstChild);
		}

		episode_tile_list.appendChild(fragment);

		// reinsert episode tile list node
		parent_node.setAttribute("id", "Ep_Parent");
		parent_node.appendChild(episode_tile_list);

		if (EpCalc <= episodeCount) {
			utils.debug("Missing Episodes (insertEpisodeTiles) Plugin: Episode count too high at current zoom level. Currently not supported due to the way Plex dynamically generates the list.");
			const missing_eps = document.querySelectorAll("[class*=missing_episode]");
			const episodeCountMissing = missing_eps.length;
			for (i = 0; i < episodeCountMissing; i++) {
				missing_eps[i].style.display = "none";
			}
		}

		const sliderObserver = new MutationObserver((mutations) => {
			utils.debug("Missing Episodes (insertEpisodeTiles) (sliderObserver) Plugin: Slider value change detected.");

			const sliderMultiplier = parseFloat(sliderValue.ariaValueNow) - 1;
			const { valueW, valueH, valueImgH } = missing_episodes.calculateEpisodeSlider(sliderMultiplier);

			const episode_tile_list_elements = document.querySelectorAll("[class*=existing_episode]");
			const episodeCount = episode_tile_list_elements.length;
			const EpCalc = 31 - (sliderMultiplier * 13);
			if (EpCalc <= episodeCount) {
				utils.debug("Missing Episodes (insertEpisodeTiles) (sliderObserver) Plugin: Episode count too high at current zoom level. Currently not supported due to the way Plex dynamically generates the list.");
				const missing_eps = document.querySelectorAll("[class*=missing_episode]");
				const episodeCountMissing = missing_eps.length;
				for (let i = 0; i < episodeCountMissing; i++) {
					missing_eps[i].style.display = "none";
				}
				const existing_eps = document.querySelectorAll("[class*=existing_episode]");
				const episodeCountexisting = existing_eps.length;
				for (let i = 0; i < episodeCountexisting; i++) {
					existing_eps[i].classList.remove("Ep_Container");
					existing_eps[i].style.willChange = "transform";
					existing_eps[i].style.position = "absolute";
				}
			}
			else {
				const orig_Ep_Containers = document.querySelectorAll("[class*=_episode]");
				utils.debug("Missing Episodes (insertEpisodeTiles) (sliderObserver) Plugin: Setting new Height & Width");

				for (const orig_Ep_Container of orig_Ep_Containers) {
					const container = orig_Ep_Container;
					const pContainer = container.querySelector(':scope > div');
					const pImgContainer = pContainer ? pContainer.querySelector(':scope > div:first-child') : null;
					const pImg = pContainer ? pContainer.querySelector('img') : null;
					container.classList.add("Ep_Container");
					container.removeAttribute("style");
					container.style.width = valueW;
					container.style.height = valueH;

					if (pContainer) {
						pContainer.style.width = valueW;
						pContainer.style.height = valueImgH;
					}
					if (pImgContainer) {
						pImgContainer.style.width = valueW;
						pImgContainer.style.height = valueImgH;
					}
					if (pImg) {
						pImg.style.width = valueW;
						pImg.style.height = valueImgH;
					}
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