//*** Global settings ***//

// The file that contains JSON-encoded data about the servers.
// See example.servers.json for more information.
var server_map = "servers.json"

// HTTP or HTTPS. Use the latter only if the remote SSL cert
// is in your trusted certificates store, otherwise
// expect connection errors.
var protocol = "http://";

// The URL where OPcache helper API scripts are
// located (the ones in "api" directory)
var api_url = "/opcache/api"

// No need to change these unless you rename the
// scripts in "api"
var status_url = api_url + "/get_status.php";
var config_url = api_url + "/get_config.php";
var reset_url = api_url + "/reset.php";

// Refresh delay in milliseconds
var refresh_stats_ms = 5000;

//*** End of settings ***//

//*** Global variables and UI settings ***//
var div_ids = {};
var refresh_elements_timeout = {};

var chart_options = {
    animation: false,
    percentageInnerCutout: 70,
};

// Colors and their highlight alternatives
// used in graphs
var good_color = "#26A65B";
var good_color_hl = "#00B16A";

var bad_color = "#D64541";
var bad_color_hl = "#E74C3C";

var very_bad_color = "#C0392B";
var very_bad_color_hl = "#C0392B";

// Percentage values above these thresholds will 
// set 'bad_color' on the number inside the graph.
// Just set to 101 or higher if you don't want to see
// red numbers :)
memory_alert_th = 90;
keys_alert_th = 90;
strings_alert_th = 90;

//*** End of global variables and UI settings ***//




// Define a graph id <=> title binding across all servers
function Graph(suffix, title) {
    this.suffix = suffix;
    this.title = title;
}

var graphStrings = new Graph(suffix="-graph-strings", title="Strings [MB]");
var graphMemory = new Graph(suffix="-graph-memory", title="Memory [MB]");
var graphKeys = new Graph(suffix="-graph-keys", title="Free/Used Keys");
var graphHitMiss = new Graph(suffix="-graph-hitmiss", title="Hit/Miss");


function add_graph(graph_instance, server_name) {
    $( "#" + server_name).append(   "<div class='graph'>\
                                        <span>" + graph_instance.title + "</span><br>\
                                        <div><canvas id='" + server_name + graph_instance.suffix + "'></canvas></div>\
                                        <div class='donut-inner'>\
                                            <span id='" + server_name + graph_instance.suffix + "-text'></span>\
                                        </div>\
                                    </div>");
    }


function blank_canvases(server_name) {
    // Recreate all canvases under a specific server
    $( "#" + server_name ).find("canvas").each( function() {
        redraw_canvas($( this ).id, "", "", "");
    });
}


function redraw_canvas(canvas_id, text, text_color, font_weight) {
    canvas = $( "#" + canvas_id );
    canvas_parent = canvas.parent();
    canvas.remove();
    canvas_parent.append("<canvas id='" + canvas_id + "'></canvas>");
    $( "#" + canvas_id + "-text" ).text(text);
    $( "#" + canvas_id + "-text" ).css("color", text_color);
    $( "#" + canvas_id + "-text" ).css("font-weight", font_weight);
}


function build_layout() {
    $.getJSON( server_map, function( data ) {
        $.each( data, function( category, property ) {
            div_ids[category] = {};

            $( "#main" ).append("<div class='category' id='" + category + "'></div>");
            $( "#" + category ).append("<a id='" + category + "-header' href='#'>\
                                            <div class='category_header'>\
                                                <span class='category_name'>" + property['alias'] + "</span>\
                                            </div>\
                                        </a>");
            $( "#" + category ).append("<div class='category_separator' id='" + category + "-separator'></div>");
            $( "#" + category ).append("<div class='category_content' id='" + category + "-content'></div>");

            // Hide a category after clicking on its header
            $( "#" + category + "-header").click( function(e) {
                e.preventDefault();
                if ( $( "#" + category + "-content").css('display') == 'none' ) {
                    show_category(category);
                }
                else {
                    hide_category(category);
                }
                
            });

            $.each( property['servers'], function( s_name, s_addr ) {
                div_ids[category][s_name] = s_addr;
                  $( "#" + category + "-content").append("<div class='server' id='" + s_name + "'></div>");
                  $( "#" + s_name ).append("<div class='server_name'><span>" + s_name + " (" + s_addr + ")</span></div>");
                  $( "#" + s_name ).append("<a class='reset_button' id='" + s_name + "-reset' href='#'><span> Reset </span></a>");

                  add_graph(graphMemory, s_name);
                  add_graph(graphStrings, s_name);
                  add_graph(graphKeys, s_name);
                  add_graph(graphHitMiss, s_name);

                  $( "#" + s_name + "-reset" ).click( function(e) {
                      e.preventDefault();
                      if (confirm("Flush opcache on " + s_name + " ?")) {
                        $.ajax({
                            url: protocol + s_addr + reset_url, 
                            dataType: "json",
                            crossOrigin: true,
                            error: function( data ) {
                                var response = $.parseJSON(data.responseText);
                                alert(response['error']);
                            },
                            success: function( data ) {
                                alert(data['status']);
                            }
                        });
                      }
                  });
            });
        });
    });
}


function load_elements_data(elem_ids, category) {
    $.each( elem_ids[category], function( s_name, s_addr ) {
        $.ajax({ 
            url: protocol + s_addr + status_url, 
            dataType: "json",
            crossOrigin: true,
            timeout: 2000,
            error: function() {
                // Blank all the server's canvases on error
                blank_canvases(s_name);
            },
            success: function( data ) {
                var memory_usage = data['memory_usage'];
                var opc_stats = data['opcache_statistics'];
                var interned_strings_usage = data['interned_strings_usage'];

                // Free/Used Memory
                var chart_data = [
                    {
                        value: Math.floor(memory_usage['used_memory'] / 1024 / 1024),
                        color: bad_color,
                        highlight: bad_color_hl,
                        label: "Used"
                    },
                    {
                        value: Math.floor(memory_usage['wasted_memory'] / 1024 / 1024),
                        color: very_bad_color,
                        highlight: very_bad_color_hl,
                        label: "Wasted"
                    },
                    {
                        value: Math.floor(memory_usage['free_memory'] / 1024 / 1024),
                        color: good_color,
                        highlight: good_color_hl,
                        label: "Free"
                    }
                ];
                percent_used_memory = Math.round((100 * chart_data[0].value / (chart_data[0].value + chart_data[1].value + chart_data[2].value)) * 10 ) / 10;
                
                var font_weight = "normal";
                var text_color = "black";
                if ( percent_used_memory >= memory_alert_th ) {
                    text_color = bad_color;
                    font_weight = "bold";
                };

                redraw_canvas(s_name + graphMemory.suffix, percent_used_memory + "%", text_color, font_weight);
                var ctx = document.getElementById(s_name + graphMemory.suffix).getContext("2d");
                new Chart(ctx).Doughnut(chart_data, chart_options);


                // Free/Used Keys
                var chart_data = [
                    {
                        value: opc_stats['num_cached_keys'],
                        color: bad_color,
                        highlight: bad_color_hl,
                        label: "Used"
                    },
                    {
                        value: opc_stats['max_cached_keys'] - opc_stats['num_cached_keys'],
                        color: good_color,
                        highlight: good_color_hl,
                        label: "Free"
                    }
                ];
                percent_used_keys = Math.round((100 * chart_data[0].value / (chart_data[0].value + chart_data[1].value)) * 10 ) / 10;

                var font_weight = "normal";
                var text_color = "black";
                if ( percent_used_keys >= keys_alert_th ) {
                    text_color = bad_color;
                    font_weight = "bold";
                };

                redraw_canvas(s_name + graphKeys.suffix, percent_used_keys + "%", text_color, font_weight);
                var ctx = document.getElementById(s_name + graphKeys.suffix).getContext("2d");
                new Chart(ctx).Doughnut(chart_data, chart_options);


                // Hits/Misses
                var chart_data = [
                    {
                        value: opc_stats['misses'],
                        color: bad_color,
                        highlight: bad_color_hl,
                        label: "Miss"
                    },
                    {
                        value: opc_stats['blacklist_misses'],
                        color: very_bad_color,
                        highlight: very_bad_color_hl,
                        label: "Blacklist"
                    },
                    {
                        value: opc_stats['hits'],
                        color: good_color,
                        highlight: good_color_hl,
                        label: "Hit"
                    }
                ];
                percent_hits = Math.round( opc_stats['opcache_hit_rate'] * 10 ) / 10;
                redraw_canvas(s_name + graphHitMiss.suffix, percent_hits + "%");
                var ctx = document.getElementById(s_name + graphHitMiss.suffix).getContext("2d");
                new Chart(ctx).Doughnut(chart_data, chart_options);


                // Free/Used Interned Strings
                var chart_data = [
                    {
                        value: Math.floor(interned_strings_usage['used_memory'] / 1024 / 1024),
                        color: bad_color,
                        highlight: bad_color_hl,
                        label: "Used"
                    },
                    {
                        value: Math.floor(interned_strings_usage['free_memory'] / 1024 / 1024),
                        color: good_color,
                        highlight: good_color_hl,
                        label: "Free"
                    }
                ];
                percent_used_interned_strings = Math.round((100 * chart_data[0].value / (chart_data[0].value + chart_data[1].value)) * 10 ) / 10;

                var font_weight = "normal";
                var text_color = "black";
                if ( percent_used_interned_strings >= strings_alert_th ) {
                    text_color = bad_color;
                    font_weight = "bold";
                };

                redraw_canvas(s_name + graphStrings.suffix, percent_used_interned_strings + "%", text_color, font_weight);
                var ctx = document.getElementById(s_name + graphStrings.suffix).getContext("2d");
                new Chart(ctx).Doughnut(chart_data, chart_options);
            }     
        });
    });

    refresh_elements_timeout[category] = setTimeout(load_elements_data, refresh_stats_ms, elem_ids, category);
}


function stop_all_api_calls() {
    // Prevents the multiplication of regular API calls
    // when clicking through the menu, etc.
    $.each(refresh_elements_timeout, function( category ) {
        clearTimeout(refresh_elements_timeout[category]);
    });
}


function show_dashboard() {
    $( "#main" ).html("");
    stop_all_api_calls();
    build_layout();
}


function show_settings() {
    stop_all_api_calls();
    $( "#main" ).html("");            
}


function show_category(category) {
    clearTimeout(refresh_elements_timeout[category]);
    $( "#" + category + "-content" ).slideToggle("slow", function() {
            load_elements_data(div_ids, category);
            $( "#" + category + "-separator").slideToggle();
        });
}


function hide_category(category) {
    clearTimeout(refresh_elements_timeout[category]);
    $( "#" + category + "-content" ).slideToggle("slow", function() {
            $( "#" + category + "-separator").slideToggle();
        });
}