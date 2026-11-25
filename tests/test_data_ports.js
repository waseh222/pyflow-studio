const assert=require('node:assert/strict');
const E=require('../engine.js');require('../module-engine.js');require('../bindings-v05.js');const P=require('../data-ports-v06.js');
function fixture(){
 const p=E.blank('Visual Data Connections');
 const s=E.makeNode('start',50,100),price=E.makeNode('set_var',300,100,{name:'price',kind:'Number',value:'200'}),rate=E.makeNode('set_var',550,100,{name:'rate',kind:'Number',value:'0.15'}),calc=E.makeNode('math',800,100,{name:'tax',left:'999',operator:'*',right:'999'}),show=E.makeNode('print',1050,100,{mode:'Text',value:'wrong'});
 p.nodes=[s,price,rate,calc,show];p.edges=p.nodes.slice(0,-1).map((n,i)=>({from:n.id,to:p.nodes[i+1].id,port:'next'}));return {p,s,price,rate,calc,show};
}
let {p,s,price,rate,calc,show}=fixture();
assert.equal(P.validate(p,{from:calc.id,output:'tax',to:price.id,input:'value'}).ok,false,'future step cannot feed earlier step');
assert.equal(P.validate(p,{from:price.id,output:'price',to:calc.id,input:'badfield'}).ok,false);
assert.equal(P.connect(p,{from:price.id,output:'price',to:calc.id,input:'left'}).ok,true);
assert.equal(P.connect(p,{from:rate.id,output:'rate',to:calc.id,input:'right'}).ok,true);
assert.equal(P.connect(p,{from:calc.id,output:'tax',to:show.id,input:'value'}).ok,true);
assert.equal(p.dataLinks.length,3);assert.equal(p.nodes.find(n=>n.id===show.id).params.value,'wrong','source project not mutated');
const generated=E.compile(p);assert.ok(generated.code.includes('tax = price * rate'));assert.ok(generated.code.includes('print(tax)'));assert.equal(generated.dataLinkCount,3);
const py=P.preparedProject(p).project;assert.equal(py.nodes.find(n=>n.id===show.id).params.mode,'Variable / expression');
P.disconnect(p,show.id,'value');assert.equal(p.dataLinks.length,2);assert.ok(E.compile(p).code.includes("print(\"wrong\")"));
const text=E.makeNode('set_var',300,100,{name:'message',kind:'Text',value:'Hi'});
p.nodes.splice(1,0,text);p.edges.push({from:s.id,to:text.id,port:'next'});p.edges.push({from:text.id,to:calc.id,port:'next'});
const warn=P.validate(p,{from:text.id,output:'message',to:calc.id,input:'left'});assert.equal(warn.ok,true);assert.ok(warn.warnings.some(x=>x.includes('expects number')));
const branch=E.blank('Branch scope');const b0=E.makeNode('start'),cond=E.makeNode('if'),a=E.makeNode('set_var',400,0,{name:'only_yes',kind:'Number',value:'20'}),other=E.makeNode('set_var',400,180,{name:'only_no',kind:'Number',value:'10'}),end=E.makeNode('math',680,100,{name:'total',left:'0',operator:'+',right:'1'});
branch.nodes=[b0,cond,a,other,end];branch.edges=[{from:b0.id,to:cond.id,port:'next'},{from:cond.id,to:a.id,port:'yes'},{from:cond.id,to:other.id,port:'no'},{from:a.id,to:end.id,port:'next'},{from:other.id,to:end.id,port:'next'}];
const v=P.validate(branch,{from:a.id,output:'only_yes',to:end.id,input:'left'});assert.equal(v.ok,true);assert.ok(v.warnings.some(x=>x.includes('every execution branch')));
const guided=E.templates.find(t=>t.id==='visual-invoice').create();const from=guided.nodes.find(n=>n.type==='set_var'&&n.params.name==='price'),target=guided.nodes.find(n=>n.type==='call');
assert.ok(P.connect(guided,{from:from.id,output:'price',to:target.id,input:'arg:price'}).ok);
assert.ok(E.compile(guided).code.includes('calculate_total(price, tax_rate)'));
const serial=JSON.parse(JSON.stringify(guided));assert.equal(serial.dataLinks.length,1,'JSON project retains data wires');
console.log('PASS v0.6 visual data sockets: independent control/data links, compilable Python, safe scope, type checks, guided arguments, JSON round trip');
