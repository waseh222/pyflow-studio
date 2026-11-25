/* PyFlow v0.13: accessible guided action forms and safe reusable-section review.
   Rendered in existing Data & Map overlay; no permanent canvas rail. */
(()=>{
'use strict';
const S=window.PyFlowStudio,E=window.PyFlowEngine,B=window.PyFlowBindings,P=window.PyFlowPorts,I=window.PyFlowIntelligence,G=window.PyFlowGuidedV013;
const overlay=document.getElementById('v11-overlay');
if(!S||!E||!B||!P||!I||!G||!overlay)return;
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tabs=$('.v11-tabs',overlay),body=$('#v11-body',overlay),head=$('#v11-title',overlay);
tabs.insertAdjacentHTML('beforeend','<button type="button" data-v13-tab="guided" role="tab" aria-selected="false">✦ Guided setup</button>');
let active=false,id='',form=null,notice='';
const project=()=>S.getProject();
const supported=()=>project().nodes.filter(n=>G.ACTIONS.includes(n.type));
const options=(items,current)=>items.map(o=>`<option value="${esc(o.value)}" ${String(o.value)===String(current)?'selected':''}>${esc(o.label)}</option>`).join('');
function values(){if(!id)return [];return I.inspect(project(),E,B,P,id).values||[];}
const findValue=(str,vs)=>vs.some(v=>v.name===str);
function infer(raw,vs){const str=String(raw??'');if(findValue(str,vs))return {mode:'variable',value:str};if(G.literalNum(str)!==null)return {mode:'number',value:str};if(str==='True'||str==='False')return {mode:'boolean',value:str==='True'?'true':'false'};if(/^(["']).*\1$/.test(str))return {mode:'text',value:str.slice(1,-1)};return {mode:'variable',value:vs[0]?.name||''};}
function setup(n){const vs=values(),p=n.params||{};
 const wired=(key)=>{const link=(project().dataLinks||[]).find(e=>e.to===n.id&&e.input===key);return link&&findValue(link.output,vs)?link.output:null;};
 if(['math','if','assert'].includes(n.type))return {name:p.name||'result',operator:p.operator||'+',left:infer(wired('left')||p.left,vs),right:infer(wired('right')||p.right,vs),message:p.message||'Validation failed'};
 if(n.type==='print')return {mode:wired('value')?'variable':(p.mode==='Text'?'text':'variable'),text:p.mode==='Text'?p.value||'':'',source:wired('value')||(findValue(p.value,vs)?p.value:vs[0]?.name||'')};
 if(n.type==='for')return {item:p.item||'item',source:wired('source')||(findValue(p.source,vs)?p.source:vs[0]?.name||'')};
 return {name:p.name||'sorted_items',source:wired('value')||(findValue(p.value,vs)?p.value:vs[0]?.name||''),reverse:!!p.reverse};
}
function chooseNode(next){id=next;form=setup(project().nodes.find(n=>n.id===id));notice='';render();}
function field(label,markup,help=''){return `<label class="v13-field"><span>${esc(label)}</span>${markup}${help?`<small>${esc(help)}</small>`:''}</label>`;}
function selectField(key,vals,value,help='',labelText=key){return field(labelText,`<select data-v13-prop="${esc(key)}">${options(vals,value)}</select>`,help);}
function valueEditor(name,title,expected='number'){
 const val=form[name]||{mode:'variable',value:''},vs=values();
 const choices=vs.map(v=>({value:v.name,label:`${v.name} · ${v.type} · ${v.origin}`}));
 const mode=[{value:'variable',label:'Saved value from earlier step'},{value:'number',label:'Number'},{value:'text',label:'Text'},{value:'boolean',label:'True / False'}];
 const control=val.mode==='variable'?`<select data-v13-val="${name}" ${!choices.length?'disabled':''}><option value="">${choices.length?'Choose a connected value':'No upstream values yet'}</option>${options(choices,val.value)}</select>`:
 val.mode==='boolean'?`<select data-v13-val="${name}">${options([{value:'true',label:'True'},{value:'false',label:'False'}],val.value)}</select>`:
 `<input data-v13-val="${name}" type="${val.mode==='number'?'text':'text'}" value="${esc(val.value)}" placeholder="${val.mode==='number'?'e.g. 25':'Enter text'}" autocomplete="off">`;
 return `<div class="v13-operand"><strong>${esc(title)}</strong><div class="v13-value-grid"><select data-v13-mode="${name}">${options(mode,val.mode)}</select>${control}</div>${val.mode==='variable'?'<small>Only earlier connected steps are available, to avoid undefined variables.</small>':''}</div>`;
}
function actionsFor(n){const kind=n.type;
 const c=kind==='math'?`<div class="v13-two">${valueEditor('left','First value')}${valueEditor('right','Second value')}</div>${selectField('operator',[{value:'+',label:'Add (+)'},{value:'-',label:'Subtract (−)'},{value:'*',label:'Multiply (×)'},{value:'/',label:'Divide (÷)'},{value:'//',label:'Whole-number division (//)'},{value:'%',label:'Remainder (%)'},{value:'**',label:'Power (**)'}],form.operator)}${field('Save result as',`<input data-v13-prop="name" value="${esc(form.name)}">`,'Use a new variable name. It becomes available to following steps.')}`:
 ['if','assert'].includes(kind)?`<div class="v13-two">${valueEditor('left','Check this value')}${valueEditor('right','Against this value')}</div>${selectField('operator',G.OPS_COMPARE.map(x=>({value:x,label:({'>':'Greater than','<':'Less than','==':'Equal to','!=':'Not equal to','>=':'At least','<=':'At most'})[x]||x})),form.operator)}${kind==='assert'?field('Message if check fails',`<input data-v13-prop="message" value="${esc(form.message)}">`):'<p class="v13-note">Connect Yes and No output arrows on this action to define both outcomes.</p>'}`:
 kind==='print'?`${selectField('mode', [{value:'text',label:'A message that I type'},{value:'variable',label:'A saved result'}],form.mode,'','What should be displayed?')}${form.mode==='text'?field('Message',`<textarea data-v13-prop="text" rows="3">${esc(form.text)}</textarea>`):selectField('source',values().map(v=>({value:v.name,label:`${v.name} · ${v.type}`})),form.source,'','Saved result')}`:
 kind==='for'?`${field('Call each item',`<input data-v13-prop="item" value="${esc(form.item)}">`,'For example, item or row')}${selectField('source',values().map(v=>({value:v.name,label:`${v.name} · ${v.type}`})),form.source,'','Loop through this saved collection')}<p class="v13-note">Connect a Body output to actions that should repeat, and Next to actions that follow the loop.</p>`:
 `${field('Save sorted result as',`<input data-v13-prop="name" value="${esc(form.name)}">`)}${selectField('source',values().map(v=>({value:v.name,label:`${v.name} · ${v.type}`})),form.source,'','Sort this saved collection')}${field('Order',`<select data-v13-prop="reverse">${options([{value:'false',label:'Ascending · A to Z / low to high'},{value:'true',label:'Descending · Z to A / high to low'}],String(form.reverse))}</select>`)}`;
 return c;
}
function currentPlan(){return G.plan(project(),id,form,values(),P);}
function refreshPreview(){const r=currentPlan(),preview=$('#v13-preview',body),warning=$('#v13-message',body),apply=$('#v13-apply',body);if(!preview||!warning||!apply)return;
 preview.textContent=r.ok?r.preview:'Complete the highlighted fields to preview the resulting Python.';
 warning.textContent=r.ok?(r.warnings.length?'Check: '+r.warnings.join(' '):'✓ Valid action setup. Python will be updated only when you apply.'):r.reason;
 warning.classList.toggle('v13-warn',!r.ok||r.warnings?.length>0);
 apply.disabled=!r.ok;
}
function render(){if(!active)return;const targets=supported();if(!targets.some(n=>n.id===id))id=targets[0]?.id||'';
 if(!form&&id)form=setup(targets.find(n=>n.id===id));
 const node=targets.find(n=>n.id===id),available=values();
 const nodeList=targets.map(n=>({value:n.id,label:`${E.byId[n.type].title} · ${n.params?.name||n.params?.result||n.type}`}));
 body.innerHTML=`<div class="v13-hero"><span class="v13-kicker">VISUAL ACTION SETUP</span><h3>Configure Python with simple choices</h3><p>Choose saved values, numbers, or words. Every setting generates real Python code; no expressions need to be typed here.</p></div>${node?`<div class="v13-main"><section class="v13-card"><div class="v13-step">01 · PICK THE ACTION</div>${field('Action on your canvas',`<select id="v13-action">${options(nodeList,id)}</select>`)}<div class="v13-step">02 · CHOOSE WHAT IT DOES</div>${actionsFor(node)}</section><section class="v13-card v13-result"><div class="v13-step">03 · REVIEW YOUR RESULT</div><span class="v13-label">GENERATED PYTHON PREVIEW</span><pre id="v13-preview"></pre><p id="v13-message" role="status"></p><button class="v12-primary" id="v13-apply">✓ Apply to this action</button><p class="v13-note">The editor saves changes and supports Undo. Choose other Python actions from the Actions library.</p><div class="v13-available"><b>Available earlier values</b><span>${esc(available.map(v=>`${v.name} (${v.type})`).join(' · ')||'Connect an earlier action to use its values.')}</span></div></section></div>`:`<div class="v13-empty">Create a Calculate, If / Else, Display output, For each, Sort, or Assert action first.</div>`}<div class="v13-foot">Guided support is available for six commonly used actions in this release. More advanced actions retain their existing settings.</div>`;
 if(node)refreshPreview();
}
function open(){active=true;notice='';
 head.textContent='Configure an action without code';$('.v11-head p',overlay).textContent='Visual controls for common Python operations, with safe value pickers and real code previews.';
 tabs.querySelectorAll('button').forEach(b=>{const on=!!b.dataset.v13Tab;b.classList.toggle('active',on);b.setAttribute('aria-selected',on?'true':'false')});
 const selected=S.selected();id=supported().some(n=>n.id===selected)?selected:supported()[0]?.id||'';form=id?setup(project().nodes.find(n=>n.id===id)):null;render();
}
// capture-phase listeners avoid interference with previous versions' tab handling.
overlay.addEventListener('click',e=>{const tab=e.target.closest('[data-v13-tab]');if(tab){e.preventDefault();e.stopImmediatePropagation();open();return;}
 if(e.target.closest('[data-v11-tab],[data-v12-tab]')){active=false;tabs.querySelectorAll('[data-v13-tab]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-selected','false')});}
 const detail=e.target.closest('[data-v13-preview]');if(detail){e.preventDefault();const sec=(project().reusableSections||[]).find(x=>x.id===detail.dataset.v13Preview),after=$('#v12-after',overlay)?.value;return previewSection(sec,after);}
 const rename=e.target.closest('[data-v13-rename]');if(rename){e.preventDefault();const sec=(project().reusableSections||[]).find(x=>x.id===rename.dataset.v13Rename);if(!sec)return;const next=prompt('Rename reusable section',sec.name);if(next===null)return;const pre=G.renameSection(project(),sec.id,next);if(!pre.ok){S.toast(pre.reason);return;}S.update(p=>G.renameSection(p,sec.id,next));$('#v11-body [data-v12-insert]')&&overlay.querySelector('[data-v12-tab="sections"]')?.click();return;}
 const dup=e.target.closest('[data-v13-copy]');if(dup){e.preventDefault();const source=dup.dataset.v13Copy;let outcome;S.update(p=>{outcome=G.duplicateSection(p,source,E)});if(outcome?.ok){overlay.querySelector('[data-v12-tab="sections"]')?.click();S.toast('Reusable section duplicated. Undo can reverse this.');}return;}
},true);
function previewSection(section,after){const out=$('.v12-content',body);if(!out)return;const review=G.sectionAudit(project(),section,after,E,P);
 $('.v13-review',out)?.remove();
 const card=document.createElement('section');card.className='v13-review';
 card.innerHTML=`<div class="v13-review-head"><strong>${esc(section?.name||'Section preview')}</strong><button class="v13-close-review" aria-label="Close preview">×</button></div><p>${review.actions.length} actions · ${(section?.dataLinks||[]).length} internal data wires. This is a preview only.</p>${review.actions.map((a,i)=>`<div class="v13-review-step"><span>${i+1}</span><b>${esc(a.label)}</b><small>${esc(a.detail)}</small></div>`).join('')}${[...review.errors,...review.warnings].map(w=>`<p class="v13-conflict">⚠ ${esc(w)}</p>`).join('')||'<p class="v13-success">✓ No output-name conflicts detected for this insertion point.</p>'}<small>Reusing a name may overwrite data. This section is not renamed automatically, so review its variable names before running.</small>`;
 out.prepend(card);card.querySelector('button').onclick=()=>card.remove();card.scrollIntoView({block:'nearest',behavior:'instant'});
}
// Decorate existing saved-section cards when v0.12 renders them. Do not replace their handlers.
let busy=false;
new MutationObserver(()=>{if(busy)return;const cards=body.querySelectorAll('.v12-saved');for(const card of cards){if(card.querySelector('.v13-card-controls'))continue;const id=card.querySelector('[data-v12-insert]')?.dataset.v12Insert;if(!id)continue;
 busy=true;const extra=document.createElement('div');extra.className='v13-card-controls';extra.innerHTML=`<button type="button" data-v13-preview="${esc(id)}" title="Review sequence and output-name risks">Preview</button><button type="button" data-v13-rename="${esc(id)}" title="Change section name">Rename</button><button type="button" data-v13-copy="${esc(id)}" title="Duplicate section">Copy</button>`;card.append(extra);busy=false;}}).observe(body,{childList:true,subtree:true});
overlay.addEventListener('change',e=>{if(!active)return;const t=e.target;
 if(t.matches('[data-v13-prop]')){const key=t.dataset.v13Prop;if(key==='source')form.source=t.value;else if(key==='reverse')form.reverse=t.value==='true';else form[key]=t.value;if(key==='mode')render();else refreshPreview();}
 if(t.matches('[data-v13-mode]')){const which=t.dataset.v13Mode,mode=t.value;form[which]={mode,value:mode==='variable'?values()[0]?.name||'':mode==='number'?'0':mode==='boolean'?'true':''};render();}
 if(t.matches('[data-v13-val]')){form[t.dataset.v13Val].value=t.value;refreshPreview();}
 if(t.id==='v13-action')chooseNode(t.value);
},true);
overlay.addEventListener('input',e=>{if(!active)return;const t=e.target;if(t.matches('input[data-v13-prop],textarea[data-v13-prop]')){form[t.dataset.v13Prop]=t.value;refreshPreview();}if(t.matches('input[data-v13-val]')){form[t.dataset.v13Val].value=t.value;refreshPreview();}},true);
overlay.addEventListener('click',e=>{if(!active||!e.target.closest('#v13-apply'))return;const q=currentPlan();if(!q.ok){refreshPreview();return;}const list=values();
 S.update(p=>{const n=p.nodes.find(n=>n.id===id);if(!n)return;n.params=q.params;
 const bindings=[];
 if(['math','if','assert'].includes(n.type))bindings.push(['left',form.left],['right',form.right]);
 if(n.type==='print')bindings.push(['value',form.mode==='variable'?{mode:'variable',value:form.source}:null]);
 if(n.type==='for')bindings.push(['source',{mode:'variable',value:form.source}]);
 if(n.type==='sort')bindings.push(['value',{mode:'variable',value:form.source}]);
 for(const [key,val] of bindings){P.disconnect(p,n.id,key);if(val?.mode==='variable'){
  const src=list.find(v=>v.name===val.value);if(src)P.connect(p,{from:src.nodeId,output:src.name,to:n.id,input:key});
 }}
 });notice='';render();S.toast('Guided settings applied. Undo is available.');});
window.PyFlowGuidedStudio={open:()=>{document.getElementById('v11-open')?.click();open();},preview:(sec,after)=>G.sectionAudit(project(),sec,after,E,P)};
// A contextual shortcut in the existing Properties drawer, never a permanent canvas rail.
const inspector=document.getElementById('inspector-body');
if(inspector){
 let inspecting=false;
 const decorateInspector=()=>{
  if(inspecting||inspector.querySelector('#v13-inspector-launch'))return;
  const n=project().nodes.find(x=>x.id===S.selected());
  if(!n||!G.ACTIONS.includes(n.type))return;
  inspecting=true;
  const button=document.createElement('button');button.id='v13-inspector-launch';button.type='button';
  button.className='v13-inspector-launch';button.textContent='✦ Configure with guided choices';
  button.title='Open the no-code action wizard with typed value pickers';
  button.onclick=()=>window.PyFlowGuidedStudio.open();
  inspector.prepend(button);inspecting=false;
 };
 new MutationObserver(decorateInspector).observe(inspector,{childList:true});
 decorateInspector();
}

})();
