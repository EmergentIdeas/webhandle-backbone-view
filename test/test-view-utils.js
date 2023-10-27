import mocha from "mocha";
import { assert } from 'chai'
import eventEntryMapper from "../client-js/event-entry-mapper.js"
import extractEventNames from "../client-js/extract-event-names.js"


let handle = function (evt) {

}
let events = {
	'click button.okay': 'okayCall'
	, 'click footer button.cancel': handle
}

let events2 = {
	' click button.okay ': ' okayCall'
	, 'click  footer  button.cancel': handle
}

let events3 = {
	' click button.okay ': ' okayCall'
	, 'click  footer  button.cancel': handle
	, 'mousedown  footer  button.cancel': handle
}

describe("basic tests of the view utils", function () {

	it("basic entry mapping", function () {

		let eventTriggers = Object.entries(events).map(eventEntryMapper)

		assert(eventTriggers.length, 2)
		let okay = eventTriggers[0]
		assert.equal(okay.event, 'click')
		assert.equal(okay.selector, 'button.okay')
		assert.equal(okay.handler, 'okayCall')

		let cancel = eventTriggers[1]
		assert.equal(cancel.event, 'click')
		assert.equal(cancel.selector, 'footer button.cancel')
		assert.equal(cancel.handler, handle)
	})

	it("spacing issues", function () {

		let eventTriggers = Object.entries(events2).map(eventEntryMapper)

		assert(eventTriggers.length, 2)
		let okay = eventTriggers[0]
		assert.equal(okay.event, 'click')
		assert.equal(okay.selector, 'button.okay')
		assert.equal(okay.handler, 'okayCall')

		let cancel = eventTriggers[1]
		assert.equal(cancel.event, 'click')
		assert.equal(cancel.selector, 'footer  button.cancel')
		assert.equal(cancel.handler, handle)
	})

	it("extract event names", function () {

		let eventTriggers = Object.entries(events3).map(eventEntryMapper)
		let eventNames = extractEventNames(eventTriggers)
		
		assert.equal(eventNames.length, 2)
		assert.equal(eventNames[0], 'click')
		assert.equal(eventNames[1], 'mousedown')
	})
})
