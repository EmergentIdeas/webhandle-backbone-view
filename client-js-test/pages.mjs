import tri from 'tripartite';
import { test1, test2 } from "../views/load-browser-views.js"
import { View } from '../client-js/index.js'
import 'mocha'

import {assert} from 'chai'

let clickCount = 0

class DollarView extends View {
	preinitialize() {
		this.clickCount = 0
		this.events = {
			'click .one': 'oneClicked'
			, 'click .math-button': 'doMath'
			, 'click .': function (evt) {
				this.clickCount++
				console.log(`${this.model} it got clicked`)
			}
		}
	}

	render() {
		this.el.innerHTML = "$" + `<span id="${this.id}one" class="one"><span id="${this.id}two" class="two">${parseFloat(this.model)}</span></span><button class="add-one math-button">Add One</button><button class="subtract-one math-button">Subtract One</button>`
		return this
	}

	oneClicked(evt, selected) {
		console.log(`one clicked ${selected.id}`)
	}

	doMath(evt, selected) {
		if(selected.classList.contains('add-one')) {
			this.model = this.model + 1
		}
		else if(selected.classList.contains('subtract-one')) {
			this.model = this.model - 1
		}
		this.el.querySelector('.two').innerHTML = parseFloat(this.model)
		console.log(this.randomInfo)
	}
}

let one = new DollarView({
	model: 1.45
	, randomInfo: 20
})

one.render()
one.appendTo(document.body)

mocha.setup('bdd')
mocha.run()


describe("view operations", function() {
	it("rendering", function() {
		let twoEl = one.el.querySelector(`.two`)
		assert.equal(twoEl.innerHTML, '1.45')
		
		assert.equal(one.el.querySelectorAll('button').length, 2)
	})

	it("check events", function() {
		let twoEl = one.el.querySelector(`.two`)
		one.el.querySelector('.add-one').dispatchEvent(new CustomEvent('click', {bubbles: true}))
		assert.equal(twoEl.innerHTML, '2.45')

		// an event but a different event type
		one.el.querySelector('.add-one').dispatchEvent(new CustomEvent('mousedown', {bubbles: true}))
		assert.equal(twoEl.innerHTML, '2.45')

		one.el.dispatchEvent(new CustomEvent('click', {bubbles: true}))
		assert.equal(one.clickCount, 1)
	})
	it("remove", function() {
		one.remove()
		let twoEl = document.querySelector(`.two`)
		assert.isNull(twoEl)

	})
	it("init properties", function() {
		one = new DollarView({
			model: 2.33
			, clickCount: 4
			, className: 'second-one'
		})

		one.render()
		one.appendTo(document.body)
		one.el.dispatchEvent(new CustomEvent('click', {bubbles: true}))
		assert.equal(one.clickCount, 5)
		
		assert.isNotNull(document.querySelector('.second-one'))
	})

})

