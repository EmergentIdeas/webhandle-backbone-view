import tri from 'tripartite';
import { test1, test2 } from "../views/load-browser-views.js"
import { View } from '../client-js/index.js'


class DollarView extends View {
	preinitialize() {
		this.events = {
			'click .one': 'oneClicked'
			, 'click .math-button': 'doMath'
			, 'click .': function (evt) {
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
