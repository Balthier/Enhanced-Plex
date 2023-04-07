imdb = {
    metadata_xml: null,

    init: function (metadata_xml, type, parent_element) {
        imdb.insertImdbLink(type, metadata_xml, parent_element);
    },
    constructImdbLink: function (imdb_url, parent_element) {
        var logo_url = utils.getResourcePath("imdb/imdb_logo.png")
        var imdb_container_element = document.createElement("span");
        imdb_container_element.setAttribute("id", "imdb-container");
        template_check = parent_element.children[0].children[0].children[0]
        if (template_check) {
            imdb_container_element.classList = template_check.classList
        }
        else {
            imdb_container_element.classList = parent_element.children[0].classList
        }
        imdb_container_element.style.backgroundColor = "transparent";
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

    insertImdbLink: async (type, metadata_xml, parent_element) => {
        var site = "imdb"
        utils.debug("IMDB Plugin [async] (insertImdbLink): Lauching TMDB API (Site: " + site + ") (Type: " + type + ")");
        imdb_id = await tmdb_api.getId(site, type, metadata_xml);
        if (imdb_id) {
            utils.debug("IMDB Plugin [async] (insertImdbLink): TMDB API returned the following IMDB ID (" + imdb_id + ")");
            url = "http://www.imdb.com/title/" + imdb_id;
            // create imdb link element
            var imdb_container = imdb.constructImdbLink(url, parent_element);

            // insert imdb link element to bottom of metadata container
            utils.debug("IMDB Plugin [async] (insertImdbLink): Inserting IMDB container into page");
            document.getElementById("Enhanced-Plex-Banner").appendChild(imdb_container);
        }
        else {
            utils.debug("IMDB Plugin [async] (insertImdbLink): TMDB API did not find the IMDB ID... Aborting.");
        }
    }
}