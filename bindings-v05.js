/* PyFlow Studio v0.5: dependency-aware, no-expression visual argument binding.
   Converts only known-safe values and upstream identifiers to Python code. */
(function(root){
'use strict';
const E=root.PyFlowEngine, M=root.PyFlowModules;
if(!E||!M)return;
const clone=M.clone;
const isId=M.validId;
const paramType=t=>['number','integer','text','boolean','list','any'].includes(t)?t:'any';
const defaultValue=t=>t==='text'?'':t==='boolean'?'False':t==='list'?'':t==='any'?'':'0';
const defaultBinding=(p)=>({name:p.name,source:'literal',type:paramType(p.type),value:defaultValue(p.type),variable:''});
const signature=(node,project)=>{
 const p=node.params||{},modules=project.visualModules||[];
 if(node.type==='call')return modules.find(m=>m.kind==='function'&&m.name===p.name)||null;
 if(node.type==='object')return modules.find(m=>m.kind==='class'&&m.name===p.class)||null;
 if(node.type==='method'){
   const ancestors=upstream(project,node.id);
   const obj=ancestors.map(x=>x.node).find(x=>x.type==='object'&&x.params.name===p.object);
   const cls=modules.find(m=>m.kind==='class'&&m.name===obj?.params.class);
   const method=cls?.methods.find(m=>m.name===p.method);
   return method?{...method,kind:'method',parent:cls.name}:null;
 }
 return null;
};
function upstream(project,nodeId){
 const nodes=new Map((project.nodes||[]).map(n=>[n.id,n])),edges=project.edges||[];
 const queue=[{id:nodeId,dist:0}],seen=new Set([nodeId]),found=[];
 while(queue.length){const {id,dist}=queue.shift();for(const edge of edges.filter(e=>e.to===id)){
  if(seen.has(edge.from))continue;seen.add(edge.from);const n=nodes.get(edge.from);if(!n)continue;
  found.push({node:n,dist:dist+1});queue.push({id:n.id,dist:dist+1});
 }}
 return found.sort((a,b)=>a.dist-b.dist);
}
const outputFields={
 set_var:[['name','kind']],math:[['name','number']],input:[['name','text']],convert:[['name','any']],
 string:[['name','text']],list_create:[['name','list']],sort:[['name','list']],dictionary:[['name','any']],
 regex:[['name','list']],call:[['result','any']],method:[['result','any']],object:[['name','object']],
 read_file:[['name','text']],json_read:[['name','any']],csv_read:[['name','list']],
 pandas_read:[['name','any']],pandas_clean:[['name','any']],pandas_filter:[['name','any']],pandas_group:[['name','any']],
 numpy:[['name','any']],request:[['name','any']],web_scrape:[['name','text']],flask_app:[['name','object']],
 sqlite_connect:[['name','any']],sqlite_fetch:[['result','list']],
 ml_iris:[['data','any'],['target','any']],ml_train:[['model','any']],
 datetime:[['name','any']],random:[['name','integer']],for:[['item','any']],
 list_comp:[['name','list']],lambda:[['name','any']]
};
function outputs(node,project){
 const p=node.params||{};let entries=outputFields[node.type]||[];
 let result=[];
 for(const [field,typ] of entries){const val=String(p[field]||'').trim();if(!isId(val))continue;
  let type=typ;
  if(typ==='kind')type=p.kind==='Text'?'text':p.kind==='Boolean'?'boolean':String(p.kind).includes('List')?'list':'number';
  if(node.type==='convert')type={str:'text',float:'number',int:'integer',bool:'boolean',list:'list',tuple:'any',set:'any'}[p.kind]||'any';
  if(field==='result'&&node.type==='call'){const f=(project.visualModules||[]).find(m=>m.kind==='function'&&m.name===p.name);type=f?.returnType||'any';}
  result.push({name:val,type,origin:node.type,nodeId:node.id});
 }
 return result;
}
function available(project,nodeId){const used=new Set(),acc=[];
 for(const {node,dist} of upstream(project,nodeId))for(const item of outputs(node,project)){
  if(used.has(item.name))continue;used.add(item.name);acc.push({...item,dist});
 }
 return acc;
}
function literalCode(binding,expected){
 const type=paramType(binding?.type||expected),value=String(binding?.value??'');
 if(type==='integer'){if(!/^[+-]?\d+$/.test(value.trim()))throw Error('Enter a whole number.');return BigInt(value.trim()).toString();}
 if(type==='number'){return M.codeValue({type:'number',value});}
 if(type==='text')return M.codeValue({type:'text',value});
 if(type==='boolean'){if(!['True','False'].includes(value))throw Error('Choose True or False.');return value;}
 if(type==='list')return '['+value.split(',').map(x=>x.trim()).filter(Boolean).map(x=>JSON.stringify(x)).join(', ')+']';
 return 'None';
}
function resolve(project,node){
 const p=node.params||{},warnings=[],sig=signature(node,project),vars=available(project,node.id),bindings=Array.isArray(p.bindings)?p.bindings:[];
 if(p.bindingMode!=='guided')return {args:p.args||'',warnings,signature:sig,vars};
 if(!sig){warnings.push(`${node.type==='method'?'Method':node.type==='object'?'Class':'Function'} at ${node.id} is missing or disconnected. Select a saved component.`);return {args:'',warnings,signature:sig,vars};}
 if(node.type==='object')return {args:'',warnings,signature:sig,vars}; // visual classes have zero-argument constructors
 const values=[];
 for(const param of sig.parameters||[]){
  const b=bindings.find(x=>x.name===param.name)||defaultBinding(param);
  if(b.source==='variable'){
   const found=vars.find(x=>x.name===b.variable);
   if(!found){warnings.push(`Input “${param.name}” of ${sig.name}: select a variable created earlier in the connected workflow.`);values.push('None');}
   else{
    if(param.type!=='any'&&found.type!=='any'&&found.type!=='object'&&found.type!==param.type&&!(param.type==='number'&&found.type==='integer'))warnings.push(`Input “${param.name}” expects ${param.type} but “${found.name}” is ${found.type}.`);
    values.push(found.name);
   }
  }else try{if(param.type!=='any'&&b.type!==param.type&&!(param.type==='number'&&b.type==='integer'))warnings.push(`Input “${param.name}” expects ${param.type} but was configured as ${b.type}.`);values.push(literalCode(b,param.type));}catch(e){warnings.push(`Input “${param.name}” of ${sig.name}: ${e.message}`);values.push('None');}
 }
 return {args:values.join(', '),warnings,signature:sig,vars};
}
const baseCompile=E.compile;
E.compile=function(project){
 let errors=[],p=project;
 if((project.nodes||[]).some(n=>n.params?.bindingMode==='guided')){
  p=E.clone(project);
  for(const n of p.nodes.filter(x=>x.params?.bindingMode==='guided')){
   const resolved=resolve(p,n);n.params.args=resolved.args;
   errors.push(...resolved.warnings);
  }
 }
 const result=baseCompile(p);
 result.warnings=[...result.warnings,...errors];
 result.guidedConnections=(project.nodes||[]).filter(n=>n.params?.bindingMode==='guided').length;
 return result;
};
const invoice=()=>{
 const p=E.blank('No-Code Invoice Calculator'),f=M.makeFunction();p.visualModules=[f];
 const s=E.makeNode('start',65,170),price=E.makeNode('set_var',325,170,{name:'price',kind:'Number',value:'200'}),rate=E.makeNode('set_var',595,170,{name:'tax_rate',kind:'Number',value:'0.15'}),call=E.makeNode('call',865,170,{name:f.name,args:'',result:'invoice_total',bindingMode:'guided',bindings:[{name:'price',source:'variable',type:'number',variable:'price',value:'0'},{name:'tax_rate',source:'variable',type:'number',variable:'tax_rate',value:'0'}]}),print=E.makeNode('print',1135,170,{mode:'Variable / expression',value:'invoice_total'});
 p.nodes=[s,price,rate,call,print];p.edges=[[s,price],[price,rate],[rate,call],[call,print]].map(([a,b])=>({from:a.id,to:b.id,port:'next'}));return p;
};
E.templates.push({id:'visual-invoice',title:'No-Code Invoice Calculator',icon:'◈',tag:'Guided function inputs',description:'Connect two saved values into a reusable function without writing Python.',create:invoice});

const objectInvoice=()=>{
 const p=E.blank('Visual Class Invoice App'),cls=M.makeClass();p.visualModules=[cls];
 const start=E.makeNode('start',65,185),price=E.makeNode('set_var',325,185,{name:'price',kind:'Number',value:'200'}),obj=E.makeNode('object',585,185,{name:'invoice',class:cls.name,args:''}),method=E.makeNode('method',845,185,{object:'invoice',method:'total',args:'',result:'invoice_total',bindingMode:'guided',bindings:[{name:'price',source:'variable',type:'number',variable:'price',value:'0'}]}),show=E.makeNode('print',1105,185,{mode:'Variable / expression',value:'invoice_total'});
 p.nodes=[start,price,obj,method,show];p.edges=[[start,price],[price,obj],[obj,method],[method,show]].map(([a,b])=>({from:a.id,to:b.id,port:'next'}));return p;
};
E.templates.push({id:'visual-objects',title:'Visual Class & Method',icon:'⬡',tag:'Guided OOP workflow',description:'Create an object, choose its method, and connect a saved value using menus.',create:objectInvoice});
root.PyFlowBindings={defaultBinding,defaultValue,upstream,available,signature,resolve,literalCode,outputs,invoice,objectInvoice};
if(typeof module!=='undefined'&&module.exports)module.exports=root.PyFlowBindings;
})(typeof window!=='undefined'?window:globalThis);
