"""Runtime trace captures *actual* CPython line events with variable values, stdout and errors.
The identical recorder script is bundled in the Pyodide worker for browser execution.
"""
import ast
import json
import subprocess
from pathlib import Path
R=Path(__file__).resolve().parents[1]
source=(R/'trace_runtime_v07.py').read_text()
worker=(R/'trace-worker-v07.js').read_text()
assert json.dumps(source,ensure_ascii=False) in worker, 'Worker is not using the tested Python recorder.'

def record(code):
    namespace={'_pyflow_source_text':code}
    exec(source,namespace,namespace)
    return json.loads(namespace['_pf_trace_result_json'])

code='''# Generated visually by PyFlow Studio\n# PYFLOW_NODE:n_a\na = 14\n# PYFLOW_NODE:n_b\nb = 16\n# PYFLOW_NODE:n_c\nresult = a + b\n# PYFLOW_NODE:n_d\nprint(result)\n'''
ast.parse(code)
r=record(code)
assert r['error'] is None,r
assert r['stdout'].strip()=='30',r
assert len(r['events'])>=4,r
assert any(ev['variables'].get('result')=='30' for ev in r['events']),r
assert all(isinstance(ev['line'],int) for ev in r['events']),r
assert any(ev['line']==7 for ev in r['events']),r

err=record('''# PYFLOW_NODE:n_1\nx = 10\n# PYFLOW_NODE:n_2\ny = 0\n# PYFLOW_NODE:n_3\nresult = x / y\n''')
assert err['error']['kind']=='ZeroDivisionError',err
assert err['error']['line']==6,err
assert 'division by zero' in err['error']['message'],err

f=record('''# PYFLOW_NODE:n_one\ndef twice(value):\n    return value * 2\n# PYFLOW_NODE:n_two\nresult = twice(15)\nprint(result)\n''')
assert f['stdout'].strip()=='30',f
assert any(ev['function']=='twice' for ev in f['events']),f
assert any(ev['return']=='30' for ev in f['events'] if ev['function']=='twice'),f
print('PASS v0.7 real CPython trace recorder: execution lines, variables, function return, stdout and exception line')
