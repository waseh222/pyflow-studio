/* PyFlow Studio v0.3: dockable, full-height canvas experience. No new external dependencies. */
(() => {
'use strict';
const body=document.body;
const q=s=>document.querySelector(s);
const libraryButton=q('#toggle-library'), inspectorButton=q('#toggle-inspector'),focusButton=q('#btn-focus');
const resultsButton=q('#toggle-results'), resultPanel=q('.results-section');
const viewport=q('#canvas-viewport');
const safeGet=(name)=>{try{return window.localStorage.getItem(name)}catch(e){return null}};
const safeSet=(name,value)=>{try{window.localStorage.setItem(name,value)}catch(e){/* File:// private mode may disallow storage. */}};
let focusPrevious=null;
const initialLibrary=safeGet('pyflow03-library-hidden');
const initialInspector=safeGet('pyflow03-inspector-hidden');
if(initialLibrary==='1'||(initialLibrary===null&&innerWidth<1150))body.classList.add('library-hidden');
if(initialInspector==='1'||(initialInspector===null&&innerWidth<680))body.classList.add('inspector-hidden');
function updateButtons(){
 const scrim=q('#dock-scrim');if(scrim)scrim.classList.toggle('visible',innerWidth<=950&&!body.classList.contains('focus-mode')&&(!body.classList.contains('library-hidden')||!body.classList.contains('inspector-hidden')));
 libraryButton?.setAttribute('aria-pressed',String(!body.classList.contains('library-hidden')&&!body.classList.contains('focus-mode')));
 inspectorButton?.setAttribute('aria-pressed',String(!body.classList.contains('inspector-hidden')&&!body.classList.contains('focus-mode')));
 focusButton?.setAttribute('aria-pressed',String(body.classList.contains('focus-mode')));
 if(focusButton)focusButton.innerHTML=body.classList.contains('focus-mode')?'⤢ <span>Exit focus</span>':'⛶ <span>Focus</span>';
 const resultBtn=q('#btn-show-results');if(resultBtn)resultBtn.setAttribute('aria-pressed',String(!resultPanel.classList.contains('results-collapsed')));
}
function updateLayout(){updateButtons();window.dispatchEvent(new Event('resize'));}
function toggleLibrary(){if(body.classList.contains('focus-mode'))exitFocus();body.classList.toggle('library-hidden');safeSet('pyflow03-library-hidden',body.classList.contains('library-hidden')?'1':'0');updateLayout()}
function toggleInspector(){if(body.classList.contains('focus-mode'))exitFocus();body.classList.toggle('inspector-hidden');safeSet('pyflow03-inspector-hidden',body.classList.contains('inspector-hidden')?'1':'0');updateLayout()}
function exitFocus(){body.classList.remove('focus-mode');if(focusPrevious){body.classList.toggle('library-hidden',focusPrevious.library);body.classList.toggle('inspector-hidden',focusPrevious.inspector)}focusPrevious=null;updateLayout()}
function toggleFocus(){if(body.classList.contains('focus-mode')){exitFocus();return}focusPrevious={library:body.classList.contains('library-hidden'),inspector:body.classList.contains('inspector-hidden')};body.classList.add('focus-mode');updateLayout()}
libraryButton.addEventListener('click',toggleLibrary);
inspectorButton.addEventListener('click',toggleInspector);
focusButton.addEventListener('click',toggleFocus);
q('#close-library')?.addEventListener('click',toggleLibrary);
q('#close-inspector')?.addEventListener('click',toggleInspector);
q('#dock-scrim')?.addEventListener('click',()=>{body.classList.add('library-hidden','inspector-hidden');safeSet('pyflow03-library-hidden','1');safeSet('pyflow03-inspector-hidden','1');updateLayout()});
const outputButton=q('#btn-show-results');
outputButton.addEventListener('click',()=>{resultsButton.click();updateButtons()});
resultsButton.addEventListener('click',updateButtons);
q('#btn-debug')?.addEventListener('click',()=>{if(resultPanel.classList.contains('results-collapsed'))resultsButton.click();updateButtons()});
q('#btn-run')?.addEventListener('click',()=>{if(resultPanel.classList.contains('results-collapsed'))resultsButton.click();updateButtons()});
q('#btn-canvas-add').addEventListener('click',()=>q('#btn-add-step').click());
q('#btn-canvas-home').addEventListener('click',()=>{viewport.scrollTo({left:0,top:0,behavior:'smooth'});});
// A blank canvas can be dragged just like in n8n. Node and port dragging remains unchanged.
let pan=null;
viewport.addEventListener('pointerdown',e=>{
 if(e.button!==0||e.target.closest('.canvas-node,.canvas-hint,.canvas-guide,button,.workflow-minimap,.canvas-floating-tools'))return;
 if(e.target.closest('#canvas-stage')&&!e.target.closest('#connector-svg,#node-layer'))return;
 pan={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};
 viewport.classList.add('is-panning');
});
window.addEventListener('pointermove',e=>{if(!pan)return;viewport.scrollLeft=pan.left-(e.clientX-pan.x);viewport.scrollTop=pan.top-(e.clientY-pan.y)});
window.addEventListener('pointerup',()=>{pan=null;viewport.classList.remove('is-panning')});
window.addEventListener('blur',()=>{pan=null;viewport.classList.remove('is-panning')});
viewport.addEventListener('wheel',e=>{if(e.shiftKey&&!e.ctrlKey){e.preventDefault();viewport.scrollLeft+=e.deltaY}}, {passive:false});
const typing=el=>el?.isContentEditable||['INPUT','TEXTAREA','SELECT'].includes(el?.tagName);
document.addEventListener('keydown',e=>{
 if(e.key==='Escape' && innerWidth<=950 && (!body.classList.contains('library-hidden')||!body.classList.contains('inspector-hidden'))){body.classList.add('library-hidden','inspector-hidden');updateLayout();return;}
 if(typing(e.target)||e.ctrlKey||e.altKey||e.metaKey||q('#modal-backdrop:not(.hidden)')||q('#action-picker:not(.hidden)'))return;
 const key=e.key.toLowerCase();
 if(key==='f'){e.preventDefault();toggleFocus()}
 if(key==='l'){e.preventDefault();toggleLibrary()}
 if(key==='p'){e.preventDefault();toggleInspector()}
 if(key==='g'){e.preventDefault();outputButton.click()}
});
// Panels can be dragged wider or narrower without resizing the browser window.
function initResize(handle,isLibrary){if(!handle)return;let drag=null;
 handle.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,from:parseFloat(getComputedStyle(body).getPropertyValue(isLibrary?'--library-width':'--inspector-width'))||(isLibrary?252:324)};handle.classList.add('resizing');handle.setPointerCapture(e.pointerId);e.preventDefault();});
 handle.addEventListener('pointermove',e=>{if(!drag)return;let next=drag.from+(e.clientX-drag.x)*(isLibrary?1:-1);next=Math.round(Math.max(isLibrary?205:280,Math.min(isLibrary?430:510,next)));body.style.setProperty(isLibrary?'--library-width':'--inspector-width',next+'px');});
 handle.addEventListener('pointerup',()=>{if(!drag)return;const key=isLibrary?'pyflow03-library-width':'pyflow03-inspector-width';safeSet(key,getComputedStyle(body).getPropertyValue(isLibrary?'--library-width':'--inspector-width').trim());drag=null;handle.classList.remove('resizing');updateLayout()});
 handle.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;const step=e.key==='ArrowRight'?16:-16;const varName=isLibrary?'--library-width':'--inspector-width',cur=parseFloat(getComputedStyle(body).getPropertyValue(varName))||(isLibrary?252:324);body.style.setProperty(varName,Math.max(205,cur+(isLibrary?step:-step))+'px');e.preventDefault()});
}
for(const [key,cssKey] of [['pyflow03-library-width','--library-width'],['pyflow03-inspector-width','--inspector-width']]){const width=safeGet(key);if(width&&/^\d+px$/.test(width))body.style.setProperty(cssKey,width)}
initResize(q('#library-resizer'),true);initResize(q('#inspector-resizer'),false);
// New projects open at a comfortable readable 110% zoom; zoom remains adjustable.
if(q('#zoom-val')?.textContent?.trim()==='100%')q('#zoom-in')?.click();
window.addEventListener('resize',updateButtons);
updateButtons();
})();
