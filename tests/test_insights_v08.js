const assert=require('node:assert/strict');
const {analyze,valueType}=require('../insights-v08.js');
assert.equal(valueType('30.0'),'number');
assert.equal(valueType("['a', 'b']"),'list');
assert.equal(valueType('True'),'boolean');
const project={nodes:[{id:'s',type:'start'},{id:'a',type:'set_var'},{id:'b',type:'math'},{id:'c',type:'print'},{id:'d',type:'print'}],dataLinks:[{from:'a',to:'b',input:'left',output:'price'}]};
const ports={outputs:n=>({a:[{name:'price'}],b:[{name:'total'}]})[n.id]||[]};
const events=[
 {line:2,event:'line',function:'<module>',variables:{}},
 {line:4,event:'line',function:'<module>',variables:{price:'200'}},
 {line:6,event:'line',function:'<module>',variables:{price:'200',total:'230.0'}},
 {line:7,event:'return',function:'<module>',variables:{price:'200',total:'230.0'}}
];
const r=analyze(project,{events,result:{stdout:'230.0\n',error:null}},{2:'a',4:'b',6:'c',7:'c'},ports);
assert.equal(r.executed,3);
assert.equal(r.reports.a.outputs[0].value,'200');
assert.equal(r.reports.b.outputs[0].value,'230.0');
assert.equal(r.reports.b.inputs[0].value,'200');
assert.equal(r.reports.d.status,'not-run');
assert.equal(r.reports.c.outputs.length,0);
const f=analyze(project,{events,result:{error:{kind:'ZeroDivisionError',message:'division by zero',line:4}}},{2:'a',4:'b',6:'c'},ports);
assert.equal(f.reports.b.status,'error');
assert.match(f.reports.b.error.help,/divide by zero/);
const e=analyze(project,{events:[],result:{error:{kind:'NameError',message:'x',line:5}}},{5:'b'},ports);
assert.equal(e.reports.b.status,'error');
assert.equal(e.executed,1);
const missing=analyze(project,{events,result:{error:{kind:'FileNotFoundError',message:'bad',line:999}}},{2:'a',4:'b',6:'c'},ports);
assert.equal(missing.failingBlock,null);
assert.deepEqual(r.reports.b.changes.map(v=>v.name),['total']);
console.log('PASS v0.8 action insights: 12 assertions, successes, data inputs, unexecuted branch and error guidance');
