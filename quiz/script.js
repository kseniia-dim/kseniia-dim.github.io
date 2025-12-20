"use strict";

class Csv {
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

class App {
    /** @prop {Csv} csv */
    csv
    /** @prop {string[]} categories */
    categories = []

    curLangItalian = true
    langEl = document.getElementById('lang')

    curCategoryEl = null
    categoriesEl = document.getElementById('categories-container')
    cardsEl = document.getElementById('cards-container')
    portalEl = document.getElementById('portal')
    charSampleEl = document.getElementById('char-sample')
    quizEl = document.getElementById('quiz')
    questionEl = document.getElementById('question')
    answerEl1 = document.getElementById('answer1')
    answerEl2 = document.getElementById('answer2')
    answerEl3 = document.getElementById('answer3')
    answerEl4 = document.getElementById('answer4')
    answerEls = []
    quizCharW = 32
    quizCharH = 32

    categoryQuestionIdxs = {}

    constructor() {
        this.answerEls = [
            this.answerEl1,
            this.answerEl2,
            this.answerEl3,
            this.answerEl4,
        ]

        this.quizTextEls = [
            this.questionEl,
            this.answerEl1,
            this.answerEl2,
            this.answerEl3,
            this.answerEl4,
        ]

        this.csv = new Csv
        this.csv.fetchData("./list.csv")
            .then(
                () => {
                    this.render()
                    this.initEvents()
                }
            )
        
        this.quizCharW = this.charSampleEl.clientWidth
        this.quizCharH = this.charSampleEl.clientHeight
    }

    render() {
        this.initCategories()

        this.initQuestions()

        this.renderCategoryButtons()

        this.renderQuestions()
    }

    initEvents() {
        window.addEventListener("resize", () => this.setQuizFontSize())
        this.portalEl.onclick = (e) => this.onPortalClick(e)
        this.questionEl.onclick = (e) => this.onQuestionClick(e)

        this.langEl.onclick = (e) => this.toggleLang(e)

        this.answerEl1.onclick = (e) => this.selectOption(e, 1)
        this.answerEl2.onclick = (e) => this.selectOption(e, 2)
        this.answerEl3.onclick = (e) => this.selectOption(e, 3)
        this.answerEl4.onclick = (e) => this.selectOption(e, 4)
    }

    initCategories() {
        this.categories = [
            ...new Set(
                this.csv.get(undefined, "категория")
            )
        ]

        this.categories.forEach((category) => this.categoryQuestionIdxs[category] = [] )
    }

    initQuestions() {
        for(let i=0; i < this.csv.getRowCount(); i++) {
            let category = this.csv.get(i, "категория")
            this.categoryQuestionIdxs[category].push( i )
        }
    }

    getCleanSample(name) {
        let sample = document.getElementsByClassName(`${name}-sample`)[0]
        sample.parentNode.removeChild(sample)
        sample.classList.remove(`${name}-sample`,'hidden')
        return sample
    }

    renderCategoryButtons() {
        let sample = this.getCleanSample('category')

        this.categories.forEach(
            /** @param {string} category */
            (category, i) => {
                let el = sample.cloneNode()
                el.innerText = category[0].toUpperCase() + category.slice(1)
                el.onclick = () => this.selectCategory(el, i, category)
                this.categoriesEl.appendChild(el)
            }
        )
    }

    selectCategory(element, idx, category) {
        this.curCategoryEl?.classList.remove('active')
        this.curCategoryEl = element
        element.classList.add('active')
        
        document.querySelectorAll(`[data-category="${idx}"]`)
            .forEach((el) => el.classList.add('category-active'))
        
        document.querySelectorAll(`[data-category]:not([data-category="${idx}"])`)
            .forEach((el) => el.classList.remove('category-active'))
    }

    renderQuestions() {
        let sample = this.getCleanSample('card')

        this.categories.forEach(
            /** @param {string} category */
            (category, i) => {

                this.categoryQuestionIdxs[category].forEach(
                    (rowIdx) => {
                        let el = sample.cloneNode()
                        el.innerText = this.csv.get(rowIdx, "номер")
                        el.dataset.category = i
                        el.onclick = (evt) => this.selectQuestion(
                            evt,
                            el, 
                            category, 
                            rowIdx,
                        )
                        this.cardsEl.appendChild(el)
                    }
                )

            }
        )
    }

    toggleLang(evt) {
        evt.stopPropagation()
        this.langEl.innerText = this.curLangItalian
            ? 'Рус'
            : 'Ita'
        
        this.curLangItalian = !this.curLangItalian
        this.setTexts()
    }

    optionCount = 0
    characters = 0
    setTexts() {
        this.optionCount = 0
        const optionLetter = ['A. ','B. ','C. ','D. ']
        if (this.curLangItalian) {
            let question = this.csv.get(this.curQuestionId, "domanda")
            question = question ? question : this.csv.get(this.curQuestionId, "вопрос")
            this.questionEl.innerText = question;

            [1,2,3,4].forEach((n,i) => {
                let answer = this.csv.get(this.curQuestionId, `risposta${n}`)
                answer = answer ? answer : this.csv.get(this.curQuestionId, `ответ${n}`)

                this[`answerEl${n}`].innerText = answer
                    ? optionLetter[i] + answer
                    : ''

                if (answer) {
                    this.optionCount++
                }
            })
        } else {
            let question = this.csv.get(this.curQuestionId, "вопрос")
            question = question ? question : this.csv.get(this.curQuestionId, "domanda")
            this.questionEl.innerText = question;

            [1,2,3,4].forEach((n,i) => {
                let answer = this.csv.get(this.curQuestionId, `ответ${n}`)
                answer = answer ? answer : this.csv.get(this.curQuestionId, `risposta${n}`)

                this[`answerEl${n}`].innerText = answer
                    ? optionLetter[i] + answer
                    : ''

                if (answer) {
                    this.optionCount++
                }
            })
        }

        this.characters =
            this.quizTextEls.map((el) => el.innerText)
                .join('').length
        
        this.setQuizFontSize()
    }

    // #portal.active .quiz-text
    qiuzFontSize = 32
    defaultMinChars = 500
    setQuizFontSize() {
        let viewWidth = document.documentElement.clientWidth
        let viewHeight = document.documentElement.clientHeight
        let quizWidth = viewWidth * .8
        let quizHeight = viewHeight * .85
        let maxBaseChars = (quizWidth / this.quizCharW - 1) * (quizHeight / this.quizCharH - 1)
        // let optionCountRatio = 1 - 0.15 * this.optionCount
        let charsRatio = (maxBaseChars / this.characters)// * optionCountRatio 

        // console.log([ this.characters, maxBaseChars, optionCountRatio, charsRatio ])
        let style = charsRatio < 1
            ? `font-size: ${this.qiuzFontSize*charsRatio}px !important;`
            : ''
        
        this.quizTextEls.forEach(el => el.setAttribute('style', style))
    }

    optionsHidden = true
    curQuestionId = null
    curQuestionEl = null
    answered = false
    selectQuestion(evt, element, category, questionId) {
        this.curQuestionId = questionId
        this.curQuestionEl = element
        this.optionsHidden = true
        this.answered = false

        this.setTexts()
        // this.questionEl.classList.add('active')
        // this.portalEl.setAttribute('style', `top: ${evt.clientY}; left: ${evt.clientX};`)
        this.portalEl.classList.add('active')
    }

    onPortalClick(evt) {
        if (this.answered) {
            this.closePortal()
            return
        }
        evt.stopPropagation()

        if (this.optionsHidden && this.optionCount > 1) {
            this.revealOptions()
        }
    }

    revealOptions() {
        this.optionsHidden = false
        this.answerEls.forEach((el) => 
            el.classList.add('active')
        )
    }

    onQuestionClick(evt) {
        if (this.answered) {
            return
        }

        if (this.optionCount <= 1 && this.optionsHidden) {
            evt.stopPropagation()
            this.revealOptions()
            this.selectOption(evt, 1)
            this.answered = true
        }
    }
    
    selectOption(evt, num) {
        if (this.answered || this.optionsHidden) {
            return
        }
        evt.stopPropagation()

        this.answered = true

        let rightNum = +this.csv.get(this.curQuestionId, "правильный ответ")
        rightNum = rightNum ? rightNum : 1

        // console.log([ num, rightNum, this.csv.get(this.curQuestionId, "правильный ответ") ])
        if (num !== rightNum) {
            this.answerEls[num-1].classList.add('wrong')
        }

        this.answerEls[rightNum-1].classList.add('correct')
    }

    closePortal() {
        this.answerEls.forEach((el) => el.classList.remove('correct', 'wrong', 'active'))
        this.portalEl.classList.remove('active')
        this.curQuestionEl.classList.add('inactive')
    }
}

document.body.onload = () => window.app = new App