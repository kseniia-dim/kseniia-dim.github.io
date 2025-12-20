"use strict";

export default class {
    ccode2feature = {};
    motif = [];
    ccode2lang = {};
    lang2ccode = {};
    country2ccode = {};
    active_langs = {};
    active_ccode = {};
    hovered_countries = [];
    active_countries = [];
    map = null;

    constructor(map) {
        this.map = map;
        this.fetch();
    }
    async fetch() {
        await fetch("./motifs_to_langs.csv")
            .then( (response) => response.text() )
            .then( (text) => {
                let span = document.createElement("span");
                let input = document.createElement("input");
                input.type = "checkbox";
                input.checked = false;
                let label = document.createElement("label");
                span.appendChild(input);
                span.appendChild(label);
                let legend = document.getElementById("legend");
                let lines = text.split(/\r?\n/);

                for(let i = 0; lines[i] && i < lines.length; i++) {
                    let cols = lines[i].split(";");
                    this.motif[i] = cols.map(e => e.trim());
                    //console.log(this.motif[i][1]);
                    if (this.motif[i][1][0] == '"' && this.motif[i][1].at(-1) == '"') {
                        this.motif[i][1] = this.motif[i][1].slice(1,-1).replaceAll('""','"');
                    }
                    this.motif[i][2] = this.motif[i][2].split(",").map(e => e.trim());
                    let _span = span.cloneNode(true);
                    _span.onmouseenter = (e) => this.hover_motif(e);
                    _span.onmouseleave = (e) => this.hover_motif(e);
                    _span.setAttribute("data-id",i);
                    _span.children[0].id = "in-"+i;
                    _span.children[0].onchange = (e) => this.onInputChange(e);
                    _span.children[0].setAttribute("data-id",i);
                    _span.children[1].htmlFor = _span.children[0].id;
                    _span.children[1].innerHTML = this.motif[i][0] + ' ' + this.motif[i][1];
                    legend.appendChild(_span);
                }
            }
        );

        await fetch("./countries_langs.csv")
            .then( (response) => response.text() )
            .then( (text) => {
                let lines = text.split(/\r?\n/);
                for(let i = 0; lines[i] && i < lines.length; i++) {
                    let cols = lines[i].split(";");
                    let ccode = cols[0].trim();
                    let country = cols[1].trim();
                    let langs = cols[2].split(",").map(e => e.trim());
                    this.ccode2lang[ccode] = [country, langs];
                    this.country2ccode[country] = ccode;
                    langs.forEach(e => {
                        if (this.lang2ccode[e])
                            alert("redundant language ", e, "in 'countries_langs.csv line: ", line[i]);
                        else
                        this.lang2ccode[e] = [ccode,country];
                    });
                    
                }
        });
    }
    onInputChange(e) {
        let id = e.target.getAttribute("data-id");
        this.motif[id][2].forEach(lang => {
            if (e.target.checked == true) {
                if (this.active_langs[lang]?.length) { // lang already selected
                    this.active_langs[lang].push(id);
                } else { // lang isn't selected yet
                    this.active_langs[lang] = [ id ];
                    if (!this.lang2ccode[lang])
                        console.log(this.motif[id][0], ") ", lang);
                    else {
                        let ccode = this.lang2ccode[lang][0];
                        if (this.active_ccode[ccode]?.length) { // country by code already selected (by different lang)
                            this.active_ccode[ccode].push(lang);
                        } else { // country isn't selected
                            this.active_ccode[ccode] = [ lang ];
                            this.country_set_state(ccode, true);
                        }
                    }
                }
            } else {
                this.active_langs[lang].splice(this.active_langs[lang].indexOf(id),1);
                if (!this.active_langs[lang].length) {
                    let ccode = this.lang2ccode[lang][0];
                    this.active_ccode[ccode].splice(this.active_ccode[ccode].indexOf(lang),1);
                    if (!this.active_ccode[ccode].length) {
                        this.country_set_state(ccode, false);
                    }
                }
            }
        })
        //let tgl_countries
        //;
    }

    country_set_state(ccode, selected) {
        //console.log(ccode, selected);
        if (this.ccode2feature[ccode]) {
            this.map.setFeatureState(this.ccode2feature[ccode], {"state": selected ? "selected" : "deselected"});
        }
        this.display_active_country(this.ccode2lang[ccode][0], selected);
    }

    hover_motif(e) {
        if (e.type == "mouseleave") {
            this.hovered_countries.forEach(ccode => {
                this.map.setFeatureState(this.ccode2feature[ccode], {"hover": false});
            });
            this.hovered_countries = [];
        } else {
            let id = e.target.getAttribute("data-id");
            let new_hovered_countries = [];
            this.motif[id][2].forEach(lang => {
                let ccode = this.lang2ccode[lang][0];
                if (new_hovered_countries.indexOf(ccode) == -1)
                    new_hovered_countries.push(ccode);
            });
            new_hovered_countries.forEach(ccode => {
                this.map.setFeatureState(this.ccode2feature[ccode], {"hover": true});
            });
            this.hovered_countries = new_hovered_countries;
        }
        //console.log(e.type, " ", id, hovered_countries);
    }

    display_active_country(country, show) {
        if (show) {
            this.active_countries.push(country);
            this.active_countries.sort();
        } else
            this.active_countries.splice(this.active_countries.indexOf(country),1);
        let countries_block = document.getElementById("active_countries");
        let countries_w_langs = this.active_countries.map(c => `${c} (${this.active_ccode[this.country2ccode[c]].join(", ")})`);
        countries_block.innerText = (this.active_countries.length? this.active_countries.length+" - ":"") + countries_w_langs.join(", ");
    }

    select_country() {

    }
}