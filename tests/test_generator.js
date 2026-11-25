const assert=require('node:assert/strict');
const E=require('../engine.js');
assert.equal(E.defs.length,62);
for(const t of E.templates){const p=t.create(),compiled=E.compile(p);assert.equal(compiled.connectedCount,p.nodes.length,`unreachable nodes in ${t.id}`);assert.equal(compiled.warnings.length,0,`warnings in ${t.id}`);assert.ok(compiled.code.length>100);}
const p=E.templates[0].create(),c=E.compile(p);assert.match(c.code,/for sale in sales:/);assert.match(c.code,/if total > 5000:/);assert.match(c.code,/else:/);
console.log('PASS: block catalog and all 9 templates compile to code with no structural warnings');
