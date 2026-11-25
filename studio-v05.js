/* v0.5 - Guided Data Mapping inspector. No Python expression entry required. */
(()=>{
'use strict';
const S=window.PyFlowStudio,E=window.PyFlowEngine,B=window.PyFlowBindings;
if(!S||!E||!B)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const types={number:'Number',integer:'Whole number',text:'Text',boolean:'True or false',list:'List of text',any:'Empty / none'};
const typeLabel=t=>types[t]||t;
const option=(value,label,selected)=>`<option value="${esc(value)}" ${selected===value?'selected':''}>${esc(label)}</option>`;
function control(node,proj){
 const p=node.params||{},modules=proj.visualModules||[];
 const functions=modules.filter(x=>x.kind==='function'),classes=modules.filter(x=>x.kind==='class');
 const objects=B.upstream(proj,node.id).map(x=>x.node).filter(x=>x.type==='object'&&classes.some(m=>m.name===x.params.class));
 const chosenObject=objects.find(x=>x.params.name===p.object),objClass=classes.find(x=>x.name===chosenObject?.params.class);
 const methods=objClass?.methods||[];
 const label=node.type==='call'?'Run a saved function':node.type==='object'?'Create an object':'Run an object method';
 let selects='';
 if(node.type==='call')selects=`<label class="v5-control"><span>Function to run</span><select data-v5-key="name" aria-label="Function to run">${option('','Choose a function',p.name)}${functions.map(x=>option(x.name,x.name,p.name)).join('')}</select></label>`;
 if(node.type==='object')selects=`<label class="v5-control"><span>Class to create</span><select data-v5-key="class" aria-label="Class to create">${option('','Choose a saved class',p.class)}${classes.map(x=>option(x.name,x.name,p.class)).join('')}</select></label>`;
 if(node.type==='method')selects=`<label class="v5-control"><span>Object from a previous step</span><select data-v5-key="object" aria-label="Object from a previous step">${option('','Choose a connected object',p.object)}${objects.map(x=>option(x.params.name,`${x.params.name} · ${x.params.class}`,p.object)).join('')}</select></label><label class="v5-control"><span>Method to run</span><select data-v5-key="method" aria-label="Method to run">${option('','Choose a method',p.method)}${methods.map(x=>option(x.name,x.name,p.method)).join('')}</select></label>`;
 const sig=B.signature(node,proj),guided=p.bindingMode==='guided',rv=B.resolve(proj,node),vars=rv.vars;
 const preview=node.type==='call'?`${p.result||'result'} = ${p.name||'function'}(${rv.args})`:node.type==='method'?`${p.result||'result'} = ${p.object||'object'}.${p.method||'method'}(${rv.args})`:`${p.name||'object'} = ${p.class||'Class'}()`;
 const parms=sig?.parameters||[];
 const oldNotice=!guided && node.type!=='object'?`<div class="v5-migrate"><b>This step uses advanced arguments from an earlier project.</b><p>Switch to guided inputs to configure it with menus instead. Existing arguments will be replaced; other settings stay intact.</p><button type="button" class="v5-secondary" data-v5-action="enable">✦ Switch to guided inputs</button></div>`:'';
 const missing=!sig?`<div class="v5-message warn">${node.type==='method'?'Choose an object and its saved method. The object must be connected before this step.':'Choose or create a saved '+(node.type==='object'?'class':'function')+'.'} <button type="button" class="v5-inline" data-v5-action="studio">Open Component Studio ↗</button></div>`:'';
 const inputCards=guided&&sig&&node.type!=='object'?(parms.length?parms.map((param,i)=>{
   const b=(p.bindings||[]).find(x=>x.name===param.name)||B.defaultBinding(param);const isVar=b.source==='variable';
   const matching=vars.filter(x=>!x.type||param.type==='any'||x.type===param.type||(param.type==='number'&&x.type==='integer')||x.type==='any');
   const varsHTML=vars.map(x=>option(x.name,`${x.name} · ${typeLabel(x.type)} · previous ${x.origin} step`,b.variable)).join('');
   const literalInput=b.type==='boolean'?`<select data-v5-value="${esc(param.name)}" aria-label="Value for ${esc(param.name)}">${option('False','False',b.value)}${option('True','True',b.value)}</select>`:`<input data-v5-value="${esc(param.name)}" aria-label="Value for ${esc(param.name)}" ${['number','integer'].includes(b.type)?'inputmode="decimal"':''} value="${esc(b.value)}" placeholder="${b.type==='list'?'e.g. red, blue, green':b.type==='text'?'Enter words':'Enter a value'}">`;
   return `<div class="v5-binding-card" data-v5-param="${esc(param.name)}"><div class="v5-binding-header"><span class="v5-binding-index">${i+1}</span><div><b>${esc(param.name)}</b><small>Expected: ${esc(typeLabel(param.type||'any'))}</small></div><span class="v5-required">INPUT</span></div><label class="v5-control"><span>Where should this input come from?</span><select data-v5-source="${esc(param.name)}" aria-label="Source for ${esc(param.name)}">${option('literal','Enter a value',b.source)}${option('variable','Use saved workflow data',b.source)}</select></label>${isVar?`<label class="v5-control"><span>Choose data from a connected earlier step</span><select data-v5-var="${esc(param.name)}" aria-label="Variable for ${esc(param.name)}">${option('','Choose a saved value',b.variable)}${varsHTML}</select></label>${!vars.length?`<div class="v5-message warn">No upstream values yet. Create a variable before this step and connect it.</div>`:`<div class="v5-help">${matching.length} matching saved value(s) available.</div>`}`:`<div class="v5-const-row"><label class="v5-control"><span>Value type</span><select data-v5-type="${esc(param.name)}" aria-label="Type for ${esc(param.name)}">${Object.entries(types).map(([k,v])=>option(k,v,b.type)).join('')}</select></label><label class="v5-control"><span>Value</span>${literalInput}</label></div>`}</div>`;
 }).join(''):'<div class="v5-message">No inputs needed. You can connect this action directly.</div>'):'';
 const wrong=rv.warnings.length?`<div class="v5-message warn">${rv.warnings.map(esc).join('<br>')}</div>`:'';
 const resultField=node.type==='object'?`<label class="v5-control"><span>Save the object as</span><input data-v5-key="name" aria-label="Object variable name" value="${esc(p.name||'')}" placeholder="invoice"></label>`:`<label class="v5-control"><span>Save the result as</span><input data-v5-key="result" aria-label="Save result as" value="${esc(p.result||'')}" placeholder="e.g. final_total"></label>`;
 const review=!guided&&node.type!=='object'?'Choose guided mode to see the generated call preview.':preview;
 const usable=guided&&sig&&node.type!=='object';
 return `<div class="v5-inspector"><div class="v5-intro"><span class="v5-icon">⬡</span><div><span class="v5-eyebrow">VISUAL COMPONENT STEP</span><h2>${label}</h2><p>Connect information to reusable Python logic, without writing a line of Python.</p></div></div>
 <div class="v5-section"><div class="v5-section-top"><b><i>1</i> Choose what to run</b></div>${selects}${!functions.length&&!classes.length?'<div class="v5-message">Build a function or class first using the Component Studio.</div>':''}${missing}</div>
 ${oldNotice}${guided&&sig&&node.type!=='object'?`<div class="v5-section"><div class="v5-section-top"><b><i>2</i> Connect the inputs</b><button class="v5-inline" data-v5-action="auto">Match saved values</button></div><p class="v5-section-caption">For every input, choose an earlier workflow value or enter a number, text, or other value.</p>${inputCards}<button class="v5-secondary" data-v5-action="reset">↺ Reset to examples</button></div>`:''}
 <div class="v5-section"><div class="v5-section-top"><b><i>${usable?3:2}</i> Name the output</b></div>${resultField}<div class="v5-help">This name becomes a saved value that later actions can use.</div></div>
 <div class="v5-preview"><div class="v5-preview-head"><b>What Python will do</b><span>Generated automatically</span></div><code>${esc(review)}</code>${wrong}<div class="v5-preview-caption">Project remains editable visually; export generates real Python.</div></div>
 <div class="v5-section"><div class="v5-section-top"><b>Continue your workflow</b></div><button class="v5-secondary" data-inspector-quick="next">＋ Add the next step</button><button class="v5-secondary" data-v5-action="studio">⬡ Edit saved functions & classes</button><div class="v5-actions"><button class="v5-secondary" id="duplicate-node">Duplicate</button><button class="v5-secondary danger" id="delete-node">Delete step</button></div></div></div>`;
}
function renderInspector(project,node,wrap){if(!['call','method','object'].includes(node.type))return false;
 const mods=project.visualModules||[];
 if(!mods.length&&node.params?.bindingMode!=='guided')return false;
 wrap.innerHTML=control(node,project);return true;
}
function mutate(id,fn){S.update(p=>{const n=p.nodes.find(n=>n.id===id);if(n){n.params=n.params||{};fn(n.params,p,n);}});}
function getSelected(){return S.selected();}
function setParam(name,update){mutate(getSelected(),(p,proj,node)=>{
 const sig=B.signature(node,proj);if(!sig)return;
 const spec=(sig.parameters||[]).find(x=>x.name===name);if(!spec)return;
 p.bindings=Array.isArray(p.bindings)?p.bindings:[];
 let b=p.bindings.find(x=>x.name===name);if(!b){b=B.defaultBinding(spec);p.bindings.push(b);}
 update(b,spec,proj,node);
 });}
const body=document.querySelector('#inspector-body');
body.addEventListener('change',e=>{
 const t=e.target, id=getSelected();if(!id)return;
 if(t.matches('[data-v5-key]')){const key=t.dataset.v5Key;mutate(id,(p,proj,node)=>{
  p[key]=t.value;
  if(['name','class','object','method'].includes(key) && key!=='name' || (node.type==='call'&&key==='name'))p.bindings=[];
 });}
 if(t.matches('[data-v5-source]'))setParam(t.dataset.v5Source,(b,spec,proj,node)=>{b.source=t.value;if(t.value==='variable'){const vars=B.available(proj,node.id);b.variable=vars.find(x=>x.name===spec.name)?.name||vars[0]?.name||'';}});
 if(t.matches('[data-v5-var]'))setParam(t.dataset.v5Var,b=>{b.variable=t.value;b.source='variable'});
 if(t.matches('[data-v5-type]'))setParam(t.dataset.v5Type,b=>{b.type=t.value;b.source='literal';b.value=B.defaultValue(t.value)});
 if(t.matches('[data-v5-value]'))setParam(t.dataset.v5Value,b=>{b.value=t.value;b.source='literal'});
});
body.addEventListener('click',e=>{
 const target=e.target.closest('[data-v5-action]');if(!target)return;
 const action=target.dataset.v5Action,id=getSelected();
 if(action==='studio'){window.PyFlowComponentStudio?.open();return;}
 if(action==='enable')mutate(id,(p,proj,node)=>{p.bindingMode='guided';const sig=B.signature(node,proj);p.bindings=(sig?.parameters||[]).map(B.defaultBinding);});
 if(action==='reset')mutate(id,(p,proj,node)=>{const sig=B.signature(node,proj);p.bindings=(sig?.parameters||[]).map(B.defaultBinding);});
 if(action==='auto')mutate(id,(p,proj,node)=>{const sig=B.signature(node,proj);const vars=B.available(proj,node.id);
  p.bindings=(sig?.parameters||[]).map(par=>{const b=(p.bindings||[]).find(x=>x.name===par.name)||B.defaultBinding(par);const v=vars.find(x=>x.name===par.name);return v?{...b,source:'variable',variable:v.name}:b;});
 });
});
window.PyFlowDataFlow={renderInspector};
})();
