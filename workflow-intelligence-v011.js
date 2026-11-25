/* v0.11: pure workflow discovery and safe, opt-in graph arrangement. No new project schema. */
(function(root){
'use strict';
function inspect(project,E,bindings,ports,targetId){
  const nodes=Array.isArray(project?.nodes)?project.nodes:[];
  const target=nodes.find(n=>n.id===targetId)||null;
  const prior=target&&bindings?.upstream?bindings.upstream(project,targetId):[];
  const seen=new Set(),values=[];
  for(const {node,dist} of prior){
    for(const out of (ports?.outputs?.(node,project)||bindings?.outputs?.(node,project)||[])){
      if(seen.has(out.name))continue;
      seen.add(out.name);
      values.push({name:out.name,type:out.type||'any',nodeId:node.id,origin:E?.byId?.[node.type]?.title||node.type,dist});
    }
  }
  const inputs=target?(ports?.inputs?.(target,project)||[]):[];
  return {target,values,inputs,links:(project?.dataLinks||[]).filter(x=>x.to===targetId)};
}
function compatible(sourceType,expectedType){
 const s=String(sourceType||'any').toLowerCase(),t=String(expectedType||'any').toLowerCase();
 return s==='any'||t==='any'||s===t||(t==='number'&&s==='integer');
}
function outline(project,E){
 const nodes=project?.nodes||[],edges=project?.edges||[];
 const ids=new Map(nodes.map(n=>[n.id,n]));
 const starts=nodes.filter(n=>n.type==='start');
 const order={next:0,yes:1,body:2,no:3,error:4};
 const incoming=new Map(nodes.map(n=>[n.id,0]));
 const outgoing=new Map(nodes.map(n=>[n.id,[]]));
 for(const e of edges){if(!ids.has(e.from)||!ids.has(e.to))continue;outgoing.get(e.from).push(e);incoming.set(e.to,incoming.get(e.to)+1);}
 for(const group of outgoing.values())group.sort((a,b)=>(order[a.port]??9)-(order[b.port]??9));
 const visited=new Set(),connected=[];const queue=starts.map(n=>({id:n.id,depth:0,via:'start'}));
 let maxIterations=Math.max(30,nodes.length*nodes.length+20);
 while(queue.length&&maxIterations--){
  const item=queue.shift();if(visited.has(item.id))continue;
  const n=ids.get(item.id);if(!n)continue;
  visited.add(item.id);
  connected.push({id:n.id,type:n.type,label:E?.byId?.[n.type]?.title||n.type,depth:item.depth,via:item.via,inputs:incoming.get(item.id),outputs:outgoing.get(item.id).length});
  for(const edge of outgoing.get(item.id))queue.push({id:edge.to,depth:item.depth+1,via:edge.port||'next'});
 }
 const detached=nodes.filter(n=>!visited.has(n.id)).map(n=>({id:n.id,type:n.type,label:E?.byId?.[n.type]?.title||n.type,depth:0,via:'unconnected',inputs:incoming.get(n.id),outputs:outgoing.get(n.id).length}));
 return {connected,detached,total:nodes.length,links:edges.length,values:(project?.dataLinks||[]).length};
}
/* Long graphs: deterministic column layout, separate Y slots per depth; does not change edges or data. */
function arranged(project,E){
 const list=outline(project,E),nodes=project.nodes||[],idMap=new Map(nodes.map(n=>[n.id,n]));
 const indeg=new Map(nodes.map(n=>[n.id,0])),successors=new Map(nodes.map(n=>[n.id,[]]));
 for(const e of project.edges||[]){if(!idMap.has(e.from)||!idMap.has(e.to)||e.from===e.to)continue;indeg.set(e.to,indeg.get(e.to)+1);successors.get(e.from).push(e.to);}
 const queue=nodes.filter(n=>indeg.get(n.id)===0).map(n=>n.id),level=new Map(nodes.map(n=>[n.id,0]));
 let i=0;while(i<queue.length&&i<nodes.length){const id=queue[i++];for(const child of successors.get(id)){level.set(child,Math.max(level.get(child),level.get(id)+1));indeg.set(child,indeg.get(child)-1);if(indeg.get(child)===0)queue.push(child);}}
 // Guard invalid cyclic graphs; their untouched ordering remains deterministic.
 const rank=new Map([...list.connected,...list.detached].map((n,index)=>[n.id,index]));
 const columns=new Map(),connectedSet=new Set(list.connected.map(n=>n.id));
 for(const node of nodes){let k=connectedSet.has(node.id)?level.get(node.id):'detached';if(!columns.has(k))columns.set(k,[]);columns.get(k).push(node);}
 const layers=[...columns.keys()].filter(k=>k!=='detached').sort((a,b)=>a-b);if(columns.has('detached'))layers.push('detached');
 const points={};layers.forEach((k,col)=>{columns.get(k).sort((a,b)=>(rank.get(a.id)||0)-(rank.get(b.id)||0));columns.get(k).forEach((node,row)=>{points[node.id]={x:65+col*310,y:115+row*216};});});
 return points;
}
const api={inspect,compatible,outline,arranged};
root.PyFlowIntelligence=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
