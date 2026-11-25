/* v0.11 — full-width editor extensions: available-value browser and workflow outline.
   Explicit user actions are the only way to create links or move cards. */
(() => {
'use strict';
const S=window.PyFlowStudio,E=window.PyFlowEngine,B=window.PyFlowBindings,P=window.PyFlowPorts,I=window.PyFlowIntelligence;
if(!S||!E||!B||!P||!I)return;
const $=s=>document.querySelector(s), escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toolbar=$('#v10-help')?.parentElement;
if(toolbar){const button=document.createElement('button');button.type='button';button.id='v11-open';button.className='v11-toolbar-button';button.innerHTML='◈ <span>Data & Map</span>';button.title='Discover available values and navigate large workflows';toolbar.append(button);button.addEventListener('click',()=>open('values'));}
const overlay=document.createElement('div');overlay.className='v11-overlay';overlay.id='v11-overlay';overlay.hidden=true;
overlay.innerHTML=`<div class="v11-backdrop" data-v11-close></div><section class="v11-panel" role="dialog" aria-modal="true" aria-labelledby="v11-title"><header class="v11-head"><div><span class="v11-eyebrow">VISUAL PYTHON WORKSPACE</span><h2 id="v11-title">Explore your project</h2><p>Find information and connect steps without writing expressions.</p></div><button class="v11-close" id="v11-close" aria-label="Close Data and Map">×</button></header><nav class="v11-tabs" role="tablist"><button class="active" data-v11-tab="values" role="tab" aria-selected="true">◈ Available values</button><button data-v11-tab="outline" role="tab" aria-selected="false">☷ Workflow outline</button></nav><div class="v11-body" id="v11-body"></div><footer class="v11-foot"><span>Changes to connections and layout are reversible with Undo.</span><button id="v11-done">Done</button></footer></section>`;
document.body.append(overlay);
let mode='values',targetId=null,inputKey='',source=null,term='',outlineTerm='',focusReturn=null;
function selectedProject(){return S.getProject()}
function selectedNode(project){return project.nodes.find(n=>n.id===targetId)}
function close(){if(overlay.hidden)return;overlay.hidden=true;focusReturn?.focus?.();}
function open(m='values',target=null){
  focusReturn=document.activeElement;mode=m;
  const p=selectedProject();targetId=(target&&p.nodes.some(n=>n.id===target))?target:((S.selected()&&p.nodes.some(n=>n.id===S.selected()))?S.selected():p.nodes.find(n=>n.type!=='start')?.id);
  inputKey='';source=null;term='';outlineTerm='';overlay.hidden=false;render();
}
function ensureTarget(project){if(!selectedNode(project))targetId=project.nodes.find(n=>n.type!=='start')?.id||project.nodes[0]?.id||null;}
function render(){overlay.querySelectorAll('[data-v11-tab]').forEach(b=>{const active=b.dataset.v11Tab===mode;b.classList.toggle('active',active);b.setAttribute('aria-selected',String(active));});$('#v11-title').textContent=mode==='values'?'Use data from earlier steps':'Your workflow at a glance';mode==='values'?renderValues():renderOutline();}
function typeDot(type){const t=String(type||'any').toLowerCase();return t==='number'||t==='integer'?'number':t==='text'?'text':t==='list'?'list':t==='boolean'?'boolean':t==='object'?'object':'any';}
function renderValues(){
 const project=selectedProject();ensureTarget(project);const report=I.inspect(project,E,B,P,targetId);
 const fieldInput=report.inputs.find(x=>x.key===inputKey);if(!fieldInput)inputKey=report.inputs[0]?.key||'';
 const expected=report.inputs.find(x=>x.key===inputKey)?.type||'any';
 const available=report.values.filter(v=>(`${v.name} ${v.origin} ${v.type}`).toLowerCase().includes(term.toLowerCase()));
 const picked=available.find(v=>source?.nodeId===v.nodeId&&source?.name===v.name);
 const wired=report.links.find(x=>x.input===inputKey);
 const choices=project.nodes.filter(n=>n.type!=='start').map(n=>`<option value="${escape(n.id)}" ${n.id===targetId?'selected':''}>${escape(E.byId[n.type]?.title||n.type)} · ${escape((n.params?.name||n.params?.result||'step').slice(0,40))}</option>`).join('');
 const valueHTML=available.map(v=>{
   const match=I.compatible(v.type,expected),selected=picked?.nodeId===v.nodeId&&picked?.name===v.name;
   return `<button class="v11-value ${selected?'chosen':''}" type="button" data-v11-source="${escape(v.nodeId)}" data-v11-output="${escape(v.name)}" aria-pressed="${selected}" title="${escape(v.origin)} produced this value"><span class="v11-type ${typeDot(v.type)}">${escape((v.type||'any').slice(0,2))}</span><span class="v11-value-main"><strong>${escape(v.name)}</strong><small>From ${escape(v.origin)} · ${escape(v.type)} · ${v.dist} step${v.dist===1?'':'s'} back</small></span>${match?'<span class="v11-match">✓ Fits</span>':'<span class="v11-mismatch">Review type</span>'}</button>`;
 }).join('')||`<div class="v11-empty">${report.values.length?'No values match this search.':'No values available yet. Connect an earlier action that produces a value.'}</div>`;
 $('#v11-body').innerHTML=`<section class="v11-context"><div><span class="v11-kicker">1 · SELECT AN ACTION TO RECEIVE DATA</span><label class="v11-label" for="v11-target">Receiving action</label><select id="v11-target">${choices}</select></div><p>Only values produced by earlier <b>connected</b> actions are shown. A data wire transfers a value; a gray arrow defines execution order.</p></section><div class="v11-columns"><section class="v11-list"><div class="v11-list-top"><div><span class="v11-kicker">2 · CHOOSE A VALUE</span><h3>Available from earlier steps <span>${report.values.length}</span></h3></div><input id="v11-search" placeholder="Search name, type or action" autocomplete="off" value="${escape(term)}" aria-label="Find available values"></div><div class="v11-values" id="v11-values">${valueHTML}</div></section><section class="v11-connect"><span class="v11-kicker">3 · CONNECT IT TO AN INPUT</span><h3>Where should this value go?</h3>${report.inputs.length?`<label class="v11-label" for="v11-input">Target input</label><select id="v11-input">${report.inputs.map(i=>`<option value="${escape(i.key)}" ${i.key===inputKey?'selected':''}>${escape(i.label)} (${escape(i.type||'any')})</option>`).join('')}</select><div class="v11-current">${wired?`<span>Currently linked</span><strong>${escape(wired.output)}</strong>`:'<span>Not connected</span><strong>Choose a source value</strong>'}</div><div class="v11-source-preview">${picked?`<span class="v11-type ${typeDot(picked.type)}">${escape(picked.type.slice(0,2))}</span><div><b>${escape(picked.name)}</b><small>${escape(picked.type)} from ${escape(picked.origin)}</small></div>`:'<p>Select a value on the left to preview the connection.</p>'}</div><p class="v11-validation">${picked&&!I.compatible(picked.type,expected)?'⚠ Types differ. The connection is allowed, but Python might need a conversion.': '✓ Python will use the saved value when this block runs.'}</p><button id="v11-connect" ${picked?'':'disabled'}>⑂ Connect selected value</button>${wired?'<button id="v11-unlink" class="v11-unlink">Remove existing connection</button>':''}`:`<div class="v11-empty">This action has no visual data inputs. Choose another action, or configure its fields in Properties.</div>`}<div class="v11-tips"><b>How it works</b><p>First connect actions with gray execution arrows. Then choose their saved outputs here. PyFlow generates the Python reference automatically.</p></div></section></div>`;
}
function renderOutline(){
 const p=selectedProject(),info=I.outline(p,E);
 const filtered=part=>part.filter(n=>`${n.label} ${n.via} ${n.type}`.toLowerCase().includes(outlineTerm.toLowerCase()));
 const rows=items=>items.map((n,i)=>`<button class="v11-outline-item" data-v11-jump="${escape(n.id)}" type="button"><span class="v11-order">${i+1}</span><span class="v11-outline-text"><strong>${escape(n.label)}</strong><small>${escape(n.via==='start'?'Entry point':n.via==='next'?'Next step':n.via==='yes'?'Yes branch':n.via==='no'?'No branch':n.via==='body'?'Loop body':n.via==='error'?'Error branch':'Not connected')} · ${n.inputs} in · ${n.outputs} out</small></span><span class="v11-outline-arrow">Go ↗</span></button>`).join('');
 $('#v11-body').innerHTML=`<div class="v11-outline-summary"><div><strong>${info.total}</strong><span>Python actions</span></div><div><strong>${info.links}</strong><span>Execution links</span></div><div><strong>${info.values}</strong><span>Data links</span></div><div><strong>${info.detached.length}</strong><span>Disconnected</span></div></div><div class="v11-outline-bar"><label for="v11-outline-search">Find an action</label><input id="v11-outline-search" autocomplete="off" placeholder="Search steps, names or branches" value="${escape(outlineTerm)}"><button id="v11-arrange" title="Move cards into execution columns without changing program logic">▦ Organize visual layout</button><button id="v11-fit">⛶ Fit all</button></div><div class="v11-outline-sections"><section><h3>Execution path <span>${info.connected.length}</span></h3><div>${rows(filtered(info.connected))||'<div class="v11-empty">No matching actions</div>'}</div></section><section><h3>Not connected to Start <span>${info.detached.length}</span></h3><div>${rows(filtered(info.detached))||'<div class="v11-empty">No detached actions match your search.</div>'}</div></section></div><p class="v11-outline-footnote">Organize changes card positions only. Program logic, data connections and saved values stay unchanged, and the change can be undone.</p>`;
}
function connect(){
 const p=selectedProject(),val=I.inspect(p,E,B,P,targetId),picked=val.values.find(v=>v.nodeId===source?.nodeId&&v.name===source?.name);
 if(!picked||!inputKey){S.toast('Choose a value and a target input first.');return;}
 const link={from:picked.nodeId,output:picked.name,to:targetId,input:inputKey};const review=P.validate(p,link);
 if(!review.ok){S.toast(review.reason);return;}
 S.update(project=>{P.connect(project,link)});
 S.toast(review.warnings?.length?'Data linked. Review the type warning.':'Value connected. Python code updated.');
 source={nodeId:picked.nodeId,name:picked.name};renderValues();
}
function jump(id){close();if(window.PyFlowNavigation?.jumpTo){window.PyFlowNavigation.jumpTo(id,{edit:true})}else S.showNode(id);}
$('#v11-close').addEventListener('click',close);$('#v11-done').addEventListener('click',close);
overlay.addEventListener('click',e=>{
 if(e.target.matches('[data-v11-close]')){close();return;}
 const tab=e.target.closest('[data-v11-tab]');if(tab){mode=tab.dataset.v11Tab;render();return;}
 const val=e.target.closest('[data-v11-source]');if(val){source={nodeId:val.dataset.v11Source,name:val.dataset.v11Output};renderValues();return;}
 if(e.target.closest('#v11-connect')){connect();return;}
 if(e.target.closest('#v11-unlink')){S.update(p=>P.disconnect(p,targetId,inputKey));source=null;renderValues();S.toast('Data link removed');return;}
 const step=e.target.closest('[data-v11-jump]');if(step){jump(step.dataset.v11Jump);return;}
 if(e.target.closest('#v11-arrange')){const p=S.getProject(),positions=I.arranged(p,E);S.update(proj=>proj.nodes.forEach(n=>{if(positions[n.id])Object.assign(n,positions[n.id]);}));close();$('#fit-workflow')?.click();S.toast('Visual layout organized. Use Undo to restore previous positions.');return;}
 if(e.target.closest('#v11-fit')){close();$('#fit-workflow')?.click();return;}
});
overlay.addEventListener('change',e=>{
 if(e.target.id==='v11-target'){targetId=e.target.value;inputKey='';source=null;term='';renderValues();}
 if(e.target.id==='v11-input'){inputKey=e.target.value;source=null;renderValues();}
});
overlay.addEventListener('input',e=>{
 if(e.target.id==='v11-search'){const pos=e.target.selectionStart;term=e.target.value;renderValues();const el=$('#v11-search');el.focus();el.setSelectionRange(pos,pos);}
 if(e.target.id==='v11-outline-search'){const pos=e.target.selectionStart;outlineTerm=e.target.value;renderOutline();const el=$('#v11-outline-search');el.focus();el.setSelectionRange(pos,pos);}
});
document.addEventListener('keydown',e=>{if(overlay.hidden)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();}},true);
// Show value discovery where the user configures an individual block, without changing existing node forms.
const inspector=$('#inspector-body');function inject(){if(!inspector||inspector.querySelector('.v11-inspector-action'))return;const project=selectedProject(),node=project.nodes.find(n=>n.id===S.selected());if(!node||!P.inputs(node,project).length)return;const wrap=document.createElement('div');wrap.className='v11-inspector-action';wrap.innerHTML='<span>◈ Visual data mapping</span><button type="button" id="v11-from-inspector">Browse available values ↗</button>';inspector.insertAdjacentElement('afterbegin',wrap);}
if(inspector){const observer=new MutationObserver(inject);observer.observe(inspector,{childList:true,subtree:false});inject();inspector.addEventListener('click',e=>{if(e.target.closest('#v11-from-inspector'))open('values',S.selected());});}
window.PyFlowWorkspace={open,close,inspect:()=>I.inspect(selectedProject(),E,B,P,targetId),outline:()=>I.outline(selectedProject(),E)};
})();
