"""Generate a real workflow with visual data links, then run exported Python."""
import subprocess, pathlib, shutil, ast
ROOT=pathlib.Path(__file__).resolve().parents[1]
js=r'''const E=require('./engine.js');require('./module-engine.js');require('./bindings-v05.js');const P=require('./data-ports-v06.js');
const p=E.blank('Wired calculator'),s=E.makeNode('start',65,165),a=E.makeNode('set_var',310,165,{name:'price',kind:'Number',value:'200'}),b=E.makeNode('set_var',555,165,{name:'rate',kind:'Number',value:'0.15'}),m=E.makeNode('math',800,165,{name:'tax',left:'999',operator:'*',right:'999'}),o=E.makeNode('print',1045,165,{mode:'Text',value:'placeholder'});
p.nodes=[s,a,b,m,o];p.edges=p.nodes.slice(0,-1).map((n,i)=>({from:n.id,to:p.nodes[i+1].id,port:'next'}));
for(const [from,output,to,input] of [[a,'price',m,'left'],[b,'rate',m,'right'],[m,'tax',o,'value']]){let x=P.connect(p,{from:from.id,output,to:to.id,input});if(!x.ok)throw Error(x.reason);}
const r=E.compile(p);if(r.warnings.length)throw Error(r.warnings.join('; '));process.stdout.write(r.code);
'''
run=subprocess.run(['node','-e',js],cwd=ROOT,check=True,text=True,capture_output=True)
ast.parse(run.stdout)
process=subprocess.run(['python','-c',run.stdout],check=True,text=True,capture_output=True)
assert process.stdout.strip()=='30.0', process.stdout
print('PASS compiled real Python with 3 visual data links: output =',process.stdout.strip())
