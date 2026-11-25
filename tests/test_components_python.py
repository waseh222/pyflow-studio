import ast
import subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
js=r'''
const E=require('./engine.js'),M=require('./module-engine.js');
const p=E.blank('Module Test');p.nodes=[];p.edges=[];
const f=M.makeFunction(),c=M.makeClass();p.visualModules=[f,c];
const s=E.makeNode('start',40,40),call=E.makeNode('call',280,40,{name:'calculate_total',args:'100, 0.15',result:'grand_total'}),display=E.makeNode('print',520,40,{mode:'Variable / expression',value:'grand_total'}),o=E.makeNode('object',740,40,{name:'invoice',class:'InvoiceCalculator'}),m=E.makeNode('method',960,40,{object:'invoice',method:'total',args:'200',result:'another_total'}),out=E.makeNode('print',1180,40,{mode:'Variable / expression',value:'another_total'});
p.nodes=[s,call,display,o,m,out];p.edges=[[s,call],[call,display],[display,o],[o,m],[m,out]].map(([a,b])=>({from:a.id,to:b.id,port:'next'}));
process.stdout.write(E.compile(p).code);
'''
result=subprocess.run(['node','-e',js],cwd=ROOT,capture_output=True,text=True,check=True)
code=result.stdout
ast.parse(code)
assert code.index('class InvoiceCalculator')<code.index('grand_total ='), 'Definitions must appear before calls'
run=subprocess.run(['python','-c',code],cwd=ROOT,capture_output=True,text=True,check=True)
assert run.stdout.splitlines()==['115.0','230.0'],run.stdout
print('PASS generated Python: functions and classes called from connected workflow, output:',run.stdout.replace('\n',', '))
