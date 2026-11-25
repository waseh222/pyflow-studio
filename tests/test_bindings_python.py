from pathlib import Path
import subprocess,ast
root=Path(__file__).resolve().parents[1]
script="const E=require('./engine.js'),M=require('./module-engine.js'),B=require('./bindings-v05.js');process.stdout.write(E.compile(B.invoice()).code)"
r=subprocess.run(['node','-e',script],cwd=root,text=True,capture_output=True,check=True)
ast.parse(r.stdout)
run=subprocess.run(['python','-c',r.stdout],capture_output=True,text=True,check=True)
assert run.stdout.strip()=='230.0',run.stdout
script2="const E=require('./engine.js'),M=require('./module-engine.js'),B=require('./bindings-v05.js');process.stdout.write(E.compile(B.objectInvoice()).code)"
r2=subprocess.run(['node','-e',script2],cwd=root,text=True,capture_output=True,check=True)
ast.parse(r2.stdout)
run2=subprocess.run(['python','-c',r2.stdout],capture_output=True,text=True,check=True)
assert run2.stdout.strip()=='230.0',run2.stdout
print('PASS: visual function and class method workflows execute in Python, each returning 230.0')
