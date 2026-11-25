/* PyFlow Studio v0.12 — deterministic, opt-in transformations and reusable linear sections.
   No arbitrary source expressions are evaluated in this module. */
(function(root){
'use strict';
const E=root.PyFlowEngine, B=root.PyFlowBindings, P=root.PyFlowPorts;
if(!E||!B||!P)return;
const clone=v=>JSON.parse(JSON.stringify(v));
const safeId=s=>/^[A-Za-z_][A-Za-z_0-9]*$/.test(String(s||''))&& !new Set(['False','True','None','class','for','while','if','else','return','def','import','try','except','global','nonlocal','lambda','async','await','yield','from','with','as','in','pass','break','continue','raise','del','assert','is','not','and','or']).has(s);
const kinds=[{value:'str',label:'Text',type:'text',example:'"35"'},{value:'float',label:'Number / decimal',type:'number',example:'35.0'},{value:'int',label:'Whole number',type:'integer',example:'35'},{value:'bool',label:'True / False',type:'boolean',example:'True'},{value:'list',label:'List',type:'list',example:'[35]'},{value:'tuple',label:'Tuple',type:'any',example:'(35,)'},{value:'set',label:'Set',type:'any',example:'{35}'}];
const words={str:'text',float:'number',int:'whole_number',bool:'boolean',list:'list',tuple:'tuple',set:'set'};
function names(project){return new Set((project.nodes||[]).flatMap(n=>P.outputs(n,project).map(v=>v.name)));}
function freshName(project,output,kind){const base=String(output||'value').replace(/[^\w]/g,'_')+'_as_'+(words[kind]||'value');let id=safeId(base)?base:'converted_value',taken=names(project),k=2;while(taken.has(id))id=base+'_'+(k++);return id;}
function planConversion(project,opts){
 const source=(project.nodes||[]).find(n=>n.id===opts?.from),receiver=(project.nodes||[]).find(n=>n.id===opts?.to),kind=kinds.find(k=>k.value===opts?.kind);
 if(!source||!receiver)return {ok:false,reason:'Choose a source value and receiving action.'};
 if(!kind)return {ok:false,reason:'Choose a supported conversion type.'};
 const target=P.inputs(receiver,project).find(i=>i.key===opts?.input);
 const output=P.outputs(source,project).find(o=>o.name===opts?.output);
 if(!target||!output)return {ok:false,reason:'Choose an available output and target input.'};
 const incoming=(project.edges||[]).filter(e=>e.to===receiver.id);
 if(incoming.length!==1)return {ok:false,reason:'For automatic insertion, the receiving action must have exactly one incoming execution arrow.'};
 if(!['next','yes','no','body','error'].includes(incoming[0].port||'next'))return {ok:false,reason:'The incoming execution arrow is unsupported.'};
 const link=P.validate(project,{from:source.id,output:output.name,to:receiver.id,input:target.key});
 if(!link.ok)return {ok:false,reason:link.reason};
 const name=String(opts.name||freshName(project,output.name,kind.value)).trim();
 if(!safeId(name))return {ok:false,reason:'Choose a valid Python variable name with letters, numbers or underscores.'};
 if(names(project).has(name))return {ok:false,reason:'This output variable name is already used. Choose a unique name.'};
 const warnings=[...link.warnings];
 if(kind.value==='bool'&&output.type==='text')warnings.push('Converting non-empty text to bool returns True, even if it reads "False".');
 if(['float','int'].includes(kind.value)&&['text','any'].includes(output.type))warnings.push('The input must contain a valid numeric value when Python runs.');
 if(kind.value==='list'&&output.type==='text')warnings.push('Converting text to a list produces a list of individual characters.');
 return {ok:true,source,receiver,kind,target,output,incoming:incoming[0],name,warnings,code:`${name} = ${kind.value}(${output.name})`};
}
function insertConversion(project,opts){
 const p=planConversion(project,opts);if(!p.ok)return p;
 const {source,receiver,kind,target,output,incoming,name}=p;
 const before={x:receiver.x,y:receiver.y};
 // Make room for a new card without changing any existing execution/data semantics.
 for(const n of project.nodes||[])if(n.x>=before.x)n.x+=290;
 const added=E.makeNode('convert',before.x,before.y,{name,kind:kind.value,value:output.name});
 project.nodes.push(added);
 incoming.to=added.id;
 project.edges.push({from:added.id,to:receiver.id,port:'next'});
 const a=P.connect(project,{from:source.id,output:output.name,to:added.id,input:'value'});
 const b=P.connect(project,{from:added.id,output:name,to:receiver.id,input:target.key});
 if(!a.ok||!b.ok)throw new Error('Unexpected internal conversion connection failure');
 return {ok:true,id:added.id,name,warnings:p.warnings,code:p.code};
}
const LINEAR_TYPES=new Set(['set_var','print','input','math','convert','comment','string','list_create','list_add','dictionary','sort','regex','import','list_comp','lambda','sleep','read_file','write_file','json_read','json_write','csv_read','csv_write','request','web_scrape','pandas_read','pandas_clean','pandas_filter','pandas_group','numpy','chart','ml_iris','ml_train','ml_score','sqlite_connect','sqlite_table','sqlite_insert','sqlite_fetch','assert','datetime','random','schedule']);
function validateSection(project,selected){
 const ids=new Set(selected||[]),map=new Map((project.nodes||[]).map(n=>[n.id,n]));
 if(!ids.size)return {ok:false,reason:'Select at least one step.'};
 if(ids.size>25)return {ok:false,reason:'Save no more than 25 actions in one reusable section.'};
 for(const id of ids){const n=map.get(id);if(!n)return {ok:false,reason:'One selected action no longer exists.'};if(!LINEAR_TYPES.has(n.type))return {ok:false,reason:'Reusable sections currently support straight-line actions; remove branch/loop/start actions.'};}
 const inside=(project.edges||[]).filter(e=>ids.has(e.from)&&ids.has(e.to)),incoming=new Map([...ids].map(id=>[id,0])),outgoing=new Map([...ids].map(id=>[id,0]));
 for(const e of inside){if((e.port||'next')!=='next')return {ok:false,reason:'Only straight-line Next connections can form a reusable section.'};incoming.set(e.to,incoming.get(e.to)+1);outgoing.set(e.from,outgoing.get(e.from)+1);}
 const roots=[...ids].filter(id=>incoming.get(id)===0),ends=[...ids].filter(id=>outgoing.get(id)===0);
 if(inside.length!==ids.size-1||roots.length!==1||ends.length!==1||[...incoming.values(),...outgoing.values()].some(n=>n>1))return {ok:false,reason:'Choose one continuous, straight-line path with no gaps, forks or merges.'};
 const incomingExternal=(project.dataLinks||[]).filter(e=>ids.has(e.to)&&!ids.has(e.from));
 if(incomingExternal.length)return {ok:false,reason:'Include the steps that produce this section’s data, so it can run by itself.'};
 const order=[],seen=new Set();let cursor=roots[0];while(cursor&&!seen.has(cursor)){seen.add(cursor);order.push(cursor);cursor=inside.find(e=>e.from===cursor)?.to;}
 if(order.length!==ids.size)return {ok:false,reason:'The chosen actions do not make a single valid path.'};
 return {ok:true,order,first:roots[0],last:ends[0],warnings:[]};
}
function saveSection(project,label,selected){
 const name=String(label||'').trim();if(name.length<2||name.length>60)return {ok:false,reason:'Enter a section name between 2 and 60 characters.'};
 const result=validateSection(project,selected);if(!result.ok)return result;
 const ordered=result.order.map(id=>project.nodes.find(n=>n.id===id)),ids=new Set(result.order),origin={x:Math.min(...ordered.map(n=>n.x)),y:Math.min(...ordered.map(n=>n.y))};
 const nodes=ordered.map(n=>({...clone(n),x:n.x-origin.x,y:n.y-origin.y}));
 const edges=(project.edges||[]).filter(e=>ids.has(e.from)&&ids.has(e.to)).map(clone);
 const dataLinks=(project.dataLinks||[]).filter(e=>ids.has(e.from)&&ids.has(e.to)).map(clone);
 const section={id:E.makeId(),name,nodes,edges,dataLinks,created:new Date().toISOString()};
 project.reusableSections=Array.isArray(project.reusableSections)?project.reusableSections:[];
 project.reusableSections.push(section);
 return {ok:true,section};
}
function insertSection(project,section,afterId){
 const after=project.nodes.find(n=>n.id===afterId);
 if(!after||!(E.byId[after.type]?.ports||[]).includes('next'))return {ok:false,reason:'Choose an action with a Next output as the insertion point.'};
 if(!section||!Array.isArray(section.nodes)||!section.nodes.length)return {ok:false,reason:'This saved section is empty.'};
 const template={nodes:clone(section.nodes),edges:clone(section.edges||[]),dataLinks:clone(section.dataLinks||[])};
 const validated=validateSection(template,template.nodes.map(n=>n.id));if(!validated.ok)return {ok:false,reason:'Saved section is invalid: '+validated.reason};
 const old=project.edges.find(e=>e.from===after.id&&(e.port||'next')==='next'),existing=old?.to||null;
 const shift=290*template.nodes.length;
 for(const n of project.nodes)if(n.x>after.x+200)n.x+=shift;
 const idMap=new Map(template.nodes.map(n=>[n.id,E.makeId()]));
 const inserts=template.nodes.map(n=>({...n,id:idMap.get(n.id),x:after.x+290+Math.max(0,n.x),y:after.y+n.y}));
 project.nodes.push(...inserts);
 project.edges.push(...template.edges.map(e=>({...e,from:idMap.get(e.from),to:idMap.get(e.to)})));
 project.dataLinks=Array.isArray(project.dataLinks)?project.dataLinks:[];
 project.dataLinks.push(...template.dataLinks.map(e=>({...e,from:idMap.get(e.from),to:idMap.get(e.to)})));
 const first=idMap.get(validated.first),last=idMap.get(validated.last);
 if(old)old.to=first;else project.edges.push({from:after.id,to:first,port:'next'});
 if(existing)project.edges.push({from:last,to:existing,port:'next'});
 return {ok:true,first,last,count:inserts.length};
}
const api={kinds,safeId,freshName,planConversion,insertConversion,validateSection,saveSection,insertSection,LINEAR_TYPES};
root.PyFlowFlowBuilding=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
/* One end-to-end visual template, using the exact same compiler and graph paths as user-created projects. */
(function(root){
'use strict';const E=root.PyFlowEngine,P=root.PyFlowPorts;if(!E||!P)return;
E.templates.push({id:'visual-type-conversion',title:'Visual Type Conversion',icon:'⇄',tag:'Guided transformations',description:'Turn a text price into a number and calculate its double without typing Python.',create:()=>{
 const p=E.blank('Visual Type Conversion'),s=E.makeNode('start',65,170),t=E.makeNode('set_var',350,170,{name:'price_text',kind:'Text',value:'25.5'}),c=E.makeNode('convert',635,170,{name:'price_number',kind:'float',value:'price_text'}),m=E.makeNode('math',920,170,{name:'double_price',left:'price_number',operator:'*',right:'2'}),o=E.makeNode('print',1205,170,{mode:'Variable / expression',value:'double_price'});
 p.nodes=[s,t,c,m,o];p.edges=[[s,t],[t,c],[c,m],[m,o]].map(([a,b])=>({from:a.id,to:b.id,port:'next'}));
 P.connect(p,{from:t.id,output:'price_text',to:c.id,input:'value'});
 P.connect(p,{from:c.id,output:'price_number',to:m.id,input:'left'});
 P.connect(p,{from:m.id,output:'double_price',to:o.id,input:'value'});return p;
}});
})(typeof window!=='undefined'?window:globalThis);
