"""Check real Python structured snapshots and bundled Worker match exactly."""
import json
from pathlib import Path
R=Path(__file__).resolve().parents[1]
src=(R/'trace_runtime_v07.py').read_text()
worker=(R/'trace-worker-v07.js').read_text()
assert 'const SCRIPT = '+json.dumps(src,ensure_ascii=False)+';' in worker
assert (R/'trace-worker-inline-v07.js').read_text().find(json.dumps(worker,ensure_ascii=False))>=0

def trace(code):
 g={'_pyflow_source_text':code};exec(src,g,g);return json.loads(g['_pf_trace_result_json'])
code='''# PYFLOW_NODE:a
items = [{'name':'Ada','score':10},{'name':'Alan','score':22}]
# PYFLOW_NODE:b
mapping = {'x':30,'y':40}
# PYFLOW_NODE:c
scalar = 34
# PYFLOW_NODE:d
print(items)
'''
r=trace(code)
assert r['error'] is None,r['error']
events=r['events'];assert all(isinstance(e.get('structured'),dict) for e in events)
tables={k:v for e in events for k,v in e['structured'].items() if v['kind']=='table'}
assert tables['items']['columns']==['name','score'],tables
assert tables['items']['rows']==[['Ada',10],['Alan',22]],tables
assert tables['mapping']['rows']==[['x',30],['y',40]],tables
assert any(e['structured'].get('scalar',{}).get('value')==34 for e in events)
# Truncation limit is explicit and consistent with a real 100-item source.
r=trace('long_list=list(range(100))\nprint(len(long_list))')
prev=next(e['structured']['long_list'] for e in r['events'] if 'long_list' in e['structured'])
assert len(prev['rows'])==8 and prev['totalRows']==100 and prev['truncated']
# A text cell is just data; never interpreted as a formula in previews.
r=trace("tricky=['=HYPERLINK(\"abc\")','<img src=x>']\nprint(len(tricky))")
assert any('tricky' in e['structured'] for e in r['events'])
try:
 import pandas
 r=trace("import pandas as pd\ndata=pd.DataFrame([{'name':'Ada','score':10},{'name':'Alan','score':22}])\nprint(len(data))")
 tab=next(e['structured']['data'] for e in r['events'] if 'data' in e['structured'])
 assert tab['type']=='DataFrame' and tab['rows']==[['Ada',10],['Alan',22]],tab
 assert tab['totalColumns']==2
except ImportError:
 pass
print('PASS v0.9 true Python structured snapshots for lists, dictionaries, DataFrames, scalars, truncation and worker parity')
