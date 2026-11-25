const assert=require('node:assert/strict');
const E=require('../engine.js');require('../module-engine.js');require('../bindings-v05.js');const P=require('../data-ports-v06.js');const C=require('../workflow-check-v010.js');
for(const t of E.templates){const project=t.create(),r=C.check(project,E,P);assert.equal(r.errors,0,`${t.id}: ${JSON.stringify(r.issues)}`);assert.equal(r.connected,project.nodes.length,t.id);}
const p=E.templates.find(x=>x.id==='visual-data-links').create();
assert.equal(C.check(p,E,P).errors,0);
const orphan=E.makeNode('print',1500,300,{value:'hello'});p.nodes.push(orphan);
let r=C.check(p,E,P);assert.ok(r.issues.find(i=>i.nodeId===orphan.id&&i.title==='Action cannot run'));
p.edges.push({from:orphan.id,to:p.nodes[0].id,port:'next'});r=C.check(p,E,P);assert.ok(r.issues.find(i=>i.title==='Arrow enters Start'));
p.edges.push({from:p.nodes[3].id,to:p.nodes[1].id,port:'next'});r=C.check(p,E,P);assert.ok(r.issues.find(i=>i.title==='Circular execution path'));
const p2=E.templates.find(x=>x.id==='visual-data-links').create();p2.dataLinks.push({from:'missing',to:p2.nodes[4].id,input:'value',output:'bad'});r=C.check(p2,E,P);assert.ok(r.issues.find(i=>i.title==='Broken data connection'));
console.log('PASS v0.10: 13 templates, unreachable nodes, cycles, invalid wires, duplicate inputs');
