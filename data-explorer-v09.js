/* PyFlow v0.9 - Evidence-based structured value explorer and guided error navigation. */
(function(root){
'use strict';
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function csvEscape(value){
  const raw=String(value??'');
  // Prevent spreadsheet formula interpretation if the user opens an exported sample.
  const safe=/^[\s]*[=+@-]/.test(raw)?"'"+raw:raw;
  return '"'+safe.replace(/"/g,'""')+'"';
}
function sampleCsv(data,rows){
  if(data?.kind!=='table'||!Array.isArray(data.columns))return '';
  const all=[data.columns,...(rows||data.rows||[])];
  return all.map(row=>row.map(csvEscape).join(',')).join('\r\n')+'\r\n';
}
function sampleMatches(row,text){return row.some(x=>String(x??'').toLowerCase().includes(text.toLowerCase()));}
function getActionPlan(kind){
 const plans={
  ZeroDivisionError:{title:'Check the divisor',steps:['Open the failing calculation action.','Inspect the number or variable used on the right side of ÷.','Ensure the divisor cannot be zero; add a condition before dividing.']},
  NameError:{title:'Connect the missing value',steps:['Open the failing action and check the variable name.','Find the earlier action that creates that variable.','Connect its data output to the input, or select a valid saved value.']},
  TypeError:{title:'Check the data types',steps:['Inspect the action input and its source data preview.','Confirm that the operation receives compatible types (for example, numbers for maths).','Add a conversion action if the source is text or another type.']},
  ValueError:{title:'Check the input format',steps:['Inspect the value entering the failing action.','Check whether it matches the required number, date, or data format.','Add a validation or conversion action before this step.']},
  IndexError:{title:'Check the list position',steps:['Open the failing list operation.','View the list preview and its recorded length.','Use a valid index or check the list length before reading an item.']},
  KeyError:{title:'Check the available fields',steps:['Inspect the dictionary or table preview.','Check the exact spelling and capitalization of the requested key.','Select a field that exists or add a default/fallback branch.']},
  FileNotFoundError:{title:'Check the input file',steps:['Open the file-reading action and review its path.','Confirm the file exists in the runtime where Python executes.','When running in a browser, use a supported upload instead of a PC-only path.']},
  ModuleNotFoundError:{title:'Review Python dependencies',steps:['Inspect which package the workflow requires.','Check if browser Python supports that package.','For unsupported modules, export and run Python locally with the necessary package installed.']}
 };
 return plans[String(kind)]||{title:'Inspect the failing action',steps:['Open the action settings and review its inputs.','Check captured values and the failing Python line.','Update the workflow, then run a new trace to verify the change.']};
}
const core={csvEscape,sampleCsv,sampleMatches,getActionPlan};
root.PyFlowDataExplorerCore=core;
if(typeof module!=='undefined'&&module.exports)module.exports=core;
if(typeof document==='undefined'||!root.PyFlowStudio||!root.PyFlowInsights)return;
const S=root.PyFlowStudio,Trace=()=>root.PyFlowTrace,Insights=()=>root.PyFlowInsights;
const inspector=document.getElementById('runtime-debugger'),canvas=document.getElementById('node-layer');
const portal=document.createElement('div');
portal.id='v9-explorer';portal.className='v9-explorer';portal.hidden=true;
portal.innerHTML='<div class="v9-shade" data-v9-action="close"></div><div class="v9-sheet" role="dialog" aria-modal="true" aria-labelledby="v9-explorer-title"><div class="v9-top"><div><div class="v9-eyebrow">PYFLOW DATA EXPLORER</div><h2 id="v9-explorer-title">Captured data</h2><p id="v9-explorer-subtitle"></p></div><button data-v9-action="close" class="v9-close" aria-label="Close data explorer">×</button></div><div class="v9-toolbar"><label class="v9-search">⌕ <input id="v9-filter" placeholder="Search previewed values" aria-label="Search recorded data"></label><button class="v9-export" data-v9-action="export">⇩ Export visible sample</button></div><div id="v9-preview"></div><div class="v9-foot">The preview contains only values recorded during the selected Python run. Samples are limited for performance, and are not the complete dataset.</div></div>';
document.body.append(portal);
const lookup={name:'',data:null,id:null,query:'',previousFocus:null};
const owner=()=>{
 const info=Insights()?.current();
 return info&&!info.stale&&info.analysis?info:null;
};
function locate(nodeId){
 const info=owner();if(!info)return null;
 const report=info.analysis.reports[nodeId];if(!report)return null;
 const index=report.last;
 if(index<0)return null;
 const events=info.trace.events;
 const before=events[index]||{};
 const next=events[index+1];
 const after=next?.function===before.function?next:null;
 const structured={...(before.structured||{}),...(after?.structured||{})};
 // Show declared results first, but retain other values available at the recorded step.
 const preferred=(report.outputs||[]).map(x=>x.name);
 return {report,structured, names:Object.keys(structured).sort((a,b)=>(preferred.includes(b)?1:0)-(preferred.includes(a)?1:0)||a.localeCompare(b))};
}
function rowsShown(){
 const data=lookup.data;
 const q=lookup.query.toLowerCase().trim();
 if(!data||data.kind!=='table')return [];
 return q?data.rows.filter(row=>sampleMatches(row,q)):data.rows;
}
function renderPreview(){
 const data=lookup.data;if(!data)return;
 const holder=document.getElementById('v9-preview');
 if(data.kind==='table'){
  const visible=rowsShown(),cells=data.columns.length;
  const table=`<table class="v9-table"><thead><tr><th>#</th>${data.columns.map(x=>`<th>${escapeHtml(x)}</th>`).join('')}</tr></thead><tbody>${visible.map((row,i)=>`<tr><td class="v9-rownum">${i+1}</td>${Array.from({length:cells},(_,c)=>`<td title="${escapeHtml(row[c])}">${escapeHtml(row[c])}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const notice=`Showing ${visible.length} recorded row${visible.length===1?'':'s'} of ${data.totalRows??data.rows.length} total row${data.totalRows===1?'':'s'}`+(data.truncated?' · preview truncated':'');
  holder.innerHTML=`<div class="v9-sample-info"><span>▦ ${escapeHtml(data.type||'table')}</span><span>${escapeHtml(notice)}</span></div><div class="v9-tablewrap">${visible.length?table:'<p class="v9-empty">No matching rows in the recorded sample.</p>'}</div>`;
 }else{
  holder.innerHTML=`<div class="v9-sample-info"><span>${escapeHtml(data.type)}</span><span>Recorded value</span></div><div class="v9-value">${escapeHtml(data.value)}</div>`;
 }
}
function open(nodeId,name){
 const target=locate(nodeId);const data=target?.structured?.[name];
 if(!data)return false;
 lookup.id=nodeId;lookup.name=name;lookup.data=data;lookup.query='';lookup.previousFocus=document.activeElement;
 portal.hidden=false;document.body.classList.add('v9-data-open');
 document.getElementById('v9-explorer-title').textContent=name;
 document.getElementById('v9-explorer-subtitle').textContent=`${data.type||'Python value'} · captured from a real Python execution`;
 document.getElementById('v9-filter').value='';
 document.getElementById('v9-filter').disabled=data.kind!=='table';
 portal.querySelector('.v9-export').disabled=data.kind!=='table';
 renderPreview();portal.querySelector('.v9-close').focus();
 return true;
}
function close(){portal.hidden=true;document.body.classList.remove('v9-data-open');lookup.id=null;lookup.data=null;lookup.previousFocus?.focus?.();}
function exportCsv(){if(!lookup.data||lookup.data.kind!=='table')return;
 const contents='\ufeff'+sampleCsv(lookup.data,rowsShown());
 const url=URL.createObjectURL(new Blob([contents],{type:'text/csv;charset=utf-8'}));
 const link=document.createElement('a');link.href=url;link.download='pyflow-'+lookup.name.replace(/[^a-zA-Z0-9_-]/g,'_')+'-recorded-sample.csv';
 document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),300);
}
portal.addEventListener('click',e=>{
 const action=e.target.closest('[data-v9-action]')?.dataset.v9Action;
 if(action==='close')close();else if(action==='export')exportCsv();
});
portal.querySelector('#v9-filter').addEventListener('input',e=>{lookup.query=e.target.value;renderPreview();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!portal.hidden){e.stopImmediatePropagation();e.preventDefault();close();}},true);
function decorateNodes(){
 canvas.querySelectorAll('.v9-canvas-browse').forEach(x=>x.remove());
 const info=owner();if(!info){if(!portal.hidden)close();return;}
 for(const node of canvas.querySelectorAll('.canvas-node')){
  const data=locate(node.dataset.node);if(!data)continue;
  const first=data.names.find(n=>data.structured[n]?.kind==='table');if(!first)continue;
  const item=data.structured[first];
  const b=document.createElement('button');b.type='button';b.className='v9-canvas-browse';
  b.dataset.v9Node=node.dataset.node;b.dataset.v9Name=first;
  b.textContent=`▦ Browse ${first} · ${item.totalRows??'?'} rows`;
  node.append(b);
 }
}
function sync(){
 inspector.querySelectorAll('.v9-inspector-items,.v9-guided-plan').forEach(x=>x.remove());
 const info=owner();if(!info){if(!portal.hidden)close();decorateNodes();return;}
 const trace=info.trace,e=trace.events[trace.position],nodeId=e?.line!=null?trace.lineMap?.[e.line]:null;
 const target=nodeId?locate(nodeId):null;
 const below=inspector.querySelector('.v8-insight-container');
 if(below&&target?.names.length){
  const section=document.createElement('section');section.className='v9-inspector-items';
  section.innerHTML=`<div class="v9-panel-title">▦ Structured data <small>From recorded Python values</small></div><div class="v9-values">${target.names.map(name=>{
   const item=target.structured[name],size=item.kind==='table'?`${item.totalRows} rows`:'value';
   return `<button type="button" data-v9-node="${escapeHtml(nodeId)}" data-v9-name="${escapeHtml(name)}"><b>${escapeHtml(name)}</b><span>${escapeHtml(item.type||'value')} · ${escapeHtml(size)}</span><strong>View ↗</strong></button>`;
  }).join('')}</div>`;
  below.insertAdjacentElement('afterend',section);
 }
 if(info.analysis.error){
  const kind=info.analysis.error.kind||'PythonError',plan=getActionPlan(kind);
  const block=info.analysis.failingBlock;
  const section=document.createElement('section');section.className='v9-guided-plan';
  section.innerHTML=`<div class="v9-plan-tag">GUIDED ERROR REVIEW</div><h4>${escapeHtml(plan.title)}</h4><ol>${plan.steps.map(t=>`<li>${escapeHtml(t)}</li>`).join('')}</ol>${block?`<button type="button" data-v9-settings="${escapeHtml(block)}">Open failing action settings ↗</button>`:''}<p>This guidance does not change or run your program automatically.</p>`;
  (below||inspector.querySelector('.v7-stage'))?.insertAdjacentElement('afterend',section);
 }
 decorateNodes();
}
inspector.addEventListener('click',e=>{
 const browse=e.target.closest('[data-v9-node][data-v9-name]');
 if(browse){open(browse.dataset.v9Node,browse.dataset.v9Name);return;}
 const edit=e.target.closest('[data-v9-settings]');if(edit){
  const id=edit.dataset.v9Settings;
  S.showNode(id);
  Trace()?.close?.();
  if(document.body.classList.contains('inspector-hidden'))document.getElementById('toggle-inspector')?.click();
 }
});
canvas.addEventListener('click',e=>{
 const b=e.target.closest('.v9-canvas-browse');if(!b)return;e.stopImmediatePropagation();e.preventDefault();open(b.dataset.v9Node,b.dataset.v9Name);
},true);
root.PyFlowDataExplorer={open,close,sync,decorateNodes,locate,getState:()=>({open:!portal.hidden,name:lookup.name,data:lookup.data,query:lookup.query})};
})(typeof globalThis!=="undefined"?globalThis:this);
