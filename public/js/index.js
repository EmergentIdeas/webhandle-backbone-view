var e={d:(t,i)=>{for(var r in i)e.o(i,r)&&!e.o(t,r)&&Object.defineProperty(t,r,{enumerable:!0,get:i[r]})},o:(e,t)=>Object.prototype.hasOwnProperty.call(e,t)},t={};function i([e,t]){let i=(e=e.trim()).split(" "),r=i.shift().trim(),s=i.join(" ").trim();return"string"==typeof t&&(t=t.trim()),{event:r,selector:s,handler:t}}e.d(t,{G:()=>s});let r={tagName:"div",events:{}};class s{constructor(e){this.id=function(){let e=new Uint8Array(32);window.crypto.getRandomValues(e);let t=btoa(e);return t=t.replace(/\//g,"_").replace(/\+/g,"-").replace(/=+$/,""),t}(),Object.assign(this,r),this.preinitialize.apply(this,arguments),Object.assign(this,e),this._ensureElement(),this.initialize.apply(this,arguments)}preinitialize(){}initialize(){}render(){return this}remove(){this.el.parentElement.removeChild(this.el)}appendTo(e){e.appendChild(this.el)}replaceContentsOf(e){e.innerHTML="",this.appendTo(e)}setElement(e){return this.el!==e&&(this.el=e,this._addListeners()),this}_createElement(e){let t=document.createElement(e);return t.view=this,t}_ensureElement(){this.el||this.setElement(this._createElement(this.tagName)),this._setAttributes(),this.className&&this.el.classList.add(this.className)}_setAttributes(e){if(this.attributes)for(let[e,t]of Object.entries(this.attributes))this.el.setAttribute(e,t)}_addListeners(){this.eventTriggers=Object.entries(this.events).map(i);let e=(t=this.eventTriggers,Array.from(t.reduce(((e,t)=>(e.add(t.event),e)),new Set)));var t;for(let t of e)this.el.addEventListener(t,this._eventHandler.bind(this))}_getCandidates(e){return"."===e?[this.el]:Array.from(this.el.querySelectorAll(e))}_eventHandler(e){for(let t of this.eventTriggers)if(e.type==t.event){let i=this._getCandidates(t.selector),r=null;for(let t of i)if(t===e.target||t.contains(e.target)){r=t;break}if(r){"string"==typeof t.handler?this[t.handler].call(this,e,r):"function"==typeof t.handler&&t.handler.call(this,e,r);break}}}}var n=t.G;export{n as View};
//# sourceMappingURL=index.js.map