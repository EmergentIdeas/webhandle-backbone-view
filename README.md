# Webhandle Backbone View

A replacement for Backbone's View.

I really like Backbone's View. It's a perfect level of abstraction and container for when a framework
is too big and managing a few different object types becomes messy.

However, it requires jQuery and Underscore, which add a staggering 600k to the bundle making it unsuitable for the
creation of little modules. Additionally, its code was written to run on older IE browsers and still
uses that packaging and those techniques.

While that level of backward compatibility can be useful, I want to write code that uses classes,
modules, etc, and want my tools to support that.



## Install

```bash
npm install @webhandle/backbone-view
```

It's about 1027 bytes zipped as part of a webpack bundle, so about 1% of the size of Backbone and its
dependencies. 


## Usage


Import like

```js
const View = require('@webhandle/backbone-view').View
```

or

```js
import { View } from '@webhandle/backbone-view'
```

[Backbone's actual documentation](https://backbonejs.org/#View) is still pretty descriptive of what this does.
But in brief, the basic process is to extend View and define how the data will be rendered and how events will be handled.


Setting callbacks to handle events is done by creating an events object, where `this.events` is a hash like:

```json
{"event selector": "callback"}
```

Events are things like `click` and `mousedown`. Selectors are standard css selectors like `button`, `footer .ok`, or `.ok`. Each
selector is assumed to target only elements within the view. A special selector value, `.`, is used to indicate the
root element of the view.

Events are handled by event listeners on the view's root element. That means that while you have to have the
events defined when the view is created, you can change the content of the view's dom section however you want and 
whenever you want. Events on those new elements will still get handled. 

Callbacks are either a string, which refers to a method of the view, or functions. In either case the method/function
will be called with the view as the `this` object. These functions will receive the dom event and the element matching
the selector which the event bubbled through. This may not be the same as the `evt.target` since a child element of the matching
element may have been the actual thing clicked (or whatever). Essentially, the second argument is what the `evt.target` would
have been if the event listener had been added directly to that element instead of the view root.

Rendering (via the `render` method) is the most free from. It requires that the contents of `this.el` (the view's root element)
get modified to show content appropriate to `this.model`. You can use any templating library or no templating library at all.

Include the view into the page by adding the view object's `el` (the root element of the view) to any place in the dom. There
are two convience functions `appendTo` and `replaceContentsOf`.

And don't forget to call `render`, either before or after the element is added to the dom, or you won't see any content. 


```js
import { View } from '@webhandle/backbone-view'

class DollarView extends View {
	preinitialize(options) {
		this.events = Object.assign({}, {
			'click .one': 'oneClicked',
			'click .': function (evt) {
				console.log(`${this.model} it got clicked`)
			}
		}, options.events)
		options.events = this.events
	}

	render() {
		this.el.innerHTML = "$" + `<span id="${this.id}one" class="one"><span id="${this.id}two" class="two">${parseFloat(this.model)}</span></span>`
		return this
	}

	oneClicked(evt, selected) {
		console.log(`one clicked ${selected.id}`)
	}
}

let one = new DollarView({
	model: 123.45
})

one.render()
one.appendTo(document.body)
```

A view will accept the options 'model', 'el', 'id', 'attributes', 'className', 'tagName', and 'events'.
It's possible to pass these in as options to an instance or as options via the subclass's constructor.
However, I think it looks cleaner to implement the `preinitialize` function, which is called before
the view creates any elements.


## Differences from Backbone

As mentioned above, there are no dependencies. The View also lacks some of the functions used by Backbone
for interaction with its Model and Collections components. Since there is no jQuery, some of the members
like `this.$el` don't exist and events will be plain HTML dom events.

Backbone also limits which members of the options will be added to the View instance object to those listed
above. That seems unnecessarily limiting so this View adds all members.

While broadly compatible, I wouldn't expect the behaviors to be identical.

## An Only Slightly More Complicated Example

```js
import { View } from '@webhandle/backbone-view'

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
		this.el.innerHTML = "$" + `<span id="${this.id}one" class="one"><span id="${this.id}two" class="two">${parseFloat(this.model)}</span></span><button class="add-one math-button">Add One</button><button class="substract-one math-button">Subtract One</button>`
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
```
