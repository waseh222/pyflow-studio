/* PyFlow Studio v0.6 — explicit visual data wires, separate from execution paths.
   Pure compiler functions work in Node; browser decoration is optional. */
(function(root){
'use strict';
const E=root.PyFlowEngine, B=root.PyFlowBindings;
if(!E||!B)return;
const COMMON={
  set_var:[['value','Value','any']],
  return:[['value','Return value','any']],
  generator:[['value','Yield value','any']],
  list_comp:[['source','Items to process','list']],
  pandas_clean:[['name','DataFrame','any']],
  pandas_filter:[['name','DataFrame','any']],
  json_write:[['value','Object to export','any']],
  sqlite_table:[['conn','Database connection','any']],
  sqlite_insert:[['conn','Database connection','any']],
  sqlite_fetch:[['conn','Database connection','any']],
  flask_route:[['app','Flask app variable','object']],
  flask_start:[['app','Flask app variable','object']],
  print:[['value','Display this value','any']],
  math:[['left','First value','number'],['right','Second value','number']],
  if:[['left','Compare','any'],['right','Against','any']],
  while:[['left','Compare','any'],['right','Against','any']],
  for:[['source','Collection','list']],
  convert:[['value','Value to convert','any']],
  string:[['source','Source text','text']],
  list_add:[['list','Target collection','list'],['value','Item to add','any']],
  sort:[['value','List to sort','list']],
  regex:[['text','Text to search','text']],
  write_file:[['value','Content to write','any']],
  json_write:[['value','Data to export','any']],
  csv_write:[['rows','Rows to export','list']],
  pandas_group:[['source','Dataframe','any']],
  chart:[['source','Chart data','any']],
  ml_train:[['features','Features','any'],['labels','Labels','any']],
  ml_score:[['model','Model','any']],
  assert:[['left','Compare','any'],['right','Against','any']]
};
const safeEsc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
function inputs(node,project){
 if(['call','method'].includes(node.type)){
  const sig=B.signature(node,project);
  return (sig?.parameters||[]).map(p=>({key:'arg:'+p.name,label:p.name,type:p.type||'any'}));
 }
 return (COMMON[node.type]||[]).map(([key,label,type])=>({key,label,type}));
}
function outputs(node,project){return B.outputs(node,project).filter(x=>x.name&&/^[_a-zA-Z][_a-zA-Z0-9]*$/.test(x.name));}
function prior(project,to){return B.upstream(project,to).map(x=>x.node.id);}
function branchRisk(project,from,to){
 const start=(project.nodes||[]).find(n=>n.type==='start');if(!start)return false;
 const q=[start.id],seen=new Set();while(q.length){const id=q.shift();if(id===from||seen.has(id))continue;if(id===to)return true;seen.add(id);
  (project.edges||[]).filter(e=>e.from===id).forEach(e=>q.push(e.to));
 }return false;
}
function validate(project,link){
 const nodes=new Map((project.nodes||[]).map(n=>[n.id,n]));const from=nodes.get(link?.from),to=nodes.get(link?.to);
 if(!from||!to)return {ok:false,reason:'A linked action was removed.'};
 if(from.id===to.id)return {ok:false,reason:'An action cannot send data to itself.'};
 const output=outputs(from,project).find(x=>x.name===link.output);
 const input=inputs(to,project).find(x=>x.key===link.input);
 if(!output)return {ok:false,reason:'The output value no longer exists.'};
 if(!input)return {ok:false,reason:'The destination input no longer exists.'};
 if(!prior(project,to.id).includes(from.id))return {ok:false,reason:'Connect the action execution path first. Data must come from an earlier step.'};
 const warning=[];
 if(input.type!=='any'&&output.type!=='any'&&output.type!==input.type&&!(input.type==='number'&&output.type==='integer'))warning.push(`“${input.label}” expects ${input.type} but “${output.name}” is ${output.type}.`);
 if(branchRisk(project,from.id,to.id))warning.push(`“${output.name}” may not exist on every execution branch. Review the Yes/No paths.`);
 return {ok:true,from,to,input,output,warnings:warning};
}
function connect(project,link){
 const v=validate(project,link);if(!v.ok)return v;
 project.dataLinks=(Array.isArray(project.dataLinks)?project.dataLinks:[]).filter(e=>!(e.to===link.to&&e.input===link.input));
 project.dataLinks.push({from:link.from,output:link.output,to:link.to,input:link.input});
 return v;
}
function disconnect(project,to,input){project.dataLinks=(project.dataLinks||[]).filter(e=>!(e.to===to&&e.input===input));}
function preparedProject(original){
 const project=clone(original),warnings=[],active=[];
 const links=Array.isArray(project.dataLinks)?project.dataLinks:[];
 for(const link of links){
  const check=validate(project,link);
  if(!check.ok){warnings.push(`Data link ignored: ${check.reason}`);continue;}
  warnings.push(...check.warnings.map(w=>`Data link: ${w}`));
  const {to}=check,p=to.params||(to.params={});
  if(link.input.startsWith('arg:')){
   const param=link.input.slice(4),signature=B.signature(to,project);
   const desc=(signature?.parameters||[]).find(p=>p.name===param);
   if(!desc){warnings.push(`Data link ignored: input ${param} was removed from the function.`);continue;}
   p.bindingMode='guided';p.bindings=Array.isArray(p.bindings)?p.bindings:[];
   const current=p.bindings.find(b=>b.name===param);
   const changed={name:param,source:'variable',variable:link.output,type:desc.type||'any',value:''};
   if(current)Object.assign(current,changed);else p.bindings.push(changed);
  }else{
   p[link.input]=link.output;
   if(to.type==='set_var')p.kind='Expression';
   if(to.type==='print'||to.type==='write_file') {if(to.type==='print')p.mode='Variable / expression';else p.source='Variable / expression';}
   if(to.type==='list_add')p.mode='Number / expression';
  }
  active.push(link);
 }
 return {project,warnings,active};
}
const previousCompile=E.compile;
E.compile=function(project){
 const prepared=preparedProject(project),result=previousCompile(prepared.project);
 result.warnings=[...result.warnings,...prepared.warnings];
 result.dataLinkCount=prepared.active.length;
 return result;
};
// A fully wired example, usable without typing Python or configuring expressions.
E.templates.push({
 id:'visual-data-links',title:'Connected Data Calculator',icon:'⑂',tag:'Visual data sockets',
 description:'Connect numbers between steps using purple data ports; Python is generated automatically.',
 create:()=>{
  const p=E.blank('Connected Data Calculator');
  const s=E.makeNode('start',65,175),a=E.makeNode('set_var',340,175,{name:'price',kind:'Number',value:'200'}),
        b=E.makeNode('set_var',615,175,{name:'tax_rate',kind:'Number',value:'0.15'}),
        m=E.makeNode('math',890,175,{name:'tax_due',left:'0',operator:'*',right:'0'}),
        o=E.makeNode('print',1165,175,{mode:'Text',value:'Result'});
  p.nodes=[s,a,b,m,o];p.edges=p.nodes.slice(0,-1).map((n,i)=>({from:n.id,to:p.nodes[i+1].id,port:'next'}));
  connect(p,{from:a.id,output:'price',to:m.id,input:'left'});
  connect(p,{from:b.id,output:'tax_rate',to:m.id,input:'right'});
  connect(p,{from:m.id,output:'tax_due',to:o.id,input:'value'});
  return p;
 }
});
E.templates.push({
 id:'visual-list-pipeline',title:'Visual Lists & Data Types',icon:'▥',tag:'No-code collection mapping',
 description:'Create, sort and display a collection using typed visual value connectors.',
 create:()=>{
  const p=E.blank('Visual Lists & Data Types');
  const start=E.makeNode('start',60,185),items=E.makeNode('list_create',330,185,{name:'fruits',kind:'Text',values:'mango, apple, banana'}),
        sorted=E.makeNode('sort',605,185,{name:'sorted_fruits',value:'fruits',reverse:false}),
        display=E.makeNode('print',885,185,{mode:'Variable / expression',value:'sorted_fruits'});
  p.nodes=[start,items,sorted,display];
  p.edges=[[start,items],[items,sorted],[sorted,display]].map(([a,b])=>({from:a.id,to:b.id,port:'next'}));
  connect(p,{from:items.id,output:'fruits',to:sorted.id,input:'value'});
  connect(p,{from:sorted.id,output:'sorted_fruits',to:display.id,input:'value'});
  return p;
 }
});
const api={inputs,outputs,prior,branchRisk,validate,connect,disconnect,preparedProject};
root.PyFlowPorts=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;

if(typeof document==='undefined'||!root.PyFlowStudio)return;
const S=root.PyFlowStudio,ns=document.querySelector('#node-layer'),inspector=document.querySelector('#inspector-body');
let activeSource=null;
function chosen(){return activeSource;}
function updateSelection(){
 ns.querySelectorAll('[data-data-src]').forEach(el=>el.classList.toggle('v6-port-picked',!!activeSource&&el.dataset.dataSrc===activeSource.from&&el.dataset.dataOutput===activeSource.output));
 ns.classList.toggle('v6-choose-input',!!activeSource);
}
function decorateNodes(project,layer){
 for(const node of project.nodes){
  const card=[...layer.children].find(c=>c.dataset.node===node.id);if(!card)continue;
  const outs=outputs(node,project),ins=inputs(node,project);
  if(!outs.length&&!ins.length)continue;
  const links=project.dataLinks||[];
  const incoming=ins.map(i=>{
   const linked=links.find(x=>x.to===node.id&&x.input===i.key);
   return `<button type="button" class="v6-data-port v6-data-in ${linked?'is-wired':''}" data-data-dst="${safeEsc(node.id)}" data-data-input="${safeEsc(i.key)}" title="Connect a saved value to ${safeEsc(i.label)}" aria-label="Data input ${safeEsc(i.label)}">${linked?'●':'○'} ${safeEsc(i.label.length>12?i.label.slice(0,11)+'…':i.label)}</button>`;
  }).join('');
  const outgoing=outs.map(o=>`<button type="button" class="v6-data-port v6-data-out" data-data-src="${safeEsc(node.id)}" data-data-output="${safeEsc(o.name)}" title="Connect saved value ${safeEsc(o.name)} to a later action" aria-label="Data output ${safeEsc(o.name)}">${safeEsc(o.name.length>12?o.name.slice(0,11)+'…':o.name)} ●</button>`).join('');
  card.insertAdjacentHTML('beforeend',`<div class="v6-port-row"><div class="v6-port-group">${incoming}</div><div class="v6-port-group right">${outgoing}</div></div>`);
 }
 updateSelection();
}
function findSocket(kind,node,key){return [...ns.querySelectorAll(kind==='from'?'[data-data-src]':'[data-data-dst]')].find(el=>kind==='from'?(el.dataset.dataSrc===node&&el.dataset.dataOutput===key):(el.dataset.dataDst===node&&el.dataset.dataInput===key));}
function drawLinks(project,svg,zoom){
 const doc=svg.ownerDocument,nsURI='http://www.w3.org/2000/svg',g=doc.createElementNS(nsURI,'g');g.setAttribute('class','v6-data-wires');
 const stageRect=document.querySelector('#canvas-stage').getBoundingClientRect();
 for(const link of project.dataLinks||[]){const a=findSocket('from',link.from,link.output),b=findSocket('to',link.to,link.input);if(!a||!b)continue;
  const ra=a.getBoundingClientRect(),rb=b.getBoundingClientRect(),x1=(ra.right-stageRect.left)/zoom,y1=(ra.top+ra.height/2-stageRect.top)/zoom,x2=(rb.left-stageRect.left)/zoom,y2=(rb.top+rb.height/2-stageRect.top)/zoom;
  const dx=Math.max(55,Math.abs(x2-x1)*.4),path=doc.createElementNS(nsURI,'path');path.setAttribute('d',`M ${x1} ${y1} C ${x1+dx} ${y1}, ${x2-dx} ${y2}, ${x2} ${y2}`);path.setAttribute('class','v6-data-line');g.appendChild(path);
 }svg.appendChild(g);
}
function appendInspector(project,node,wrap){
 const ins=inputs(node,project);if(!ins.length)return;
 const priorIds=new Set(prior(project,node.id));
 const sources=project.nodes.filter(n=>priorIds.has(n.id)).flatMap(n=>outputs(n,project).map(o=>({...o,nodeId:n.id,title:E.byId[n.type]?.title||n.type})));
 const wires=(project.dataLinks||[]).filter(l=>l.to===node.id);
 const options=sources.map(s=>`<option value="${safeEsc(s.nodeId+'::'+s.name)}">${safeEsc(s.name)} · ${safeEsc(s.title)} (${safeEsc(s.type||'any')})</option>`).join('');
 const rows=ins.map(i=>{const l=wires.find(e=>e.input===i.key);const valid=l?validate(project,l):null;return `<div class="v6-link-item"><span class="v6-link-dot ${l?'connected':''}"></span><div><b>${safeEsc(i.label)}</b><small>${l?safeEsc(l.output)+' · '+safeEsc(project.nodes.find(n=>n.id===l.from)?.type||'missing'):'Not connected'}</small>${valid?.warnings?.length?`<small class="v6-link-warning">${safeEsc(valid.warnings.join(' '))}</small>`:''}</div>${l?`<button data-v6-remove="${safeEsc(i.key)}" aria-label="Disconnect ${safeEsc(i.label)}" title="Remove data link">×</button>`:''}</div>`;}).join('');
 wrap.insertAdjacentHTML('beforeend',`<section class="v6-inspector-panel"><div class="v6-inspector-heading"><span class="v6-h-icon">⑂</span><div><strong>Connect workflow data</strong><small>Link results to inputs — no Python expressions</small></div></div><div class="v6-linked-list">${rows}</div><div class="v6-selects"><label>Input to fill<select data-v6-select-input>${ins.map(i=>`<option value="${safeEsc(i.key)}">${safeEsc(i.label)}</option>`).join('')}</select></label><label>Value from earlier step<select data-v6-select-source>${options||'<option value="">Connect an earlier step first</option>'}</select></label></div><button type="button" class="v6-link-btn" data-v6-connect ${sources.length?'':'disabled'}>◉ Connect data to input</button><p class="v6-info">Purple dotted lines carry values. Gray arrows control the order of actions. Both are needed.</p></section>`);
}
api.decorateNodes=decorateNodes;api.drawLinks=drawLinks;api.appendInspector=appendInspector;api.chosen=chosen;
ns.addEventListener('click',e=>{
 const source=e.target.closest('[data-data-src]'),target=e.target.closest('[data-data-dst]');if(!source&&!target)return;
 e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
 if(source){activeSource={from:source.dataset.dataSrc,output:source.dataset.dataOutput};updateSelection();S.toast('Value selected. Click a purple input on a later connected step.');return;}
 if(!activeSource){S.toast('First click a purple data output on an earlier step.');return;}
 const link={...activeSource,to:target.dataset.dataDst,input:target.dataset.dataInput};const test=validate(S.getProject(),link);
 if(!test.ok){S.toast(test.reason);return;}
 S.update(p=>connect(p,link));activeSource=null;updateSelection();S.toast(test.warnings.length?'Connected — review the warning in Properties':'Data connected! Generated Python has been updated.');
},true);
inspector.addEventListener('click',e=>{
 const rm=e.target.closest('[data-v6-remove]'),add=e.target.closest('[data-v6-connect]');if(!rm&&!add)return;
 e.stopPropagation();e.preventDefault();
 const selected=S.selected();if(rm){S.update(p=>disconnect(p,selected,rm.dataset.v6Remove));S.toast('Data connection removed.');return;}
 const input=inspector.querySelector('[data-v6-select-input]')?.value||'',raw=inspector.querySelector('[data-v6-select-source]')?.value||'',i=raw.indexOf('::');
 if(i<0)return S.toast('Choose a value from an earlier connected step.');
 const link={from:raw.slice(0,i),output:raw.slice(i+2),to:selected,input};const test=validate(S.getProject(),link);
 if(!test.ok)return S.toast(test.reason);
 S.update(p=>connect(p,link));S.toast(test.warnings.length?'Connected with a warning — review the input type.':'Data connection saved.');
});
root.addEventListener('keydown',e=>{if(e.key==='Escape'&&activeSource){activeSource=null;updateSelection();}},true);
})(typeof window!=='undefined'?window:globalThis);
