"""v0.9 desktop/mobile interactions, with real CPython traces passed through a mocked Worker."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
recorder=(R/'trace_runtime_v07.py').read_text()
def record(code):
 g={'_pyflow_source_text':code};exec(recorder,g,g);return json.loads(g['_pf_trace_result_json'])
css=['styles.css','studio-v02.css','studio-v03.css','studio-v04.css','studio-v05.css','studio-v06.css','studio-v07.css','studio-v08.css','studio-v09.css']
js=['engine.js','expression.js','module-engine.js','bindings-v05.js','app.js','studio-v03.js','studio-v04.js','studio-v05.js','data-ports-v06.js','studio-v06.js','trace-worker-inline-v07.js','trace-ui-v07.js','insights-v08.js','data-explorer-v09.js']
html=(R/'index.html').read_text()
for name in css:html=html.replace(f'<link rel="stylesheet" href="{name}">',f'<style>{(R/name).read_text()}</style>')
for name in js:html=html.replace(f'<script src="{name}"></script>',f'<script>{(R/name).read_text()}</script>')
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1680,'height':960},accept_downloads=True)
 errors=[];page.on('pageerror',lambda x:errors.append(str(x)))
 page.set_content(html,wait_until='load');page.wait_for_timeout(160)
 assert page.evaluate('typeof PyFlowDataExplorer.open')=='function'
 page.locator('#nav-templates').click()
 page.locator('[data-modal-template="visual-list-pipeline"]').click()
 project=page.evaluate('PyFlowStudio.getProject()')
 code=page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
 fixture=record(code)
 assert fixture['error'] is None
 assert any('sorted_fruits' in e['structured'] for e in fixture['events'])
 page.evaluate('(v)=>window.__fixture=v',fixture)
 page.evaluate('''()=>{window.Worker=class TestWorker{constructor(){this.terminated=false}
 postMessage(){setTimeout(()=>{if(!this.terminated)this.onmessage({data:{kind:'complete',result:window.__fixture}})},20)}
 terminate(){this.terminated=true}};}''')
 page.locator('#btn-trace').click();page.locator('[data-v7-action="run"]').click()
 page.wait_for_timeout(180)
 assert page.evaluate('PyFlowTrace.getState().status')=='complete'
 assert page.locator('.v9-canvas-browse').count()>=2,page.locator('.canvas-node').all_inner_texts()
 browse=page.locator('.v9-canvas-browse').first
 browse.click();page.wait_for_timeout(60)
 assert page.locator('#v9-explorer').is_visible()
 assert page.locator('.v9-table tbody tr').count()==3
 assert 'apple' in page.locator('.v9-table').inner_text()
 page.screenshot(path=str(R/'preview_data_explorer.png'))
 page.locator('#v9-filter').fill('banana')
 assert page.locator('.v9-table tbody tr').count()==1
 with page.expect_download() as d:
  page.locator('[data-v9-action="export"]').click()
 assert d.value.suggested_filename.endswith('-recorded-sample.csv')
 page.locator('.v9-close').click()
 assert page.locator('#v9-explorer').is_hidden()
 page.locator('[data-v7-action="close"]').click()
 page.locator('#fit-workflow').click()
 page.screenshot(path=str(R/'preview.png'))
 page.locator('#btn-trace').click()
 # Data previews must vanish after workflow changes and stale trace can't be reused.
 page.evaluate('''()=>PyFlowStudio.update(p=>{p.nodes.find(n=>n.type==='list_create').params.values='pear, guava';})''')
 assert page.locator('.v9-canvas-browse').count()==0
 # Error trace with actionable guide and direct settings navigation.
 page.evaluate('''()=>PyFlowStudio.update(p=>{const n=p.nodes.find(n=>n.type==='sort');n.type='math';n.params={name:'bad',left:'5',right:'0',operator:'/'};p.dataLinks=[];})''')
 errorcode=page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
 err=record(errorcode);assert err['error']['kind']=='ZeroDivisionError'
 page.evaluate('(v)=>window.__fixture=v',err)
 page.locator('[data-v7-action="close"]').click();page.locator('#btn-trace').click();page.locator('[data-v7-action="run"]').click();page.wait_for_timeout(160)
 assert page.locator('.v9-guided-plan').count()==1
 assert 'Check the divisor' in page.locator('.v9-guided-plan').inner_text()
 page.screenshot(path=str(R/'preview_guided_error.png'))
 bad_id=next(n['id'] for n in page.evaluate('PyFlowStudio.getProject()')['nodes'] if n['type']=='math')
 page.locator('[data-v9-settings]').click()
 assert page.evaluate('PyFlowStudio.selected()')==bad_id
 assert page.locator('#runtime-debugger').is_hidden()
 assert not errors,errors
 mobile=browser.new_page(viewport={'width':390,'height':844})
 mobile_errors=[];mobile.on('pageerror',lambda x:mobile_errors.append(str(x)))
 mobile.set_content(html,wait_until='load');mobile.wait_for_timeout(100)
 assert mobile.evaluate('typeof PyFlowDataExplorer.open')=='function'
 mobile.locator('#btn-mobile-trace').click()
 assert mobile.locator('#runtime-debugger').is_visible()
 assert mobile.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2')
 mobile.screenshot(path=str(R/'preview_mobile.png'))
 assert not mobile_errors,mobile_errors
 browser.close()
print('PASS v0.9 browser: real structured trace, table search, sample CSV, edit invalidation, guided settings, mobile')
