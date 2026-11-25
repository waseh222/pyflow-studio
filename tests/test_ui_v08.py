"""v0.8: block result UI renders actual CPython recordings and invalidates stale results.
Worker is mocked with real CPython test fixtures because CDN access is unavailable here.
"""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
recorder=(ROOT/'trace_runtime_v07.py').read_text()
def record(code):
    g={'_pyflow_source_text':code};exec(recorder,g,g)
    return json.loads(g['_pf_trace_result_json'])
html=(ROOT/'index.html').read_text()
for stylesheet in ['styles.css','studio-v02.css','studio-v03.css','studio-v04.css','studio-v05.css','studio-v06.css','studio-v07.css','studio-v08.css']:
    html=html.replace(f'<link rel="stylesheet" href="{stylesheet}">',f'<style>{(ROOT/stylesheet).read_text()}</style>')
for js in ['engine.js','expression.js','module-engine.js','bindings-v05.js','app.js','studio-v03.js','studio-v04.js','studio-v05.js','data-ports-v06.js','studio-v06.js','trace-worker-inline-v07.js','trace-ui-v07.js','insights-v08.js']:
    html=html.replace(f'<script src="{js}"></script>',f'<script>{(ROOT/js).read_text()}</script>')
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1680,'height':950},accept_downloads=True)
    errors=[];page.on('pageerror',lambda x:errors.append(str(x)))
    page.set_content(html,wait_until='load');page.wait_for_timeout(150)
    assert page.evaluate('typeof PyFlowInsights.analyze')=='undefined'  # pure API exposed separately
    assert page.evaluate('typeof PyFlowInsightsCore.analyze')=='function'
    assert page.locator('.v8-node-summary').count()==0
    page.locator('#nav-templates').click()
    page.locator('[data-modal-template="visual-list-pipeline"]').click()
    project=page.evaluate('PyFlowStudio.getProject()')
    source=page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
    fixture=record(source)
    assert fixture['stdout'].strip()=="['apple', 'banana', 'mango']"
    page.evaluate('(v)=>window.__realTraceFixture=v',fixture)
    page.evaluate('''()=>{window.Worker=class TestWorker{
      constructor(){this.terminated=false;}
      postMessage(){setTimeout(()=>{if(this.terminated)return;
        this.onmessage({data:{kind:'stage',stage:'executing',message:'Running Python...'}});
        this.onmessage({data:{kind:'complete',result:window.__realTraceFixture}});
      },20)}
      terminate(){this.terminated=true;}
    };}''')
    page.locator('#fit-workflow').click()
    page.locator('#btn-trace').click();page.locator('[data-v7-action="run"]').click()
    page.wait_for_timeout(160)
    assert page.evaluate('PyFlowTrace.getState().status')=='complete'
    assert page.locator('.v8-node-summary.executed').count()>=3
    assert page.locator('.v8-node-summary.error').count()==0
    assert 'sorted_fruits' in page.locator('.v8-node-summary').all_inner_texts()[-2],page.locator('.v8-node-summary').all_inner_texts()
    info=page.evaluate('PyFlowInsights.current().analysis')
    assert info['executed']>=3
    sort_id=next(n['id'] for n in project['nodes'] if n['type']=='sort')
    sort_result=page.locator(f'[data-node="{sort_id}"] .v8-node-summary')
    assert 'sorted_fruits' in sort_result.inner_text()
    page.locator('[data-v7-action="close"]').click()
    sort_result.click()
    page.wait_for_timeout(60)
    assert 'Block data preview' in page.locator('#runtime-debugger').inner_text()
    assert 'produced / changed values' in page.locator('#runtime-debugger').inner_text().lower()
    assert page.locator('.v7-trace-active').count()==1
    page.screenshot(path=str(ROOT/'preview_insights.png'))
    page.locator('[data-v7-action="close"]').click()
    assert page.locator(f'[data-node="{sort_id}"] .v8-node-summary').count()==1
    page.locator('#fit-workflow').click()
    page.screenshot(path=str(ROOT/'preview.png'))
    # Editing the program makes old trace cards invalid; results must not be misrepresented.
    page.evaluate('''()=>PyFlowStudio.update(p=>{const n=p.nodes.find(x=>x.type==='list_create');n.params.values='pear, banana';})''')
    assert page.locator('.v8-node-summary').count()==0
    page.locator('#btn-trace').click()
    assert 'earlier version of the workflow' in page.locator('.v8-stale').inner_text()
    page.locator('[data-v7-action="close"]').click()
    # Failing program: accurate error badge and grounded guidance.
    page.evaluate('''()=>PyFlowStudio.update(p=>{const n=p.nodes.find(x=>x.type==='sort');n.type='math';n.params={name:'broken',left:'10',right:'0',operator:'/'};p.dataLinks=[];})''')
    fail_src=page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
    fail_fixture=record(fail_src)
    assert fail_fixture['error']['kind']=='ZeroDivisionError'
    page.evaluate('(v)=>window.__realTraceFixture=v',fail_fixture)
    page.locator('#btn-trace').click();page.locator('[data-v7-action="run"]').click();page.wait_for_timeout(150)
    assert page.locator('.v8-node-summary.error').count()==1
    assert 'division by zero' in page.locator('.v7-trace-error').inner_text()
    assert 'Check the divisor' in page.locator('.v8-error-advice').inner_text()
    page.screenshot(path=str(ROOT/'preview_error.png'))
    assert not errors,errors
    # Mobile panel scroll and node chip after traced fixture.
    mobile=browser.new_page(viewport={'width':390,'height':844})
    mobile_errors=[];mobile.on('pageerror',lambda x:mobile_errors.append(str(x)))
    mobile.set_content(html,wait_until='load');mobile.wait_for_timeout(120)
    mobile.locator('#btn-mobile-trace').click()
    assert mobile.locator('#runtime-debugger').is_visible()
    mobile.screenshot(path=str(ROOT/'preview_mobile.png'))
    assert mobile.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2')
    assert not mobile_errors,mobile_errors
    browser.close()
print('PASS v0.8 browser: real CPython node previews, trace navigation, stale invalidation, error guidance, mobile')
