/******/ var __webpack_modules__ = ({

/***/ "./node_modules/tripartite/active-element.js":
/*!***************************************************!*\
  !*** ./node_modules/tripartite/active-element.js ***!
  \***************************************************/
/***/ ((module) => {


const defaultTemplateName = 'defaultTemplate'

class ActiveElement {
	constructor(conditionalExpression, dataExpression, handlingExpression, tripartite) {
		this.conditionalExpression = conditionalExpression
		this.dataExpression = dataExpression
		this.handlingExpression = handlingExpression || defaultTemplateName
		this.tripartite = tripartite
	}
}

module.exports = ActiveElement

/***/ }),

/***/ "./node_modules/tripartite/calculate-relative-path.js":
/*!************************************************************!*\
  !*** ./node_modules/tripartite/calculate-relative-path.js ***!
  \************************************************************/
/***/ ((module) => {

var calculateRelativePath = function(parentPath, currentPath) {
	if(!parentPath) {
		return currentPath
	}
	if(!currentPath) {
		return currentPath
	}
	
	if(currentPath.indexOf('../') != 0 && currentPath.indexOf('./') != 0) {
		return currentPath
	}
	
	var pparts = parentPath.split('/')
	var cparts = currentPath.split('/')
	
	// trim any starting blank sections
	while(pparts.length && !pparts[0]) {
		pparts.shift()
	}
	while(cparts.length && !cparts[0]) {
		cparts.shift()
	}
	
	if(currentPath.indexOf('../') == 0 ) {
		while(cparts.length && cparts[0] == '..') {
			pparts.pop()
			cparts.shift()
		}
		pparts.pop()
		
		while(cparts.length) {
			pparts.push(cparts.shift())
		}
		return pparts.join('/')
	}
	if(currentPath.indexOf('./') == 0 ) {
		cparts.shift()
		pparts.pop()
		while(cparts.length) {
			pparts.push(cparts.shift())
		}
		return pparts.join('/')
	}
	
	return currentPath
}

module.exports = calculateRelativePath

/***/ }),

/***/ "./node_modules/tripartite/evaluate-in-context.js":
/*!********************************************************!*\
  !*** ./node_modules/tripartite/evaluate-in-context.js ***!
  \********************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


const resolveDataPath = __webpack_require__(/*! ./resolve-data-path */ "./node_modules/tripartite/resolve-data-path.js")
function evaluateInContext(context, expression, dataFunctions, globalData) {
	if (!expression) {
		return null
	}
	if (typeof expression === 'string') {
		expression = expression.trim()
	}

	if (expression === '$this' || expression === 'this') {
		return context
	}
	if (typeof context === 'object' && expression in context) {
		return context[expression]
	}
	if (expression === '""' || expression === "''") {
		return ''
	}
	let resolved = resolveDataPath(context, expression)
	if (resolved === null || resolved === undefined) {
		resolved = resolveDataPath({
			'$globals': globalData
		}, expression)
	}
	if (resolved === null || resolved === undefined) {
		resolved = _evaluateInContext.call(context, context, expression, dataFunctions, globalData)
	}
	return resolved
}

let evalFunction = new Function('additionalContexts',
	`with ({
		'$globals': additionalContexts.globalData
	}) {
		with (additionalContexts.dataFunctions) {
			with (additionalContexts.context) {
				try {
					return eval(additionalContexts.expression);
				} catch (e) {
					return null;
				}
			}
		}
	}`
)

function _evaluateInContext(context, expression, dataFunctions, globalData) {
	dataFunctions = dataFunctions || {}
	globalData = globalData || {}


	let result = evalFunction.call(this, {
		globalData: globalData
		, dataFunctions: dataFunctions
		, context: context
		, expression: expression
	})
	return result
}

module.exports = evaluateInContext

/***/ }),

/***/ "./node_modules/tripartite/execution-context.js":
/*!******************************************************!*\
  !*** ./node_modules/tripartite/execution-context.js ***!
  \******************************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {


let ActiveElement = __webpack_require__(/*! ./active-element */ "./node_modules/tripartite/active-element.js")
var calculateRelativePath = __webpack_require__(/*! ./calculate-relative-path */ "./node_modules/tripartite/calculate-relative-path.js")
let evaluateInContext = __webpack_require__(/*! ./evaluate-in-context */ "./node_modules/tripartite/evaluate-in-context.js")

class ExecutionContext {
	/**
	 * 
	 * @param {Tripartite} tripartite 
	 * @param {function} template 
	 * @param {stream} [destination]
	 */
	constructor(tripartite, template, data = {}, destination = '', dataFunctions = {}) {
		this.tripartite = tripartite
		this.template = template
		this.destination = destination
		this.initialData = data
		this.currentData = []
		this.dataFunctions = dataFunctions
		this.continueOnTripartiteError = true
	}

	/**
	 * 
	 * @param {function} [callback] called when done
	 * @returns Returns the string of stream as the result of the operation
	 */
	run(callback) {
		let ourCallback
		if (callback) {
			ourCallback = () => {
				callback(null, this.destination)
			}
		}

		this._run(this.template, this.initialData, ourCallback)

		return this.destination
	}

	_resolveHandlingExpression(template, handlingExpression, data) {
		if (!handlingExpression) {
			handlingExpression = defaultTemplateName
		}
		if (handlingExpression.charAt(0) == '$') {
			// Indicates the handling espression is not a literal template name but is a string which should
			// be evaluated to determine the template name
			handlingExpression = evaluateInContext(data, handlingExpression.substring(1), this.dataFunctions, this.initialData)
		}
		// resolve relative template paths
		if (handlingExpression.indexOf('./') == 0 || handlingExpression.indexOf('../') == 0) {
			handlingExpression = calculateRelativePath(template.templateMeta.name, handlingExpression)
		}

		return handlingExpression
	}

	_run(template, data, callback) {
		let parts = [...template.parts].reverse()
		const processParts = () => {
			if (parts.length > 0) {
				let part = parts.pop()
				if (typeof part === 'string') {
					this.output(part)
					processParts()
				}
				else if (part instanceof ActiveElement) {
					let conditional = part.conditionalExpression || part.dataExpression
					let conditionalResult = false
					let resultData
					if (conditional == null || conditional == undefined || conditional === '') {
						// Because if they didn't specify a condition or data, they probably 
						// just want the template to be run as is
						conditionalResult = true
					}
					else {
						if(part.conditionalExpression) {
							let result = evaluateInContext(data, part.conditionalExpression, this.dataFunctions, this.initialData)
							if (result) {
								conditionalResult = true
							}
						}
						else {
							// This means we're evaluating the data expression to see if we should run the template
							resultData = evaluateInContext(data, part.dataExpression, this.dataFunctions, this.initialData)
							if(resultData === null || resultData === undefined) {
								conditionalResult = false
							}
							else if (typeof resultData === 'number') {
								// if the result is a number, any number, we want to output it
								// unless the number is from the conditional expression, in which
								// case we want to evaluate it as truthy
								conditionalResult = true
							}
							else if(Array.isArray(resultData) && resultData.length > 0) {
								conditionalResult = true
							}
							else if(resultData) {
								conditionalResult = true
							}
						}
					}


					if (conditionalResult) {
						if (part.dataExpression && resultData === undefined) {
							resultData = evaluateInContext(data, part.dataExpression, this.dataFunctions, this.initialData)
						}
						if(resultData === null || resultData === undefined) {
							resultData = data
						}

						let handlingExpression = this._resolveHandlingExpression(template, part.handlingExpression, data)
						let handlingTemplate
						let children = (Array.isArray(resultData) ? [...resultData] : [resultData]).reverse()
						const applyTemplate = () => {
							if (children.length > 0) {
								let child = children.pop()
								this._run(handlingTemplate, child, () => {
									applyTemplate()
								})
							}
							else {
								processParts()
							}
						}

						if(handlingExpression in this.tripartite.templates) {
							handlingTemplate = this.tripartite.getTemplate(handlingExpression)
							if (handlingTemplate) {
								applyTemplate()
							}
							else {
								// the template has been loaded before but is empty
								if (this.continueOnTripartiteError) {
									processParts()
								}
							}
							
						}
						else {
							this.tripartite.loadTemplate(handlingExpression, (template) => {
								if (!template) {
									let msg = 'Could not load template: ' + handlingExpression
									console.error(msg)
									if (this.continueOnTripartiteError) {
										processParts()
									}
									else {
										let err = new Error(msg)
										if (callback) {
											callback(err)
										}
										else {
											throw err
										}
									}
								}
								else {
									handlingTemplate = template
									applyTemplate()
								}
							})
						}
					}
					else {
						processParts()
					}
				}
				else if (typeof part === 'function') {
					if(part.write) {
						part.write(data, this.destination, () => {
							processParts()
						})

					}
					else {
						this.output(part(data))
						processParts()
					}
				}

			}
			else {
				if (callback) {
					callback()
				}
			}
		}

		processParts()
	}

	/**
	 * 
	 * @param {string} value 
	 */
	output(value) {
		if(value === null || value === undefined) {
			return
		}
		if (typeof this.destination === 'string') {
			this.destination += value
		}
		else if (this.destination.write) {
			this.destination.write(value)
		}
	}
}


module.exports = ExecutionContext

/***/ }),

/***/ "./node_modules/tripartite/resolve-data-path.js":
/*!******************************************************!*\
  !*** ./node_modules/tripartite/resolve-data-path.js ***!
  \******************************************************/
/***/ ((module) => {

/*
function resolveDataPath(data, path) {
	if(data === null || data === undefined) {
		return data
	}
	let parts
	if(typeof path === 'string') {
		parts = path.trim().split('.')
	}
	else if(Array.isArray(path)) {
		parts = path
	}
	
	let name = parts.shift()
	if(name.indexOf(' ') > -1) {
		// there's a space, which means it's really unlikely it's a property
		return null
	}
	let child
	if(name === 'this' || name === '$this') {
		child = data
	}
	else if(typeof data === 'object') {
		if(name in data) {
			child = data[name]
		}
	}
	if(parts.length > 0) {
		return resolveDataPath(child, parts)
	}
	else {
		return child
	}
} */
function resolveDataPath(data, path) {
	if (data === null || data === undefined) {
		return data
	}
	let parts
	if (typeof path === 'string') {
		parts = path.trim().split('.')
	}
	else if (Array.isArray(path)) {
		parts = path
	}

	while (parts.length > 0) {
		let name = parts.shift()
		if (name.indexOf(' ') > -1) {
			// there's a space, which means it's really unlikely it's a property
			return null
		}
		let child
		if (name === 'this' || name === '$this') {
			child = data
		}
		else if (typeof data === 'object') {
			if (name in data) {
				child = data[name]
			}
		}
		if (parts.length == 0) {
			return child
		}
		data = child
	}
}

module.exports = resolveDataPath

/***/ }),

/***/ "./node_modules/tripartite/tripartite.js":
/*!***********************************************!*\
  !*** ./node_modules/tripartite/tripartite.js ***!
  \***********************************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {




if (typeof String.prototype.trim !== 'function') {
	String.prototype.trim = function () {
		return this.replace(/^\s+|\s+$/g, '');
	}
}


function isStream(stream) {
	return stream !== null
		&& typeof stream === 'object'
		&& typeof stream.pipe === 'function';
}


function isTemplate(obj) {
	if (!obj) {
		return false
	}
	if (typeof obj !== 'function') {
		return false
	}
	if (!obj.write) {
		return false
	}
	if (!obj.parts) {
		return false
	}
	if (!obj.templateMeta) {
		return false
	}

	return true
}

let ExecutionContext = __webpack_require__(/*! ./execution-context */ "./node_modules/tripartite/execution-context.js")
let ActiveElement = __webpack_require__(/*! ./active-element */ "./node_modules/tripartite/active-element.js")


class Tripartite {
	constructor(options = {}) {
		this.templates = {
			defaultTemplate: this._makeTemplate(function (thedata) {
				return '' + thedata;
			})
		}
		let { constants = {
			templateBoundary: '__',
			templateNameBoundary: '##'
		} } = options
		this.constants = constants

		// This object (if set) will receive the template functions parsed from a script
		// I want to be able to call my templates as global functions, so I've set it
		// to be the window object
		this.secondaryTemplateFunctionObject = options.secondaryTemplateFunctionObject

		this.loaders = options.loaders || []

		this.dataFunctions = options.dataFunction || {}
	}

	_makeTemplate(transformationFunction) {
		if (isTemplate(transformationFunction)) {
			return transformationFunction
		}
		let tri = this
		let f = function (thedata) {
			let stream = null
			let options = null
			let callback = null
			for (let i = 1; i < arguments.length; i++) {
				let arg = arguments[i]
				if (isStream(arg)) {
					stream = arg
				}
				else if(typeof arg === 'function') {
					callback = arg
				}
				else if(typeof arg === 'object') {
					options = arg
				}
			}

			return f.write(thedata, stream, callback, options)
		}
		f.write = function (thedata, stream, callback, options = {}) {
			if(transformationFunction && transformationFunction.write) {
				// if it's not a template, but has a write method, invoke the right method directly
				return transformationFunction.write.apply(transformationFunction, arguments)
			}
			else {
				let dest = stream || ''

				let context = new ExecutionContext(tri, f, thedata, dest, tri.dataFunctions)
				if (options && 'continueOnTripartiteError' in options) {
					context.continueOnTripartiteError = options.continueOnTripartiteError
				}

				return context.run(callback)
			}
		}
		f.parts = []
		if (transformationFunction && typeof transformationFunction === 'function') {
			f.parts.push(transformationFunction)
		}
		f.templateMeta = {}
		return f
	}

	addTemplate(name, template) {
		if (typeof template === 'string') {
			template = this.parseTemplate(template);
		}
		else if (typeof template === 'function') {
			template = this._makeTemplate(template)
		}

		this.templates[name] = template;
		template.templateMeta = template.templateMeta || {}
		template.templateMeta.name = name
		return template;
	}

	createBlank() {
		return new Tripartite()
	}

	getTemplate(name) {
		return this.templates[name]
	}

	loadTemplate(name, callback) {
		if (name in this.templates) {
			callback(this.templates[name])
		}
		else {
			let tri = this
			let count = this.loaders.length
			let done = false

			if (count == 0) {
				tri.templates[name] = null
				callback(tri.getTemplate(name))
			}
			else {
				this.loaders.forEach(loader => {
					if (done) {
						return
					}
					loader(name, template => {
						if (done) {
							return
						}
						count--
						if (template) {
							done = true
							tri.addTemplate(name, template)
						}
						else if (count == 0) {
							done = true
							tri.templates[name] = null
						}
						if (done) {
							callback(tri.getTemplate(name))
						}
					})
				})
			}
		}
	}
	parseTemplateScript(tx) {
		var tks = this.tokenizeTemplateScript(tx);
		/* current template name */
		var ctn = null;
		for (var i = 0; i < tks.length; i++) {
			var token = tks[i];
			if (token.active) {
				ctn = token.content;
			}
			else {
				if (ctn) {
					var template = this.addTemplate(ctn, this.stripTemplateWhitespace(token.content));
					if (this.secondaryTemplateFunctionObject) {
						this.secondaryTemplateFunctionObject[ctn] = template;
					}
					ctn = null;
				}
			}
		}
	}

	stripTemplateWhitespace(txt) {
		var i = txt.indexOf('\n');
		if (i > -1 && txt.substring(0, i).trim() == '') {
			txt = txt.substring(i + 1);
		}
		i = txt.lastIndexOf('\n');
		if (i > -1 && txt.substring(i).trim() == '') {
			txt = txt.substring(0, i);
		}
		return txt;
	}

	/* simple template */
	_createActiveElement(/* conditional expression */ cd, data, /* handling expression */ hd, tripartite, templateMeta) {
		let el = new ActiveElement(cd, data, hd, tripartite);
		el.templateMeta = templateMeta
		return el
	}
	pt(tx) {
		return this.parseTemplate(tx)
	}
	/* parse template */
	parseTemplate(tx) {
		var tks = this.tokenizeTemplate(tx);
		let t = this._makeTemplate()
		var templateMeta = t.templateMeta

		for (let tk of tks) {
			if (tk.active) {
				t.parts.push(this.tokenizeActivePart(tk.content, templateMeta));
			}
			else if (tk.content) {
				t.parts.push(tk.content);
			}
		}

		return t
	}

	tokenizeActivePart(tx, templateMeta) {
		var con = null;
		var dat = null;
		var han = null;

		/* condition index */
		var ci = tx.indexOf('??');
		if (ci > -1) {
			con = tx.substring(0, ci);
			ci += 2;
		}
		else {
			ci = 0;
		}

		/* handler index */
		var hi = tx.indexOf('::');
		if (hi > -1) {
			dat = tx.substring(ci, hi);
			han = tx.substring(hi + 2);
		}
		else {
			dat = tx.substring(ci);
		}
		return this._createActiveElement(con, dat, han, this, templateMeta);
	}

	tokenizeTemplate(tx) {
		return this.tokenizeActiveAndInactiveBlocks(tx, this.constants.templateBoundary);
	}


	/** tokenize template script */
	tokenizeTemplateScript(tx) {
		return this.tokenizeActiveAndInactiveBlocks(tx, this.constants.templateNameBoundary);
	}

	/* tokenize active and inactive blocks */
	tokenizeActiveAndInactiveBlocks(text, /*Active Region Boundary */ boundary) {
		/* whole length */
		let length = text.length

		/* current position */
		let position = 0

		/* are we in an active region */
		let act = false

		let tokens = []

		while (position < length) {
			let i = text.indexOf(boundary, position);
			if (i == -1) {
				i = length;
			}
			var tk = { active: act, content: text.substring(position, i) };
			tokens.push(tk);
			position = i + boundary.length;
			act = !act;
		}

		return tokens;
	}

}
var tripartiteInstance = new Tripartite()

if (typeof window != 'undefined') {
	tripartiteInstance.secondaryTemplateFunctionObject = window
}


if (true) {
	module.exports = tripartiteInstance
}
else {}

if (typeof __webpack_require__.g != 'undefined') {
	if (!__webpack_require__.g.Tripartite) {
		__webpack_require__.g.Tripartite = Tripartite
	}
	if (!__webpack_require__.g.tripartite) {
		__webpack_require__.g.tripartite = tripartiteInstance
	}
}



/***/ }),

/***/ "./views/test1.tri":
/*!*************************!*\
  !*** ./views/test1.tri ***!
  \*************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var tri = __webpack_require__(/*! tripartite */ "./node_modules/tripartite/tripartite.js"); var t = "This is test1.tri\n"; 
module.exports = tri.addTemplate("test1", t); 

/***/ }),

/***/ "./views/test2.tri":
/*!*************************!*\
  !*** ./views/test2.tri ***!
  \*************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

var tri = __webpack_require__(/*! tripartite */ "./node_modules/tripartite/tripartite.js"); var t = "This is test2.tri\n__::.\/test1__\n"; 
module.exports = tri.addTemplate("test2", t); 

/***/ }),

/***/ "./client-js/event-entry-mapper.js":
/*!*****************************************!*\
  !*** ./client-js/event-entry-mapper.js ***!
  \*****************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ eventEntryMapper)
/* harmony export */ });
function eventEntryMapper([key, value]) {
	key = key.trim()
	let parts = key.split(' ')
	let event = parts.shift().trim()
	let selector = parts.join(' ').trim()
	
	if(typeof value === 'string') {
		value = value.trim()
	}	
	
	return {
		event: event,
		selector: selector,
		handler: value
	}
}

/***/ }),

/***/ "./client-js/extract-event-names.js":
/*!******************************************!*\
  !*** ./client-js/extract-event-names.js ***!
  \******************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ extractEventNames)
/* harmony export */ });
function extractEventNames(eventTriggers) {
	let eventNames = Array.from(eventTriggers.reduce((acc, trigger) => {
		acc.add(trigger.event)
		return acc
	}, new Set()))
	return eventNames
}

/***/ }),

/***/ "./client-js/generate-id.js":
/*!**********************************!*\
  !*** ./client-js/generate-id.js ***!
  \**********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ generateId)
/* harmony export */ });
/**
 * Generates a random string id in the browser. Will probably not work
 * on the server.
 * @returns A base64 web url safe string
 */
function generateId() {
	let array = new Uint8Array(32)
	window.crypto.getRandomValues(array)
	let value = btoa(array)
	value = value.replace(/\//g, "_").replace(/\+/g, "-").replace(/=+$/, "")
	return value
}

/***/ }),

/***/ "./client-js/index.js":
/*!****************************!*\
  !*** ./client-js/index.js ***!
  \****************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   View: () => (/* reexport safe */ _view_js__WEBPACK_IMPORTED_MODULE_0__.View)
/* harmony export */ });
/* harmony import */ var _view_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./view.js */ "./client-js/view.js");




/***/ }),

/***/ "./client-js/view.js":
/*!***************************!*\
  !*** ./client-js/view.js ***!
  \***************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   View: () => (/* binding */ View)
/* harmony export */ });
/* harmony import */ var _generate_id_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./generate-id.js */ "./client-js/generate-id.js");
/* harmony import */ var _event_entry_mapper_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./event-entry-mapper.js */ "./client-js/event-entry-mapper.js");
/* harmony import */ var _extract_event_names_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./extract-event-names.js */ "./client-js/extract-event-names.js");

// import pick from "./pick.js"



let defaultOptions = {
	// The default `tagName` of a View's element is `"div"`.
	tagName: 'div'
	
	, events: {}

}
let viewOptions = ['model', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

/**
 * A way to connect data to be displayed, a way to display it, and an organization
 * of functions to handle events.
 */
class View {
	constructor(options) {
		this.id = (0,_generate_id_js__WEBPACK_IMPORTED_MODULE_0__["default"])()
		Object.assign(this, defaultOptions)
		this.preinitialize.apply(this, arguments);
		Object.assign(this, options)
		this._ensureElement()
		this.initialize.apply(this, arguments);
	}


	/**
	 * preinitialize is an empty function by default. You can override it with a function
	 * or object.  preinitialize will run before any instantiation logic is run in the View
	 */
	preinitialize() { }

	/**
	 * Initialize is an empty function by default. Override it with your own
	 * initialization logic.
	 */
	initialize() { }

	/**
	 * **render** is the core function that your view should override, in order
	 * to populate its element (`this.el`), with the appropriate HTML. The
	 * convention is for **render** to always return `this`.
	 * @returns this
	 */
	render() {
		return this
	}
	
	/**
	 * Removes the element from the dom. Does not disable event listeners
	 */
	remove() {
		this.el.parentElement.removeChild(this.el)
	}
	
	/**
	 * Adds this view as a child to a containing element. Nothing special is going on here.
	 * This is just a shortcut for container.appendChild
	 * @param {Element} container 
	 */
	appendTo(container) {
		container.appendChild(this.el)
	}

	/**
	 * Clears the contents of the container and adds this view.
	 * @param {Element} container 
	 */
	replaceContentsOf(container) {
		container.innerHTML = ''
		this.appendTo(container)
	}

	/**
	 * Set the element for this view, and if new, adds listeners to it in accordance
	 * with the "events" member.
	 * @param {Element} el The dom element which will be the root of this view
	 * @returns this
	 */
	setElement(el) {
		if (this.el !== el) {
			this.el = el
			this._addListeners()
		}
		return this
	}

	/**
	 * Produces a DOM element to be assigned to your view. Exposed for
	 * subclasses using an alternative DOM manipulation API.
	 * @param {string} name The element tag name
	 * @returns The dom element
	 */
	_createElement(name) {
		let el = document.createElement(name)
		el.view = this
		return el
	}

	/**
	 * Ensures that the element exists. Applies attributes and className
	 * to it regardless
	 */
	_ensureElement() {
		if (!this.el) {
			this.setElement(this._createElement(this.tagName))
		}
		this._setAttributes()
		if (this.className) {
			this.el.classList.add(this.className)
		}
	}

	/**
	 * Set attributes from a hash on this view's element.  Exposed for
	 * subclasses using an alternative DOM manipulation API.
	 * @param {object} attributes 
	 */
	_setAttributes(attributes) {
		if (this.attributes) {
			for (let [key, value] of Object.entries(this.attributes)) {
				this.el.setAttribute(key, value)
			}
		}
	}

	/**
	 * 
	 * Set callbacks, where `this.events` is a hash of
	 * *{"event selector": "callback"}*
	 *
	 *    {
	 *       'mousedown .title':  'edit',
	 *       'click .button':     'save',
	 *       'click .open':       function(e) { ... },
	 *       'keydown .':     	  'handleKey'
	 *    }
	 * pairs. Callbacks will be bound to the view, with `this` set properly.
	 * 
	 * 
	 * Note that the selector `.` will match the root element and can be used
	 * as a final chance to handle events or for events like an escape key
	 * which are essentially global to the widget.
	 * 
	 */
	_addListeners() {
		this.eventTriggers = Object.entries(this.events).map(_event_entry_mapper_js__WEBPACK_IMPORTED_MODULE_1__["default"])
		let eventNames = (0,_extract_event_names_js__WEBPACK_IMPORTED_MODULE_2__["default"])(this.eventTriggers)		

		for(let eventName of eventNames) {
			this.el.addEventListener(eventName, this._eventHandler.bind(this))
		}
	}
	
	/**
	 * Get the elements from the view which match the selector
	 * @param {string} selector A css selector. `.` will select the root element
	 * @returns An array of elements
	 */
	_getCandidates(selector) {
		if(selector === '.') {
			return [this.el]
		}
		return Array.from(this.el.querySelectorAll(selector))
	}
	
	/**
	 * Handles all events for all elements within the view. It attempts to find a
	 * trigger matching the event and then process it. It will match and invoke
	 * only one trigger.
	 * @param {Event} evt 
	 */
	_eventHandler(evt) {
		for(let trigger of this.eventTriggers) {
			if(evt.type == trigger.event) {
				let candidates = this._getCandidates(trigger.selector)
				let found = null
				for(let candidate of candidates) {
					if(candidate === evt.target || candidate.contains(evt.target)) {
						found = candidate
						break
					}
				}
				if(found) {
					if(typeof trigger.handler === 'string') {
						this[trigger.handler].call(this, evt, found)
					}	
					else if(typeof trigger.handler === 'function') {
						trigger.handler.call(this, evt, found)
					}
					break
				}
			}
		}
	}
}


/***/ }),

/***/ "./views/load-browser-views.js":
/*!*************************************!*\
  !*** ./views/load-browser-views.js ***!
  \*************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   test1: () => (/* binding */ test1),
/* harmony export */   test2: () => (/* binding */ test2)
/* harmony export */ });
/* harmony import */ var _test1_tri__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./test1.tri */ "./views/test1.tri");
/* harmony import */ var _test2_tri__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./test2.tri */ "./views/test2.tri");




let test1 = _test1_tri__WEBPACK_IMPORTED_MODULE_0__
let test2 = _test2_tri__WEBPACK_IMPORTED_MODULE_1__

/***/ })

/******/ });
/************************************************************************/
/******/ // The module cache
/******/ var __webpack_module_cache__ = {};
/******/ 
/******/ // The require function
/******/ function __webpack_require__(moduleId) {
/******/ 	// Check if module is in cache
/******/ 	var cachedModule = __webpack_module_cache__[moduleId];
/******/ 	if (cachedModule !== undefined) {
/******/ 		return cachedModule.exports;
/******/ 	}
/******/ 	// Create a new module (and put it into the cache)
/******/ 	var module = __webpack_module_cache__[moduleId] = {
/******/ 		// no module.id needed
/******/ 		// no module.loaded needed
/******/ 		exports: {}
/******/ 	};
/******/ 
/******/ 	// Execute the module function
/******/ 	__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 
/******/ 	// Return the exports of the module
/******/ 	return module.exports;
/******/ }
/******/ 
/************************************************************************/
/******/ /* webpack/runtime/define property getters */
/******/ (() => {
/******/ 	// define getter functions for harmony exports
/******/ 	__webpack_require__.d = (exports, definition) => {
/******/ 		for(var key in definition) {
/******/ 			if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 				Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 			}
/******/ 		}
/******/ 	};
/******/ })();
/******/ 
/******/ /* webpack/runtime/global */
/******/ (() => {
/******/ 	__webpack_require__.g = (function() {
/******/ 		if (typeof globalThis === 'object') return globalThis;
/******/ 		try {
/******/ 			return this || new Function('return this')();
/******/ 		} catch (e) {
/******/ 			if (typeof window === 'object') return window;
/******/ 		}
/******/ 	})();
/******/ })();
/******/ 
/******/ /* webpack/runtime/hasOwnProperty shorthand */
/******/ (() => {
/******/ 	__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ })();
/******/ 
/******/ /* webpack/runtime/make namespace object */
/******/ (() => {
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = (exports) => {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/ })();
/******/ 
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**********************************!*\
  !*** ./client-js-test/pages.mjs ***!
  \**********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var tripartite__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! tripartite */ "./node_modules/tripartite/tripartite.js");
/* harmony import */ var _views_load_browser_views_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../views/load-browser-views.js */ "./views/load-browser-views.js");
/* harmony import */ var _client_js_index_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../client-js/index.js */ "./client-js/index.js");





class DollarView extends _client_js_index_js__WEBPACK_IMPORTED_MODULE_2__.View {
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

})();


//# sourceMappingURL=pages.js.map