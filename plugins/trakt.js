trakt = {
	init: function (TraktData) {
		trakt.constructTraktDetails(TraktData);
	},
	constructTraktDetails: function (TraktData) {
		const TraktContainer = document.getElementById("trakt-container");
		if (!TraktContainer) {
			const TraktType = TraktData.Type;
			const TraktSlug = TraktData.IDs.TraktSlug;
			let BaseURL;
			if (TraktType == "show") {
				BaseURL = "https://trakt.tv/shows";
			}
			else if (TraktType == "movie") {
				BaseURL = "https://trakt.tv/movies";
			}
			const TraktURL = `${BaseURL}/${TraktSlug}`;
			const logo_url = utils.getResourcePath("trakt/trakt_logo.png");
			const trakt_container = document.createElement("span");
			const trakt_link_element = document.createElement("a");
			trakt_container.style.backgroundColor = "transparent";
			trakt_container.setAttribute("id", "trakt-container");
			trakt_container.classList.add("ep_container");

			trakt_link_element.setAttribute("id", "trakt-link");
			trakt_link_element.setAttribute("href", TraktURL);
			trakt_link_element.setAttribute("target", "_blank");

			// construct logo
			const trakt_element_img = document.createElement("img");
			trakt_element_img.setAttribute("src", logo_url);
			trakt_element_img.setAttribute("height", "20px");

			trakt_link_element.appendChild(trakt_element_img);
			trakt_container.appendChild(trakt_link_element);
			utils.debug("Trakt Plugin (insertTraktInfo): Inserting trakt container into page");
			document.getElementById("ep_links").appendChild(trakt_container);

			const parent_box = document.getElementById("ep_infobox");
			if (parent_box) {
				if (TraktData?.Homepage) {
					const homepage = document.createElement("p");
					homepage.innerHTML = "<b>Homepage:</b> <a href='" + TraktData.Homepage + "' target='_blank'>" + TraktData.Homepage + "</a>";
					parent_box.appendChild(homepage);
				}
				if (TraktData?.Status) {
					const status_raw = TraktData.Status;
					let status_text = status_raw.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
					if (status_text == "Canceled") {
						status_text = "Cancelled";
					}
					const current_status = document.createElement("p");
					current_status.innerHTML = "<b>Status:</b> " + status_text;
					parent_box.appendChild(current_status);
				}
				if (TraktData?.Runtime) {
					const runtime = document.createElement("p");
					runtime.innerHTML = "<b>Runtime:</b> " + TraktData.Runtime + " minutes";
					parent_box.appendChild(runtime);
				}
				if (TraktData?.Network) {
					const network = document.createElement("p");
					network.innerHTML = "<b>Network:</b> " + TraktData.Network;
					parent_box.appendChild(network);
				}
				if (TraktData?.FirstAired) {
					const FirstAired = document.createElement("p");
					const first_aired = new Date(TraktData.FirstAired).toLocaleDateString();
					FirstAired.innerHTML = "<b>First Aired:</b> " + first_aired;
					parent_box.appendChild(FirstAired);
				}
				if (TraktData?.FirstReleased) {
					const FirstReleased = document.createElement("p");
					const released = new Date(TraktData.FirstReleased).toLocaleDateString();
					FirstReleased.innerHTML = "<b>Released:</b> " + released;
					parent_box.appendChild(FirstReleased);
				}
				if (TraktData?.Trailer) {
					const trailer = document.createElement("p");
					trailer.innerHTML = "<b>Trailer:</b> <a href='" + TraktData.Trailer + "' target='_blank'>" + TraktData.Trailer + "</a>";
					parent_box.appendChild(trailer);
				}
			}
		}
		else {
			utils.debug("Trakt Plugin (insertTraktInfo): Trakt already present on page. Skipping.");
		}
	}
};