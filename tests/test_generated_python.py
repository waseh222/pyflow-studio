import ast, json, subprocess, sys
from pathlib import Path
base=Path(__file__).resolve().parent
engine=base.parent/'engine.js'
source="""const E=require(process.argv[1]); process.stdout.write(JSON.stringify(E.templates.map(t=>({id:t.id,...E.compile(t.create())}))));"""
result=subprocess.run(['node','-e',source,str(engine)],capture_output=True,text=True,check=True)
for x in json.loads(result.stdout):
    ast.parse(x['code'],filename=x['id']+'.py')
    print('Syntax OK:',x['id'])
for id,expected in [('sales','6800'),('starter','Hello, World!'),('text','WELCOME TO PYFLOW'),('oop',"'name': None")]:
    script=next(x['code'] for x in json.loads(result.stdout) if x['id']==id)
    r=subprocess.run([sys.executable,'-c',script],capture_output=True,text=True,timeout=10)
    assert r.returncode==0,(id,r.stderr)
    assert expected in r.stdout,(id,r.stdout)
    print('Execution OK:',id, '=>',r.stdout.strip()[:65])
print('PASS: Python syntax valid for all 9 templates, and 4 standard-library examples execute')
