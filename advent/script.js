"use strict";

import { Csv } from '../assets/csv.js'

class App {
    /** @prop {Csv} csv */
    csv
    /** @prop {string[]} dates */
    dates = []
    dateTitles = []

    portalEl = document.getElementById('portal')
    portalContainerEl = document.getElementById('portal-container')
    itemsEl = document.getElementById('advent-items')
    insertBeforeEl = document.getElementById('put-advent-before-here')

    dateItemIdxs = {}

    /** @prop {string[]} openedDates */
    openedDates = []

    constructor() {
        this.csv = new Csv
        this.csv.fetchData("./list.csv?2")
            .then(
                () => {
                    this.render()
                    this.initEvents()
                }
            )
        
        this.openedDates = JSON.parse(window.localStorage.getItem('opened') ?? '[]')
    }

    render() {
        this.initDates()

        this.initItems()

        this.renderItems()
    }

    initEvents() {
        this.portalEl.onclick = (e) => this.onPortalClick(e)
    }

    initDates() {
        this.dates = [
            ...new Set(
                this.csv.get(undefined, "data")
            )
        ]

        this.dates.forEach((date) => this.dateItemIdxs[date] = [] )
    }

    initItems() {
        for(let i=0; i < this.csv.getRowCount(); i++) {
            let date = this.csv.get(i, "data")
            this.dateItemIdxs[date].push( i )
        }
    }

    getCleanSample(name) {
        let sample = document.getElementsByClassName(`${name}-sample`)[0]
        sample.parentNode.removeChild(sample)
        sample.classList.remove(`${name}-sample`,'hidden')
        return sample
    }

    /**
     * @param {Date} date
     * @returns {boolean} 
     */
    isPastDate(date) {
        return (new Date).valueOf() > date.valueOf()
    }

    renderItems() {
        let sample = this.getCleanSample('advent-item')

        this.dates.forEach(
            /** @param {string} date */
            (date, i) => {
                let el = sample.cloneNode(true)
                // .advent-item-date
                el.children[0].innerText =
                    this.csv.get(this.dateItemIdxs[date][0], "dataTitolo")

                let jsDate = new Date( date + ' 00:00:00' )
                if (this.isPastDate(jsDate)) {
                    el.classList.add('active')

                    if (this.openedDates.includes(date)) {
                        el.classList.add('open')
                    }
                }

                el.onclick = (evt) => this.selectItem(
                    evt,
                    el,
                    date,
                )

                this.dateItemIdxs[date].forEach(
                    (rowIdx) => {
                        let url = this.csv.get(rowIdx, "url")
                        let link = document.createElement('a') 
                        link.innerText = this.csv.get(rowIdx, "titolo")
                        link.setAttribute('target', '_blank')
                        link.classList.add('advent-item-link')
                        if (url.startsWith('http')) {
                            link.href = url
                        } else {
                            link.href = './files/' + url
                        }
                        link.onclick = (evt) => evt.stopPropagation()

                        el.appendChild(link)
                    }
                )

                this.itemsEl.appendChild(el)

            }
        )
    }

    selectItem(evt, element, date) {
        if (!element.classList.contains('active')) {
            return
        }

        if (!element.classList.contains('open')) {
            element.classList.add('open')
            this.openedDates.push(date)
            window.localStorage.setItem('opened', JSON.stringify(this.openedDates))
            return
        }

        let item = element.cloneNode(true)
        item.onclick = (evt) => evt.stopPropagation()
        this.portalContainerEl.appendChild(item)

        this.portalEl.classList.add('active')
    }

    onPortalClick(evt) {
        this.closePortal()
    }

    closePortal() {
        this.portalEl.classList.remove('active')

        let curItem = this.portalEl.querySelector('.advent-item')
        this.portalContainerEl.removeChild(curItem)
    }
}

document.body.onload = () => window.app = new App