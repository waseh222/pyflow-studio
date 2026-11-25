/* v0.6: guided, non-executing logic walkthrough. Never claims to run Python. */
(()=>{
'use strict';
const S=window.PyFlowStudio,E=window.PyFlowEngine,P=window.PyFlowPorts;
if(!S||!E||!P)return;
const $=selector=>document.querySelector(selector),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pane=$('#logic-walkthrough');
const state={open:false,history:[],index:0};
function current(){return state.history[state.index];}
function nodeFor(id){return S.getProject().nodes.find(n=>n.id===id);}
function outlets(id){return (S.getProject().edges||[]).filter(e=>e.from===id);}
function byPort(id,port){return outlets(id).find(e=>e.port===port)?.to||null;}
function scrollToCurrent(){
 const el=[...document.querySelectorAll('.canvas-node')].find(n=>n.dataset.node===current()?.id),viewport=$('#canvas-viewport');if(!el||!viewport)return;
 const zoom=(Number($('#zoom-val')?.textContent.replace('%',''))||100)/100;
 viewport.scrollTo({left:Math.max(0,el.offsetLeft*zoom-viewport.clientWidth*.32),top:Math.max(0,el.offsetTop*zoom-viewport.clientHeight*.37),behavior:'smooth'});
}
function refreshHighlight(){
 document.querySelectorAll('.canvas-node').forEach(el=>el.classList.toggle('v6-debug-active',state.open&&el.dataset.node===current()?.id));
}
function reset(){
 const nodes=S.getProject().nodes,start=nodes.find(n=>n.type==='start')||nodes[0];
 state.history=start?[{id:start.id,context:[],path:'Starting point'}]:[];state.index=0;
}
function advance(port){
 const s=current();if(!s)return;const node=nodeFor(s.id);if(!node)return reset();
 const outgoing=outlets(node.id),hasChoices=['if','for','while','try'].includes(node.type);
 let chosen=port;
 if(hasChoices&&!chosen){showMessage('Choose which path to explore. This preview does not calculate conditions.');return;}
 if(!chosen)chosen='next';
 let next=outgoing.find(e=>e.port===chosen)?.to||null,continuations=[...(s.context||[])];
 if(['for','while','try'].includes(node.type)&&['body','error'].includes(chosen)){
   const after=byPort(node.id,'next');if(after)continuations.push(after);
 }
 if(!next&&continuations.length)next=continuations.pop();
 if(!next){showMessage('End of this visual path. Choose an earlier step or restart.');return;}
 if(state.history.length>100){showMessage('Walkthrough limited to 100 transitions; restart to inspect a new path.');return;}
 const pathLabel=({yes:'Yes path',no:'No path',body:'Loop / try body',error:'Error path',next:'Next action'})[chosen]||'Next action';
 state.history=state.history.slice(0,state.index+1);
 state.history.push({id:next,context:continuations,path:pathLabel});state.index++;
 draw();scrollToCurrent();
}
function showMessage(message){const el=pane.querySelector('.v6-debug-feedback');if(el){el.textContent=message;el.hidden=false;}}
function codePreview(n){
 try{
  const source=P.preparedProject(S.getProject()).project;
  const configured=source.nodes.find(x=>x.id===n.id)||n;
  const s=E.makeNode('start',0,0),c=JSON.parse(JSON.stringify(configured));
  if(c.params?.bindingMode==='guided'){c.params.args=window.PyFlowBindings.resolve(source,configured).args;delete c.params.bindingMode;}
  const mini={id:'walkthrough',name:'Current action',nodes:[s,c],edges:[{from:s.id,to:c.id,port:'next'}],visualModules:S.getProject().visualModules||[]};
  const code=E.compile(mini).code;
  return code.split('# Program starts here').pop().split('\n').map(x=>x.trimEnd()).filter(Boolean).slice(0,6).join('\n')||'# Generated on export';
 }catch{return '# Preview unavailable for this action';}
}
function draw(){
 const s=current(),n=s&&nodeFor(s.id),proj=S.getProject();if(!state.open||!n){close();return;}
 const def=E.byId[n.type]||{title:n.type,icon:'◈',summary:'Visual operation'};
 const params=Object.entries(n.params||{}).filter(([k,v])=>v!==''&&v!=null&&typeof v!=='object').slice(0,6);
 const incoming=(proj.dataLinks||[]).filter(l=>l.to===n.id);
 const possible=outlets(n.id),choose=['if','for','while','try'].includes(n.type);
 let decision='';
 if(choose){const labels={yes:'Explore Yes',no:'Explore No',body:'Explore body',error:'Explore error',next:'After this step'};
  decision=`<div class="v6-path-choices">${possible.map(edge=>`<button data-v6-path="${esc(edge.port)}" class="v6-choice">${esc(labels[edge.port]||edge.port)}</button>`).join('')}</div>`;
 }
 pane.innerHTML=`<div class="v6-debug-top"><div><span class="v6-debug-eyebrow">GUIDED DEBUGGING</span><h3>Logic walkthrough</h3></div><button class="v6-debug-close" data-v6-debug-action="close" aria-label="Close walkthrough">×</button></div>
 <p class="v6-debug-disclaimer"><b>Preview only.</b> Follow your workflow step by step. Python is <b>not executed</b>, and conditions are chosen manually.</p>
 <div class="v6-debug-progress"><span>Step ${state.index+1} of ${state.history.length}</span><span>${esc(s.path)}</span></div>
 <div class="v6-debug-step"><div class="v6-debug-step-icon">${esc(def.icon)}</div><div><strong>${esc(def.title)}</strong><p>${esc(def.summary)}</p></div></div>
 ${incoming.length?`<div class="v6-debug-subheading">Data coming into this step</div><div class="v6-debug-data">${incoming.map(l=>`<span>${esc(l.output)} → ${esc(l.input.replace('arg:',''))}</span>`).join('')}</div>`:''}
 ${params.length?`<div class="v6-debug-subheading">Selected settings</div><div class="v6-debug-settings">${params.map(([key,v])=>`<div><span>${esc(key.replaceAll('_',' '))}</span><b>${esc(String(v).slice(0,55))}</b></div>`).join('')}</div>`:''}
 <div class="v6-debug-subheading">Generated Python for this action</div><pre class="v6-debug-code">${esc(codePreview(n))}</pre>
 <p class="v6-debug-feedback" hidden></p>
 ${decision}
 <div class="v6-debug-controls"><button data-v6-debug-action="restart" title="Restart walkthrough">↺</button><button data-v6-debug-action="prev" ${state.index===0?'disabled':''}>← Previous</button>${choose?'':`<button class="v6-debug-next" data-v6-debug-action="next">Next step →</button>`}</div>
 <div class="v6-debug-trail"><b>Path visited</b><div>${state.history.map((h,i)=>`<button data-v6-go="${i}" class="${i===state.index?'active':''}" title="Jump to step ${i+1}">${i+1}. ${esc(E.byId[nodeFor(h.id)?.type]?.title||'Action')}</button>`).join('')}</div></div>`;
 refreshHighlight();
}
function open(){state.open=true;pane.hidden=false;reset();draw();scrollToCurrent();$('#btn-debug').classList.add('v6-debug-trigger-on');}
function close(){state.open=false;pane.hidden=true;refreshHighlight();$('#btn-debug').classList.remove('v6-debug-trigger-on');}
$('#btn-debug').onclick=()=>state.open?close():open();$('#btn-mobile-walkthrough').onclick=()=>state.open?close():open();
pane.addEventListener('click',e=>{
 const action=e.target.closest('[data-v6-debug-action]'),path=e.target.closest('[data-v6-path]'),jump=e.target.closest('[data-v6-go]');
 if(action){const a=action.dataset.v6DebugAction;if(a==='close')close();if(a==='restart'){reset();draw();scrollToCurrent();}if(a==='prev'&&state.index>0){state.index--;draw();scrollToCurrent();}if(a==='next')advance();}
 else if(path)advance(path.dataset.v6Path);
 else if(jump){state.index=Math.max(0,Math.min(state.history.length-1,Number(jump.dataset.v6Go)||0));draw();scrollToCurrent();}
});
window.addEventListener('keydown',e=>{if(!state.open)return;if(e.key==='Escape'){close();return;}if(e.key==='ArrowRight'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName||''))advance();if(e.key==='ArrowLeft'&&state.index>0){state.index--;draw();scrollToCurrent();}},false);
window.PyFlowWalkthrough={open,close,reset,advance,refreshHighlight,getState:()=>({...state,history:state.history.map(x=>({...x}))})};
})();
