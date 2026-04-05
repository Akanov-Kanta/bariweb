(function(){var e=Object.defineProperty,t=(e,t)=>()=>(e&&(t=e(e=0)),t),n=(t,n)=>{let r={};for(var i in t)e(r,i,{get:t[i],enumerable:!0});return n||e(r,Symbol.toStringTag,{value:`Module`}),r},r={bodySerializer:e=>JSON.stringify(e,(e,t)=>typeof t==`bigint`?t.toString():t)};Object.entries({$body_:`body`,$headers_:`headers`,$path_:`path`,$query_:`query`});var i=({onRequest:e,onSseError:t,onSseEvent:n,responseTransformer:r,responseValidator:i,sseDefaultRetryDelay:a,sseMaxRetryAttempts:o,sseMaxRetryDelay:s,sseSleepFn:c,url:l,...u})=>{let d,f=c??(e=>new Promise(t=>setTimeout(t,e)));return{stream:async function*(){let c=a??3e3,p=0,m=u.signal??new AbortController().signal;for(;!m.aborted;){p++;let a=u.headers instanceof Headers?u.headers:new Headers(u.headers);d!==void 0&&a.set(`Last-Event-ID`,d);try{let t={redirect:`follow`,...u,body:u.serializedBody,headers:a,signal:m},o=new Request(l,t);e&&(o=await e(l,t));let s=await(u.fetch??globalThis.fetch)(o);if(!s.ok)throw Error(`SSE failed: ${s.status} ${s.statusText}`);if(!s.body)throw Error(`No body in SSE response`);let f=s.body.pipeThrough(new TextDecoderStream).getReader(),p=``,h=()=>{try{f.cancel()}catch{}};m.addEventListener(`abort`,h);try{for(;;){let{done:e,value:t}=await f.read();if(e)break;p+=t,p=p.replace(/\r\n/g,`
`).replace(/\r/g,`
`);let a=p.split(`

`);p=a.pop()??``;for(let e of a){let t=e.split(`
`),a=[],o;for(let e of t)if(e.startsWith(`data:`))a.push(e.replace(/^data:\s*/,``));else if(e.startsWith(`event:`))o=e.replace(/^event:\s*/,``);else if(e.startsWith(`id:`))d=e.replace(/^id:\s*/,``);else if(e.startsWith(`retry:`)){let t=Number.parseInt(e.replace(/^retry:\s*/,``),10);Number.isNaN(t)||(c=t)}let s,l=!1;if(a.length){let e=a.join(`
`);try{s=JSON.parse(e),l=!0}catch{s=e}}l&&(i&&await i(s),r&&(s=await r(s))),n?.({data:s,event:o,id:d,retry:c}),a.length&&(yield s)}}}finally{m.removeEventListener(`abort`,h),f.releaseLock()}break}catch(e){if(t?.(e),o!==void 0&&p>=o)break;await f(Math.min(c*2**(p-1),s??3e4))}}}()}},a=e=>{switch(e){case`label`:return`.`;case`matrix`:return`;`;case`simple`:return`,`;default:return`&`}},o=e=>{switch(e){case`form`:return`,`;case`pipeDelimited`:return`|`;case`spaceDelimited`:return`%20`;default:return`,`}},s=e=>{switch(e){case`label`:return`.`;case`matrix`:return`;`;case`simple`:return`,`;default:return`&`}},c=({allowReserved:e,explode:t,name:n,style:r,value:i})=>{if(!t){let t=(e?i:i.map(e=>encodeURIComponent(e))).join(o(r));switch(r){case`label`:return`.${t}`;case`matrix`:return`;${n}=${t}`;case`simple`:return t;default:return`${n}=${t}`}}let s=a(r),c=i.map(t=>r===`label`||r===`simple`?e?t:encodeURIComponent(t):l({allowReserved:e,name:n,value:t})).join(s);return r===`label`||r===`matrix`?s+c:c},l=({allowReserved:e,name:t,value:n})=>{if(n==null)return``;if(typeof n==`object`)throw Error("Deeply-nested arrays/objects aren’t supported. Provide your own `querySerializer()` to handle these.");return`${t}=${e?n:encodeURIComponent(n)}`},u=({allowReserved:e,explode:t,name:n,style:r,value:i,valueOnly:a})=>{if(i instanceof Date)return a?i.toISOString():`${n}=${i.toISOString()}`;if(r!==`deepObject`&&!t){let t=[];Object.entries(i).forEach(([n,r])=>{t=[...t,n,e?r:encodeURIComponent(r)]});let a=t.join(`,`);switch(r){case`form`:return`${n}=${a}`;case`label`:return`.${a}`;case`matrix`:return`;${n}=${a}`;default:return a}}let o=s(r),c=Object.entries(i).map(([t,i])=>l({allowReserved:e,name:r===`deepObject`?`${n}[${t}]`:t,value:i})).join(o);return r===`label`||r===`matrix`?o+c:c},d=/\{[^{}]+\}/g,f=({path:e,url:t})=>{let n=t,r=t.match(d);if(r)for(let t of r){let r=!1,i=t.substring(1,t.length-1),a=`simple`;i.endsWith(`*`)&&(r=!0,i=i.substring(0,i.length-1)),i.startsWith(`.`)?(i=i.substring(1),a=`label`):i.startsWith(`;`)&&(i=i.substring(1),a=`matrix`);let o=e[i];if(o==null)continue;if(Array.isArray(o)){n=n.replace(t,c({explode:r,name:i,style:a,value:o}));continue}if(typeof o==`object`){n=n.replace(t,u({explode:r,name:i,style:a,value:o,valueOnly:!0}));continue}if(a===`matrix`){n=n.replace(t,`;${l({name:i,value:o})}`);continue}let s=encodeURIComponent(a===`label`?`.${o}`:o);n=n.replace(t,s)}return n},p=({baseUrl:e,path:t,query:n,querySerializer:r,url:i})=>{let a=i.startsWith(`/`)?i:`/${i}`,o=(e??``)+a;t&&(o=f({path:t,url:o}));let s=n?r(n):``;return s.startsWith(`?`)&&(s=s.substring(1)),s&&(o+=`?${s}`),o};function m(e){let t=e.body!==void 0;if(t&&e.bodySerializer)return`serializedBody`in e?e.serializedBody!==void 0&&e.serializedBody!==``?e.serializedBody:null:e.body===``?null:e.body;if(t)return e.body}var h=async(e,t)=>{let n=typeof t==`function`?await t(e):t;if(n)return e.scheme===`bearer`?`Bearer ${n}`:e.scheme===`basic`?`Basic ${btoa(n)}`:n},ee=({parameters:e={},...t}={})=>n=>{let r=[];if(n&&typeof n==`object`)for(let i in n){let a=n[i];if(a==null)continue;let o=e[i]||t;if(Array.isArray(a)){let e=c({allowReserved:o.allowReserved,explode:!0,name:i,style:`form`,value:a,...o.array});e&&r.push(e)}else if(typeof a==`object`){let e=u({allowReserved:o.allowReserved,explode:!0,name:i,style:`deepObject`,value:a,...o.object});e&&r.push(e)}else{let e=l({allowReserved:o.allowReserved,name:i,value:a});e&&r.push(e)}}return r.join(`&`)},te=e=>{if(!e)return`stream`;let t=e.split(`;`)[0]?.trim();if(t){if(t.startsWith(`application/json`)||t.endsWith(`+json`))return`json`;if(t===`multipart/form-data`)return`formData`;if([`application/`,`audio/`,`image/`,`video/`].some(e=>t.startsWith(e)))return`blob`;if(t.startsWith(`text/`))return`text`}},ne=(e,t)=>t?!!(e.headers.has(t)||e.query?.[t]||e.headers.get(`Cookie`)?.includes(`${t}=`)):!1,re=async({security:e,...t})=>{for(let n of e){if(ne(t,n.name))continue;let e=await h(n,t.auth);if(!e)continue;let r=n.name??`Authorization`;switch(n.in){case`query`:t.query||={},t.query[r]=e;break;case`cookie`:t.headers.append(`Cookie`,`${r}=${e}`);break;default:t.headers.set(r,e);break}}},ie=e=>p({baseUrl:e.baseUrl,path:e.path,query:e.query,querySerializer:typeof e.querySerializer==`function`?e.querySerializer:ee(e.querySerializer),url:e.url}),ae=(e,t)=>{let n={...e,...t};return n.baseUrl?.endsWith(`/`)&&(n.baseUrl=n.baseUrl.substring(0,n.baseUrl.length-1)),n.headers=se(e.headers,t.headers),n},oe=e=>{let t=[];return e.forEach((e,n)=>{t.push([n,e])}),t},se=(...e)=>{let t=new Headers;for(let n of e){if(!n)continue;let e=n instanceof Headers?oe(n):Object.entries(n);for(let[n,r]of e)if(r===null)t.delete(n);else if(Array.isArray(r))for(let e of r)t.append(n,e);else r!==void 0&&t.set(n,typeof r==`object`?JSON.stringify(r):r)}return t},ce=class{constructor(){this.fns=[]}clear(){this.fns=[]}eject(e){let t=this.getInterceptorIndex(e);this.fns[t]&&(this.fns[t]=null)}exists(e){let t=this.getInterceptorIndex(e);return!!this.fns[t]}getInterceptorIndex(e){return typeof e==`number`?this.fns[e]?e:-1:this.fns.indexOf(e)}update(e,t){let n=this.getInterceptorIndex(e);return this.fns[n]?(this.fns[n]=t,e):!1}use(e){return this.fns.push(e),this.fns.length-1}},le=()=>({error:new ce,request:new ce,response:new ce}),ue=ee({allowReserved:!1,array:{explode:!0,style:`form`},object:{explode:!0,style:`deepObject`}}),de={"Content-Type":`application/json`},fe=(e={})=>({...r,headers:de,parseAs:`auto`,querySerializer:ue,...e}),pe=((e={})=>{let t=ae(fe(),e),n=()=>({...t}),r=e=>(t=ae(t,e),n()),a=le(),o=async e=>{let n={...t,...e,fetch:e.fetch??t.fetch??globalThis.fetch,headers:se(t.headers,e.headers),serializedBody:void 0};return n.security&&await re({...n,security:n.security}),n.requestValidator&&await n.requestValidator(n),n.body!==void 0&&n.bodySerializer&&(n.serializedBody=n.bodySerializer(n.body)),(n.body===void 0||n.serializedBody===``)&&n.headers.delete(`Content-Type`),{opts:n,url:ie(n)}},s=async e=>{let{opts:t,url:n}=await o(e),r={redirect:`follow`,...t,body:m(t)},i=new Request(n,r);for(let e of a.request.fns)e&&(i=await e(i,t));let s=t.fetch,c;try{c=await s(i)}catch(e){let n=e;for(let r of a.error.fns)r&&(n=await r(e,void 0,i,t));if(n||={},t.throwOnError)throw n;return t.responseStyle===`data`?void 0:{error:n,request:i,response:void 0}}for(let e of a.response.fns)e&&(c=await e(c,i,t));let l={request:i,response:c};if(c.ok){let e=(t.parseAs===`auto`?te(c.headers.get(`Content-Type`)):t.parseAs)??`json`;if(c.status===204||c.headers.get(`Content-Length`)===`0`){let n;switch(e){case`arrayBuffer`:case`blob`:case`text`:n=await c[e]();break;case`formData`:n=new FormData;break;case`stream`:n=c.body;break;default:n={};break}return t.responseStyle===`data`?n:{data:n,...l}}let n;switch(e){case`arrayBuffer`:case`blob`:case`formData`:case`text`:n=await c[e]();break;case`json`:{let e=await c.text();n=e?JSON.parse(e):{};break}case`stream`:return t.responseStyle===`data`?c.body:{data:c.body,...l}}return e===`json`&&(t.responseValidator&&await t.responseValidator(n),t.responseTransformer&&(n=await t.responseTransformer(n))),t.responseStyle===`data`?n:{data:n,...l}}let u=await c.text(),d;try{d=JSON.parse(u)}catch{}let f=d??u,p=f;for(let e of a.error.fns)e&&(p=await e(f,c,i,t));if(p||={},t.throwOnError)throw p;return t.responseStyle===`data`?void 0:{error:p,...l}},c=e=>t=>s({...t,method:e}),l=e=>async t=>{let{opts:n,url:r}=await o(t);return i({...n,body:n.body,headers:n.headers,method:e,onRequest:async(e,t)=>{let r=new Request(e,t);for(let e of a.request.fns)e&&(r=await e(r,n));return r},serializedBody:m(n),url:r})};return{buildUrl:e=>ie({...t,...e}),connect:c(`CONNECT`),delete:c(`DELETE`),get:c(`GET`),getConfig:n,head:c(`HEAD`),interceptors:a,options:c(`OPTIONS`),patch:c(`PATCH`),post:c(`POST`),put:c(`PUT`),request:s,setConfig:r,sse:{connect:l(`CONNECT`),delete:l(`DELETE`),get:l(`GET`),head:l(`HEAD`),options:l(`OPTIONS`),patch:l(`PATCH`),post:l(`POST`),put:l(`PUT`),trace:l(`TRACE`)},trace:c(`TRACE`)}})(fe({baseUrl:`http://localhost:8000`})),g=globalThis,me=g.ShadowRoot&&(g.ShadyCSS===void 0||g.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,he=Symbol(),ge=new WeakMap,_e=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==he)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(me&&e===void 0){let n=t!==void 0&&t.length===1;n&&(e=ge.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&ge.set(t,e))}return e}toString(){return this.cssText}},ve=e=>new _e(typeof e==`string`?e:e+``,void 0,he),_=(e,...t)=>new _e(e.length===1?e[0]:t.reduce((t,n,r)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if(typeof e==`number`)return e;throw Error(`Value passed to 'css' function must be a 'css' function result: `+e+`. Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.`)})(n)+e[r+1],e[0]),e,he),ye=(e,t)=>{if(me)e.adoptedStyleSheets=t.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let n of t){let t=document.createElement(`style`),r=g.litNonce;r!==void 0&&t.setAttribute(`nonce`,r),t.textContent=n.cssText,e.appendChild(t)}},be=me?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return ve(t)})(e):e,{is:xe,defineProperty:Se,getOwnPropertyDescriptor:Ce,getOwnPropertyNames:we,getOwnPropertySymbols:Te,getPrototypeOf:Ee}=Object,v=globalThis,De=v.trustedTypes,Oe=De?De.emptyScript:``,ke=v.reactiveElementPolyfillSupport,y=(e,t)=>e,b={toAttribute(e,t){switch(t){case Boolean:e=e?Oe:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},Ae=(e,t)=>!xe(e,t),je={attribute:!0,type:String,converter:b,reflect:!1,useDefault:!1,hasChanged:Ae};Symbol.metadata??=Symbol(`metadata`),v.litPropertyMetadata??=new WeakMap;var x=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=je){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&Se(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=Ce(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??je}static _$Ei(){if(this.hasOwnProperty(y(`elementProperties`)))return;let e=Ee(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(y(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(y(`properties`))){let e=this.properties,t=[...we(e),...Te(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(be(e))}else e!==void 0&&t.push(be(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return ye(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?b:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?b:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??Ae)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};x.elementStyles=[],x.shadowRootOptions={mode:`open`},x[y(`elementProperties`)]=new Map,x[y(`finalized`)]=new Map,ke?.({ReactiveElement:x}),(v.reactiveElementVersions??=[]).push(`2.1.2`);var Me=globalThis,Ne=e=>e,S=Me.trustedTypes,Pe=S?S.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,Fe=`$lit$`,C=`lit$${Math.random().toFixed(9).slice(2)}$`,Ie=`?`+C,Le=`<${Ie}>`,w=document,T=()=>w.createComment(``),E=e=>e===null||typeof e!=`object`&&typeof e!=`function`,D=Array.isArray,Re=e=>D(e)||typeof e?.[Symbol.iterator]==`function`,ze=`[ 	
\f\r]`,O=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,Be=/-->/g,Ve=/>/g,k=RegExp(`>|${ze}(?:([^\\s"'>=/]+)(${ze}*=${ze}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),He=/'/g,Ue=/"/g,We=/^(?:script|style|textarea|title)$/i,A=(e=>(t,...n)=>({_$litType$:e,strings:t,values:n}))(1),j=Symbol.for(`lit-noChange`),M=Symbol.for(`lit-nothing`),Ge=new WeakMap,N=w.createTreeWalker(w,129);function Ke(e,t){if(!D(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return Pe===void 0?t:Pe.createHTML(t)}var qe=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=O;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===O?c[1]===`!--`?o=Be:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=k):(We.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=k):o=Ve:o===k?c[0]===`>`?(o=i??O,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?k:c[3]===`"`?Ue:He):o===Ue||o===He?o=k:o===Be||o===Ve?o=O:(o=k,i=void 0);let d=o===k&&e[t+1].startsWith(`/>`)?` `:``;a+=o===O?n+Le:l>=0?(r.push(s),n.slice(0,l)+Fe+n.slice(l)+C+d):n+C+(l===-2?t:d)}return[Ke(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},P=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=qe(t,n);if(this.el=e.createElement(l,r),N.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=N.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(Fe)){let t=u[o++],n=i.getAttribute(e).split(C),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?Ye:r[1]===`?`?Xe:r[1]===`@`?Ze:L}),i.removeAttribute(e)}else e.startsWith(C)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(We.test(i.tagName)){let e=i.textContent.split(C),t=e.length-1;if(t>0){i.textContent=S?S.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],T()),N.nextNode(),c.push({type:2,index:++a});i.append(e[t],T())}}}else if(i.nodeType===8)if(i.data===Ie)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(C,e+1))!==-1;)c.push({type:7,index:a}),e+=C.length-1}a++}}static createElement(e,t){let n=w.createElement(`template`);return n.innerHTML=e,n}};function F(e,t,n=e,r){if(t===j)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=E(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=F(e,i._$AS(e,t.values),i,r)),t}var Je=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??w).importNode(t,!0);N.currentNode=r;let i=N.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new I(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new Qe(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=N.nextNode(),a++)}return N.currentNode=w,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},I=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=M,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=F(this,e,t),E(e)?e===M||e==null||e===``?(this._$AH!==M&&this._$AR(),this._$AH=M):e!==this._$AH&&e!==j&&this._(e):e._$litType$===void 0?e.nodeType===void 0?Re(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==M&&E(this._$AH)?this._$AA.nextSibling.data=e:this.T(w.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=P.createElement(Ke(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new Je(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=Ge.get(e.strings);return t===void 0&&Ge.set(e.strings,t=new P(e)),t}k(t){D(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(T()),this.O(T()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=Ne(e).nextSibling;Ne(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},L=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=M,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=M}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=F(this,e,t,0),a=!E(e)||e!==this._$AH&&e!==j,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=F(this,r[n+o],t,o),s===j&&(s=this._$AH[o]),a||=!E(s)||s!==this._$AH[o],s===M?e=M:e!==M&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===M?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},Ye=class extends L{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===M?void 0:e}},Xe=class extends L{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==M)}},Ze=class extends L{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=F(this,e,t,0)??M)===j)return;let n=this._$AH,r=e===M&&n!==M||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==M&&(n===M||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Qe=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){F(this,e)}},$e=Me.litHtmlPolyfillSupport;$e?.(P,I),(Me.litHtmlVersions??=[]).push(`3.3.2`);var et=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new I(t.insertBefore(T(),e),e,void 0,n??{})}return i._$AI(e),i},R=globalThis,z=class extends x{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=et(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return j}};z._$litElement$=!0,z.finalized=!0,R.litElementHydrateSupport?.({LitElement:z});var tt=R.litElementPolyfillSupport;tt?.({LitElement:z}),(R.litElementVersions??=[]).push(`4.2.2`);var B=e=>(t,n)=>{n===void 0?customElements.define(e,t):n.addInitializer(()=>{customElements.define(e,t)})},nt={attribute:!0,type:String,converter:b,reflect:!1,hasChanged:Ae},rt=(e=nt,t,n)=>{let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function V(e){return(t,n)=>typeof n==`object`?rt(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}function H(e){return V({...e,state:!0,attribute:!1})}var it=(e,t,n)=>(n.configurable=!0,n.enumerable=!0,Reflect.decorate&&typeof t!=`object`&&Object.defineProperty(e,t,n),n);function at(e,t){return(n,r,i)=>{let a=t=>t.renderRoot?.querySelector(e)??null;if(t){let{get:e,set:t}=typeof r==`object`?n:i??(()=>{let e=Symbol();return{get(){return this[e]},set(t){this[e]=t}}})();return it(n,r,{get(){let n=e.call(this);return n===void 0&&(n=a(this),(n!==null||this.hasUpdated)&&t.call(this,n)),n}})}return it(n,r,{get(){return a(this)}})}}var ot={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},st=e=>(...t)=>({_$litDirective$:e,values:t}),ct=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,n){this._$Ct=e,this._$AM=t,this._$Ci=n}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}},lt=class extends ct{constructor(e){if(super(e),this.it=M,e.type!==ot.CHILD)throw Error(this.constructor.directiveName+`() can only be used in child bindings`)}render(e){if(e===M||e==null)return this._t=void 0,this.it=e;if(e===j)return e;if(typeof e!=`string`)throw Error(this.constructor.directiveName+`() called with a non-string value`);if(e===this.it)return this._t;this.it=e;let t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}};lt.directiveName=`unsafeHTML`,lt.resultType=1;var ut=st(lt),U=e=>A`${ut(`
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="2" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  >
    ${e}
  </svg>
`)}`,W={accessibility:U(`<circle cx="16" cy="4" r="1"/><path d="m18 19 1-7-6-1"/><path d="m5 8 3-3 5.5 3-2.36 3.5"/><path d="M4.24 14.5a5 5 0 0 0 6.88 6"/><path d="M13.76 17.5a5 5 0 0 0-6.88-6"/>`),close:U(`<path d="M18 6 6 18"/><path d="m6 6 12 12"/>`),languages:U(`<path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/>`),profiles:U(`<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`),textSize:U(`<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>`),contrast:U(`<circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 0 0 0-12v12z"/>`),grayscale:U(`<circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M12 18a6 6 0 0 0 0-12"/><path d="M12 14a2 2 0 0 0 0-4"/>`),cursor:U(`<path d="M4 4l11.73 4.58a0.5 0 0 1 0 0.94l-4.47 1.35 1.35 4.47a0.5 0 0 1-0.94 0L6.7 9.61 4 4z"/>`),screenReader:U(`<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>`),visualImpair:U(`<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z"/><circle cx="12" cy="12" r="3"/>`),seizureSafe:U(`<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>`),cognitive:U(`<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.54z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.54z"/>`),info:U(`<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>`),check:U(`<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>`),chevronDown:U(`<path d="m6 9 6 6 6-6"/>`),sun:U(`<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>`),moon:U(`<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>`),droplet:U(`<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5s-3 3.5-3 5.5a7 7 0 0 0 7 7z"/>`),refresh:U(`<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>`)},dt=_`
  :host {
    display: block;
    pointer-events: none;
    user-select: none;
    
    /* Убиваем тени на корню через переменные */
    --bw-shadow: none !important;
    --bw-shadow-lg: none !important;
    --bw-card-shadow: none !important;

    --bw-primary: var(--bw-primary-color, #18181b);
    --bw-primary-fg: var(--bw-primary-fg-color, #ffffff);
    --bw-bg: var(--bw-bg-color, #ffffff);
    --bw-fg: var(--bw-fg-color, #09090b);
    --bw-border: var(--bw-border-color, #e4e4e7);
    --bw-radius: var(--bw-radius-size, 1rem);
    --bw-bg-hover: #f4f4f5;
    
    font-family: system-ui, -apple-system, sans-serif;
  }

  /* --- Accessibility Themes & Toggles --- */

  /* High Contrast Theme */
  :host([data-contrast="high"]) {
    --bw-bg: #000000;
    --bw-fg: #ffff00;
    --bw-primary: #ffffff;
    --bw-border: #ffffff;
    --bw-bg-hover: #1a1a1a;
    --bw-primary-fg: #000000;
  }

  /* Light Contrast Theme */
  :host([data-contrast="light"]) {
    --bw-bg: #f8fafc;
    --bw-fg: #64748b;
    --bw-primary: #94a3b8;
    --bw-border: #e2e8f0;
    --bw-bg-hover: #ffffff;
  }

  /* Text Spacing */
  :host([data-text-spacing]) {
    line-height: var(--bw-line-height) !important;
    letter-spacing: var(--bw-letter-spacing) !important;
    word-spacing: var(--bw-word-spacing) !important;
  }

  /* Dyslexic Font */
  :host([data-dyslexic]) {
    font-family: "Comic Sans MS", "Chalkboard SE", "Comic Neue", sans-serif !important;
  }

  /* Focus Visualizer */
  :host([data-focus-visualizer]) *:focus-visible {
    outline: 4px solid #f59e0b !important;
    outline-offset: 2px !important;
    box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.3) !important;
  }

  /* Cursor Magnifier */
  :host([data-cursor-magnifier]) {
    cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z'%3E%3C/path%3E%3Cpath d='M13 13l6 6'%3E%3C/path%3E%3C/svg%3E"), auto !important;
  }

  /* Pause Animations */
  :host([data-no-animations]) *,
  :host([data-no-animations]) {
    transition: none !important;
    animation: none !important;
  }

  /* Link Highlight */
  :host([data-link-highlight]) a {
    text-decoration: underline !important;
    text-decoration-thickness: 2px !important;
    background-color: #fef08a !important;
    color: #000000 !important;
    padding: 0 2px !important;
    border-radius: 2px !important;
  }

  /* --- Base Layout --- */

  /* The trigger button */
  .trigger {
    position: fixed;
    bottom: 2rem;
    left: 2rem;
    width: var(--bw-trigger-size, 64px);
    height: var(--bw-trigger-size, 64px);
    pointer-events: auto;
    transition: transform 0.3s ease, opacity 0.3s ease;
    /* Убираем тень, если она была у кнопки */
    box-shadow: none !important; 
  }

  /* The sliding sidebar panel */
  bw-card {
    all: initial;
    display: flex;
    flex-direction: column;
    
    /* ГАРАНТИРОВАННОЕ ОТСУТСТВИЕ ТЕНИ */
    box-shadow: none !important;
    --bw-card-shadow: none !important;
    --bw-shadow: none !important;
    
    position: fixed;
    top: 0;
    left: 0;
    min-width: 420px;
    width: 35vw; 
    max-width: 95vw; 
    height: 100vh;
    background: var(--bw-bg);
    color: var(--bw-fg);
    border: none;
    overflow-y: auto; /* Scroll if font is too large */
    
    /* АНИМАЦИЯ: убираем display: none, используем visibility */
    transition: transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.3s ease;
    will-change: transform, opacity;
    z-index: 2147483647;
  }

  bw-card * {
    box-sizing: border-box;
  }

  /* Slide from the left edge */
  .panel-hidden {
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
    transform: translate3d(-100%, 0, 0) !important;
    box-shadow: none !important;
  }

  .panel-visible ~ .trigger {
    transform: scale(0);
    opacity: 0;
    pointer-events: none;
  }

  /* Hide the trigger button gently when panel is open */
  .panel-visible ~ .trigger {
    transform: scale(0);
    opacity: 0;
    pointer-events: none;
  }

  bw-button {
    --bw-radius: var(--bw-radius);
    --bw-primary: var(--bw-primary);
  }

  .widget-container {
    display: block;
    pointer-events: none;
  }

  /* Header styling */
  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-top: env(safe-area-inset-top, 0); /* Respect mobile notches */
  }

  .header-title {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    letter-spacing: -0.025em;
  }

  .close-btn {
    --bw-radius: 50%;
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    background: var(--bw-bg-hover, #f4f4f5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }
  .close-btn:hover { background: var(--bw-border, #e4e4e7); transform: rotate(90deg); }
  .close-btn svg { width: 18px; height: 18px; }

  /* Sections */
  .selector-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 1.5rem;
    overflow-x: auto;
    padding-bottom: 4px;
    scrollbar-width: none; 
  }
  .selector-bar::-webkit-scrollbar {
    display: none;
  }

  .selector-item {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
    padding: 10px 14px;
    background: var(--bw-bg-hover, #f8fafc);
    border: 1px solid var(--bw-border);
    border-radius: 9999px;
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .selector-item:hover { background: var(--bw-border, #f1f5f9); }
  .selector-item svg { width: 16px; height: 16px; opacity: 0.7; }

  /* Grid */
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
    margin-top: 1rem;
  }

  /* Grid 3-column for Color Tiles */
  .grid-3 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
    gap: 8px;
    margin-top: 1rem;
  }

  /* Color Custom Box */
  .color-custom-box {
    margin-top: 1.5rem;
    padding: 1rem;
    border: 1px solid var(--bw-border);
    border-radius: 1rem;
    background: var(--bw-bg);
  }

  .color-custom-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 1rem;
  }

  .color-custom-header svg {
    width: 24px;
    height: 24px;
    color: #3b82f6;
  }

  .color-custom-title {
    font-size: 0.9375rem;
    font-weight: 700;
    margin: 0;
  }

  .color-custom-subtitle {
    font-size: 0.8125rem;
    opacity: 0.6;
    margin: 0;
  }

  .color-tabs {
    display: flex;
    gap: 8px;
    margin: 1rem 0;
  }

  .color-tab {
    flex: 1;
    padding: 8px;
    font-size: 0.8125rem;
    font-weight: 600;
    text-align: center;
    background: #fff;
    border: 1px solid var(--bw-border);
    border-radius: 999px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .color-tab[active] {
    background: #3b82f6;
    color: #fff;
    border-color: #3b82f6;
  }

  .hue-slider {
    -webkit-appearance: none;
    width: 100%;
    height: 12px;
    border-radius: 6px;
    background: linear-gradient(to right, 
      #ff0000 0%, #ffff00 17%, #00ff00 33%, 
      #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%);
    outline: none;
    margin: 1rem 0;
  }

  .hue-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #3b82f6;
    border: 3px solid #fff;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }

  .reset-colors {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    font-size: 0.8125rem;
    color: #3b82f6;
    font-weight: 600;
    cursor: pointer;
    margin-top: 0.5rem;
  }

  .reset-colors:hover {
    text-decoration: underline;
  }

  /* Tiles active indicator */
  bw-button[vertical] {
    position: relative;
    padding-top: 1rem;
    padding-bottom: 1rem;
  }

  .active-check {
    position: absolute;
    top: 6px;
    right: 6px;
    color: #3b82f6;
  }
  .active-check svg { width: 14px; height: 14px; }

  /* Section Titles */
  .section-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--bw-primary);
    margin: 1.5rem 0 0.75rem 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  /* Footer */
  .footer-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    font-size: 0.75rem;
    opacity: 0.6;
    margin-bottom: env(safe-area-inset-bottom, 0);
    padding-top: 1rem;
  }

  .footer-brand {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 700;
    color: var(--bw-primary);
  }

  /* Responsive Adjustments for very narrow screens */
  @media (max-width: 480px) {
    bw-card {
      width: 100vw;
      max-width: 100vw;
      border-right: none;
    }
  }

  /* ========================= */
  /* CHAT TAB STYLES           */
  /* ========================= */

  .tab-bar {
    display: flex;
    border-bottom: 1px solid var(--bw-border);
    margin-bottom: 0;
    flex-shrink: 0;
  }

  .tab {
    flex: 1;
    padding: 10px 8px;
    font-size: 0.875rem;
    font-weight: 600;
    text-align: center;
    cursor: pointer;
    color: var(--bw-fg);
    opacity: 0.5;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }

  .tab[active] {
    opacity: 1;
    border-bottom-color: var(--bw-primary);
    color: var(--bw-primary);
  }

  .tab-panel {
    display: none;
    flex: 1;
    min-height: 0;
    flex-direction: column;
    position: relative;
    height: 100%; /* Fill panel-body */
  }
  .tab-panel[active] {
    display: flex;
  }

  /* Chat messages area */
  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .chat-empty {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    opacity: 0.5;
    padding: 2rem;
    text-align: center;
  }
  .chat-empty svg { width: 40px; height: 40px; opacity: 0.4; }
  .chat-empty p { font-size: 0.875rem; margin: 0; }

  .chat-bubble {
    max-width: 85%;
    padding: 10px 14px;
    border-radius: 18px;
    font-size: 0.9rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .chat-bubble.user {
    align-self: flex-end;
    background: var(--bw-primary);
    color: var(--bw-primary-fg);
    border-bottom-right-radius: 4px;
  }

  .chat-bubble.assistant {
    align-self: flex-start;
    background: var(--bw-bg-hover, #f4f4f5);
    color: var(--bw-fg);
    border-bottom-left-radius: 4px;
    border: 1px solid var(--bw-border);
  }

  /* Typing indicator */
  .typing-indicator {
    display: flex;
    gap: 5px;
    align-items: center;
    padding: 12px 16px;
    background: var(--bw-bg-hover, #f4f4f5);
    border-radius: 18px;
    border-bottom-left-radius: 4px;
    border: 1px solid var(--bw-border);
    align-self: flex-start;
    width: fit-content;
  }

  .typing-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--bw-primary);
    opacity: 0.4;
    animation: bw-typing 1.4s infinite;
  }
  .typing-dot:nth-child(2) { animation-delay: 0.2s; }
  .typing-dot:nth-child(3) { animation-delay: 0.4s; }

  @keyframes bw-typing {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.2); }
  }

  /* Chat input bar */
  .chat-input-bar {
    display: flex;
    gap: 8px;
    padding: 1rem;
    border-top: 1px solid var(--bw-border);
    flex-shrink: 0;
    background: var(--bw-bg);
    margin-top: auto; /* Push to bottom of tab-panel */
    position: sticky;
    bottom: 0;
    z-index: 10;
  }

  .chat-input {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid var(--bw-border);
    border-radius: 9999px;
    font-size: 0.9rem;
    font-family: inherit;
    background: var(--bw-bg-hover, #f4f4f5);
    color: var(--bw-fg);
    outline: none;
    transition: border-color 0.2s;
  }
  .chat-input:focus { border-color: var(--bw-primary); }
  .chat-input:disabled { opacity: 0.5; cursor: not-allowed; }

  .chat-send-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: var(--bw-primary);
    color: var(--bw-primary-fg);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: transform 0.2s, opacity 0.2s;
  }
  .chat-send-btn:hover:not(:disabled) { transform: scale(1.1); }
  .chat-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .chat-send-btn svg { width: 18px; height: 18px; }
`,ft=`bw-a11y-settings-v2`,pt={monochrome:!1,darkHighContrast:!1,brightHighContrast:!1,lowSaturation:!1,highSaturation:!1,contrastMode:!1,customBgHue:null,customHeaderHue:null,customContentHue:null,activeColorTab:`background`,textScale:1,highlightHeaders:!1,enlargeButtons:!1,textSpacing:!1,dyslexicFont:!1,focusVisualizer:!1,cursorMagnifier:!1,animationsDisabled:!1,linkHighlight:!1},mt=class{constructor(e){this.settings={...pt},(this.host=e).addController(this),this._loadSettings()}hostConnected(){this._applySettings()}_loadSettings(){let e=localStorage.getItem(ft);if(e)try{let t=JSON.parse(e);this.settings={...pt,...t}}catch(e){console.error(`BariWeb: Failed to parse a11y settings`,e)}}_saveSettings(){localStorage.setItem(ft,JSON.stringify(this.settings)),this._applySettings(),this.host.requestUpdate()}_ensureGlobalStyles(){let e=`bw-global-a11y-styles`,t=document.getElementById(e);t||(t=document.createElement(`style`),t.id=e,document.head.appendChild(t)),t.textContent=`
      /* Global Filters */
      html {
        filter: 
          grayscale(var(--bw-grayscale, 0%)) 
          saturate(var(--bw-saturation, 1)) !important;
        transition: filter 0.3s ease;
      }

      /* Text Spacing */
      html[data-bw-text-spacing], html[data-bw-text-spacing] * {
        line-height: 1.8 !important;
        letter-spacing: 0.12em !important;
        word-spacing: 0.16em !important;
      }

      /* Dyslexic Font */
      html[data-bw-dyslexic], html[data-bw-dyslexic] * {
        font-family: "OpenDyslexic", "Comic Sans MS", "Chalkboard SE", sans-serif !important;
      }

      /* Focus Visualizer (Read Focus) - More distinctive */
      html[data-bw-focus-visualizer] *:focus,
      html[data-bw-focus-visualizer] *:focus-visible {
        outline: 8px solid #3b82f6 !important;
        outline-offset: 4px !important;
        box-shadow: 0 0 0 12px rgba(59, 130, 246, 0.4) !important;
        z-index: 99999 !important;
        position: relative;
      }
      html[data-bw-focus-visualizer] *:hover {
        outline: 2px solid rgba(59, 130, 246, 0.3) !important;
        outline-offset: 2px !important;
      }

      /* Cursor Magnifier - Standing out */
      html[data-bw-cursor-magnifier], html[data-bw-cursor-magnifier] * {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='%233b82f6' stroke='white' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z'%3E%3C/path%3E%3Cpath d='M13 13l6 6'%3E%3C/path%3E%3C/svg%3E") 0 0, auto !important;
      }

      /* Link Highlight */
      html[data-bw-link-highlight] a {
        text-decoration: underline !important;
        text-decoration-thickness: 3px !important;
        background-color: #fef08a !important;
        color: #000000 !important;
        padding: 0 4px !important;
        border-radius: 4px !important;
        font-weight: bold !important;
      }

      /* Highlight Headers */
      html[data-bw-highlight-headers] h1,
      html[data-bw-highlight-headers] h2,
      html[data-bw-highlight-headers] h3,
      html[data-bw-highlight-headers] h4,
      html[data-bw-highlight-headers] h5,
      html[data-bw-highlight-headers] h6 {
        background-color: #3b82f6 !important;
        color: #ffffff !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        display: inline-block !important;
      }

      /* Enlarge Buttons */
      html[data-bw-enlarge-buttons] button,
      html[data-bw-enlarge-buttons] [role="button"],
      html[data-bw-enlarge-buttons] input[type="button"],
      html[data-bw-enlarge-buttons] input[type="submit"] {
        transform: scale(1.2) !important;
        margin: 10px !important;
      }

      /* Stop Animations */
      html[data-bw-no-animations], html[data-bw-no-animations] * {
        transition: none !important;
        animation: none !important;
        scroll-behavior: auto !important;
      }

      /* --- High Contrast Modes --- */
      
      /* Dark High Contrast */
      html[data-bw-dark-high-contrast], 
      html[data-bw-dark-high-contrast] body,
      html[data-bw-dark-high-contrast] *:not(bw-widget):not(bw-widget *) {
        background-color: #000000 !important;
        color: #00ff00 !important; /* High-Visibility Green on Black */
        border-color: #00ff00 !important;
        background-image: none !important;
      }
      html[data-bw-dark-high-contrast] a { color: #ffff00 !important; }

      /* Bright High Contrast */
      html[data-bw-bright-high-contrast], 
      html[data-bw-bright-high-contrast] body,
      html[data-bw-bright-high-contrast] *:not(bw-widget):not(bw-widget *) {
        background-color: #ffffff !important;
        color: #000000 !important;
        border-color: #000000 !important;
        background-image: none !important;
      }
      html[data-bw-bright-high-contrast] a { color: #0000ff !important; font-weight: bold !important; }

      /* Contrast Mode (Classic) */
      html[data-bw-contrast-mode], 
      html[data-bw-contrast-mode] body,
      html[data-bw-contrast-mode] *:not(bw-widget):not(bw-widget *) {
        background-color: #000 !important;
        color: #fff !important;
        border-color: #fff !important;
      }

      /* --- Custom Colors --- */
      html[data-bw-has-custom-bg] body,
      html[data-bw-has-custom-bg] *:not(bw-widget):not(bw-widget *) {
        background-color: var(--bw-custom-bg) !important;
        background-image: none !important;
      }
      html[data-bw-has-custom-header] h1,
      html[data-bw-has-custom-header] h2,
      html[data-bw-has-custom-header] h3 {
        color: var(--bw-custom-header) !important;
      }
      html[data-bw-has-custom-content] p,
      html[data-bw-has-custom-content] span,
      html[data-bw-has-custom-content] div:not(bw-widget *) {
        color: var(--bw-custom-content) !important;
      }
    `}_applySettings(){let e=document.documentElement;this._ensureGlobalStyles(),e.style.setProperty(`--bw-grayscale`,this.settings.monochrome?`100%`:`0%`);let t=1;this.settings.lowSaturation&&(t=.3),this.settings.highSaturation&&(t=2.5),e.style.setProperty(`--bw-saturation`,t.toString()),this.settings.customBgHue===null?e.removeAttribute(`data-bw-has-custom-bg`):(e.style.setProperty(`--bw-custom-bg`,`hsl(${this.settings.customBgHue}, 50%, 95%)`),e.setAttribute(`data-bw-has-custom-bg`,``)),this.settings.customHeaderHue===null?e.removeAttribute(`data-bw-has-custom-header`):(e.style.setProperty(`--bw-custom-header`,`hsl(${this.settings.customHeaderHue}, 70%, 30%)`),e.setAttribute(`data-bw-has-custom-header`,``)),this.settings.customContentHue===null?e.removeAttribute(`data-bw-has-custom-content`):(e.style.setProperty(`--bw-custom-content`,`hsl(${this.settings.customContentHue}, 60%, 40%)`),e.setAttribute(`data-bw-has-custom-content`,``)),this.settings.textScale>1?e.style.fontSize=`${this.settings.textScale*100}%`:e.style.fontSize=``;let n={"data-bw-monochrome":this.settings.monochrome,"data-bw-dark-high-contrast":this.settings.darkHighContrast,"data-bw-bright-high-contrast":this.settings.brightHighContrast,"data-bw-contrast-mode":this.settings.contrastMode,"data-bw-text-spacing":this.settings.textSpacing,"data-bw-dyslexic":this.settings.dyslexicFont,"data-bw-focus-visualizer":this.settings.focusVisualizer,"data-bw-cursor-magnifier":this.settings.cursorMagnifier,"data-bw-no-animations":this.settings.animationsDisabled,"data-bw-link-highlight":this.settings.linkHighlight,"data-bw-highlight-headers":this.settings.highlightHeaders,"data-bw-enlarge-buttons":this.settings.enlargeButtons};Object.entries(n).forEach(([t,n])=>{n?e.setAttribute(t,``):e.removeAttribute(t)});let r=this.host;r&&r.style.setProperty(`--bw-font-scale`,this.settings.textScale.toString())}toggleMonochrome(){this.settings.monochrome=!this.settings.monochrome,this._saveSettings()}toggleDarkHighContrast(){this.settings.darkHighContrast=!this.settings.darkHighContrast,this.settings.darkHighContrast&&(this.settings.brightHighContrast=!1,this.settings.contrastMode=!1),this._saveSettings()}toggleBrightHighContrast(){this.settings.brightHighContrast=!this.settings.brightHighContrast,this.settings.brightHighContrast&&(this.settings.darkHighContrast=!1,this.settings.contrastMode=!1),this._saveSettings()}toggleLowSaturation(){this.settings.lowSaturation=!this.settings.lowSaturation,this.settings.lowSaturation&&(this.settings.highSaturation=!1),this._saveSettings()}toggleHighSaturation(){this.settings.highSaturation=!this.settings.highSaturation,this.settings.highSaturation&&(this.settings.lowSaturation=!1),this._saveSettings()}toggleContrastMode(){this.settings.contrastMode=!this.settings.contrastMode,this.settings.contrastMode&&(this.settings.darkHighContrast=!1,this.settings.brightHighContrast=!1),this._saveSettings()}setCustomHue(e){this.settings.activeColorTab===`background`?this.settings.customBgHue=e:this.settings.activeColorTab===`header`?this.settings.customHeaderHue=e:this.settings.customContentHue=e,this._saveSettings()}resetCustomColors(){this.settings.customBgHue=null,this.settings.customHeaderHue=null,this.settings.customContentHue=null,this._saveSettings()}toggleHighlightHeaders(){this.settings.highlightHeaders=!this.settings.highlightHeaders,this._saveSettings()}toggleEnlargeButtons(){this.settings.enlargeButtons=!this.settings.enlargeButtons,this._saveSettings()}incrementTextScale(){this.settings.textScale>=1.5?this.settings.textScale=1:this.settings.textScale=parseFloat((this.settings.textScale+.1).toFixed(1)),this._saveSettings()}toggleTextSpacing(){this.settings.textSpacing=!this.settings.textSpacing,this._saveSettings()}toggleDyslexicFont(){this.settings.dyslexicFont=!this.settings.dyslexicFont,this._saveSettings()}toggleFocusVisualizer(){this.settings.focusVisualizer=!this.settings.focusVisualizer,this._saveSettings()}toggleCursorMagnifier(){this.settings.cursorMagnifier=!this.settings.cursorMagnifier,this._saveSettings()}toggleAnimations(){this.settings.animationsDisabled=!this.settings.animationsDisabled,this._saveSettings()}toggleLinkHighlight(){this.settings.linkHighlight=!this.settings.linkHighlight,this._saveSettings()}reset(){this.settings={...pt},this._saveSettings()}};function ht(e){try{let t=new URL(e),n=t.pathname;n=n.replace(bt,`:id`),n=n.replace(xt,`/:id`),n=n.replace(St,`/:slug`),n=n.replace(Ct,`/:id`);let r=new URLSearchParams;t.searchParams.forEach((e,t)=>{wt.has(t)?r.set(`:${t}`,``):e.length<30&&!/^\d+$/.test(e)&&r.set(t,e)});let i=r.toString();return n.replace(/\/$/,``)+(i?`?${i}`:``)}catch{return e.replace(bt,`:id`).replace(/\/\d{1,20}(?=\/|$)/g,`/:id`).split(`?`)[0]}}function gt(e){let t=[`dialog`,`tooltip`,`menu`,`listbox`,`alertdialog`],n=e;for(;n&&n!==document.body;){let e=n.getAttribute(`role`)||``;if(t.includes(e)||n.hasAttribute(`data-radix-popper-content-wrapper`)||n.hasAttribute(`data-floating-ui-portal`))return!0;let r=typeof n.className==`string`?n.className:``;if(/popover|tooltip|dropdown-menu|floating|overlay/i.test(r))return!0;n=n.parentElement}return!1}function _t(e){let t=[`li`,`article`,`tr`,`dd`],n=e.parentElement,r=0;for(;n&&n!==document.body&&r<8;){let e=n.tagName.toLowerCase();if(t.includes(e))return!0;let i=typeof n.className==`string`?n.className:``;if(/\b(card|item|tile|post|entry|product|row-item|list-item|feed-item|cell)\b/i.test(i)){let e=n.parentElement?.children;if(e&&e.length>2)return!0}let a=n.getAttribute(`role`)||``;if(a===`listitem`||a===`row`||a===`gridcell`)return!0;n=n.parentElement,r++}return!1}function vt(e){let t=e,n=(t.getAttribute(`aria-label`)||t.getAttribute(`title`)||t.innerText||t.getAttribute(`placeholder`)||``).trim().toLowerCase();return!n||n.length<2||n.length>40||/^[\d\s₸$€%.,\-+:()]+$/.test(n)||/^\d{1,2}[./]\d{1,2}/.test(n)||Tt.has(n)?``:n.replace(/^[\p{Emoji}\s]+/u,``).trim().slice(0,30)}function yt(e){let t=5381;for(let n=0;n<e.length;n++)t=(t<<5)+t^e.charCodeAt(n);return(t>>>0).toString(16)}function G(){let e=[],t=ht(window.location.href);e.push(`route:${t}`);let n=document.querySelector(`h1`);if(n){let t=n.innerText?.trim().toLowerCase();t&&t.length>1&&t.length<50&&!/\d{3,}/.test(t)&&e.push(`h1:${t.slice(0,30)}`)}let r=Array.from(document.querySelectorAll(`input:not([type="hidden"]):not([type="submit"]):not([type="radio"]):not([type="checkbox"]), textarea, select`)).slice(0,8);for(let t of r){if(gt(t))continue;let n=t,r=(n.getAttribute(`name`)||n.getAttribute(`placeholder`)||n.getAttribute(`aria-label`)||``).toLowerCase().trim().slice(0,25);r&&r.length>1&&!Tt.has(r)&&e.push(`field:${r}`)}let i=Array.from(document.querySelectorAll(`nav a, [role="navigation"] a`)).slice(0,6);for(let t of i){if(gt(t))continue;let n=vt(t);n&&e.push(`nav:${n}`)}let a=document.querySelector(`main`)||document.querySelector(`[role="main"]`)||document.getElementById(`root`);return a&&Array.from(a.querySelectorAll(`button:not([aria-hidden="true"]), [role="button"]:not([aria-hidden="true"])`)).filter(e=>!gt(e)&&!_t(e)).map(vt).filter(e=>e.length>1).reduce((e,t)=>e.includes(t)?e:[...e,t],[]).slice(0,3).forEach(t=>e.push(`btn:${t}`)),[...new Set(e)].sort().slice(0,15)}function K(){return`bw-${yt(G().join(`|`))}`}var bt,xt,St,Ct,wt,Tt,Et=t((()=>{bt=/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,xt=/\/\d{1,20}(?=\/|$)/g,St=/\/[a-z0-9]+(?:-[a-z0-9]+)*-\d+(?=\/|$)/g,Ct=/\/[0-9a-f]{8,}(?=\/|$)/gi,wt=new Set([`id`,`userId`,`user_id`,`orderId`,`order_id`,`itemId`,`item_id`,`productId`,`product_id`,`token`,`key`,`ref`,`code`,`session`]),Tt=new Set(`ok,ок,okay,close,закрыть,cancel,отмена,yes,da,no,нет,да,submit,отправить,back,назад,next,далее,more,ещё,еще,menu,меню,...,•,·,loading,загрузка,open,открыть,expand,collapse,toggle,sort`.split(`,`))}));Et();var Dt=`http://localhost:8000`,Ot=5,kt=[/(submit|отправить|оплатить|сгенерировать|сохранить|перевести|подтвердит|купить|удалить|delete|pay|purchase|buy|send|transfer|confirm|place.?order|checkout|remove|drop|unsubscribe|sign.?out|выйти|уволить)/i];function At(e){if(e.type!==`click_element`||!e.element_id)return!1;let t=document.getElementById(e.element_id);if(!t)return!1;if(t.getAttribute(`type`)===`submit`||t.tagName.toLowerCase()===`button`&&t.closest(`form`)!==null&&t.getAttribute(`type`)!==`button`)return!0;let n=[t.textContent?.trim()||``,t.getAttribute(`aria-label`)||``,t.getAttribute(`title`)||``,t.getAttribute(`name`)||``,t.getAttribute(`value`)||``].join(` `);return kt.some(e=>e.test(n))}var jt=class{constructor(e){this.messages=[],this.isLoading=!1,this.error=null,this.pendingConfirmation=null,(this.host=e).addController(this),this._loadMessages()}hostConnected(){}hostDisconnected(){}_loadMessages(){try{let e=sessionStorage.getItem(`bw-chat-history`);e&&(this.messages=JSON.parse(e),this.messages.length>0&&typeof this.host.setOpen==`function`&&setTimeout(()=>this.host.setOpen(!0),100));let t=sessionStorage.getItem(`bw-auto-resume`);if(t===`true`||t===`verify-only`){sessionStorage.removeItem(`bw-auto-resume`);let e=t===`verify-only`?`Страница загрузилась после отправки формы. Проверь новый DOM: если авторизация прошла успешно (нет формы входа, есть контент приложения) — сообщи об успехе. НЕ нажимай ничего снова.`:`Страница загрузилась. Продолжай выполнение задачи с учетом нового контекста и DOM.`;setTimeout(()=>{this._agentStep(e)},1e3)}}catch(e){console.error(`Failed to load chat history`,e)}}_saveMessages(){try{sessionStorage.setItem(`bw-chat-history`,JSON.stringify(this.messages))}catch(e){console.error(`Failed to save chat history`,e)}}gatherContext(){let e=window.location.href;return{page_text:document.body?.innerText?.slice(0,3e3)??``,elements:Array.from(document.querySelectorAll(`a[href], button, [role="button"], input:not([type="hidden"]), textarea, select`)).map(e=>{let t=e,n=t.tagName.toLowerCase(),r=n===`input`||n===`textarea`||n===`select`,i=t.getAttribute(`type`)||(n===`input`?`text`:n===`button`?`button`:n),a=t.getAttribute(`name`)||``,o=t.getAttribute(`placeholder`)||``,s=r?(t.value||``).slice(0,80):``,c=t.id&&!t.getAttribute(`data-bw-auto`)?t.id:t.getAttribute(`data-id`)||t.getAttribute(`data-testid`)||``;if(!c){let e=`${n}|${i}|${a}|${o}|${(t.className||``).toString().replace(/\s+/g,`-`).slice(0,40)}|${t.href||``}|${(t.textContent||``).trim().slice(0,30)}|${t.parentElement?.tagName?.toLowerCase()||`root`}`,r=5381;for(let t=0;t<e.length;t++)r=(r<<5)+r^e.charCodeAt(t);c=`bw-${(r>>>0).toString(16)}`,t.id=c,t.setAttribute(`data-bw-auto`,`true`)}let l=t.getAttribute(`aria-label`)||``;if(!l&&c){let e=document.querySelector(`label[for="${c}"]`);e&&(l=e.textContent?.trim()||``)}if(!l){let e=t.parentElement;for(;e&&e.tagName.toLowerCase()!==`form`&&e.tagName.toLowerCase()!==`body`;){if(e.tagName.toLowerCase()===`label`){l=(e.textContent||``).replace(t.textContent||``,``).trim();break}e=e.parentElement}}if(l||=(t.textContent||``).trim().slice(0,80),l||=t.getAttribute(`title`)||``,!l&&o&&(l=o),!l&&n===`button`){let e=t.querySelector(`svg`);if(e&&typeof e.className?.baseVal==`string`){let t=e.className.baseVal.match(/lucide-([a-z0-9\-]+)/);l=t?`[icon:${t[1]}]`:`[icon]`}else l=`[btn:${(t.className||``).toString().slice(0,30)}]`}return{id:c,label:l.trim(),tag:n,type:i,name:a,placeholder:o,value:s}}).filter(e=>e.label.length>0||(e.placeholder??``).length>0||(e.name??``).length>0).slice(0,100).map(e=>`[`+[e.tag,e.type||``,e.id,e.name||``,e.placeholder||``,e.value||``,e.label].join(`|`)+`]`).join(``),page_url:e}}executeAction(e){if(e.type===`click_element`&&e.element_id){let t=document.getElementById(e.element_id);if(t){if(t.tagName.toLowerCase()===`a`&&t.href){let n=t.href;return new URL(n,window.location.origin).origin===window.location.origin&&sessionStorage.setItem(`bw-auto-resume`,`true`),t.click(),{result:`✅ Нажал на "${t.textContent?.trim()||e.element_id}"`,causesNavigation:!0}}return t.getAttribute(`type`)===`submit`||t.tagName.toLowerCase()===`button`&&t.closest(`form`)!==null&&t.getAttribute(`type`)!==`button`?(sessionStorage.setItem(`bw-auto-resume`,`verify-only`),t.click(),{result:`✅ Нажал на "${t.textContent?.trim()||e.element_id}"`,causesNavigation:!0}):(t.click(),{result:`✅ Нажал на "${t.textContent?.trim()||e.element_id}"`,causesNavigation:!1})}return{result:`⚠️ Элемент "${e.element_id}" не найден.`,causesNavigation:!1}}if(e.type===`navigate`&&e.url)return sessionStorage.setItem(`bw-auto-resume`,`true`),window.location.href=e.url,{result:`🔀 Перехожу на ${e.url}...`,causesNavigation:!0};if(e.type===`input_text`&&e.element_id&&e.value!==void 0){let t=document.getElementById(e.element_id);if(t){let n=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,`value`)?.set,r=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,`value`)?.set;return t.tagName.toLowerCase()===`textarea`&&r?r.call(t,e.value):n?n.call(t,e.value):t.value=e.value,t.dispatchEvent(new Event(`input`,{bubbles:!0})),t.dispatchEvent(new Event(`change`,{bubbles:!0})),{result:`⌨️ Ввел текст "${e.value}" в поле.`,causesNavigation:!1}}return{result:`⚠️ Поле ввода "${e.element_id}" не найдено.`,causesNavigation:!1}}return e.type===`continue`?{result:`🔄 Анализирую страницу...`,causesNavigation:!1}:{result:`⚠️ Неизвестное действие.`,causesNavigation:!1}}async _callAPI(e){let{page_text:t,elements:n,page_url:r}=this.gatherContext(),i=K(),a=this.host.clientId||window.__BARIWEB_CLIENT_ID__||``,o=null;try{let e=await fetch(`${Dt}/v1/training/match-screen`,{method:`POST`,headers:{"Content-Type":`application/json`,"X-Client-ID":a},body:JSON.stringify({fingerprint:i})});if(e.ok){let t=await e.json();t.matched&&(o=t.label)}}catch(e){console.warn(`Failed to match screen fingerprint`,e)}let s=await fetch(`${Dt}/v1/chat`,{method:`POST`,headers:{"Content-Type":`application/json`,"X-Client-ID":a},body:JSON.stringify({query:e,history:this._compressedHistory(),page_text:t,elements:n,page_url:r,screen_label:o,screen_fingerprint:i})});if(!s.ok)throw Error(`HTTP ${s.status}: ${s.statusText}`);let c=await s.json();if(c.text&&c.text.trimStart().startsWith(`{`))try{let e=JSON.parse(c.text);e.text&&(c.text=e.text,e.action&&!c.action&&(c.action=e.action))}catch{c.text=c.text.replace(/^\{"text"\s*:\s*"/,``).replace(/",?\s*"action".*$/,``)}return c}_compressedHistory(){let e=this.messages.map(e=>({role:e.role,text:e.text}));if(e.length<=3)return e;let t=-1;for(let n=e.length-1;n>=0;n--)if(e[n].role===`user`){t=n;break}return t===-1?e.slice(-3):[e[t],...e.slice(t+1).filter(e=>e.role===`assistant`).slice(-2)]}async _agentLoop(e,t){if(this.isLoading)return;this.isLoading=!0,this.error=null,t&&(this.messages=[...this.messages,{role:`user`,text:e,timestamp:Date.now()}],this._saveMessages()),this.host.requestUpdate();let n=e,r=0;try{for(;r<Ot;){r++;let e=await this._callAPI(n),t=e.text;if(e.action){if(At(e.action)){let t=document.getElementById(e.action.element_id||``)?.textContent?.trim()||e.action.element_id||`кнопку`;this.pendingConfirmation={text:`${e.text}\n\n⚠️ Нажать «${t}»?`,action:e.action,currentQuery:n,step:r},this.messages=[...this.messages,{role:`assistant`,text:`${e.text}\n\n🛑 **Подтвердите действие:** нажать «${t}»?`,timestamp:Date.now()}],this._saveMessages(),this.isLoading=!1,this.host.requestUpdate();return}let i=this.gatherContext().page_text,{result:a,causesNavigation:o}=this.executeAction(e.action);if(e.action.type===`continue`){this.messages=[...this.messages,{role:`assistant`,text:`🔄 Анализирую...`,timestamp:Date.now()}],this._saveMessages(),this.host.requestUpdate(),await this._waitForDom(800),n=`Страница обновилась. Продолжай задачу, прочитай DOM.`;continue}if(t=`${e.text}\n${a}`,o){this.messages=[...this.messages,{role:`assistant`,text:t,timestamp:Date.now()}],this._saveMessages(),this.host.requestUpdate(),await this._waitForDom(1500);let e=sessionStorage.getItem(`bw-auto-resume`);if(e===`true`||e===`verify-only`){sessionStorage.removeItem(`bw-auto-resume`),n=e===`verify-only`?`Страница загрузилась после отправки формы (SPA навигация). Проверь новый DOM: если задача выполнена — сообщи об успехе. НЕ нажимай ничего снова.`:`Страница загрузилась (SPA навигация). Продолжай задачу, прочитай новый DOM.`;continue}break}this.messages=[...this.messages,{role:`assistant`,text:t,timestamp:Date.now()}],this._saveMessages(),this.host.requestUpdate(),e.action.type===`input_text`&&e.action.element_id?(await this._waitForDom(800),n=(document.getElementById(e.action.element_id)?.value??``).length>0?`✅ Поле заполнено. Переходи к СЛЕДУЮЩЕМУ незаполненному полю или нажми кнопку отправки. НЕ повторяй ввод.`:`⚠️ Поле не получило значение. Попробуй ввести снова в id="${e.action.element_id}".`):(await this._waitForDom(800),n=i===this.gatherContext().page_text?`⚠️ Страница не изменилась. Возможно кнопка не сработала. Проверь DOM.`:`Действие выполнено. Если задача готова — сообщи. Иначе продолжай.`);continue}this.messages=[...this.messages,{role:`assistant`,text:t,timestamp:Date.now()}],this._saveMessages();break}}catch(e){this.error=e.message??`Ошибка соединения`,this.messages=[...this.messages,{role:`assistant`,text:`❌ Ошибка: ${this.error}`,timestamp:Date.now()}],this._saveMessages()}finally{this.isLoading=!1,this.host.requestUpdate()}}async confirmAction(){if(!this.pendingConfirmation)return;let{action:e}=this.pendingConfirmation;this.pendingConfirmation=null,this.messages=[...this.messages,{role:`user`,text:`✅ Подтверждаю`,timestamp:Date.now()}],this._saveMessages(),this.host.requestUpdate();let{result:t,causesNavigation:n}=this.executeAction(e);this.messages=[...this.messages,{role:`assistant`,text:t,timestamp:Date.now()}],this._saveMessages(),this.host.requestUpdate(),!n&&(await this._waitForDom(1200),await this._agentStep(`Действие подтверждено и выполнено. Проверь результат в DOM.`))}cancelAction(){this.pendingConfirmation&&(this.pendingConfirmation=null,this.messages=[...this.messages,{role:`user`,text:`❌ Отмена`,timestamp:Date.now()},{role:`assistant`,text:`🚫 Действие отменено. Чем ещё могу помочь?`,timestamp:Date.now()}],this._saveMessages(),this.host.requestUpdate())}_waitForDom(e){return new Promise(t=>setTimeout(t,e))}async sendMessage(e){!e.trim()||this.isLoading||(await this._agentLoop(e,!0),this.host.updateComplete?.then(()=>{let e=this.host.renderRoot?.querySelector(`.chat-messages`);e&&(e.scrollTop=e.scrollHeight)}))}async _agentStep(e){await this._agentLoop(e,!1),this.host.updateComplete?.then(()=>{let e=this.host.renderRoot?.querySelector(`.chat-messages`);e&&(e.scrollTop=e.scrollHeight)})}clearMessages(){this.messages=[],this.error=null,this.pendingConfirmation=null,this._saveMessages(),this.host.requestUpdate()}},Mt=st(class extends ct{constructor(e){if(super(e),e.type!==ot.ATTRIBUTE||e.name!==`class`||e.strings?.length>2)throw Error("`classMap()` can only be used in the `class` attribute and must be the only part in the attribute.")}render(e){return` `+Object.keys(e).filter(t=>e[t]).join(` `)+` `}update(e,[t]){if(this.st===void 0){this.st=new Set,e.strings!==void 0&&(this.nt=new Set(e.strings.join(` `).split(/\s/).filter(e=>e!==``)));for(let e in t)t[e]&&!this.nt?.has(e)&&this.st.add(e);return this.render(t)}let n=e.element.classList;for(let e of this.st)e in t||(n.remove(e),this.st.delete(e));for(let e in t){let r=!!t[e];r===this.st.has(e)||this.nt?.has(e)||(r?(n.add(e),this.st.add(e)):(n.remove(e),this.st.delete(e)))}return j}}),Nt=_`
  :host {
    display: inline-block;
    width: 100%;
    
    --bw-button-radius: var(--bw-radius, 0.5rem);
    --bw-button-font-family: inherit;
    --bw-button-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    --bw-button-bg: var(--bw-bg, #ffffff);
    --bw-button-fg: var(--bw-fg, #18181b);
    --bw-button-border: var(--bw-border, #e4e4e7);
    
    --bw-button-primary-bg: var(--bw-primary, #18181b);
    --bw-button-primary-fg: var(--bw-primary-fg, #ffffff);
    
    --bw-button-shadow: var(--bw-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05));
    --bw-button-hover-shadow: var(--bw-shadow-md, 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1));
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    width: 100%;
    padding: 0.75rem 1.25rem;
    border: 1px solid var(--bw-button-border);
    border-radius: var(--bw-button-radius);
    background: var(--bw-button-bg);
    color: var(--bw-button-fg);
    font-family: var(--bw-button-font-family);
    font-weight: 500;
    font-size: 0.875rem;
    cursor: pointer;
    transition: var(--bw-button-transition);
    box-sizing: border-box;
    outline: none;
    box-shadow: var(--bw-button-shadow);
    position: relative;
    overflow: hidden;
    white-space: normal; /* Allow text wrapping */
    word-break: break-word; /* Prevent long words from breaking layout */
  }

  .button:focus-visible {
    outline: 2px solid var(--bw-button-primary-bg);
    outline-offset: 2px;
  }

  .button:hover {
    box-shadow: var(--bw-button-hover-shadow);
    transform: translateY(-2px);
  }

  .button:active {
    transform: translateY(0) scale(0.98);
  }

  /* Variants */
  .button--primary { 
    background: var(--bw-button-primary-bg); 
    color: var(--bw-button-primary-fg); 
    border-color: transparent;
  }
  .button--primary:hover {
    filter: brightness(1.2);
  }

  /* Vertical Tile Mode */
  .button--vertical {
    flex-direction: column;
    padding: 1.5rem 1rem;
    height: 100%;
    text-align: center;
    gap: 0.5rem;
  }

  .button--circle {
    width: 100%;
    height: 100%;
    aspect-ratio: 1 / 1;
    border-radius: 50%;
    padding: 0;
  }

  /* Icon slot styling */
  ::slotted(svg), ::slotted(.bw-icon) {
    width: var(--bw-button-icon-size, 1.5rem);
    height: var(--bw-button-icon-size, 1.5rem);
    flex-shrink: 0;
  }

  .button--vertical ::slotted(svg), .button--vertical ::slotted(.bw-icon) {
    width: 2rem;
    height: 2rem;
    margin-bottom: 0.25rem;
  }

  @media (max-width: 480px) {
    .button {
      padding: 1rem 1.25rem;
      font-size: 1rem;
    }
    .button--vertical {
      padding: 1.75rem 1rem;
    }
  }

`;function q(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var J=class extends z{constructor(...e){super(...e),this.circle=!1,this.vertical=!1,this.variant=`primary`}static{this.styles=[Nt]}render(){return A`
      <button 
        class="${Mt({button:!0,"button--circle":this.circle,"button--vertical":this.vertical,[`button--${this.variant}`]:!0})}"
        role="button"
        aria-pressed=${this.circle?`mixed`:`false`}
      >
        <slot name="icon"></slot>
        <slot></slot>
      </button>
    `}};q([V({type:Boolean,reflect:!0})],J.prototype,`circle`,void 0),q([V({type:Boolean,reflect:!0})],J.prototype,`vertical`,void 0),q([V({reflect:!0})],J.prototype,`variant`,void 0),J=q([B(`bw-button`)],J);var Pt=_`
  :host {
    display: block;
    min-height: 0;
    --bw-card-bg: var(--bw-bg, #ffffff);
    --bw-card-fg: var(--bw-fg, #09090b);
    --bw-card-radius: var(--bw-radius, 1rem);
    --bw-card-border: var(--bw-border, #e4e4e7);
    --bw-card-shadow: var(--bw-shadow, none);
    --bw-card-padding: var(--bw-padding, 1.5rem);
  }

  .card {
    display: flex;
    background-color: var(--bw-card-bg);
    color: var(--bw-card-fg);
    border-radius: var(--bw-card-radius);
    border: 1px solid var(--bw-card-border);
    box-shadow: var(--bw-card-shadow);
    overflow: hidden;
    height: inherit;
    max-height: inherit;
  }

  .card--vertical { 
    flex-direction: column; 
  }
  .card--horizontal { flex-direction: row; }

  .content-wrapper {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
  }

  .header-slot, .footer-slot {
    display: block;
    padding: var(--bw-card-padding);
    flex-shrink: 0;
  }

  .body-slot {
    display: flex;
    flex-direction: column;
    padding: var(--bw-body-padding, var(--bw-card-padding));
    flex: 1;
    overflow-y: auto;
    min-height: 0;
    overscroll-behavior-y: contain;
    
    /* Custom scrollbar for webkit */
    scrollbar-width: thin;
    scrollbar-color: var(--bw-border, #e2e8f0) transparent;
  }

  .body-slot::-webkit-scrollbar {
    width: 6px;
  }
  .body-slot::-webkit-scrollbar-track {
    background: transparent;
  }
  .body-slot::-webkit-scrollbar-thumb {
    background: var(--bw-border, #e2e8f0);
    border-radius: 10px;
  }
  .body-slot::-webkit-scrollbar-thumb:hover {
    background: #cbd5e1;
  }

  .header-slot { padding-bottom: 0; }
  .footer-slot { padding-top: 0; }
  
  ::slotted([slot="media"]) {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`,Ft=class extends z{constructor(...e){super(...e),this.orientation=`vertical`}static{this.styles=[Pt]}render(){return A`
      <article 
        part="base" 
        class="${Mt({card:!0,"card--vertical":this.orientation===`vertical`,"card--horizontal":this.orientation===`horizontal`})}"
        role="article"
      >
        <slot name="media" part="media"></slot>
        
        <div class="content-wrapper">
          <header class="header-slot" part="header">
            <slot name="header"></slot>
          </header>
          
          <main class="body-slot" part="body">
            <slot></slot>
          </main>
          
          <footer class="footer-slot" part="footer">
            <slot name="footer"></slot>
          </footer>
        </div>
      </article>
    `}};q([V({reflect:!0})],Ft.prototype,`orientation`,void 0),Ft=q([B(`bw-card`)],Ft);var It=_`
  :host {
    display: block;
    width: 100%;
    --bw-accordion-border: var(--bw-border, #e2e8f0);
    --bw-accordion-radius: var(--bw-radius, 0.5rem);
    --bw-accordion-bg: var(--bw-bg, #ffffff);
    --bw-accordion-fg: var(--bw-fg, #0f172a);
    --bw-accordion-padding: 1rem;
    --bw-accordion-transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .accordion-item {
    border-bottom: 1px solid var(--bw-accordion-border);
    background: var(--bw-accordion-bg);
  }

  .accordion-item:last-child {
    border-bottom: none;
  }

  .trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--bw-accordion-padding);
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--bw-accordion-fg);
    transition: var(--bw-accordion-transition);
    text-align: left;
  }

  .trigger:hover {
    background-color: var(--bw-bg-hover, #f8fafc);
  }

  .icon-wrapper {
    display: flex;
    align-items: center;
    flex-shrink: 0;
    transition: transform 0.3s ease;
    color: var(--bw-accordion-fg);
  }

  .icon-wrapper svg {
    width: 18px;
    height: 18px;
    stroke: currentColor;
    flex-shrink: 0;
  }

  .trigger[aria-expanded="true"] .icon-wrapper {
    transform: rotate(180deg);
  }

  .content-container {
    display: grid;
    grid-template-rows: 0fr;
    transition: grid-template-rows 0.3s ease, visibility 0.3s;
    overflow: hidden;
    visibility: hidden;
    pointer-events: none;
  }

  .trigger[aria-expanded="true"] + .content-container {
    grid-template-rows: 1fr;
    visibility: visible;
    pointer-events: auto;
  }

  .content {
    min-height: 0;
    padding: 0 var(--bw-accordion-padding) var(--bw-accordion-padding) var(--bw-accordion-padding);
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--bw-accordion-fg);
    opacity: 0.8;
  }
`,Y=class extends z{constructor(...e){super(...e),this.title=``,this.open=!1}static{this.styles=[It]}_toggle(){this.open=!this.open,this.dispatchEvent(new CustomEvent(`bw-toggle`,{detail:{open:this.open},bubbles:!0,composed:!0}))}render(){return A`
      <div class="accordion-item" ?data-open=${this.open}>
        <button 
          class="trigger" 
          @click=${this._toggle} 
          aria-expanded=${this.open}
          aria-controls="content"
        >
          <span class="title">${this.title}</span>
          <span class="icon-wrapper">
            ${W.chevronDown||A`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`}
          </span>
        </button>
        <div id="content" class="content-container" role="region">
          <div class="content">
            <slot></slot>
          </div>
        </div>
      </div>
    `}};q([V({type:String})],Y.prototype,`title`,void 0),q([V({type:Boolean,reflect:!0})],Y.prototype,`open`,void 0),Y=q([B(`bw-accordion-item`)],Y);function Lt(e,t){let n=new Set([...e].filter(e=>t.has(e))),r=new Set([...e,...t]);return r.size===0?1:n.size/r.size}var Rt,X,zt=t((()=>{Et(),Rt=class{constructor(e=1500){this._observer=null,this._debounceTimer=null,this._lastTokens=new Set,this._lastUrl=``,this._callbacks=[],this._discoveryCallbacks=[],this._isDiscovering=!1,this.isAutoDiscoveryEnabled=!1,this._debounceMs=e}start(){this._observer||(this._lastTokens=new Set(G()),this._lastUrl=ht(window.location.href),this._observer=new MutationObserver(()=>{this._debounceTimer&&clearTimeout(this._debounceTimer),this._debounceTimer=setTimeout(()=>this._onMutation(),this._debounceMs)}),this._observer.observe(document.body,{childList:!0,subtree:!0,attributes:!1,characterData:!1}))}stop(){this._observer?.disconnect(),this._observer=null,this._debounceTimer&&clearTimeout(this._debounceTimer)}onStateChange(e){this._callbacks.push(e)}onDiscovery(e){this._discoveryCallbacks.push(e)}get isDiscovering(){return this._isDiscovering}getLiveSnapshot(){let e=Array.from(document.querySelectorAll(`h1, h2`)).map(e=>e.innerText?.trim()).filter(Boolean).slice(0,3),t=Array.from(document.querySelectorAll(`button, a[href], [role="button"]`)).map(e=>{let t=e,n=(t.getAttribute(`aria-label`)||t.innerText||``).trim().slice(0,60);return{id:t.id||``,text:n}}).filter(e=>e.text.length>0).slice(0,30);return{url:window.location.href,headings:e,fingerprint:K(),elements:t}}async _onMutation(){if(document.readyState!==`complete`)return;let e=ht(window.location.href),t=new Set(G());if(t.size<2)return;let n=K(),r=e!==this._lastUrl,i=Lt(this._lastTokens,t);if(r||i<.55){let a=r?`URL: ${this._lastUrl} → ${e}`:`Sim: ${i.toFixed(2)}`;console.log(`[Watcher] Screen change (${a})`),this._lastUrl=e,this._lastTokens=t;let o=this.getLiveSnapshot();this.isAutoDiscoveryEnabled&&this._discover(n,[...t]).catch(()=>{}),this._callbacks.forEach(e=>e(o))}}async _discover(e,t){let n=localStorage.getItem(`bw_admin_token`);if(n){this._isDiscovering=!0;try{let r=await fetch(`http://localhost:8000/v1/training/discover`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${n}`},body:JSON.stringify({fingerprint:e,tokens:t,page_url:window.location.href})});if(r.ok){let e=await r.json();console.log(`[Discovery] ${e.status} — ${e.label}`),this._discoveryCallbacks.forEach(t=>t(e))}else r.status===401?(console.warn(`[Discovery] Token expired — disabling auto-discovery`),localStorage.removeItem(`bw_admin_token`),this.isAutoDiscoveryEnabled=!1):console.warn(`[Discovery] Server error ${r.status}`)}catch(e){console.warn(`[Discovery] Network error`,e)}finally{this._isDiscovering=!1}}}async forceDiscovery(){let e=[...new Set(G())],t=K();await this._discover(t,e)}},X=new Rt(1500)})),Bt=n({initAdminMode:()=>Wt,mountAdminPanel:()=>Ut});function Vt(){if(!Z)return;let e=G(),t=K(),n=Q?.is_trained===!0,r=Q&&!Q.is_trained,i=Q?.label||null,a=Q?.description||null,o=n?`active`:r?`draft`:`idle`,s=n?`trained`:r?`draft`:`idle`,c=n?`✅ Обучено`:r?`📝 Черновик (не подтверждено)`:`🔍 Сканирование...`,l=Z.querySelector(`#bw-admin-panel`);l&&(l.className=n?`trained`:`discovering`,l.id=`bw-admin-panel`,n&&l.classList.add(`trained`));let u=Z.querySelector(`#bw-panel-content`);u&&(u.innerHTML=`
      <div class="bw-status-box ${n?`trained`:r?`draft`:``}">
        <div class="bw-status-indicator">
          <span class="bw-status-dot ${o}"></span>
          <span class="bw-status-text ${s}">${c}</span>
        </div>
        ${i?`<div class="bw-label-display">${i}</div>`:``}
        ${a?`<div class="bw-desc-display">${a}</div>`:``}
      </div>

      <div class="bw-fp-mini">🔑 ${t}</div>

      <div class="bw-tokens-list">
        ${e.map(e=>`<span class="bw-token-tag" data-token="${e}">${e}</span>`).join(``)}
      </div>

      <div class="bw-discovery-bar">
        <div class="spinner"></div>
        🤖 Система обучается в фоновом режиме...
      </div>
    `,u.querySelectorAll(`.bw-token-tag`).forEach(e=>{let t=e;t.onmouseenter=()=>Ht(t.dataset.token||``),t.onmouseleave=()=>document.querySelectorAll(`.bw-highlight-rect`).forEach(e=>e.remove())}))}function Ht(e){document.querySelectorAll(`.bw-highlight-rect`).forEach(e=>e.remove());let t=document.createTreeWalker(document.body,NodeFilter.SHOW_ELEMENT),n;for(;n=t.nextNode();)if((n.innerText||``).toLowerCase()===e.toLowerCase()&&n.offsetWidth>0){let e=n.getBoundingClientRect(),t=document.createElement(`div`);t.className=`bw-highlight-rect`,t.style.top=`${e.top+window.scrollY}px`,t.style.left=`${e.left+window.scrollX}px`,t.style.width=`${e.width}px`,t.style.height=`${e.height}px`,document.body.appendChild(t)}}async function Ut(){if(Z)return;let e=document.createElement(`div`);e.id=`bw-admin-wrapper`,e.innerHTML=`
      <style>${Gt}</style>
      <div id="bw-admin-panel">
        <div class="bw-panel-header">
          <span class="bw-panel-title">🧠 Discovery Mode</span>
          <button class="bw-panel-close" id="bw-admin-close">✕</button>
        </div>
        <div id="bw-panel-content"></div>
      </div>
    `,document.body.appendChild(e),Z=e;let t=e.querySelector(`#bw-admin-close`);t.onclick=()=>{Z?.remove(),Z=null},X.onDiscovery(e=>{Q=e,Vt()}),Vt(),await X.forceDiscovery()}function Wt(){Ut()}var Gt,Z,Q,Kt=t((()=>{zt(),Et(),Gt=`
  #bw-admin-panel {
    position: fixed;
    bottom: 160px;
    right: 20px;
    z-index: 2147483647;
    width: 320px;
    background: #0f172a;
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 12px 50px rgba(0,0,0,0.6);
    font-family: Inter, system-ui, sans-serif;
    color: #f1f5f9;
    transition: border-color 0.3s;
  }
  #bw-admin-panel.trained {
    border-color: #10b981;
  }
  #bw-admin-panel.discovering {
    border-color: #a78bfa;
  }

  .bw-panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .bw-panel-title {
    font-size: 13px;
    font-weight: 700;
    color: #a78bfa;
  }
  .bw-panel-close {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 16px;
    padding: 0;
    line-height: 1;
  }
  .bw-panel-close:hover { color: #f87171; }

  .bw-status-box {
    background: #1e293b;
    border-radius: 10px;
    padding: 12px;
    margin-bottom: 12px;
    border: 1px solid #334155;
    transition: all 0.3s;
  }
  .bw-status-box.trained {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.08);
  }
  .bw-status-box.draft {
    border-color: #f59e0b;
    background: rgba(245, 158, 11, 0.05);
  }

  .bw-status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;
  }
  .bw-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .bw-status-dot.active { background: #4ade80; box-shadow: 0 0 8px #4ade80; animation: bw-pulse 2s infinite; }
  .bw-status-dot.draft  { background: #f59e0b; }
  .bw-status-dot.idle   { background: #475569; }

  @keyframes bw-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .bw-status-text {
    font-size: 11px;
    font-weight: 600;
  }
  .bw-status-text.trained { color: #4ade80; }
  .bw-status-text.draft   { color: #f59e0b; }
  .bw-status-text.idle    { color: #94a3b8; }

  .bw-label-display {
    font-size: 14px;
    font-weight: 700;
    color: #e2e8f0;
    margin: 4px 0;
    word-break: break-word;
  }
  .bw-desc-display {
    font-size: 11px;
    color: #94a3b8;
    line-height: 1.4;
    margin-top: 4px;
  }

  .bw-fp-mini {
    font-family: monospace;
    font-size: 9px;
    color: #475569;
    margin-bottom: 10px;
    word-break: break-all;
  }

  .bw-tokens-list {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .bw-token-tag {
    background: #334155;
    color: #e2e8f0;
    font-size: 9px;
    padding: 2px 6px;
    border-radius: 4px;
    cursor: help;
    transition: all 0.15s;
  }
  .bw-token-tag:hover {
    background: #7c3aed;
    color: white;
    transform: translateY(-1px);
  }

  .bw-discovery-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    background: rgba(167, 139, 250, 0.08);
    border: 1px solid rgba(167, 139, 250, 0.2);
    border-radius: 8px;
    font-size: 10px;
    color: #a78bfa;
    margin-top: 8px;
  }
  .bw-discovery-bar .spinner {
    width: 12px;
    height: 12px;
    border: 2px solid rgba(167, 139, 250, 0.3);
    border-top-color: #a78bfa;
    border-radius: 50%;
    animation: bw-spin 0.8s linear infinite;
  }
  @keyframes bw-spin {
    to { transform: rotate(360deg); }
  }

  .bw-highlight-rect {
    position: absolute;
    pointer-events: none;
    border: 2px solid #7c3aed;
    background: rgba(124, 58, 237, 0.1);
    box-shadow: 0 0 10px #7c3aed;
    z-index: 100000;
    border-radius: 4px;
    transition: all 0.15s ease-out;
  }
`,Z=null,Q=null}));zt();var $=class extends z{static{this.styles=[dt]}constructor(){super(),this._a11y=new mt(this),this._chat=new jt(this),this.clientId=``,this._isOpen=!1,this._activeTab=`chat`,this._inputValue=``,this._isAdmin=!1,this._adminPassword=``,this._authError=``,this._currentScreenLabel=``,this._checkAuthStatus()}async _checkAuthStatus(){let e=localStorage.getItem(`bw_admin_token`);if(e)try{(await fetch(`http://localhost:8000/auth/login/widget/verify`,{method:`GET`,headers:{Authorization:`Bearer ${e}`}})).ok?(this._isAdmin=!0,this._loadAdminUI()):localStorage.removeItem(`bw_admin_token`)}catch{try{let t=JSON.parse(atob(e.split(`.`)[1]));t.exp&&t.exp*1e3>Date.now()&&t.role===`admin`?(this._isAdmin=!0,this._loadAdminUI()):localStorage.removeItem(`bw_admin_token`)}catch{localStorage.removeItem(`bw_admin_token`)}}}async _loadAdminUI(){try{let{initAdminMode:e}=await Promise.resolve().then(()=>(Kt(),Bt));e(),X.isAutoDiscoveryEnabled=!0}catch(e){console.error(`Failed to load Admin UI`,e)}}async _handleAdminLogin(){if(this._authError=``,!this.clientId){this._authError=`Client ID not configured`;return}try{let e=await fetch(`http://localhost:8000/auth/login/widget`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({client_public_id:this.clientId,admin_key:this._adminPassword})});if(e.ok){let{access_token:t}=await e.json();localStorage.setItem(`bw_admin_token`,t),this._isAdmin=!0,this._loadAdminUI()}else this._authError=(await e.json().catch(()=>({}))).detail||`Invalid admin key`}catch{this._authError=`Connection failed`}}_handleAdminLogout(){localStorage.removeItem(`bw_admin_token`),this._isAdmin=!1,this._adminPassword=``,X.isAutoDiscoveryEnabled=!1;let e=document.querySelector(`#bw-admin-wrapper`);e&&e.remove()}connectedCallback(){super.connectedCallback(),X.start(),X.onStateChange(async e=>{console.log(`SPA State Shift Detected:`,e.fingerprint);try{let t=await fetch(`http://localhost:8000/v1/training/match-screen`,{method:`POST`,headers:{"Content-Type":`application/json`,"X-Client-ID":this.clientId||window.__BARIWEB_CLIENT_ID__||``},body:JSON.stringify({fingerprint:e.fingerprint})});if(t.ok){let e=await t.json();this._currentScreenLabel=e.matched?e.label:``}}catch{}})}disconnectedCallback(){super.disconnectedCallback(),X.stop()}_toggle(){this._isOpen=!this._isOpen}setOpen(e){this._isOpen=e}_setTab(e){this._activeTab=e}_getCurrentHue(){let e=this._a11y.settings;return e.activeColorTab===`background`?e.customBgHue||0:e.activeColorTab===`header`?e.customHeaderHue||0:e.customContentHue||0}_handleInput(e){this._inputValue=e.target.value}async _handleSend(){let e=this._inputValue.trim();!e||this._chat.isLoading||(this._inputValue=``,await this._chat.sendMessage(e),this.updateComplete.then(()=>{this._messagesEl&&(this._messagesEl.scrollTop=this._messagesEl.scrollHeight)}))}_handleKeydown(e){e.key===`Enter`&&!e.shiftKey&&(e.preventDefault(),this._handleSend())}_renderChatTab(){let e=this._chat.messages,t=this._chat.isLoading,n=this._chat.pendingConfirmation,r=A`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`,i=A`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;return A`
      <div class="chat-messages">
        ${this._currentScreenLabel?A`
          <div style="background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.2); border-radius: 8px; padding: 6px 10px; margin-bottom: 10px; font-size: 11px; color: #4ade80; display: flex; align-items: center; gap: 6px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            Опознано: <strong>${this._currentScreenLabel}</strong>
          </div>
        `:``}
        ${e.length===0?A`
          <div class="chat-empty">
            ${i}
            <p>Задайте вопрос, и я помогу вам найти нужную информацию или нажать нужную кнопку на странице.</p>
          </div>
        `:A`
          ${e.map(e=>A`
            <div class="chat-bubble ${e.role}">${e.text}</div>
          `)}
          ${t?A`
            <div class="typing-indicator">
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
            </div>
          `:``}
        `}
      </div>

      ${n?A`
        <!-- Confirmation buttons — replaces input bar while awaiting user decision -->
        <div style="display: flex; gap: 8px; padding: 10px 14px; border-top: 1px solid rgba(255,255,255,0.06);">
          <button
            @click=${()=>this._chat.confirmAction()}
            style="flex: 1; padding: 10px; border-radius: 10px; border: 1px solid rgba(74, 222, 128, 0.3); background: rgba(74, 222, 128, 0.1); color: #4ade80; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.15s;"
          >✅ Подтвердить</button>
          <button
            @click=${()=>this._chat.cancelAction()}
            style="flex: 1; padding: 10px; border-radius: 10px; border: 1px solid rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.1); color: #ef4444; font-weight: 700; font-size: 13px; cursor: pointer; transition: all 0.15s;"
          >❌ Отмена</button>
        </div>
      `:A`
        <div class="chat-input-bar">
          <input
            class="chat-input"
            type="text"
            placeholder="Напишите сообщение..."
            .value=${this._inputValue}
            @input=${this._handleInput}
            @keydown=${this._handleKeydown}
            ?disabled=${t}
            aria-label="Chat input"
          />
          <button
            class="chat-send-btn"
            @click=${this._handleSend}
            ?disabled=${t||!this._inputValue.trim()}
            aria-label="Send message"
          >
            ${r}
          </button>
        </div>
      `}
    `}_renderA11yTab(){let e=this._a11y.settings;return A`
      <div style="overflow-y: auto; flex: 1; padding: 0;">
        <nav class="selector-bar" aria-label="Quick Settings">
          <div class="selector-item" role="button" tabindex="0" @click=${()=>this._a11y.reset()}>
            ${W.close} Сбросить
          </div>
          <div class="selector-item" role="button" tabindex="0">${W.languages} Русский</div>
        </nav>

        <bw-accordion-item title="Color Adjustment" open>
          <div class="grid-3" style="margin-top: 0;">
            <bw-button vertical variant="${e.monochrome?`primary`:`outline`}" @click=${()=>this._a11y.toggleMonochrome()}>
              <span slot="icon">${W.visualImpair}</span>
              Monochrome
              ${e.monochrome?A`<div class="active-check">${W.check}</div>`:``}
            </bw-button>
            <bw-button vertical variant="${e.darkHighContrast?`primary`:`outline`}" @click=${()=>this._a11y.toggleDarkHighContrast()}>
              <span slot="icon">${W.moon}</span>
              Dark High-Contrast
              ${e.darkHighContrast?A`<div class="active-check">${W.check}</div>`:``}
            </bw-button>
            <bw-button vertical variant="${e.brightHighContrast?`primary`:`outline`}" @click=${()=>this._a11y.toggleBrightHighContrast()}>
              <span slot="icon">${W.sun}</span>
              Bright High-Contrast
              ${e.brightHighContrast?A`<div class="active-check">${W.check}</div>`:``}
            </bw-button>
            <bw-button vertical variant="${e.lowSaturation?`primary`:`outline`}" @click=${()=>this._a11y.toggleLowSaturation()}>
              <span slot="icon">${W.droplet}</span>
              Low saturation
              ${e.lowSaturation?A`<div class="active-check">${W.check}</div>`:``}
            </bw-button>
            <bw-button vertical variant="${e.highSaturation?`primary`:`outline`}" @click=${()=>this._a11y.toggleHighSaturation()}>
              <span slot="icon">${W.droplet}</span>
              High saturation
              ${e.highSaturation?A`<div class="active-check">${W.check}</div>`:``}
            </bw-button>
            <bw-button vertical variant="${e.contrastMode?`primary`:`outline`}" @click=${()=>this._a11y.toggleContrastMode()}>
              <span slot="icon">${W.contrast}</span>
              Contrast Mode
              ${e.contrastMode?A`<div class="active-check">${W.check}</div>`:``}
            </bw-button>
          </div>

          <div class="color-custom-box">
            <div class="color-custom-header">
              ${W.droplet}
              <div>
                <h4 class="color-custom-title">Custom Color</h4>
                <p class="color-custom-subtitle">Change the site's colors</p>
              </div>
            </div>
            
            <div class="color-tabs">
              <div class="color-tab" ?active=${e.activeColorTab===`background`} @click=${()=>{e.activeColorTab=`background`,this.requestUpdate()}}>Backgrounds</div>
              <div class="color-tab" ?active=${e.activeColorTab===`header`} @click=${()=>{e.activeColorTab=`header`,this.requestUpdate()}}>Headings</div>
              <div class="color-tab" ?active=${e.activeColorTab===`content`} @click=${()=>{e.activeColorTab=`content`,this.requestUpdate()}}>Contents</div>
            </div>
            
            <input type="range" min="0" max="360" class="hue-slider" .value=${String(this._getCurrentHue())} @input=${e=>this._a11y.setCustomHue(parseInt(e.target.value))}>
            
            <div class="reset-colors" @click=${()=>this._a11y.resetCustomColors()}>
              ${W.refresh} Reset colors
            </div>
          </div>
        </bw-accordion-item>

        <bw-accordion-item title="Content Adjustment">
          <div class="grid" style="margin-top: 0;">
            <bw-button vertical variant="${e.textScale>1?`primary`:`outline`}" @click=${()=>this._a11y.incrementTextScale()}>
              <span slot="icon">${W.textSize}</span>
              Текст ${Math.round(e.textScale*100)}%
            </bw-button>
            <bw-button vertical variant="${e.highlightHeaders?`primary`:`outline`}" @click=${()=>this._a11y.toggleHighlightHeaders()}>
              <span slot="icon">${W.visualImpair}</span>
              Headers
            </bw-button>
            <bw-button vertical variant="${e.enlargeButtons?`primary`:`outline`}" @click=${()=>this._a11y.toggleEnlargeButtons()}>
              <span slot="icon">${W.profiles}</span>
              Buttons
            </bw-button>
            <bw-button vertical variant="${e.cursorMagnifier?`primary`:`outline`}" @click=${()=>this._a11y.toggleCursorMagnifier()}>
              <span slot="icon">${W.cursor}</span>
              Cursor
            </bw-button>
            <bw-button vertical variant="${e.textSpacing?`primary`:`outline`}" @click=${()=>this._a11y.toggleTextSpacing()}>
              <span slot="icon">${W.textSize}</span>
              Spacing
            </bw-button>
            <bw-button vertical variant="${e.dyslexicFont?`primary`:`outline`}" @click=${()=>this._a11y.toggleDyslexicFont()}>
              <span slot="icon">${W.textSize}</span>
              Font
            </bw-button>
            <bw-button vertical variant="${e.linkHighlight?`primary`:`outline`}" @click=${()=>this._a11y.toggleLinkHighlight()}>
              <span slot="icon">${W.visualImpair}</span>
              Links
            </bw-button>
            <bw-button vertical variant="${e.focusVisualizer?`primary`:`outline`}" @click=${()=>this._a11y.toggleFocusVisualizer()}>
              <span slot="icon">${W.profiles}</span>
              Read Focus
            </bw-button>
            <bw-button vertical variant="${e.animationsDisabled?`primary`:`outline`}" @click=${()=>this._a11y.toggleAnimations()}>
              <span slot="icon">${W.close}</span>
              Animations
            </bw-button>
          </div>
        </bw-accordion-item>

        <bw-accordion-item title="Admin Access">
          <div style="padding: 10px 0;">
            ${this._isAdmin?A`
              <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid #334155; border-radius: 10px; padding: 14px;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 10px;">
                  <span style="width: 10px; height: 10px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 10px #4ade80; animation: bw-dot-pulse 2s infinite;"></span>
                  <span style="color: #4ade80; font-size: 12px; font-weight: 700;">Discovery Mode Active</span>
                </div>
                ${this._currentScreenLabel?A`
                  <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 6px; padding: 8px 10px; margin-bottom: 10px;">
                    <div style="font-size: 10px; color: #10b981; font-weight: 600; margin-bottom: 2px;">✅ Текущий экран</div>
                    <div style="font-size: 13px; color: #e2e8f0; font-weight: 700;">${this._currentScreenLabel}</div>
                  </div>
                `:``}
                <p style="margin: 0 0 12px; font-size: 11px; color: #64748b; line-height: 1.4;">
                  🤖 Ходите по сайту — система автоматически записывает экраны. Управляйте ими в дашборде.
                </p>
                <button
                  style="width: 100%; background: #1e293b; color: #94a3b8; border: 1px solid #334155; border-radius: 8px; padding: 8px; font-size: 12px; cursor: pointer;"
                  @click=${this._handleAdminLogout}
                >
                  Выйти из Admin Mode
                </button>
              </div>
            `:A`
              <p style="margin: 0 0 12px; font-size: 12px; color: #94a3b8; line-height: 1.4;">Введите admin-ключ для включения автоматического обучения экранов.</p>
              <input
                type="password"
                placeholder="Admin Key"
                style="width: 100%; box-sizing: border-box; background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; color: white; margin-bottom: 12px; outline: none;"
                .value=${this._adminPassword}
                @input=${e=>this._adminPassword=e.target.value}
              />
              ${this._authError?A`<p style="color: #f87171; font-size: 11px; margin-bottom: 10px; text-align: center;">${this._authError}</p>`:``}
              <button
                style="width: 100%; background: #7c3aed; color: white; border: none; border-radius: 8px; padding: 10px; font-size: 13px; font-weight: 600; cursor: pointer;"
                @click=${this._handleAdminLogin}
              >
                Login to Admin
              </button>
            `}
          </div>
        </bw-accordion-item>
      </div>
    `}render(){return A`
      <div class="widget-container">
        <bw-card 
          class="${this._isOpen?`panel-visible`:`panel-hidden`}"
          role="dialog"
          aria-label="BariWeb Accessibility & Chat"
        >
          <div slot="header" class="header-content">
            <h2 class="header-title">BariWeb Инклюзия</h2>
            <button 
              class="close-btn" 
              @click=${this._toggle} 
              aria-label="Close menu"
            >
              ${W.close}
            </button>
          </div>
 
           <!-- Tab Bar -->
           <div class="tab-bar">
             <div class="tab" ?active=${this._activeTab===`chat`} @click=${()=>this._setTab(`chat`)}>
               💬 Ассистент
             </div>
             <div class="tab" ?active=${this._activeTab===`a11y`} @click=${()=>this._setTab(`a11y`)}>
               ♿ Доступность
             </div>
           </div>
 
           <!-- Panel Content -->
           <div class="panel-body" style="flex: 1; display: flex; flex-direction: column; min-height: 0;">
             <div class="tab-panel" ?active=${this._activeTab===`chat`}>
               ${this._renderChatTab()}
             </div>
             <div class="tab-panel" ?active=${this._activeTab===`a11y`}>
               ${this._renderA11yTab()}
             </div>
           </div>
 
           <div slot="footer" class="footer-content">
             <div class="footer-brand">
               ${W.accessibility} Bariweb
             </div>
             <span>Сделано в Казахстане 🇰🇿</span>
           </div>
         </bw-card>
 
         <bw-button 
           circle 
           variant="primary" 
           @click=${this._toggle}
           class="trigger"
           aria-expanded=${this._isOpen}
           aria-label="Toggle BariWeb menu"
         >
           ${this._isOpen?W.close:W.accessibility}
         </bw-button>
       </div>
     `}};q([V({type:String,attribute:`client-id`})],$.prototype,`clientId`,void 0),q([H()],$.prototype,`_isOpen`,void 0),q([H()],$.prototype,`_activeTab`,void 0),q([H()],$.prototype,`_inputValue`,void 0),q([H()],$.prototype,`_isAdmin`,void 0),q([H()],$.prototype,`_adminPassword`,void 0),q([H()],$.prototype,`_authError`,void 0),q([H()],$.prototype,`_currentScreenLabel`,void 0),q([at(`.chat-messages`)],$.prototype,`_messagesEl`,void 0),$=q([B(`bw-widget`)],$);var qt=()=>{let e=document.querySelector(`bw-widget`)?.getAttribute(`client-id`);if(e)return e;let t=(document.currentScript||document.querySelector(`script[src*="bariweb"]`))?.getAttribute(`data-client-id`);return t||=document.querySelector(`script[data-client-id]`)?.getAttribute(`data-client-id`)||``,t||window.__BARIWEB_CLIENT_ID__||``},Jt=qt();window.__BARIWEB_CLIENT_ID__=Jt,pe.setConfig({baseUrl:`http://localhost:8000`}),pe.interceptors.request.use(e=>{let t=qt();return e.headers.set(`X-Client-ID`,t),e})})();