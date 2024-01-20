imdb = {
    metadata_xml: null,

    init: function (metadata_xml, server, type) {
        imdb.insertImdbLink(type, metadata_xml);
    },
    constructImdbLink: function (imdb_url) {
        var logo_url = utils.getResourcePath("imdb/imdb_logo.png");
        var imdb_container_element = document.createElement("span");
        imdb_container_element.setAttribute("id", "imdb-container");
        imdb_container_element.style.backgroundColor = "transparent";
        imdb_container_element.classList.add("ep_container");
        // construct link
        var imdb_element_link = document.createElement("a");
        imdb_element_link.setAttribute("id", "imdb-link");
        imdb_element_link.setAttribute("href", imdb_url);
        imdb_element_link.setAttribute("target", "_blank");

        // construct logo
        var imdb_element_img = document.createElement("img");
        imdb_element_img.setAttribute("src", logo_url);
        imdb_element_img.setAttribute("height", "20px");

        imdb_element_link.appendChild(imdb_element_img);
        imdb_container_element.appendChild(imdb_element_link);

        return imdb_container_element;
    },

    insertImdbLink: async (type, metadata_xml) => {
        imdb_exists = document.getElementById("imdb-container");
        if (imdb_exists) {
            utils.debug("IMDB Plugin [async] (insertImdbLink): IMDB already present on page. Skipping.");
        }
        else {
            var site = "imdb";
            utils.debug("IMDB Plugin [async] (insertImdbLink): Lauching TMDB API (Site: " + site + ") (Type: " + type + ")");
            imdb_id = await tmdb_api.getId(site, type, metadata_xml);
            if (imdb_id) {
                utils.debug("IMDB Plugin [async] (insertImdbLink): TMDB API returned the following IMDB ID (" + imdb_id + ")");
                url = "http://www.imdb.com/title/" + imdb_id;
                // create imdb link element
                var imdb_container = imdb.constructImdbLink(url);

                // insert imdb link element to bottom of metadata container
                utils.debug("IMDB Plugin [async] (insertImdbLink): Inserting IMDB container into page");
                document.getElementById("ep_links").appendChild(imdb_container);
            }
            else {
                utils.debug("IMDB Plugin [async] (insertImdbLink): TMDB API did not find the IMDB ID... Aborting.");
            }
        }
    }
};