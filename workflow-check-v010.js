/* PyFlow Studio 0.10: non-destructive structural preflight, distinct from Python execution. */
(function(root){
'use strict';
function check(project,engine,ports){
 const nodes=Array.isArray(project?.nodes)?project.nodes:[];
 const edges=Array.isArray(project?.edges)?project.edges:[];
 const dataLinks=Array.isArray(project?.dataLinks)?project.dataLinks:[];
 const nodeMap=new Map(nodes.map(n=>[n.id,n]));
 const issues=[],add=(severity,title,detail,nodeId)=>issues.push({severity,title,detail,nodeId:nodeId||null});
 const starts=nodes.filter(n=>n.type==='start');
 if(!starts.length)add('error','No starting step','Add a Start block so the program has an entry point.');
 if(starts.length>1)add('warning','Multiple starting steps','Only one Start should lead your main execution path.',starts[1].id);
 const children=new Map(nodes.map(n=>[n.id,[]]));
 const edgeKeys=new Set();
 for(const e of edges){
  if(!nodeMap.has(e.from)||!nodeMap.has(e.to)){add('error','Broken execution link','An arrow refers to a deleted action.',nodeMap.has(e.to)?e.to:e.from);continue;}
  if(e.from===e.to)add('error','Action links to itself','Remove this circular execution link.',e.from);
  if(edgeKeys.has(`${e.from}|${e.port||'next'}|${e.to}`))add('warning','Repeated execution link','The same two actions are connected more than once.',e.from);
  edgeKeys.add(`${e.from}|${e.port||'next'}|${e.to}`);
  children.get(e.from).push(e.to);
  if(nodeMap.get(e.to).type==='start')add('error','Arrow enters Start','A Start block cannot receive an execution arrow.',e.to);
 }
 const reached=new Set(),stack=starts.map(s=>s.id);
 while(stack.length){const id=stack.pop();if(reached.has(id)||!nodeMap.has(id))continue;reached.add(id);for(const to of children.get(id)||[])stack.push(to);}
 for(const n of nodes){
  if(!engine?.byId?.[n.type])add('error','Unknown action type',`This action (${n.type}) is not in the current catalog.`,n.id);
  if(!reached.has(n.id))add('warning','Action cannot run',`${engine?.byId?.[n.type]?.title||'This action'} is not connected to Start.`,n.id);
 }
 const visiting=new Set(),visited=new Set(),cycleNodes=new Set();
 function walk(id){if(visiting.has(id)){cycleNodes.add(id);return}if(visited.has(id))return;visiting.add(id);for(const to of children.get(id)||[])walk(to);visiting.delete(id);visited.add(id);}
 for(const n of nodes)walk(n.id);
 for(const id of cycleNodes)add('error','Circular execution path','This cycle may cause the generated program to be incomplete or repeat unexpectedly.',id);
 const destinations=new Set();
 for(const link of dataLinks){
  const key=`${link.to}:${link.input}`;
  if(destinations.has(key))add('warning','Multiple values to one input','Choose one data source for each input socket.',link.to);
  destinations.add(key);
  if(ports?.validate){const v=ports.validate(project,link);if(!v.ok)add('error','Broken data connection',v.reason,link.to);else for(const w of v.warnings||[])add('warning','Data type or branch warning',w,link.to);}
  else if(!nodeMap.has(link.to)||!nodeMap.has(link.from))add('error','Broken data connection','A data socket refers to a deleted action.',link.to);
 }
 const compiled=engine?.compile?.(project);
 for(const message of compiled?.warnings||[]){
  const lower=String(message).toLowerCase();
  if(lower.includes('unreachable')||lower.includes('disconnected'))continue;
  if(issues.some(i=>i.detail===message))continue;
  add('warning','Python generation note',String(message));
 }
 const errors=issues.filter(i=>i.severity==='error').length;
 const warnings=issues.filter(i=>i.severity==='warning').length;
 return {issues,errors,warnings,connected:reached.size,total:nodes.length,dataLinks:dataLinks.length,valid:errors===0,codeLines:compiled?.code?.split('\n').length||0};
}
root.PyFlowCheck={check};
if(typeof module!=='undefined'&&module.exports)module.exports={check};
})(typeof globalThis!=='undefined'?globalThis:this);
