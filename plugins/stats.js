stats = {
    init: function () {
        utils.debug("Stats plugin (init): Starting...");
        if (document.getElementById("stats-page-link")) {
            utils.debug("Stats plugin (init): Link already exists. Passing");
            return;
        }
        utils.debug("Stats plugin (init): Adding Stats Link");
        var rightnavbars = document.body.querySelectorAll("[class*=NavBarActivityButton-container]");
        var nav_bar_right = rightnavbars[0];

        var stats_link = document.createElement("a");
        stats_link.setAttribute("id", "stats-page-link");
        stats_link.setAttribute("title", "EnhancedPLEX stats");
        stats_link.setAttribute("href", utils.getStatsURL());
        stats_link.setAttribute("target", "_blank");

        var stats_glyph = document.createElement("i");
        stats_glyph.setAttribute("class", "glyphicon charts");

        stats_link.appendChild(stats_glyph);
        var container = document.createElement("button");
        var styles = document.querySelectorAll('[aria-label^="Settings"]')[0].getAttribute("Class")
        container.setAttribute("class", styles);

        container.appendChild(stats_link);
        nav_bar_right.parentElement.prepend(container);
    }
}