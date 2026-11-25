/* PyFlow Studio v0.8 — evidence-based, per-action results from real Python traces.
   Pure analysis can also be unit tested without a browser. No simulated execution. */
(function(root){
'use strict';
const HELP={
 ZeroDivisionError:'A calculation tried to divide by zero. Check the divisor or add a condition that handles zero values.',
 NameError:'A value was used before Python knew its name. Check the connection from the block that creates this variable.',
 TypeError:'The operation received a value of an incompatible type. Review the input types and the connected data.',
 ValueError:'Python received a value in an unexpected format. Review the input and any conversion steps.',
 KeyError:'The requested dictionary key or table field was missing. Check the available data fields before accessing it.',
 IndexError:'The list position was outside the available items. Check the list length or loop limits.',
 FileNotFoundError:'The file path could not be found in the Python runtime. Check the path and whether the file is available.',
 ModuleNotFoundError:'A required Python package is missing. Browser Python supports fewer packages than a normal installation.',
 AttributeError:'The object does not have the requested attribute or method. Check the object and selected method.'
};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function valueType(x){
 const v=String(x??'').trim();
 if(v==='None')return 'empty';
 if(v==='True'||v==='False')return 'boolean';
 if(/^[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][-+]?\d+)?$/.test(v))return 'number';
 if(v.startsWith('[')&&v.endsWith(']'))return 'list';
 if(v.startsWith('{')&&v.endsWith('}'))return 'dictionary / set';
 if(v.startsWith('(')&&v.endsWith(')'))return 'tuple';
 if(v.startsWith("'")||v.startsWith('"'))return 'text';
 return 'Python value';
}
function shorter(x,n=64){let text=String(x??'');return text.length>n?text.slice(0,n-1)+'…':text;}
function cleanVars(variables){return variables&&typeof variables==='object'&&!Array.isArray(variables)?variables:{};}
function findAfter(events,index){const e=events[index];if(!e)return null;
 // A Python line trace records locals BEFORE the line. The next event in the same
 // frame supplies the best available evidence of the new values (best effort).
 // Limit to the next event; never claim a result that requires guessing ahead.
 const next=events[index+1];
 if(next&&next.function===e.function)return cleanVars(next.variables);
 return null;
}
function changes(before,after){if(!after)return [];return Object.entries(after).filter(([name,v])=>!Object.prototype.hasOwnProperty.call(before,name)||before[name]!==v).map(([name,value])=>({name,value,type:valueType(value)}));}
function analyze(project,recording,lineMap,portsApi){
 const events=Array.isArray(recording?.events)?recording.events:[], result=recording?.result||{},map=lineMap||{};
 const nodes=Array.isArray(project?.nodes)?project.nodes:[],reports={};
 for(const node of nodes)reports[node.id]={id:node.id,type:node.type,status:'not-run',first:-1,last:-1,events:0,inputs:[],outputs:[],lastVariables:{},changes:[],error:null};
 for(let i=0;i<events.length;i++){
  const ev=events[i],id=map[ev.line],item=reports[id];if(!item)continue;
  if(item.first<0)item.first=i;
  item.status='executed';item.events++;item.last=i;
  const before=cleanVars(ev.variables),after=findAfter(events,i);
  item.lastVariables=after||before;
  const delta=changes(before,after);
  for(const v of delta){const idx=item.changes.findIndex(x=>x.name===v.name);if(idx>=0)item.changes[idx]=v;else item.changes.push(v);}
  if(ev.event==='return'&&ev.return!==null&&ev.return!==undefined){item.returnValue=String(ev.return);}
 }
 const failure=result.error||null;let failingBlock=null;
 if(failure){failingBlock=map[failure.line]||null;
   if(failingBlock&&reports[failingBlock]){reports[failingBlock].status='error';reports[failingBlock].error={kind:String(failure.kind||'Python error'),message:String(failure.message||''),line:failure.line,help:HELP[failure.kind]||'Inspect this line and the inputs used by this action.'};}
 }
 for(const node of nodes){
  const item=reports[node.id];
  const incoming=(project.dataLinks||[]).filter(l=>l.to===node.id).map(l=>({name:l.output,input:l.input,source:l.from,value:item.lastVariables[l.output]}));
  item.inputs=incoming;
  const expected=portsApi?.outputs?portsApi.outputs(node,project):[];
  const named=expected.filter(x=>Object.prototype.hasOwnProperty.call(item.lastVariables,x.name)).map(x=>({name:x.name,value:item.lastVariables[x.name],type:valueType(item.lastVariables[x.name])}));
  item.outputs=named.length?named:item.changes.slice(-3);
 }
 const relevant=nodes.filter(n=>n.type!=='start');
 const executed=relevant.filter(n=>reports[n.id].status!=='not-run').length;
 return {reports,executed,total:relevant.length,error:failure,failingBlock,events:events.length,truncated:!!result.truncated,stdout:String(result.stdout||'')};
}
const api={analyze,valueType,HELP,shorter};
root.PyFlowInsightsCore=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof document==='undefined'||!root.PyFlowStudio)return;
const S=root.PyFlowStudio,T=()=>root.PyFlowTrace,P=()=>root.PyFlowPorts;
const layer=document.getElementById('node-layer'),panel=document.getElementById('runtime-debugger');
let cached=null,cacheKey=null;
function current(){
 const t=T()?.getState();if(!t||t.status!=='complete'||!t.result||!Array.isArray(t.events))return null;
 const project=S.getProject();
 if(JSON.stringify(project)!==t.projectSignature)return {stale:true,trace:t};
 const key=t.result;
 if(cacheKey!==key){cached=analyze(project,t,t.lineMap,P());cacheKey=key;}
 return {analysis:cached,trace:t};
}
function renderNodeReports(){
 const info=current();
 layer.querySelectorAll('.canvas-node').forEach(card=>{
  card.querySelector('.v8-node-summary')?.remove();card.classList.remove('v8-executed','v8-failed','v8-not-run');
  if(!info||info.stale||!info.analysis)return;
  const report=info.analysis.reports[card.dataset.node];if(!report||report.type==='start')return;
  const status=report.status,description=status==='executed'?'Executed':status==='error'?'Python error':'Not executed';
  const value=report.outputs[0];
  const valueText=value?`${value.name} = ${shorter(value.value,29)}`:status==='not-run'?'No trace events recorded':report.returnValue!==undefined?`Return: ${shorter(report.returnValue,28)}`:'View execution details';
  const display=status==='error'?'✕':status==='executed'?'✓':'—';
  card.classList.add(status==='error'?'v8-failed':status==='executed'?'v8-executed':'v8-not-run');
  card.insertAdjacentHTML('beforeend',`<button type="button" class="v8-node-summary ${status}" data-v8-inspect="${esc(report.id)}" title="${esc(description+' · '+valueText)}" aria-label="Inspect ${esc(description.toLowerCase())} action"><span class="v8-state-icon">${display}</span><span class="v8-node-result-text"><b>${esc(description)}</b><small>${esc(valueText)}</small></span><span class="v8-node-more">↗</span></button>`);
 });
}
function kv(items,empty){return items.length?items.slice(0,6).map(x=>`<div class="v8-kv"><span>${esc(x.name)} <em>${esc(x.type||valueType(x.value))}</em></span><code title="${esc(x.value)}">${esc(shorter(x.value,95))}</code></div>`).join(''):`<div class="v8-empty">${esc(empty)}</div>`;}
function renderInspector(){
 panel.querySelectorAll('.v8-insight-container').forEach(el=>el.remove());
 const info=current();if(!info)return;
 const target=panel.querySelector('.v7-current-node')||panel.querySelector('.v7-stage');if(!target)return;
 let html='';
 if(info.stale){html='<div class="v8-stale">This execution belongs to an earlier version of the workflow. Run Python again to update block results.</div>';}
 else{
  const a=info.analysis,t=info.trace,event=t.events[t.position],nodeId=t.lineMap?.[event?.line],report=a.reports[nodeId];
  html=`<div class="v8-trace-header"><span class="v8-trace-overview">${a.executed} / ${a.total} actions executed</span><span>${a.error?'Python stopped with an error':a.truncated?'Trace event limit reached':'Recorded execution'}</span></div>`;
  if(report){
   html+=`<div class="v8-insight-heading"><b>Block data preview</b><span>${esc(report.status)}</span></div>`;
   html+='<div class="v8-section-title">Connected inputs</div>';
   html+=kv(report.inputs.map(x=>({name:x.name,value:x.value??'(value not in this snapshot)',type:x.value===undefined?'not available':valueType(x.value)})),'No explicit purple data inputs on this block.');
   html+='<div class="v8-section-title">Produced / changed values</div>';
   html+=kv(report.outputs,'No changed value was captured for this block.');
  }
  if(a.error){
   const reportError=a.failingBlock?a.reports[a.failingBlock]?.error:null;
   const hint=reportError?.help||HELP[a.error.kind]||'Inspect the error message and the values used by the failing line.';
   html+=`<div class="v8-error-advice"><b>How to investigate ${esc(a.error.kind||'the error')}</b><p>${esc(hint)}</p>${a.failingBlock?`<button data-v8-inspect="${esc(a.failingBlock)}">Inspect failing block →</button>`:''}</div>`;
  }
 }
 target.insertAdjacentHTML('afterend',`<section class="v8-insight-container">${html}</section>`);
}
function sync(){renderNodeReports();renderInspector();}
function inspect(id){const info=current();if(!info||info.stale||!info.analysis)return;
 const report=info.analysis.reports[id];if(!report)return;T().open();if(report.last>=0)T().move(report.last);
 else{const pane=document.querySelector('#runtime-debugger');pane.querySelector('.v8-empty-block')?.remove();pane.querySelector('.v8-trace-header')?.insertAdjacentHTML('afterend',`<p class="v8-empty-block">This action did not execute in this run. It may be on an unselected branch or disconnected from Start.</p>`);}
}
layer.addEventListener('click',e=>{const btn=e.target.closest('[data-v8-inspect]');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();inspect(btn.dataset.v8Inspect);},true);
panel.addEventListener('click',e=>{const b=e.target.closest('.v8-error-advice [data-v8-inspect]');if(!b)return;inspect(b.dataset.v8Inspect);});
root.PyFlowInsights={sync,inspect,current,decorateNodes:renderNodeReports,renderInspector};
// The initial canvas is rendered before this script is loaded.
sync();
})(typeof globalThis!=='undefined'?globalThis:this);
