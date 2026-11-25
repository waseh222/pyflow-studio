/* PyFlow v0.7 — real Python trace replay. Recorded execution is complete before replay. */
(()=>{
'use strict';
const S=window.PyFlowStudio,E=window.PyFlowEngine;
if(!S||!E)return;
const $=s=>document.querySelector(s);
const pane=$('#runtime-debugger');
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={open:false,busy:false,worker:null,workerURL:null,timeout:null,runToken:0,events:[],position:0,source:'',lines:[],lineMap:{},result:null,status:'idle',message:'Run supported Python and inspect what really happened.',projectSignature:null};
const UNSUPPORTED={input:'Interactive keyboard input',request:'External network requests',web_scrape:'Web scraping',flask_app:'Web servers',flask_route:'Web servers',flask_start:'Web servers',await:'Async runtime tasks'};
function listReachable(project){
 const start=(project.nodes||[]).find(n=>n.type==='start')||project.nodes[0];
 if(!start)return [];
 const ids=new Set(),q=[start.id];
 while(q.length){const id=q.shift();if(ids.has(id))continue;ids.add(id);(project.edges||[]).filter(e=>e.from===id).forEach(e=>q.push(e.to));}
 return project.nodes.filter(n=>ids.has(n.id));
}
function preflight(project){
 const errors=[],warn=[],code=E.compile(project);
 if(!code.code?.trim())errors.push('The program is empty. Add a Start and at least one action.');
 if(code.warnings?.length)warn.push(...code.warnings.slice(0,6));
 const types=[...new Set(listReachable(project).filter(n=>UNSUPPORTED[n.type]).map(n=>UNSUPPORTED[n.type]))];
 if(types.length)errors.push('Run & Inspect cannot trace workflows using '+types.join(', ')+'. Use Export Python for these actions.');
 const packages=(code.requirements||[]).filter(p=>['flask','requests','beautifulsoup4'].includes(p));
 if(packages.length)errors.push('This workflow requires server or network packages: '+packages.join(', ')+'.');
 if((project.nodes||[]).length>300)errors.push('The workflow is too large for browser tracing.');
 return {errors,warn,compiled:code};
}
function buildLineMap(code){
 const rows=String(code).split('\n'),map={},ids=new Set(S.getProject().nodes.map(n=>n.id));
 let active=null;
 rows.forEach((row,index)=>{
  const mark=row.match(/^\s*# PYFLOW_NODE:(\w[\w-]*)/);
  if(mark){active=ids.has(mark[1])?mark[1]:null;return;}
  if(/^\s*# Reusable components/.test(row))active=null;
  map[index+1]=active;
 });
 return map;
}
function current(){return state.events[state.position]||null;}
function highlighted(){
 const item=current(),nodeId=item?state.lineMap[item.line]:null;
 document.querySelectorAll('.canvas-node').forEach(el=>el.classList.toggle('v7-trace-active',state.open&&el.dataset.node===nodeId));
 if(nodeId){const el=[...document.querySelectorAll('.canvas-node')].find(x=>x.dataset.node===nodeId),viewport=$('#canvas-viewport');if(el&&viewport){const zoom=(Number($('#zoom-val').textContent.replace('%',''))||100)/100;viewport.scrollTo({left:Math.max(0,el.offsetLeft*zoom-viewport.clientWidth*.38),top:Math.max(0,el.offsetTop*zoom-viewport.clientHeight*.40),behavior:'smooth'});}}
}
function stageMessage(){
 if(state.busy)return `Python is busy: ${state.message}`;
 if(state.status==='complete')return state.result?.error?'Python ran and reported an error. Inspect the failing line below.':'Python execution completed. These are recorded Python events.';
 if(state.status==='failed')return state.message;
 return 'Run a supported workflow to record real Python lines and variable snapshots.';
}
function render(){
 if(!state.open){pane.hidden=true;highlighted();return;}pane.hidden=false;
 const event=current(),count=state.events.length,nodeId=event?state.lineMap[event.line]:null,node=S.getProject().nodes.find(n=>n.id===nodeId),nodeTitle=node?(E.byId[node.type]?.title||node.type):'Python helper / import',idx=state.position;
 const pretty=(event?.variables&&Object.entries(event.variables))||[];
 const startLine=event?Math.max(1,event.line-3):1,finishLine=event?Math.min(state.lines.length,event.line+3):Math.min(state.lines.length,7);
 const sourceLines=state.lines.slice(startLine-1,finishLine).map((line,i)=>{const num=i+startLine;return `<div class="v7-code-line ${num===event?.line?'current':''}"><span>${num}</span><code>${escapeHtml(line)||' '}</code></div>`}).join('');
 const details=state.result||{};
 const error=details.error?`<div class="v7-trace-error"><b>${escapeHtml(details.error.kind)}${details.error.line?' · line '+details.error.line:''}</b><span>${escapeHtml(details.error.message)}</span></div>`:'';
 const output=String(details.stdout||'').trim();
 pane.innerHTML=`<div class="v7-pane-head"><div><span class="v7-kicker">PYTHON EXECUTION INSPECTOR</span><h3>Run & Inspect <span class="v7-beta">Beta</span></h3></div><button class="v7-icon-btn" data-v7-action="close" aria-label="Close execution inspector">×</button></div>
 <p class="v7-trace-intro">Runs generated Python in an isolated browser worker, then replays its <b>recorded execution</b>. This is not live pause-and-resume debugging or a security sandbox.</p>
 <div class="v7-run-row"><button class="v7-primary" data-v7-action="run" ${state.busy?'disabled':''}>${state.busy?'◷ Recording…':'▶ Run Python & trace'}</button><button class="v7-secondary" data-v7-action="stop" ${state.busy?'':'disabled'}>■ Stop</button></div>
 <div class="v7-stage ${state.status==='failed'?'failed':state.status==='complete'?'done':''}" role="status">${escapeHtml(stageMessage())}</div>
 ${state.status==='complete'?`<div class="v7-summary"><span><b>${count}</b> recorded events${details.truncated?' (limited)':''}</span><span>${details.error?'⚠ Python error':'✓ Python finished'}</span></div>`:''}
 ${count?`<div class="v7-step-nav"><button data-v7-action="first" ${idx<=0?'disabled':''} aria-label="First recorded event">⇤</button><button data-v7-action="prev" ${idx<=0?'disabled':''}>← Back</button><div class="v7-step-index">Event <b>${idx+1}</b> / ${count}</div><button data-v7-action="next" ${idx>=count-1?'disabled':''}>Forward →</button><button data-v7-action="last" ${idx>=count-1?'disabled':''} aria-label="Last recorded event">⇥</button></div>
 <input type="range" class="v7-trace-slider" aria-label="Recorded event" min="0" max="${Math.max(0,count-1)}" value="${idx}" data-v7-scrub>
 <div class="v7-current-node"><span>VISUAL STEP</span><strong>${escapeHtml(nodeTitle)}</strong><small>Python line ${event.line} · ${escapeHtml(event.function)} · ${escapeHtml(event.event)}</small></div>
 <div class="v7-data-label">Variables at this moment <span>(${pretty.length})</span></div>
 <div class="v7-var-list">${pretty.length?pretty.map(([name,value])=>`<div class="v7-var"><span>${escapeHtml(name)}</span><code>${escapeHtml(value)}</code></div>`).join(''):'<p>No user variables on this event.</p>'}</div>
 ${event.return!=null?`<div class="v7-return"><b>Return</b> ${escapeHtml(event.return)}</div>`:''}
 <div class="v7-data-label">Executed source</div><div class="v7-code-preview">${sourceLines}</div>`:''}
 ${error}<div class="v7-data-label">Program output</div><pre class="v7-console">${escapeHtml(output||'No printed output yet.')}</pre>
 ${details.stderr?`<div class="v7-data-label">Stderr</div><pre class="v7-console">${escapeHtml(details.stderr)}</pre>`:''}
 <p class="v7-footer-note">First use downloads Python (Pyodide). Execution is time-limited and can be stopped. The generated Python may still need local Python for unsupported packages.</p>`;
 highlighted();
 window.PyFlowInsights?.sync?.();
 window.PyFlowDataExplorer?.sync?.();
}
function cleanup(){if(state.timeout){clearTimeout(state.timeout);state.timeout=null;}if(state.worker){state.worker.terminate();state.worker=null;}if(state.workerURL){URL.revokeObjectURL(state.workerURL);state.workerURL=null;}state.busy=false;}
function cancel(){state.runToken++;cleanup();state.status='failed';state.message='Stopped by user. No trace was saved from this incomplete run.';render();}
function run(){
 if(state.busy)return;
 const assessment=preflight(S.getProject());
 if(assessment.errors.length){state.status='failed';state.message=assessment.errors.join(' ');state.events=[];state.result=null;render();return;}
 if(typeof Worker==='undefined'||!window.PyFlowTraceWorkerSource){state.status='failed';state.message='This browser cannot start the Python trace worker. Use Export Python instead.';render();return;}
 cleanup();state.events=[];state.result=null;state.projectSignature=JSON.stringify(S.getProject());state.source=assessment.compiled.code;state.lines=state.source.split('\n');state.lineMap=buildLineMap(state.source);
 state.status='loading';state.message='Starting separate Python worker…';state.busy=true;const token=++state.runToken;render();
 try{
  state.workerURL=URL.createObjectURL(new Blob([window.PyFlowTraceWorkerSource],{type:'text/javascript'}));
  state.worker=new Worker(state.workerURL);
  const fail=(msg)=>{if(state.runToken!==token)return;cleanup();state.status='failed';state.message=msg;render();};
  state.timeout=setTimeout(()=>fail('Python runtime could not start within 60 seconds. Check your connection, or export the program.'),60000);
  state.worker.onmessage=e=>{
   if(state.runToken!==token)return;
   const data=e.data||{};
   if(data.kind==='stage'){
    state.message=data.message||'Preparing Python…';state.status=data.stage||'loading';
    if(data.stage==='executing'){clearTimeout(state.timeout);state.timeout=setTimeout(()=>fail('Python execution exceeded the 20-second limit and was stopped. Check for long loops.'),20000);}
    render();
   }else if(data.kind==='complete'){
    cleanup();state.result=data.result||{};state.events=Array.isArray(state.result.events)?state.result.events:[];state.position=0;state.status='complete';state.message='Completed';render();
   }else if(data.kind==='error')fail('Python runtime error: '+String(data.message||'unknown error'));
  };
  state.worker.onerror=e=>fail('Python worker failed to start. Browser restrictions or connectivity may be blocking it. '+String(e.message||''));
  state.worker.postMessage({code:state.source});
 }catch(error){cleanup();state.status='failed';state.message='Could not start browser Python: '+String(error.message||error);render();}
}
function open(){state.open=true;render();}
function close(){state.open=false;if(state.busy)cancel();render();}
function move(n){if(!state.events.length)return;state.position=Math.max(0,Math.min(state.events.length-1,n));render();}
pane.addEventListener('click',e=>{const b=e.target.closest('[data-v7-action]');if(!b)return;
 const action=b.dataset.v7Action;
 if(action==='close')close();else if(action==='run')run();else if(action==='stop')cancel();
 else if(action==='next')move(state.position+1);else if(action==='prev')move(state.position-1);else if(action==='first')move(0);else if(action==='last')move(state.events.length-1);
});
pane.addEventListener('input',e=>{if(e.target.matches('[data-v7-scrub]'))move(Number(e.target.value));});
$('#btn-trace').addEventListener('click',open);
$('#btn-mobile-trace').addEventListener('click',open);
window.addEventListener('keydown',e=>{if(!state.open)return;if(e.key==='Escape'){close();return;}const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||'');if(!typing&&e.altKey&&e.key==='ArrowRight'){e.preventDefault();move(state.position+1);}if(!typing&&e.altKey&&e.key==='ArrowLeft'){e.preventDefault();move(state.position-1);}},true);
window.PyFlowTrace={open,close,run,cancel,preflight,buildLineMap,move,getState:()=>({open:state.open,busy:state.busy,status:state.status,events:state.events.slice(),position:state.position,result:state.result,message:state.message,projectSignature:state.projectSignature,source:state.source,lineMap:{...state.lineMap}}),refreshHighlight:highlighted};
})();
