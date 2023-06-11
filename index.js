var ccode2feature = {};
let motif = [];
let ccode2lang = {};
let lang2ccode = {};
let country2ccode = {};
let active_langs = {};
let active_ccode = {};
function onInputChange(e) {
    var id = e.target.getAttribute("data-id");
    motif[id][2].forEach(lang => {
        if (e.target.checked == true) {
            if (active_langs[lang]?.length) { // lang already selected
                active_langs[lang].push(id);
            } else { // lang isn't selected yet
                active_langs[lang] = [ id ];
                if (!lang2ccode[lang])
                    console.log(motif[id][0], ") ", lang);
                else {
                    var ccode = lang2ccode[lang][0];
                    if (active_ccode[ccode]?.length) { // country by code already selected (by different lang)
                        active_ccode[ccode].push(lang);
                    } else { // country isn't selected
                        active_ccode[ccode] = [ lang ];
                        country_set_state(ccode, true);
                    }
                }
            }
        } else {
            active_langs[lang].splice(active_langs[lang].indexOf(id),1);
            if (!active_langs[lang].length) {
                var ccode = lang2ccode[lang][0];
                active_ccode[ccode].splice(active_ccode[ccode].indexOf(lang),1);
                if (!active_ccode[ccode].length) {
                    country_set_state(ccode, false);
                }
            }
        }
    
    })
    //var tgl_countries
    //;
}
function country_set_state(ccode, selected) {
    //console.log(ccode, selected);
    if (ccode2feature[ccode]) {
        map.setFeatureState(ccode2feature[ccode], {"state": selected ? "selected" : "deselected"});
    }
    display_active_country(ccode2lang[ccode][0], selected);
}
var active_countries = [];
function display_active_country(country, show) {
    if (show) {
        active_countries.push(country);
        active_countries.sort();
    } else
        active_countries.splice(active_countries.indexOf(country),1);
    var countries_block = document.getElementById("active_countries");
    var countries_w_langs = active_countries.map(c => `${c} (${active_ccode[country2ccode[c]].join(", ")})`);
    countries_block.innerText = (active_countries.length? active_countries.length+" - ":"") + countries_w_langs.join(", ");
}

fetch("./motifs_to_langs.csv")
    .then( (response) => response.text() )
    .then( function(text) {
        var span = document.createElement("span");
        var input = document.createElement("input");
        input.type = "checkbox";
        input.checked = false;
        var label = document.createElement("label");
        span.appendChild(input);
        span.appendChild(label);
        var legend = document.getElementById("legend");
        var lines = text.split(/\r?\n/);
    for(let i = 0; lines[i] && i < lines.length; i++) {
            var cols = lines[i].split(";");
            motif[i] = cols.map(e => e.trim());
            console.log(motif[i][1]);
            if (motif[i][1][0] == '"' && motif[i][1].at(-1) == '"') {
                motif[i][1] = motif[i][1].slice(1,-1).replaceAll('""','"');
            }
            motif[i][2] = motif[i][2].split(",").map(e => e.trim());
            var _span = span.cloneNode(true);
            _span.children[0].id = "in-"+i;
            _span.children[0].onchange = onInputChange;
            _span.children[0].setAttribute("data-id",i);
            _span.children[1].htmlFor = _span.children[0].id;
            _span.children[1].innerHTML = motif[i][0] + ' ' + motif[i][1];
            legend.appendChild(_span);
        }
});
fetch("./countries_langs.csv")
    .then( (response) => response.text() )
    .then( function(text) {
        var lines = text.split(/\r?\n/);
        for(let i = 0; lines[i] && i < lines.length; i++) {
            var cols = lines[i].split(";");
            var ccode = cols[0].trim();
            var country = cols[1].trim();
            var langs = cols[2].split(",").map(e => e.trim());
            ccode2lang[ccode] = [country, langs];
            country2ccode[country] = ccode;
            langs.forEach(e => {
                if (lang2ccode[e])
                    alert("redundant language ", e, "in 'countries_langs.csv line: ", line[i]);
                else
                lang2ccode[e] = [ccode,country];
            });
            
        }
});

function select_country() {

}