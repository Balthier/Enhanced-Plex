imdb = {
    metadata_xml: null,

    init: function (metadata_xml, type) {
        imdb.insertImdbLink(type, metadata_xml);
    },
    constructImdbLink: function (imdb_url) {
        var sister_containers = document.querySelectorAll("[class*=sprinkles_display_flex]")[2].children;
        var container_element_template = sister_containers[0]
        var logo_url = utils.getResourcePath("imdb/imdb_logo.png")
        var imdb_container_element = document.createElement("span");
        imdb_container_element.setAttribute("id", "imdb-container");
        imdb_container_element.setAttribute("class", container_element_template.getAttribute("class"));

        if (container_element_template) {
            // Set the class of the last element
            var last_sister = sister_containers[sister_containers.length - 1];
            last_sister.setAttribute("class", container_element_template.getAttribute("class"));
        }

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
        var site = "imdb"
        utils.debug("IMDB Plugin: Lauching TMDB API (Site: " + site + ") (Type: " + type + ")");
        imdb_id = await tmdb_api.getId(site, type, metadata_xml);
        if (imdb_id) {
            utils.debug("IMDB Plugin: TMDB API returned the following IMDB ID (" + imdb_id + ")");
            url = "http://www.imdb.com/title/" + imdb_id;
            // create imdb link element
            var imdb_container = imdb.constructImdbLink(url);

            // insert imdb link element to bottom of metadata container
            utils.debug("IMDB Plugin: Inserting IMDB container into page");
            document.querySelectorAll("[data-testid*=preplay-thirdTitle]")[0].children[0].appendChild(imdb_container);
        }
        else {
            utils.debug("IMDB Plugin: TMDB API did not find the IMDB ID... Aborting.");
        }
    }
}