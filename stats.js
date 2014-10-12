var servers;
var sections = {};
var active_server;
var active_section;
var last_updated_string;

function formattedDateString(timestamp) {
    var date = new Date(timestamp);
    var formatted_date = date.toLocaleTimeString() + " " + date.toDateString();
    return formatted_date;
}

function showDisplay() {
    document.getElementById("server-error-indicator").style.display = "none";
    document.getElementById("loading-indicator").style.display = "none";

    if (active_section) {
        if (active_section["type"] === "movie") {
            document.getElementById("movies-container").style.display = "block";
            document.getElementById("shows-container").style.display = "none";
        }
        else {
            document.getElementById("shows-container").style.display = "block";
            document.getElementById("movies-container").style.display = "none";
        }

        // hide headings, not needed when viewing libraries
        document.getElementById("movies-heading").style.display = "none";
        document.getElementById("shows-heading").style.display = "none";
    }
    else {
        document.getElementById("movies-heading").style.display = "block";
        document.getElementById("shows-heading").style.display = "block";
        document.getElementById("movies-container").style.display = "block";
        document.getElementById("shows-container").style.display = "block";
    }
}

function hideDisplay() {
    document.getElementById("movies-container").style.display = "none";
    document.getElementById("shows-container").style.display = "none";
    document.getElementById("server-error-indicator").style.display = "none";
    document.getElementById("server-updated").style.display = "none";

    document.getElementById("loading-indicator").style.display = "block";
}

function getServerAddresses(callback) {
    utils.background_storage_get("server_addresses", function(response) {
        callback(response["value"]);
    });
}

function getSections(address, port, plex_token, callback) {
    var library_sections_url = "http://" + address + ":" + port + "/library/sections?X-Plex-Token=" + plex_token;
    utils.getXML(library_sections_url, function(sections_xml) {
        callback(sections_xml);
    });
}

function processLibrarySections(sections_xml) {
    var directories = sections_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");
    var dir_metadata = {};
    for (var i = 0; i < directories.length; i++) {
        var title = directories[i].getAttribute("title");
        var type = directories[i].getAttribute("type");
        var scanner = directories[i].getAttribute("scanner");
        var key = directories[i].getAttribute("key");

        // only return movie or tv show libraries
        if ((type === "movie" && scanner === "Plex Movie Scanner") || (type === "show" && scanner === "Plex Series Scanner")) {
            dir_metadata[key] = {"type": type, "title": title};
        }
    }
    return dir_metadata;
}

function getAllMovies(address, port, plex_token, section_key, callback) {
    var library_section_url = "http://" + address + ":" + port + "/library/sections/" + section_key + "/all?X-Plex-Token=" + plex_token;
    utils.getXML(library_section_url, function(section_xml) {
        var movies_xml = section_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");
        var movies = [];
        for (var i = 0; i < movies_xml.length; i++) {
            var movie_data = {};
            movie_data["content_rating"] = movies_xml[i].getAttribute("contentRating");
            movie_data["rating"] = movies_xml[i].getAttribute("rating");
            movie_data["year"] = movies_xml[i].getAttribute("year");
            movie_data["added_at"] = movies_xml[i].getAttribute("addedAt");

            var metadata_xml = movies_xml[i].getElementsByTagName("Media")[0];
            movie_data["video_resolution"] = metadata_xml.getAttribute("videoResolution");

            movies.push(movie_data);
        }

        callback(movies);
    });
}

function getSectionGenres(address, port, plex_token, section_key, callback){
    var library_section_genres_url = "http://" + address + ":" + port + "/library/sections/" + section_key + "/genre?X-Plex-Token=" + plex_token;
    utils.getXML(library_section_genres_url, function(genres_xml) {
        var genre_nodes = genres_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Directory");

        var genres = {};
        for (var i = 0; i < genre_nodes.length; i++) {
            var genre_key = genre_nodes[i].getAttribute("key");
            var genre_title = genre_nodes[i].getAttribute("title");
            genres[genre_key] = genre_title;
        }

        callback(genres);
    });
}

function getMoviesByGenre(address, port, plex_token, section_key, genre_key, callback){
    var filtered_movies_url = "http://" + address + ":" + port + "/library/sections/" + section_key + "/all?genre=" + genre_key + "&X-Plex-Token=" + plex_token;
    utils.getXML(filtered_movies_url, function(movies_xml) {
        var movies = movies_xml.getElementsByTagName("MediaContainer")[0].getElementsByTagName("Video");
        callback(movies);
    });
}

function generateMovieStats(movies, genre_count) {
    var content_rating_count = {};
    var movie_rating_count = {};
    var resolution_count = {};
    var year_count = {};
    var dates_added = [];
    for (var i = 0; i < movies.length; i++) {
        // content rating count
        var content_rating = movies[i]["content_rating"];
        if (content_rating_count[content_rating]) {
            content_rating_count[content_rating]++;
        }
        else {
            content_rating_count[content_rating] = 1;
        }

        // movie ratings partioning
        // round down movie rating so that ratings 4.0-4.9 = 4 etc
        var movie_rating = parseInt(movies[i]["rating"]);
        if (movie_rating_count[movie_rating]) {
            movie_rating_count[movie_rating]++;
        }
        else {
            movie_rating_count[movie_rating] = 1;
        }

        // resolutions count
        var resolution = movies[i]["video_resolution"];
        if (resolution_count[resolution]) {
            resolution_count[resolution]++;
        }
        else {
            resolution_count[resolution] = 1;
        }

        // years count
        var year = parseInt(movies[i]["year"]);
        if (year_count[year]) {
            year_count[year]++;
        }
        else {
            year_count[year] = 1;
        }
        // add missing years
        var sorted_years = Object.keys(year_count).sort();
        for (var j = sorted_years[0]; j < sorted_years[sorted_years.length - 1]; j++) {
            if (!year_count[j]) {
                year_count[j] = 0;
            }
        }

        // movies added over time
        // set date time to beginning of day to make it easy to work with
        var added_at = new Date(parseInt(movies[i]["added_at"]) * 1000).setHours(0, 0, 0, 0);
        dates_added.push(added_at);
    }

    // clean up, remove invalid data
    if (content_rating_count[null]) {
        content_rating_count["Unknown"] = content_rating_count[null];
        delete content_rating_count[null];
    }
    delete year_count[NaN];

    // collate movies added over time data
    var sorted_dates = dates_added.sort(function(a, b){return a - b;});
    var today = new Date(Date.now());
    var start_date = new Date(sorted_dates[0]);
    var date_added_count = {};
    var total_count = 0;
    // iterate over dates from first movie added date added to today
    for (var d = start_date; d <= today; d.setDate(d.getDate() + 1)) {
        var current_timestamp = d.getTime();
        var day_count = 0;
        for (var i = 0; i < sorted_dates.length; i++) {
            if (sorted_dates[i] === current_timestamp) {
                day_count += 1;
            }
        }

        // only add date to array if movies were added that day
        if (day_count > 0){
            total_count += day_count

            var date_string = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
            date_added_count[date_string] = total_count;
        }
    }

    // format movie ratings data
    for (var rating in movie_rating_count) {
        if (isNaN(rating)) {
            movie_rating_count["No Rating"] = movie_rating_count[NaN];
        }
        else {
            var formatted_rating = rating + ".0 - " + rating + ".9";
            movie_rating_count[formatted_rating] = movie_rating_count[rating];
        }
        delete movie_rating_count[rating];
    }

    // format movie resolutions data
    var resolution_mappings = {"1080" : "1080p", "720" : "720p", "480": "480p", "576": "576p", "sd": "SD"};
    for (var resolution in resolution_count) {
        if (resolution_mappings[resolution]) {
            resolution_count[resolution_mappings[resolution]] = resolution_count[resolution];
            delete resolution_count[resolution];
        }
    }

    return {
        "content_rating_count": content_rating_count,
        "movie_rating_count": movie_rating_count,
        "resolution_count": resolution_count,
        "year_count": year_count,
        "genre_count": genre_count,
        "date_added_count": date_added_count
        };
}

function generateStats(address, port, plex_token, callback) {
    var all_movies = [];
    var all_tv_shows = [];
    var movie_genres_count = {};

    var section_movies = {};
    var section_movie_genres_count = {};

    getSections(address, port, plex_token, function(sections_xml) {
        // check if no response from server
        if (!sections_xml){
            callback(null);
            return;
        }
        var processed_sections = processLibrarySections(sections_xml);

        // set up counters to keep track of running tasks
        var counters = {"movies": 0, "movie_genres": 0}
        var reduce_counter = function(key) {
            counters[key]--;

            // check if all async tasks are finished
            if (counters["movies"] === 0 && counters["movie_genres"] === 0) {
                var movie_stats = generateMovieStats(all_movies, movie_genres_count);

                var section_names = {};
                var per_section_movie_stats = {};
                for (var section_key in section_movies) {
                    var section_movie_stats = generateMovieStats(section_movies[section_key], section_movie_genres_count[section_key]);
                    per_section_movie_stats[section_key] = section_movie_stats;
                    section_names[section_key] = processed_sections[section_key]["title"];
                }
                callback(movie_stats, per_section_movie_stats, section_names);
            }
        };

        for (var section_key in processed_sections) {
            // use closures because of scoping issues
            (function (section_key) {
                if (processed_sections[section_key]["type"] === "movie") {
                    counters["movies"]++;
                    section_movie_genres_count[section_key] = {};
                    getAllMovies(address, port, plex_token, section_key, function(movies){
                        all_movies = all_movies.concat(movies);
                        section_movies[section_key] = movies;

                        // because the plex web api calls for library sections only returns the first two genres
                        // of each movie we need to get all the genre mappings first and count the number of movies
                        // returned by the api with that genre filtered out
                        getSectionGenres(address, port, plex_token, section_key, function(genres) {
                            counters["movie_genres"] += Object.keys(genres).length;
                            for (var genre_key in genres) {
                                (function (genre_key) {
                                    var genre_title = genres[genre_key];
                                    getMoviesByGenre(address, port, plex_token, section_key, genre_key, function(genre_movies) {
                                        if (movie_genres_count[genre_title]) {
                                            movie_genres_count[genre_title] += genre_movies.length;
                                        }
                                        else {
                                            movie_genres_count[genre_title] = genre_movies.length;
                                        }
                                        if (section_movie_genres_count[section_key][genre_title]) {
                                            section_movie_genres_count[section_key][genre_title] += genre_movies.length;
                                        }
                                        else {
                                            section_movie_genres_count[section_key][genre_title] = genre_movies.length;
                                        }
                                        reduce_counter("movie_genres");
                                    });
                                }(genre_key));
                            }
                            reduce_counter("movies");
                        })
                    });
                }
                else if (processed_sections[section_key]["type"] === "show") {
                    // get stats for tv shows
                }
            }(section_key));
        }
    });
}

function getStats(server, section, force, callback) {
    var machine_identifier = server["machine_identifier"];
    var name = server["name"];
    var address = server["address"];
    var port = server["port"];
    var plex_token = server["access_token"];

    var cache_key;
    if (section) {
        // get section stats
        cache_key = "cache-stats-" + machine_identifier + "-" + section;
    }
    else {
        // get server stats
        cache_key = "cache-stats-" + machine_identifier;
    }

    utils.local_storage_get(cache_key, function(data) {
        // if force is true then we are recalculating stats
        if (data && !force) {
            var timestamp = data["timestamp"];
            var stats = data["stats"];

            callback(stats, timestamp);
        }
        else {
            generateStats(address, port, plex_token, function(stats, section_stats) {
                if (stats === null) {
                    // couldn't reach server to get data
                    callback(null);
                    return;
                }
                var timestamp = new Date().getTime();
                var hash = {"name": name, "stats": stats, "timestamp": timestamp};
                utils.local_storage_set(cache_key, hash);

                for (var section_key in section_stats) {
                    var section_hash = {"stats": section_stats[section_key], "timestamp": timestamp};
                    utils.local_storage_set("cache-stats-" + machine_identifier + "-" + section_key, section_hash);
                }

                if (section) {
                    callback(section_stats[section], timestamp);
                }
                else {
                    callback(stats, timestamp);
                }
            });
        }
    });
}

function recalculateServerStats() {
    hideDisplay();
    switchToServer(servers[active_server], null, true);
}

function updateNav() {
    // set active server name on nav bar
    var server_name_element = document.getElementById("active-server-name");
    // clear what's already there
    while (server_name_element.firstChild){
        server_name_element.removeChild(server_name_element.firstChild);
    }

    var server_name_text_node = document.createTextNode(servers[active_server]["name"]);
    server_name_element.appendChild(server_name_text_node);

    if (active_section) {
        var section_name = active_section["title"];
        var section_name_span = document.createElement("span");
        section_name_span.setAttribute("class", "section-name");
        var section_name_text_node = document.createTextNode("(" + section_name+ ")");
        section_name_span.appendChild(section_name_text_node);
        server_name_element.appendChild(section_name_span);
    }
}

function setServerSelections() {
    var server_list_element = document.getElementById("server-choices");

    // add all server choices
    for (var server in servers) {
        var li = document.createElement("li");
        var server_element = document.createElement("a");
        server_element.setAttribute("href", "#");
        server_element.setAttribute("class", "server-choice");
        server_element.setAttribute("data-machine_identifier", servers[server]["machine_identifier"]);
        var text_node = document.createTextNode(servers[server]["name"]);

        server_element.appendChild(text_node);
        li.appendChild(server_element);
        server_list_element.appendChild(li);
    }
}

function setLastUpdated(timestamp){
    last_updated_string = "Last Updated: " + formattedDateString(timestamp);

    document.getElementById("server-updated").innerHTML = last_updated_string;
    document.getElementById("server-updated").style.display = "inline-block";
}

function switchSection(e) {
    // show loading indicator and hide charts, last updated
    hideDisplay();

    var machine_identifier = e.target.getAttribute("data-machine_identifier");
    var section_key = e.target.getAttribute("data-section_key");
    switchToServer(servers[machine_identifier], section_key, false);
}

function switchToServer(server, section_key, refresh){
    // hide all charts and show loading indicator
    hideDisplay();

    active_server = server["machine_identifier"];
    if (section_key) {
        active_section = sections[server["machine_identifier"]][section_key];
    }
    else {
        active_section = null;
    }

    // update the nav with new active server
    updateNav();

    getStats(server, section_key, refresh, function(server_stats, last_updated) {
        if (server_stats === null) {
            // couldn't reach server to get data
            document.getElementById("loading-indicator").style.display = "none";
            document.getElementById("server-error-indicator").style.display = "block";
            return;
        }

        // hide loading indicator and show charts
        showDisplay();
        setLastUpdated(last_updated);

        // draw charts
        if (active_section) {
            if (active_section["type"] === "movie") {
                drawMovieYearsChart(server_stats["year_count"]);
                drawMovieGenreChart(server_stats["genre_count"]);
                drawMovieRatingChart(server_stats["movie_rating_count"]);
                drawMovieDateAddedChart(server_stats["date_added_count"]);
                drawMovieContentRatingChart(server_stats["content_rating_count"]);
                drawMovieResolutionChart(server_stats["resolution_count"]);
            }
            // section type is show
            else {
                // draw tv show charts
            }
        }
        else {
            // draw all charts
            drawMovieYearsChart(server_stats["year_count"]);
            drawMovieGenreChart(server_stats["genre_count"]);
            drawMovieRatingChart(server_stats["movie_rating_count"]);
            drawMovieDateAddedChart(server_stats["date_added_count"]);
            drawMovieContentRatingChart(server_stats["content_rating_count"]);
            drawMovieResolutionChart(server_stats["resolution_count"]);
        }
    });
}

function addSectionSelections() {
    for (var server in servers) {
        (function (server) {
            sections[server] = {};
            getSections(servers[server]["address"], servers[server]["port"], servers[server]["access_token"], function(sections_xml) {
                // check for failure to reach server
                if (sections_xml === null) {
                    // couldn't reach server to get data
                    document.getElementById("loading-indicator").style.display = "none";
                    document.getElementById("server-error-indicator").style.display = "block";
                    return;
                }

                var server_picker;
                var server_choices = document.getElementsByClassName("server-choice");
                for (var i = 0; i < server_choices.length; i++) {
                    if (server_choices[i].getAttribute("data-machine_identifier") === servers[server]["machine_identifier"]) {
                        server_picker = server_choices[i].parentNode;
                        break;
                    }
                }

                var ul = document.createElement("ul");
                server_picker.appendChild(ul);

                // create All option, to select collated server stats
                var li = document.createElement("li");
                var all_section_element = document.createElement("a");
                all_section_element.setAttribute("href", "#");
                all_section_element.setAttribute("class", "section-choice");
                all_section_element.setAttribute("data-machine_identifier", servers[server]["machine_identifier"]);
                // no section_key data attribute so when clicked getStats() returns collated server stats
                var text_node = document.createTextNode("All");

                all_section_element.appendChild(text_node);
                li.appendChild(all_section_element);
                ul.appendChild(li);

                // add event handler
                all_section_element.addEventListener("click", switchSection, false);

                var processed_sections = processLibrarySections(sections_xml);
                for (var section_key in processed_sections) {
                    var title = processed_sections[section_key]["title"];
                    var type = processed_sections[section_key]["type"];
                    sections[server][section_key] = {"title": title, "type": type};

                    var li = document.createElement("li");
                    var section_element = document.createElement("a");
                    section_element.setAttribute("href", "#");
                    section_element.setAttribute("class", "section-choice " + type);
                    section_element.setAttribute("data-machine_identifier", servers[server]["machine_identifier"]);
                    section_element.setAttribute("data-section_key", section_key);
                    var text_node = document.createTextNode(title);

                    section_element.appendChild(text_node);
                    li.appendChild(section_element);
                    ul.appendChild(li);

                    // add event handler
                    section_element.addEventListener("click", switchSection, false);
                }
            });
        }(server));
    }
}


// start stuff
getServerAddresses(function(pms_servers) {
    // check to make sure user has opened plex/web first so we can receive server addresses
    if (!pms_servers) {
        document.getElementById("loading-indicator").style.display = "none";
        document.getElementById("token-error-indicator").style.display = "block";
        return;
    }
    servers = pms_servers;

    // just load first server from array on first page load
    active_server = Object.keys(servers)[0];
    switchToServer(servers[active_server]);

    // Create server list on nav bar and then asynchronously add sections to them
    setServerSelections();
    addSectionSelections();

    // add event handlers for last updated nav bar element
    var server_updated_element = document.getElementById("server-updated");
    server_updated_element.addEventListener("mouseover", function(e) {
        server_updated_element.innerHTML = "recalculate server stats";
        }, false
    );
    server_updated_element.addEventListener("mouseout", function(e) {
        server_updated_element.innerHTML = last_updated_string;
        }, false
    );
    server_updated_element.addEventListener("click", function(e) {
        recalculateServerStats();
        }, false
    );
});