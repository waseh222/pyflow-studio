/* PyFlow Studio v0.4: schema-backed visual function/class builder + safe Python emitter.
   No eval, user-supplied expression execution, or external network access. */
(function(root){
'use strict';
const E=root.PyFlowEngine;
if(!E)return;
const RESERVED=new Set('False None True and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield'.split(' '));
const TYPES={number:'float',integer:'int',text:'str',boolean:'bool',list:'list',any:'object'};
const OPS={'+':'+','-':'-','*':'*','/':'/','//':'//','%':'%','**':'**'};
const CMP={'>':'>','>=':'>=','<':'<','<=':'<=','==':'==','!=':'!='};
const clone=x=>JSON.parse(JSON.stringify(x));
const validId=s=>/^[A-Za-z_][A-Za-z0-9_]*$/.test(String(s||''))&&!RESERVED.has(String(s));
const slug=(s,defaultName='value')=>validId(s)?s:defaultName;
const operand=(type='number',value='0')=>({type,value:String(value)});
const DEFAULTS={number:operand('number','0'),integer:operand('number','0'),text:operand('text',''),boolean:operand('boolean','False'),list:operand('variable','[]'),any:operand('none','')};
// Graph compiler may use text expressions. Our builder never does: all values are selected types.
function codeValue(o){
 const value=String(o?.value??''),type=o?.type||'number';
 if(type==='text')return JSON.stringify(value);
 if(type==='boolean')return value==='True'?'True':'False';
 if(type==='none')return 'None';
 if(type==='number'){if(value.trim()===''||!Number.isFinite(Number(value)))throw Error('Enter a valid number.');return String(Number(value));}
 if(type==='variable'&&/^(?:self\.)?[A-Za-z_][A-Za-z0-9_]*$/.test(value)&&!RESERVED.has(value))return value;
 if(type==='variable'&&value==='[]')return '[]';
 throw Error('Choose a valid variable. Only a name or self.attribute is accepted.');
}
const annotations=(params=[])=>params.map(p=>`${slug(p.name,'value')}: ${TYPES[p.type]||'object'}`).join(', ');
const dedupe=(items=[])=>{let names=items.map(x=>String(x.name||'').trim());return new Set(names).size===names.length};
function check(m){
 const errors=[];
 if(!m||!['function','class'].includes(m.kind))return ['Choose Function or Class.'];
 if(!validId(m.name))errors.push('Enter a Python-compatible name (letters, numbers, underscores).');
 if((m.name||'').startsWith('__'))errors.push('Names beginning with __ are reserved in this designer.');
 if(m.kind==='function')checkFunction(m,errors);
 else{
  if(m.base&&(!validId(m.base)||m.base===m.name))errors.push('Parent class must be a different valid class name.');
  if(!dedupe(m.attributes))errors.push('Attribute names must be unique.');
  for(const a of m.attributes||[]){if(!validId(a.name))errors.push('Invalid attribute name: '+(a.name||'(empty)'));try{codeValue(a.default)}catch(e){errors.push(`${a.name}: ${e.message}`)}}
  if(!dedupe(m.methods))errors.push('Method names must be unique.');
  for(const f of m.methods||[])checkFunction(f,errors);
 }
 return [...new Set(errors)];
}
function checkFunction(f,errors){
 if(!validId(f.name))errors.push('Invalid function or method name: '+(f.name||'(empty)'));
 if(!dedupe(f.parameters))errors.push(`${f.name}: Parameter names must be unique.`);
 for(const p of f.parameters||[]){if(!validId(p.name))errors.push(`${f.name}: Invalid parameter ${p.name||'(empty)'}`);if(p.name==='self')errors.push(`${f.name}: “self” is reserved for class methods.`)}
 for(const s of f.steps||[]){
  if(!['assign','calculate','attribute','print','return','choose'].includes(s.kind))errors.push(`${f.name}: Unsupported operation.`);
  if(['assign','calculate'].includes(s.kind)&&!validId(s.target))errors.push(`${f.name}: Enter a valid result variable.`);
  if(s.kind==='attribute'&&!validId(s.target))errors.push(`${f.name}: Enter a valid class attribute.`);
  try{if(s.kind==='assign'||s.kind==='print'||s.kind==='return'||s.kind==='attribute')codeValue(s.value);
   if(s.kind==='calculate'){codeValue(s.left);codeValue(s.right);if(!OPS[s.operator])throw Error('Select a supported calculation.')}
   if(s.kind==='choose'){[s.left,s.right,s.yes,s.no].forEach(codeValue);if(!CMP[s.operator])throw Error('Select a supported comparison.')}}catch(e){errors.push(`${f.name}: ${e.message}`)}
 }
}
function compileSteps(steps){
 const out=[];
 for(const s of steps||[]){
  if(s.kind==='assign')out.push(`${slug(s.target)} = ${codeValue(s.value)}`);
  if(s.kind==='calculate')out.push(`${slug(s.target)} = ${codeValue(s.left)} ${OPS[s.operator]||'+'} ${codeValue(s.right)}`);
  if(s.kind==='attribute')out.push(`self.${slug(s.target)} = ${codeValue(s.value)}`);
  if(s.kind==='print')out.push(`print(${codeValue(s.value)})`);
  if(s.kind==='return')out.push(`return ${codeValue(s.value)}`);
  if(s.kind==='choose')out.push(`if ${codeValue(s.left)} ${CMP[s.operator]||'=='} ${codeValue(s.right)}:`,`    return ${codeValue(s.yes)}`,'else:',`    return ${codeValue(s.no)}`);
 }
 return out.length?out:['pass'];
}
function indent(lines,n){return lines.map(s=>'    '.repeat(n)+s)}
function makeFunction(){return {id:E.makeId(),kind:'function',name:'calculate_total',description:'A reusable function made entirely from visual steps.',parameters:[{name:'price',type:'number'},{name:'tax_rate',type:'number'}],steps:[
 {id:E.makeId(),kind:'calculate',target:'tax',left:operand('variable','price'),operator:'*',right:operand('variable','tax_rate')},
 {id:E.makeId(),kind:'calculate',target:'total',left:operand('variable','price'),operator:'+',right:operand('variable','tax')},
 {id:E.makeId(),kind:'return',value:operand('variable','total')}
 ]};}
function makeClass(){return {id:E.makeId(),kind:'class',name:'InvoiceCalculator',description:'A reusable object with attributes and methods.',base:'',attributes:[{name:'tax_rate',type:'number',default:operand('number','0.15')}],methods:[{id:E.makeId(),kind:'function',name:'total',parameters:[{name:'price',type:'number'}],steps:[
 {id:E.makeId(),kind:'calculate',target:'tax',left:operand('variable','price'),operator:'*',right:operand('variable','self.tax_rate')},
 {id:E.makeId(),kind:'calculate',target:'total',left:operand('variable','price'),operator:'+',right:operand('variable','tax')},
 {id:E.makeId(),kind:'return',value:operand('variable','total')}
 ]}]};}
function makeStep(kind='assign'){
 const b={id:E.makeId(),kind,target:'result',operator:'+',value:operand('number','0'),left:operand('number','1'),right:operand('number','2'),yes:operand('text','Yes'),no:operand('text','No')};
 if(kind==='choose')b.operator='>';
 if(kind==='attribute')b.target='value';
 return b;
}
function compileOne(m){
 const errors=check(m);if(errors.length)throw Error(errors.join(' '));
 if(m.kind==='function'){
  const name=slug(m.name),pars=annotations(m.parameters);
  return [`def ${name}(${pars})${m.returnType&&m.returnType!=='any'?' -> '+(TYPES[m.returnType]||'object'):''}:`,
  ...indent([JSON.stringify(String(m.description||'Visual function').slice(0,220)),...compileSteps(m.steps)],1)].join('\n');
 }
 const declaration=`class ${slug(m.name)}${m.base?'('+slug(m.base)+')':''}:`;
 const lines=[declaration,`    ${JSON.stringify(String(m.description||'Visual class').slice(0,220))}`];
 if((m.attributes||[]).length){lines.push('    def __init__(self):');if(m.base)lines.push('        super().__init__()');for(const a of m.attributes)lines.push(`        self.${slug(a.name)} = ${codeValue(a.default)}`);}
 for(const method of m.methods||[]){lines.push('');lines.push(`    def ${slug(method.name)}(self${method.parameters.length?', '+annotations(method.parameters):''}):`);lines.push(...indent(compileSteps(method.steps),2));}
 if(!m.attributes?.length&&!m.methods?.length)lines.push('    pass');
 return lines.join('\n');
}
function compileAll(modules=[]){const errors=[],names=new Set(),snippets=[], ordered=[],visitState=new Map();
 const classes=new Map(modules.filter(m=>m.kind==='class').map(m=>[m.name,m]));
 function visit(m){if(visitState.get(m.id)===2)return;if(visitState.get(m.id)===1){errors.push(`Circular class inheritance involving ${m.name}`);return;}
  visitState.set(m.id,1);
  if(m.kind==='class'&&m.base){const base=classes.get(m.base);if(base)visit(base);else errors.push(`${m.name}: parent class ${m.base} does not exist in this project.`)}
  visitState.set(m.id,2);ordered.push(m);
 }
 for(const m of modules)visit(m);
 for(const m of ordered){if(names.has(m.name))errors.push(`Duplicate component name: ${m.name}`);names.add(m.name);try{snippets.push(compileOne(m))}catch(e){errors.push(`${m.name||'Untitled'}: ${e.message}`)}}
 return {code:snippets.join('\n\n\n'),warnings:errors};
}
const originalCompile=E.compile;
E.compile=function(project){const r=originalCompile(project),mods=(project&&Array.isArray(project.visualModules))?project.visualModules:[];
 if(!mods.length)return r;
 const extra=compileAll(mods);
 if(extra.warnings.length)r.warnings=[...r.warnings,...extra.warnings];
 if(!extra.code)return r;
 const lines=r.code.split('\n'),prefixLen=4+r.imports.length+(r.imports.length?1:0);
 r.code=[...lines.slice(0,prefixLen),'# Reusable components created visually',extra.code,'',...lines.slice(prefixLen)].join('\n');
 r.componentCount=mods.length;
 return r;
};
root.PyFlowModules={makeFunction,makeClass,makeStep,compileOne,compileAll,codeValue,validId,check,clone,TYPES,DEFAULTS};
if(typeof module!=='undefined'&&module.exports)module.exports=root.PyFlowModules;
})(typeof window!=='undefined'?window:globalThis);
