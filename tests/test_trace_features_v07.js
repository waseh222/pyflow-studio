const assert=require('assert');
const E=require('../engine.js');require('../module-engine.js');const B=require('../bindings-v05.js');const P=require('../data-ports-v06.js');
assert.equal(E.templates.length,13,'version 0.7 should ship 13 real templates');
for(const tpl of E.templates){const p=tpl.create(),c=E.compile(p);assert(c.code.includes('# PYFLOW_NODE:'),tpl.id);assert(c.connectedCount>=1,tpl.id);}
const p=E.blank('DB visual ports');
const s=p.nodes[0],a=E.makeNode('sqlite_connect',200,200,{name:'my_db',path:':memory:'}),t=E.makeNode('sqlite_table',400,200,{conn:'conn'}),f=E.makeNode('sqlite_fetch',600,200,{conn:'conn'});
p.nodes=[s,a,t,f];p.edges=[[s,a],[a,t],[t,f]].map(([x,y])=>({from:x.id,to:y.id,port:'next'}));
const o=P.outputs(a,p);assert(o.some(x=>x.name==='my_db'));
const x={from:a.id,output:'my_db',to:t.id,input:'conn'};assert(P.validate(p,x).ok);P.connect(p,x);
assert(P.connect(p,{from:a.id,output:'my_db',to:f.id,input:'conn'}).ok);
let c=E.compile(p);assert(c.code.includes('my_db.execute('));
assert(!c.warnings.some(w=>w.includes('Data link ignored')));
const q=E.blank('ML visual ports'),n1=E.makeNode('ml_iris',200,100),n2=E.makeNode('ml_train',420,100);
q.nodes=[q.nodes[0],n1,n2];q.edges=[{from:q.nodes[0].id,to:n1.id,port:'next'},{from:n1.id,to:n2.id,port:'next'}];
assert(P.outputs(n1,q).some(x=>x.name==='X'));
assert(P.outputs(n1,q).some(x=>x.name==='y'));
assert(P.connect(q,{from:n1.id,output:'X',to:n2.id,input:'features'}).ok);
assert(P.connect(q,{from:n1.id,output:'y',to:n2.id,input:'labels'}).ok);
c=E.compile(q);assert(c.code.includes('train_test_split(X, y'));
const list=E.templates.find(t=>t.id==='visual-list-pipeline').create();assert.equal(list.dataLinks.length,2);
c=E.compile(list);assert(c.code.includes('sorted_fruits = sorted(fruits'));
const portArray=P.inputs(E.makeNode('json_write'),list);assert(portArray.some(x=>x.key==='value'));
// Out-of-order outputs cannot be wired into earlier statements.
const src=list.nodes.find(n=>n.type==='sort'),dst=list.nodes.find(n=>n.type==='list_create');
assert(!P.validate(list,{from:src.id,output:'sorted_fruits',to:dst.id,input:'values'}).ok);
console.log('PASS v0.7: 13 templates, source markers, repaired output names, SQLite + ML value ports, data-link order');
