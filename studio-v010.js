/* PyFlow Studio 0.10: workspace navigator, workflow preflight and optional guided tour.
   Never modifies user code unless a user explicitly chooses to add a new action. */
(() => {
'use strict';
const $=s=>document.querySelector(s), S=window.PyFlowStudio,E=window.PyFlowEngine,C=window.PyFlowCheck;
if(!S||!E||!C)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const viewport=$('#canvas-viewport'),tbar=$('#wide-toggle');
const controls=document.createElement('div');controls.className='v10-toolbar';controls.innerHTML='<button type="button" id="v10-find" title="Find an action or command (Ctrl+K)">⌕ <span>Find steps</span><kbd>Ctrl K</kbd></button><button type="button" id="v10-check" title="Check workflow for issues">✓ <span>Check</span></button><button type="button" id="v10-help" title="Interactive getting-started guide">? <span>Guide</span></button>';
(tbar||$('#btn-add-step'))?.insertAdjacentElement('afterend',controls);
const shell=document.createElement('div');shell.id='v10-overlay';shell.className='v10-overlay';shell.hidden=true;shell.innerHTML=`<div class="v10-shade" data-v10-close="1"></div><section class="v10-panel" role="dialog" aria-modal="true" aria-labelledby="v10-title"><header class="v10-head"><div><span class="v10-kicker">PYFLOW STUDIO</span><h2 id="v10-title">Find a step</h2></div><button type="button" id="v10-close" aria-label="Close">×</button></header><div id="v10-content"></div></section>`;
document.body.appendChild(shell);
const $content=$('#v10-content');let mode=null,results=[],chosen=0,lastFocus=null;
function close(){if(shell.hidden)return;shell.hidden=true;mode=null;results=[];lastFocus?.focus?.();}
function open(type){if(!shell.hidden)close();lastFocus=document.activeElement;mode=type;shell.hidden=false;$('#v10-title').textContent=type==='find'?'Find a step or action':type==='check'?'Workflow Check':'Learn the editor';if(type==='find')renderFind();if(type==='check')renderCheck();if(type==='guide'){tourStep=0;renderTour();} }
function activeProject(){return S.getProject();}
const nodeLabel=n=>E.byId[n.type]?.title||n.type;
function nodeIndex(node){return activeProject().nodes.findIndex(n=>n.id===node.id)+1;}
function jumpTo(id,{edit=false}={}){
 const p=activeProject(),n=p.nodes.find(n=>n.id===id);if(!n)return;
 S.showNode(id);
 const zoom=Math.max(.1,parseFloat($('#zoom-val')?.textContent||'100')/100)||1;
 const left=Math.max(0,(n.x+112)*zoom-viewport.clientWidth/2);
 const top=Math.max(0,(n.y+56)*zoom-viewport.clientHeight/2);
 viewport.scrollTo({left,top,behavior:'instant'});
 const card=[...document.querySelectorAll('.canvas-node')].find(x=>x.dataset.node===id);
 card?.classList.add('v10-flash');setTimeout(()=>card?.classList.remove('v10-flash'),1250);
 if(edit&&document.body.classList.contains('inspector-hidden'))$('#toggle-inspector')?.click();
}
const commands=[
 {key:'workflow-check',title:'Check workflow',hint:'Find disconnected actions and broken links',icon:'✓',run:()=>open('check')},
 {key:'fit',title:'Fit entire workflow',hint:'See every block on the canvas',icon:'⛶',run:()=>$('#fit-workflow')?.click()},
 {key:'actions',title:'Open action library',hint:'Browse all Python programming blocks',icon:'▤',run:()=>{if(document.body.classList.contains('library-hidden'))$('#toggle-library')?.click()}},
 {key:'add',title:'Add an action',hint:'Insert the next Python operation',icon:'＋',run:()=>$('#btn-add-step')?.click()},
 {key:'components',title:'Design functions and classes',hint:'Create reusable Python components',icon:'⬡',run:()=>$('#btn-module-editor')?.click()},
 {key:'templates',title:'Choose a starter template',hint:'Create an application from an example',icon:'▦',run:()=>$('#nav-templates')?.click()},
 {key:'python',title:'Show generated Python',hint:'Open code and output dock',icon:'⌘',run:()=>{if($('.results-section')?.classList.contains('results-collapsed'))$('#btn-show-results')?.click()}},
 {key:'learn',title:'Start guided tour',hint:'Learn key controls step by step',icon:'?',run:()=>open('guide')}
];
function renderFind(){
 $content.innerHTML=`<div class="v10-search"><span>⌕</span><input id="v10-search" type="search" autocomplete="off" aria-label="Search steps, actions, commands" placeholder="Search your steps, Python actions or tools…"><kbd>Esc</kbd></div><div class="v10-results" id="v10-results" role="listbox" aria-label="Matching workflow items"></div><footer class="v10-foot"><span>↑ ↓ Select</span><span>↵ Open</span><span>Ctrl K Search</span></footer>`;
 $('#v10-search').addEventListener('input',()=>{chosen=0;refreshFind();});refreshFind();$('#v10-search').focus();
}
function refreshFind(){
 const q=$('#v10-search')?.value.trim().toLowerCase()||'',p=activeProject();
 const nodeResults=p.nodes.map((n,i)=>({kind:'node',key:n.id,title:nodeLabel(n),description:`Step ${i+1} · ${Object.entries(n.params||{}).slice(0,2).map(([k,v])=>`${k}: ${v}`).join(' · ')}`,search:[nodeLabel(n),n.type,JSON.stringify(n.params||{}),i+1].join(' ').toLowerCase()}));
 const commandResults=commands.map(c=>({kind:'command',key:c.key,title:c.title,description:c.hint,search:`${c.title} ${c.hint}`.toLowerCase()}));
 const actionResults=q.length>0?E.defs.filter(d=>d.id!=='start').map(d=>({kind:'action',key:d.id,title:`Add ${d.title}`,description:d.summary,search:`add ${d.title} ${d.summary} ${d.id}`.toLowerCase()})):[];
 results=[...nodeResults,...commandResults,...actionResults].filter(r=>!q||q.split(/\s+/).every(term=>r.search.includes(term))).slice(0,35);
 if(chosen>=results.length)chosen=0;
 $('#v10-results').innerHTML=results.length?results.map((r,i)=>`<button type="button" class="v10-item ${i===chosen?'active':''}" data-v10-index="${i}" role="option" aria-selected="${i===chosen}"><span class="v10-item-icon">${r.kind==='node'?'◇':r.kind==='action'?'＋':'⌘'}</span><span class="v10-item-copy"><strong>${esc(r.title)}</strong><small>${esc(r.description)}</small></span><span class="v10-item-kind">${r.kind==='node'?'Go to step':r.kind==='action'?'Insert':'Open'}</span></button>`).join(''):'<div class="v10-empty">No matching steps. Try a variable, action name or “Check workflow”.</div>';
}
function executeResult(index){const item=results[index];if(!item)return;close();if(item.kind==='node')jumpTo(item.key);else if(item.kind==='command')commands.find(c=>c.key===item.key)?.run();else if(item.kind==='action')S.addConfigured(item.key,{},{});}
function renderCheck(){
 const p=activeProject(),r=C.check(p,E,window.PyFlowPorts);
 const issueMarkup=r.issues.map((issue,i)=>`<div class="v10-issue ${issue.severity}"><span class="v10-issue-symbol">${issue.severity==='error'?'!':'ⓘ'}</span><div class="v10-issue-main"><b>${esc(issue.title)}</b><p>${esc(issue.detail)}</p></div>${issue.nodeId?`<button class="v10-jump" data-v10-jump="${esc(issue.nodeId)}">Go to step</button>`:''}</div>`).join('');
 $content.innerHTML=`<div class="v10-check-head"><div><strong>${r.errors===0&&r.warnings===0?'Your workflow looks connected':`${r.errors} critical · ${r.warnings} to review`}</strong><p>${r.connected} of ${r.total} steps reachable from Start · ${r.dataLinks} data connections</p></div><div class="v10-check-mark ${r.errors?'bad':r.warnings?'caution':'good'}">${r.errors?'!':r.warnings?'i':'✓'}</div></div><div class="v10-results v10-check-list">${issueMarkup||'<div class="v10-all-clear">✓ No structural problems found. This does not guarantee successful Python execution.</div>'}</div><footer class="v10-check-footer"><span>Analysis checks project structure; it does not run Python.</span><button type="button" id="v10-check-again">Check again</button></footer>`;
 $('#v10-check-again').addEventListener('click',renderCheck);
}
let tourStep=0;
const lessons=[
 {title:'Begin with a real example',desc:'Try a ready-made application first. Every step can be edited using forms.',action:'Browse examples',do:()=>$('#nav-templates')?.click()},
 {title:'Add Python actions visually',desc:'Click + Add action. Pick loops, conditions, databases, machine learning, APIs and more. They generate Python automatically.',action:'Explore actions',do:()=>$('#btn-add-step')?.click()},
 {title:'Configure the next step',desc:'Select a block to open Properties. Connect purple value sockets to pass results between steps.',action:'Show step settings',do:()=>{const n=activeProject().nodes.find(n=>n.type!=='start');if(n)jumpTo(n.id,{edit:true});}},
 {title:'Check before running',desc:'Workflow Check identifies missing connections and structural problems. Run & Inspect separately executes compatible Python and records results.',action:'Check my workflow',do:()=>open('check')},
 {title:'Save an editable project',desc:'Export project preserves blocks, wires and settings as JSON. Export Python gives you a real .py file for running outside the editor.',action:'See export options',do:()=>$('#btn-json')?.focus()}
];
function renderTour(){const t=lessons[tourStep];$content.innerHTML=`<div class="v10-tour"><div class="v10-tour-number">STEP ${tourStep+1} OF ${lessons.length}</div><div class="v10-tour-graphic">${['▦','＋','⑂','✓','⇩'][tourStep]}</div><h3>${esc(t.title)}</h3><p>${esc(t.desc)}</p><div class="v10-tour-dots">${lessons.map((_,i)=>`<i class="${i===tourStep?'active':''}"></i>`).join('')}</div><div class="v10-tour-actions"><button type="button" id="v10-tour-back" ${tourStep===0?'disabled':''}>← Back</button><button type="button" id="v10-tour-try">${esc(t.action)} ↗</button><button type="button" id="v10-tour-next">${tourStep===lessons.length-1?'Finish':'Next →'}</button></div></div>`;
 $('#v10-tour-next').addEventListener('click',()=>{if(tourStep===lessons.length-1){close();return;}tourStep++;renderTour();});
 $('#v10-tour-back').addEventListener('click',()=>{if(tourStep){tourStep--;renderTour();}});
 $('#v10-tour-try').addEventListener('click',()=>{close();t.do();});
}
$('#v10-find').addEventListener('click',()=>open('find'));
$('#v10-check').addEventListener('click',()=>open('check'));
$('#v10-help').addEventListener('click',()=>open('guide'));
$('#v10-close').addEventListener('click',close);
$('#v10-overlay').addEventListener('click',e=>{if(e.target.dataset.v10Close)close();const b=e.target.closest('[data-v10-index]');if(b)executeResult(Number(b.dataset.v10Index));const jump=e.target.closest('[data-v10-jump]');if(jump){const id=jump.dataset.v10Jump;close();jumpTo(id,{edit:true});}});
for(const id of ['nav-guide','hint-open'])$("#"+id)?.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();open('guide')},true);
document.addEventListener('keydown',e=>{
 const typing=['INPUT','TEXTAREA','SELECT'].includes(e.target?.tagName)||e.target?.isContentEditable;
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();e.stopImmediatePropagation();if(mode==='find'&&!shell.hidden)close();else open('find');return;}
 if(!shell.hidden){
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();close();return;}
  if(mode==='find'&&['ArrowDown','ArrowUp','Enter'].includes(e.key)){
   e.preventDefault();e.stopImmediatePropagation();
   if(e.key==='Enter')executeResult(chosen);else{chosen=results.length?(chosen+(e.key==='ArrowDown'?1:-1)+results.length)%results.length:0;refreshFind();$('#v10-results .active')?.scrollIntoView({block:'nearest'});}return;
  }
  return;
 }
 if(e.key==='/'&&!typing&&!e.ctrlKey&&!e.altKey&&!e.metaKey){e.preventDefault();e.stopImmediatePropagation();open('find');}
},true);
window.PyFlowNavigation={open,close,jumpTo,check:()=>C.check(activeProject(),E,window.PyFlowPorts)};
})();
