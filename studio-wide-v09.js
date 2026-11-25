/* Canvas-first wide mode for v0.9. Works alongside v0.3 dock controls. */
(() => {
  'use strict';
  const body=document.body,$=s=>document.querySelector(s),KEY='pyflow-v09-layout';
  const store=(v)=>{try{localStorage.setItem(KEY,v)}catch(_){}};
  const load=()=>{try{return localStorage.getItem(KEY)}catch(_){return null}};
  const original={library:false,inspector:false};
  const left=$('#toggle-library'),right=$('#toggle-inspector'),scrim=$('#dock-scrim'),toolbar=$('.toolbar-left');
  if(!left||!right||!toolbar)return;
  const toggle=document.createElement('button');toggle.id='wide-toggle';toggle.type='button';toggle.title='Full-width editor — panels open without shrinking the canvas (W)';toggle.textContent='⤢ Wide editor';toggle.setAttribute('aria-label','Toggle wide editor');
  left.insertAdjacentElement('afterend',toggle);
  const menuWrap=document.createElement('div');menuWrap.className='wide-menu-wrap';menuWrap.innerHTML=`<button type="button" class="tool-button" id="wide-advanced-button" title="More canvas tools" aria-label="More canvas tools" aria-expanded="false" aria-controls="wide-advanced-menu">⋯</button><div id="wide-advanced-menu" class="wide-menu" hidden><div class="wide-menu-title">CANVAS TOOLS</div><button data-forward="undo">↶ Undo</button><button data-forward="redo">↷ Redo</button><button data-forward="auto-layout">▦ Arrange automatically</button><button data-forward="zoom-reset">◉ Reset zoom to 100%</button><button data-forward="btn-debug">◇ Logic walkthrough</button></div>`;
  $('#btn-focus').insertAdjacentElement('beforebegin',menuWrap);
  const menu=$('#wide-advanced-menu'),more=$('#wide-advanced-button');
  function closeMenu(){menu.hidden=true;more.setAttribute('aria-expanded','false')}
  more.addEventListener('click',e=>{e.stopPropagation();const open=menu.hidden;menu.hidden=!open;more.setAttribute('aria-expanded',String(open));});
  menu.addEventListener('click',e=>{const btn=e.target.closest('[data-forward]');if(!btn)return;closeMenu();$('#'+btn.dataset.forward)?.click();});
  function sync(){
    const wide=body.classList.contains('editor-wide');toggle.setAttribute('aria-pressed',String(wide));toggle.textContent=wide?'⤢ Wide editor':'⛶ Wide editor';
    if(wide){const panelOpen=(!body.classList.contains('library-hidden')||!body.classList.contains('inspector-hidden'))&&!body.classList.contains('focus-mode');scrim.classList.toggle('visible',panelOpen)}
    closeMenu();
  }
  function setWide(isWide,{initial=false}={}){
    if(isWide){
      if(!initial){original.library=body.classList.contains('library-hidden');original.inspector=body.classList.contains('inspector-hidden');}
      body.classList.add('editor-wide');
      if(!body.classList.contains('library-hidden'))left.click();
      if(!body.classList.contains('inspector-hidden'))right.click();
    }else{
      body.classList.remove('editor-wide');
      if(!initial){
        if(!original.library&&body.classList.contains('library-hidden'))left.click();
        if(!original.inspector&&body.classList.contains('inspector-hidden'))right.click();
      }
      scrim.classList.remove('visible');
    }
    store(isWide?'wide':'standard');sync();window.dispatchEvent(new Event('resize'));
  }
  toggle.addEventListener('click',()=>setWide(!body.classList.contains('editor-wide')));
  [left,right,$('#close-library'),$('#close-inspector'),$('#btn-focus'),scrim].filter(Boolean).forEach(el=>el.addEventListener('click',()=>queueMicrotask(sync)));
  // Selecting a node opens its drawer while leaving the visual workspace full-width.
  $('#node-layer')?.addEventListener('click',e=>{
    if(!body.classList.contains('editor-wide')||!body.classList.contains('inspector-hidden'))return;
    if(e.target.closest('[data-out],[data-in],[data-quick],[data-data-port],.quick-add'))return;
    if(e.target.closest('.canvas-node'))right.click();
  });
  // Clicking the canvas outside the side drawers closes temporary overlays.
  $('#canvas-viewport')?.addEventListener('pointerdown',e=>{
    if(body.classList.contains('editor-wide')&&e.target===e.currentTarget){
      if(!body.classList.contains('library-hidden'))left.click();
      if(!body.classList.contains('inspector-hidden'))right.click();
    }
  });
  document.addEventListener('pointerdown',e=>{if(!menu.hidden&&!e.target.closest('.wide-menu-wrap'))closeMenu()});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'){closeMenu();if(body.classList.contains('editor-wide')){if(!body.classList.contains('library-hidden'))left.click();if(!body.classList.contains('inspector-hidden'))right.click();}}
    if(e.key.toLowerCase()==='w'&&!e.repeat&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)&&!e.target.isContentEditable&&!$('.modal-backdrop:not(.hidden)')&&!$('.component-overlay:not([hidden])')){e.preventDefault();toggle.click();}
  });
  if(load()!=='standard')setWide(true,{initial:true});else sync();
  window.PyFlowWide={setWide,isWide:()=>body.classList.contains('editor-wide')};
})();
