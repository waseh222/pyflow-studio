/* PyFlow Studio v0.13: safe, explicit forms for common actions and reusable-section audits.
   This module never evals input. It produces bounded/validated parameters for existing blocks. */
(function(root){
'use strict';
const ACTIONS=['math','if','assert','print','for','sort'];
const OPS_MATH=['+','-','*','/','//','%','**'];
const OPS_COMPARE=['==','!=','>','>=','<','<='];
const RESERVED=new Set('False True None and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'.split(' '));
const identifier=value=>/^[a-zA-Z_][a-zA-Z_0-9]*$/.test(String(value||''))&&!RESERVED.has(value);
const literalNum=value=>{
 const str=String(value??'').trim();
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(str)||!Number.isFinite(Number(str)))return null;
 return str;
};
const clone=x=>JSON.parse(JSON.stringify(x));
function operand(input,available,expected='any'){
 const v=input||{},mode=v.mode||'variable';
 if(mode==='variable'){
  const match=(available||[]).find(x=>x.name===v.value);
  if(!match)return {ok:false,reason:'Choose a saved value from an earlier connected action.'};
  const got=String(match.type||'any').toLowerCase();
  const warnings=[];
  if(expected==='number'&&!['number','integer','any'].includes(got))warnings.push(`${match.name} is labeled ${got}; check that the operation supports this type.`);
  if(expected==='list'&&!['list','tuple','set','any'].includes(got))warnings.push(`${match.name} is labeled ${got}; the operation needs an iterable collection.`);
  return {ok:true,code:match.name,mode,value:match.name,warnings,datatype:got};
 }
 if(mode==='number'){
  const n=literalNum(v.value);return n===null?{ok:false,reason:'Enter a valid finite number.'}:{ok:true,code:n,mode,value:String(v.value).trim(),warnings:[],datatype:'number'};
 }
 if(mode==='text')return {ok:true,code:JSON.stringify(String(v.value??'')),mode,value:String(v.value??''),warnings:[],datatype:'text'};
 if(mode==='boolean')return {ok:true,code:String(v.value)==='true'?'True':'False',mode,value:String(v.value)==='true'?'true':'false',warnings:[],datatype:'boolean'};
 return {ok:false,reason:'Choose a supported value type.'};
}
function uniqueName(project,node,name,ports){
 if(!identifier(name))return 'Choose a valid variable name without spaces or Python keywords.';
 for(const n of project.nodes||[]){if(n.id===node.id)continue;for(const o of ports.outputs(n,project)){if(o.name===name)return `A different action already saves a value named “${name}”. Choose another name.`;}}
 return '';
}
function plan(project,nodeId,form,available,ports){
 const node=(project.nodes||[]).find(n=>n.id===nodeId);if(!node||!ACTIONS.includes(node.type))return {ok:false,reason:'Choose a supported action.'};
 const v=form||{},p=clone(node.params||{}),warnings=[];
 const make=(obj,type)=>{const a=operand(obj,available,type);if(!a.ok)return a;warnings.push(...a.warnings);return a;};
 if(['math','if','assert'].includes(node.type)){
  const a=make(v.left,'number');if(!a.ok)return a;
  const b=make(v.right,'number');if(!b.ok)return b;
  const op=String(v.operator||'');
  if(!(node.type==='math'?OPS_MATH:OPS_COMPARE).includes(op))return {ok:false,reason:'Choose a supported operation.'};
  p.left=a.code;p.right=b.code;p.operator=op;
  if(node.type==='math'){
   const err=uniqueName(project,node,String(v.name||'').trim(),ports);if(err)return {ok:false,reason:err};
   p.name=String(v.name).trim();
   if(['/','//','%'].includes(op)&&b.datatype==='number'&&Number(b.value)===0)warnings.push('Dividing by zero will cause a Python error.');
  }
  if(node.type==='assert')p.message=String(v.message||'Validation failed');
  return {ok:true,params:p,warnings,preview:node.type==='math'?`${p.name} = ${p.left} ${p.operator} ${p.right}`:node.type==='assert'?`assert ${p.left} ${p.operator} ${p.right}`:`if ${p.left} ${p.operator} ${p.right}:`};
 }
 if(node.type==='print'){
  if(v.mode==='text'){
   p.mode='Text';p.value=String(v.text||'');
   return {ok:true,params:p,warnings,preview:`print(${JSON.stringify(p.value)})`};
  }
  const a=make({mode:'variable',value:v.source});if(!a.ok)return a;
  p.mode='Variable / expression';p.value=a.code;
  return {ok:true,params:p,warnings,preview:`print(${a.code})`};
 }
 if(node.type==='for'){
  if(!identifier(v.item))return {ok:false,reason:'Choose a valid loop-item name (for example, item).'};
  const a=make({mode:'variable',value:v.source},'list');if(!a.ok)return a;
  p.item=String(v.item);p.source=a.code;
  return {ok:true,params:p,warnings,preview:`for ${p.item} in ${p.source}:`};
 }
 if(node.type==='sort'){
  const name=String(v.name||'').trim(),err=uniqueName(project,node,name,ports);if(err)return {ok:false,reason:err};
  const a=make({mode:'variable',value:v.source},'list');if(!a.ok)return a;
  p.name=name;p.value=a.code;p.reverse=!!v.reverse;
  return {ok:true,params:p,warnings,preview:`${p.name} = sorted(${p.value}, reverse=${p.reverse?'True':'False'})`};
 }
 return {ok:false,reason:'This action is not supported yet.'};
}
function sectionAudit(project,section,afterId,engine,ports){
 const errors=[],warnings=[],actions=[];
 if(!section||!Array.isArray(section.nodes)||!section.nodes.length)errors.push('Select a saved section first.');
 const point=(project.nodes||[]).find(n=>n.id===afterId);
 if(!point||!(engine?.byId?.[point.type]?.ports||[]).includes('next'))errors.push('Choose an action with a Next output as the insertion point.');
 if(errors.length)return {ok:false,errors,warnings,actions,collisions:[]};
 const existing=new Set((project.nodes||[]).flatMap(n=>(ports.outputs(n,project)||[]).map(o=>o.name)));
 const sectionProject={nodes:section.nodes,edges:section.edges||[],dataLinks:section.dataLinks||[]};
 const outputs=new Set(),collisions=new Set();
 for(const node of section.nodes){
  actions.push({type:node.type,label:engine?.byId?.[node.type]?.title||node.type,detail:node.params?.name||node.params?.result||node.type});
  for(const o of ports.outputs(node,sectionProject)||[]){
   if(existing.has(o.name))collisions.add(o.name);
   outputs.add(o.name);
  }
 }
 if(collisions.size)warnings.push(`Existing output names would be reused: ${[...collisions].join(', ')}. This may overwrite earlier values when Python runs.`);
 if(!section.nodes.some(n=>n.type==='start')&&section.nodes.length>0&&outputs.size===0)warnings.push('This section does not create a named output; check how it affects the next step.');
 return {ok:true,errors,warnings,actions,collisions:[...collisions]};
}
function renameSection(project,id,name){
 const text=String(name||'').trim();
 if(text.length<2||text.length>60)return {ok:false,reason:'Enter a section name between 2 and 60 characters.'};
 const sec=(project.reusableSections||[]).find(s=>s.id===id);if(!sec)return {ok:false,reason:'Saved section not found.'};
 if((project.reusableSections||[]).some(s=>s.id!==id&&s.name.toLowerCase()===text.toLowerCase()))return {ok:false,reason:'Another saved section already has that name.'};
 sec.name=text;return {ok:true,section:sec};
}
function duplicateSection(project,id,engine){
 const sec=(project.reusableSections||[]).find(s=>s.id===id);if(!sec)return {ok:false,reason:'Saved section not found.'};
 const s=clone(sec),base=sec.name+' copy';let name=base,n=2;while((project.reusableSections||[]).some(x=>x.name.toLowerCase()===name.toLowerCase()))name=base+' '+n++;
 s.id=engine.makeId();s.name=name;s.created=new Date().toISOString();project.reusableSections.push(s);return {ok:true,section:s};
}
const api={ACTIONS,OPS_MATH,OPS_COMPARE,identifier,literalNum,operand,plan,sectionAudit,renameSection,duplicateSection};
root.PyFlowGuidedV013=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
