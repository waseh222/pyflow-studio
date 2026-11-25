const assert = require('node:assert/strict');
const X=require('../expression.js');
const v=(type,value)=>({type,value});
const cases=[
 [{left:v('variable','price'),operator:'multiply',right:v('number','1.2')},'(price * 1.2)'],
 [{left:v('text','Hello "world"'),operator:'none'},'"Hello \\"world\\""'],
 [{left:v('variable','data'),operator:'contains',right:v('text','abc')},'("abc" in data)'],
 [{left:v('boolean','True'),operator:'and',right:v('boolean','False')},'(True and False)'],
 [{left:v('number','0'),operator:'none'},'0'],
];
for(const [p,want] of cases){const got=X.build(p);assert.ok(got.ok,got.message);assert.equal(got.code,want);}
assert.equal(X.build({left:v('variable','a-b'),operator:'none'}).ok,false);
assert.equal(X.build({left:v('number','not_a_number'),operator:'none'}).ok,false);
assert.equal(X.build({left:v('number','2'),operator:'divide',right:v('number','')}).ok,false);
console.log('PASS: 8 expression composer cases');
