var E=new WeakMap;function L(t,e,a={}){if(t==null||typeof t!="object")throw new TypeError("Statelight.watch: target must be an object");if(!(e in t))throw new TypeError(`Statelight.watch: target has no property "${e}"`);let o=E.get(t);if(o!=null&&o.has(e))throw new Error(`Statelight.watch: "${e}" is already being watched on this object \u2014 call unwatch() first`);o||(o=new Set,E.set(t,o)),o.add(e);let s=new Set,n=t[e],i=[{state:n,from:null,at:A(),event:null}];return Object.defineProperty(t,e,{configurable:!0,enumerable:!0,get(){return n},set(r){let d=n;if(n=r,r===d)return;let l={state:r,from:d,at:A(),event:a.eventName||null};if(i.push(l),a.historyLimit>=0)for(;i.length>Math.max(a.historyLimit,1);)i.shift();for(let p of s)p(l)}}),{get current(){return n},history(){return i.slice()},onTransition(r){return s.add(r),()=>s.delete(r)},unwatch(){Object.defineProperty(t,e,{configurable:!0,enumerable:!0,writable:!0,value:n}),s.clear(),o.delete(e)}}}function A(){return typeof performance!="undefined"?performance.now():Date.now()}var N=`
.statelight-panel {
  --sl-bg: #0b1220;
  --sl-surface-1: #10192e;
  --sl-surface-2: #182544;
  --sl-text: #e7edf7;
  --sl-text-muted: #8fa3c7;
  --sl-accent: #5eead4;
  --sl-accent-support: #f2b632;
  --sl-danger: #fb7185;
  --sl-radius: 6px;
  --sl-space-1: 4px;
  --sl-space-2: 8px;
  --sl-space-3: 12px;
  --sl-space-4: 16px;

  position: fixed;
  /* --sl-stack-offset is set per instance by panel.js so multiple
     attach()ed panels cascade instead of stacking on top of each other
     at the default position; a dragged/persisted position overrides it
     with an inline left/top that wins over these. */
  right: calc(var(--sl-space-4) + var(--sl-stack-offset, 0px));
  bottom: calc(var(--sl-space-4) + var(--sl-stack-offset, 0px));
  z-index: 2147483647;
  width: 280px;
  max-width: calc(100vw - 2 * var(--sl-space-4));
  background: var(--sl-surface-1);
  color: var(--sl-text);
  border: 1px solid var(--sl-surface-2);
  border-radius: var(--sl-radius);
  box-shadow:
    0 0 0 1px rgba(94, 234, 212, 0.08),
    0 12px 32px rgba(0, 0, 0, 0.45);
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
}

.statelight-panel__header {
  display: flex;
  align-items: center;
  gap: var(--sl-space-2);
  padding: var(--sl-space-2) var(--sl-space-3);
  background: var(--sl-surface-2);
  border-bottom: 1px solid rgba(94, 234, 212, 0.15);
  cursor: grab;
  touch-action: none;
}

.statelight-panel.is-dragging {
  user-select: none;
}

.statelight-panel.is-dragging .statelight-panel__header {
  cursor: grabbing;
}

.statelight-panel__mark {
  color: var(--sl-accent);
  font-weight: 700;
  letter-spacing: 0.02em;
}

.statelight-panel__label {
  color: var(--sl-text-muted);
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.06em;
}

.statelight-panel__toggle {
  display: flex;
  align-items: center;
  gap: var(--sl-space-1);
  margin-left: auto;
  padding: var(--sl-space-1);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--sl-radius);
  color: var(--sl-text-muted);
  cursor: pointer;
  transition: color 160ms ease-out, border-color 160ms ease-out, background 160ms ease-out;
}

.statelight-panel__toggle:hover {
  color: var(--sl-text);
  background: rgba(255, 255, 255, 0.06);
}

.statelight-panel__toggle:focus-visible {
  outline: none;
  border-color: var(--sl-accent);
  box-shadow: 0 0 0 2px rgba(94, 234, 212, 0.25);
}

.statelight-panel__toggle:active {
  transform: scale(0.92);
}

.statelight-panel__toggle-icon {
  display: inline-block;
  transition: transform 160ms ease-out;
}

.statelight-panel.is-collapsed .statelight-panel__toggle-icon {
  transform: rotate(-90deg);
}

.statelight-panel__unread {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sl-accent-support);
  opacity: 0;
  transform: scale(0);
  transition: opacity 160ms ease-out, transform 160ms ease-out;
}

.statelight-panel__unread.is-visible {
  opacity: 1;
  transform: scale(1);
}

.statelight-panel.is-collapsed .statelight-panel__state,
.statelight-panel.is-collapsed .statelight-panel__graph,
.statelight-panel.is-collapsed .statelight-panel__trail {
  display: none;
}

.statelight-panel__state {
  padding: var(--sl-space-3);
  font-size: 18px;
  font-weight: 700;
  color: var(--sl-text);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.statelight-panel__state.is-pulsing {
  animation: statelight-pulse 600ms ease-out;
}

@keyframes statelight-pulse {
  0% {
    text-shadow: 0 0 0 rgba(94, 234, 212, 0);
  }
  20% {
    text-shadow: 0 0 12px rgba(94, 234, 212, 0.85);
  }
  100% {
    text-shadow: 0 0 0 rgba(94, 234, 212, 0);
  }
}

.statelight-panel--graph {
  width: 360px;
}

.statelight-panel__graph {
  padding: var(--sl-space-2) var(--sl-space-3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.statelight-graph {
  display: block;
  width: 100%;
  height: auto;
}

.statelight-graph__node-circle {
  fill: var(--sl-surface-2);
  stroke: var(--sl-text-muted);
  stroke-width: 1.5;
  transition: stroke 160ms ease-out, fill 160ms ease-out;
}

.statelight-graph__node-label {
  fill: var(--sl-text);
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 10px;
  text-anchor: middle;
  dominant-baseline: middle;
  pointer-events: none;
}

.statelight-graph__node.is-current .statelight-graph__node-circle {
  fill: rgba(94, 234, 212, 0.12);
  stroke: var(--sl-accent);
  stroke-width: 2;
  filter: drop-shadow(0 0 6px rgba(94, 234, 212, 0.65));
}

.statelight-graph__edge-line {
  fill: none;
  stroke: var(--sl-text-muted);
  stroke-width: 1.25;
  opacity: 0.55;
  transition: stroke 160ms ease-out, opacity 160ms ease-out;
}

.statelight-graph__edge-label {
  fill: var(--sl-text-muted);
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 9px;
  text-anchor: middle;
  pointer-events: none;
}

.statelight-graph__arrowhead {
  fill: var(--sl-text-muted);
  opacity: 0.55;
}

.statelight-graph__edge.is-active .statelight-graph__edge-line {
  stroke: var(--sl-accent);
  opacity: 1;
  animation: statelight-edge-pulse 600ms ease-out;
}

.statelight-graph__edge.is-active .statelight-graph__arrowhead {
  fill: var(--sl-accent);
  opacity: 1;
}

.statelight-graph__edge.is-active .statelight-graph__edge-label {
  fill: var(--sl-accent);
}

@keyframes statelight-edge-pulse {
  0% {
    filter: drop-shadow(0 0 0 rgba(94, 234, 212, 0));
  }
  20% {
    filter: drop-shadow(0 0 6px rgba(94, 234, 212, 0.85));
  }
  100% {
    filter: drop-shadow(0 0 0 rgba(94, 234, 212, 0));
  }
}

.statelight-panel__trail {
  list-style: none;
  margin: 0;
  padding: var(--sl-space-2) var(--sl-space-3);
  display: flex;
  flex-direction: column;
  gap: var(--sl-space-1);
  color: var(--sl-text-muted);
  max-height: 140px;
  overflow-y: auto;
}

.statelight-panel__trail li {
  padding: var(--sl-space-1) var(--sl-space-2);
  border-radius: var(--sl-radius);
  background: rgba(255, 255, 255, 0.03);
}

.statelight-panel__trail li:first-child {
  color: var(--sl-accent);
  background: rgba(94, 234, 212, 0.08);
}

@media (prefers-reduced-motion: reduce) {
  .statelight-panel__state.is-pulsing,
  .statelight-graph__edge.is-active .statelight-graph__edge-line {
    animation: none;
  }
}
`;function G(t={}){let e=[],a=new Set,o=[];function s(n){a.has(n)||(a.add(n),e.push(n))}for(let[n,i]of Object.entries(t)){s(n);for(let[r,d]of Object.entries(i)){let l=String(d);s(l),o.push({id:H(n,r,l),from:n,to:l,event:r})}}return{nodes:e,edges:o}}function H(t,e,a){return[t,e,a].map(B).join("::")}function B(t){return String(t).replace(/:/g,"%3A")}var X=28,Y=24;function D(t,{nodeRadius:e=X,padding:a=Y}={}){let o=new Map,s=t.length,n=e*2+a*2;if(s===0)return{positions:o,width:n,height:n};if(s===1)return o.set(t[0],{x:n/2,y:n/2}),{positions:o,width:n,height:n};let i=Math.max(e*1.25/Math.sin(Math.PI/s),e*1.5),r=i*2+e*2+a*2,d=r/2;return t.forEach((l,p)=>{let h=2*Math.PI*p/s-Math.PI/2;o.set(l,{x:d+i*Math.cos(h),y:d+i*Math.sin(h)})}),{positions:o,width:r,height:r}}function O(t,e){if(!e||e.from==null)return[];let a=String(e.from),o=String(e.state),s=t.filter(n=>n.from===a&&n.to===o);if(s.length>1&&e.event){let n=s.filter(i=>i.event===e.event);if(n.length)return n}return s}var U="http://www.w3.org/2000/svg",S=28,j=16,J=600,K=0;function m(t,e={}){let a=document.createElementNS(U,t);for(let[o,s]of Object.entries(e))a.setAttribute(o,s);return a}function F(t){let{nodes:e,edges:a}=G(t);if(e.length===0)return null;let{positions:o,width:s,height:n}=D(e,{nodeRadius:S}),i=`sl-${K++}`,r=m("svg",{class:"statelight-graph",viewBox:`0 0 ${s} ${n}`,role:"img","aria-label":"Live state transition graph"}),d=m("defs"),l=m("marker",{id:`${i}-arrow`,viewBox:"0 0 10 10",refX:9,refY:5,markerWidth:7,markerHeight:7,orient:"auto-start-reverse"});l.appendChild(m("path",{d:"M0,0 L10,5 L0,10 z",class:"statelight-graph__arrowhead"})),d.appendChild(l),r.appendChild(d);let p=new Map,h=new Map,f=m("g",{class:"statelight-graph__edges"});for(let c of a){let g=o.get(c.from),u=o.get(c.to),x=c.from===c.to,y=m("g",{class:"statelight-graph__edge","data-edge-id":c.id});if(y.appendChild(m("path",{class:"statelight-graph__edge-line",d:x?V(g,S):W(g,u,S),"marker-end":`url(#${i}-arrow)`})),c.event){let I=x?{x:g.x,y:g.y-S-j*2-4}:R(g,u,s/2,n/2),T=m("text",{class:"statelight-graph__edge-label",x:I.x,y:I.y});T.textContent=c.event,y.appendChild(T)}f.appendChild(y),p.set(c.id,y)}let b=m("g",{class:"statelight-graph__nodes"});for(let c of e){let{x:g,y:u}=o.get(c),x=m("g",{class:"statelight-graph__node","data-node-id":c});x.appendChild(m("circle",{class:"statelight-graph__node-circle",cx:g,cy:u,r:S}));let y=m("text",{class:"statelight-graph__node-label",x:g,y:u});y.textContent=String(c),x.appendChild(y),b.appendChild(x),h.set(c,x)}r.appendChild(f),r.appendChild(b);let _=null,w=new Map;function v(){var c;for(let[g,u]of w)clearTimeout(u),(c=p.get(g))==null||c.classList.remove("is-active");w.clear()}function k(c){_&&_.classList.remove("is-current"),_=h.get(String(c.state))||null,_&&_.classList.add("is-current"),v();for(let g of O(a,c)){let u=p.get(g.id);u&&(u.classList.add("is-active"),w.set(g.id,setTimeout(()=>{u.classList.remove("is-active"),w.delete(g.id)},J)))}}return{el:r,highlight:k,destroy(){v(),r.remove()}}}function W(t,e,a){let o=e.x-t.x,s=e.y-t.y,n=Math.hypot(o,s)||1,i=o/n,r=s/n;return`M${t.x+i*a},${t.y+r*a} L${e.x-i*a},${e.y-r*a}`}function V({x:t,y:e},a){let o=e-a,s=o-j*2;return`M${t-a*.6},${o} C${t-a*.6},${s} ${t+a*.6},${s} ${t+a*.6},${o}`}function R(t,e,a,o){let s=(t.x+e.x)/2,n=(t.y+e.y)/2,i=s-a,r=n-o,d=Math.hypot(i,r)||1,l=S*.9;return{x:s+i/d*l,y:n+r/d*l}}function C(t){try{return typeof localStorage=="undefined"?null:localStorage.getItem(t)}catch{return null}}function P(t,e){try{if(typeof localStorage=="undefined")return;localStorage.setItem(t,e)}catch{}}function q(t,e,{exclude:a,onDragEnd:o}={}){let s=null;function n(p,h){let f=Math.max((window.innerWidth||0)-e.offsetWidth,0),b=Math.max((window.innerHeight||0)-e.offsetHeight,0);return{left:Math.min(Math.max(p,0),f),top:Math.min(Math.max(h,0),b)}}function i(p,h){let f=n(p,h);return e.style.left=`${f.left}px`,e.style.top=`${f.top}px`,e.style.right="auto",e.style.bottom="auto",f}function r(p){var f;if(a&&p.target.closest(a))return;let h=e.getBoundingClientRect();s={pointerId:p.pointerId,startX:p.clientX,startY:p.clientY,startLeft:h.left,startTop:h.top},e.classList.add("is-dragging"),(f=t.setPointerCapture)==null||f.call(t,p.pointerId),p.preventDefault()}function d(p){!s||p.pointerId!==s.pointerId||i(s.startLeft+(p.clientX-s.startX),s.startTop+(p.clientY-s.startY))}function l(p){if(!s||p.pointerId!==s.pointerId)return;s=null,e.classList.remove("is-dragging");let h=e.getBoundingClientRect();o==null||o({left:h.left,top:h.top})}return t.addEventListener("pointerdown",r),t.addEventListener("pointermove",d),t.addEventListener("pointerup",l),t.addEventListener("pointercancel",l),{setPosition:i,destroy(){t.removeEventListener("pointerdown",r),t.removeEventListener("pointermove",d),t.removeEventListener("pointerup",l),t.removeEventListener("pointercancel",l)}}}var Q="statelight-panel",z="statelight-styles",Z=6,tt=40;function et(){if(document.getElementById(z))return;let t=document.createElement("style");t.id=z,t.textContent=N,document.head.appendChild(t)}var $=[],at=0;function st(){return $.length?$.pop():at++}function nt(t){$.push(t)}function M({label:t="State Machine",transitions:e}={}){if(typeof document=="undefined")throw new Error("Statelight.createPanel requires a DOM environment");et();let a=document.createElement("div");a.className=Q,a.innerHTML=`
    <div class="statelight-panel__header">
      <span class="statelight-panel__mark">&#9670; Statelight</span>
      <span class="statelight-panel__label"></span>
      <button type="button" class="statelight-panel__toggle" aria-expanded="true">
        <span class="statelight-panel__unread" aria-hidden="true"></span>
        <span class="statelight-panel__toggle-icon" aria-hidden="true">&#9662;</span>
      </button>
    </div>
    <div class="statelight-panel__state" role="status" aria-live="polite"></div>
    <div class="statelight-panel__graph"></div>
    <ul class="statelight-panel__trail"></ul>
  `;let o=a.querySelector(".statelight-panel__label"),s=a.querySelector(".statelight-panel__state"),n=a.querySelector(".statelight-panel__graph"),i=a.querySelector(".statelight-panel__trail"),r=a.querySelector(".statelight-panel__toggle");o.textContent=t;let d=`statelight:${t}:collapsed`,l=C(d)==="1";function p(c){l=c,a.classList.toggle("is-collapsed",l),r.setAttribute("aria-expanded",String(!l)),r.setAttribute("aria-label",l?"Expand panel":"Collapse panel"),l||r.querySelector(".statelight-panel__unread").classList.remove("is-visible")}p(l),r.addEventListener("click",()=>{p(!l),P(d,l?"1":"0")});let h=`statelight:${t}:position`,f=a.querySelector(".statelight-panel__header"),b=q(f,a,{exclude:".statelight-panel__toggle",onDragEnd(c){P(h,JSON.stringify(c))}}),_=null,w=C(h);if(w)try{let{left:c,top:g}=JSON.parse(w);Number.isFinite(c)&&Number.isFinite(g)&&b.setPosition(c,g)}catch{}a.style.left||(_=st(),_>0&&a.style.setProperty("--sl-stack-offset",`${_*tt}px`));let v=e?F(e):null;v?(a.classList.add("statelight-panel--graph"),n.appendChild(v.el)):n.remove();function k(c,g){s.textContent=String(c.state),s.classList.remove("is-pulsing"),s.offsetWidth,s.classList.add("is-pulsing"),v&&v.highlight(c),l&&r.querySelector(".statelight-panel__unread").classList.add("is-visible"),i.innerHTML="",g.slice(-Z).reverse().forEach(u=>{let x=document.createElement("li");x.textContent=u.event?`${u.state} \xB7 ${u.event}`:String(u.state),i.appendChild(x)})}return{el:a,mount(c){return(c||document.body).appendChild(a),this},update:k,destroy(){_!==null&&nt(_),b.destroy(),v==null||v.destroy(),a.remove()}}}function ot(t,e={}){let{stateKey:a="state",label:o,transitions:s,container:n}=e,i=L(t,a,e),r=M({label:o||a,transitions:s});r.mount(n),r.update({state:i.current,from:null,event:null},i.history());let d=i.onTransition(l=>{r.update(l,i.history())});return{watcher:i,panel:r,detach(){d(),i.unwatch(),r.destroy()}}}typeof window!="undefined"&&(window.Statelight={attach:ot,watch:L,createPanel:M});export{ot as attach,M as createPanel,L as watch};
