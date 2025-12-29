"use strict";

export class Csv {
    separator = ';'
    colNames = []
    cols = []
    rows = []
    constructor() {
    }
    
    async fetchData(path) {
        let response = await fetch(path)
        let text = await response.text()
        this.parse(text)
    }

    /** @param {string} text */
    parse(text) {
        /** @var {string[][]} lines */
        let lines = text
            .split('\n')
            .map((line) =>
                line.trim()
                    .split(this.separator)
                    .map(
                        (cell) => {
                            cell = cell.trim()
                            if (cell[0] == '"' && cell[cell.length-1] == '"') {
                                cell = cell.slice(1,-1).replace('""','"')
                            }
                            return cell
                        }
                    )
            )
        
        let data = lines.slice(1)
            .filter((cells) => cells.length >= lines[0].length)
        
        this.parseHeader(lines[0])

        this.setRows(data)

        this.setCols(data)

        // console.log(this.colNames, this.rows, this.cols)
    }

    /** @param {string[]} header */
    parseHeader(header) {
        header.forEach((col, i) => this.colNames[col] = i)
    }

    /** @param {string[]} header */
    setRows(data) {
        this.rows = data
    }

    /** @param {string[]} header */
    setCols(data) {
        data.forEach((row,i) => {
            row.forEach(
                (cell,i) => {
                    if (this.cols.length <= i) {
                        this.cols.push([ ])
                    }
                    this.cols[i].push(cell)
                } 
            )
        })
    }

    getRowCount() {
        return this.rows.length
    }
    /**
     * @param {number|undefined} row
     * @param {number|string|undefined} col
     * @returns {string|string[]}
     */
    get(row, col) {
        if (typeof col == "string") {
            col = this.colNames[col]
        }
        if (row !== undefined) {
            return col !== undefined ? this.rows[row][col] : this.rows[row]
        } else {
            return this.cols[col]
        }
    }
}