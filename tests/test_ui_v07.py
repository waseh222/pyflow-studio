"""PyFlow Studio v0.7 desktop/mobile browser checks with real CPython trace fixtures.
The browser Worker API is mocked here because the network-only Pyodide CDN is unreachable
inside the test container. The recorder itself is tested against CPython separately.
"""
from pathlib import Path
import json
import time
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
source=(ROOT/'trace_runtime_v07.py').read_text()

def record(code):
    g={'_pyflow_source_text':code}
    exec(source,g,g)
    return json.loads(g['_pf_trace_result_json'])

html=(ROOT/'index.html').read_text(encoding='utf-8')
for css in ['styles.css','studio-v02.css','studio-v03.css','studio-v04.css','studio-v05.css','studio-v06.css','studio-v07.css']:
    html=html.replace(f'<link rel="stylesheet" href="{css}">',f'<style>{(ROOT/css).read_text(encoding="utf-8")}</style>')
for js in ['engine.js','expression.js','module-engine.js','bindings-v05.js','app.js','studio-v03.js','studio-v04.js','studio-v05.js','data-ports-v06.js','studio-v06.js','trace-worker-inline-v07.js','trace-ui-v07.js']:
    html=html.replace(f'<script src="{js}"></script>',f'<script>{(ROOT/js).read_text(encoding="utf-8")}</script>')

with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1680,'height':960},accept_downloads=True)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='load');page.wait_for_timeout(120)
    assert page.locator('#btn-trace').is_visible()
    assert page.evaluate('PyFlowEngine.templates.length')==13
    # Load the new collection/data wiring example.
    page.locator('#nav-templates').click()
    page.locator('[data-modal-template="visual-list-pipeline"]').click()
    p=page.evaluate('PyFlowStudio.getProject()')
    assert len(p['dataLinks'])==2,p
    assert page.evaluate('PyFlowTrace.preflight(PyFlowStudio.getProject()).errors.length')==0
    code=page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
    assert '# PYFLOW_NODE:' in code
    real=record(code)
    assert real['stdout'].strip()=="['apple', 'banana', 'mango']",real
    assert len(real['events'])>3
    page.evaluate('(fixture)=>{window.__traceFixture=fixture}',real)
    page.evaluate('''()=>{window.Worker=class TestWorker{
      constructor(){this.terminated=false;}
      postMessage(){setTimeout(()=>{if(this.terminated)return;
        this.onmessage({data:{kind:'stage',stage:'loading',message:'Loading the Python runtime...'}});
        this.onmessage({data:{kind:'stage',stage:'executing',message:'Executing Python...'}});
        this.onmessage({data:{kind:'complete',result:window.__traceFixture}});
      },45);}
      terminate(){this.terminated=true;}
    };}''')
    page.locator('#fit-workflow').click()
    page.screenshot(path=str(ROOT/'preview.png'))
    page.locator('#btn-trace').click()
    assert page.locator('#runtime-debugger').is_visible()
    assert 'not live pause-and-resume' in page.locator('.v7-trace-intro').inner_text()
    page.locator('[data-v7-action="run"]').click()
    page.wait_for_timeout(200)
    assert page.evaluate('PyFlowTrace.getState().status')=='complete',page.evaluate('PyFlowTrace.getState().message')
    assert 'recorded events' in page.locator('.v7-summary').inner_text()
    assert "['apple', 'banana', 'mango']" in page.locator('.v7-console').inner_text()
    # Scrub directly to a real executed line in the final print block.
    display=next(n for n in p['nodes'] if n['type']=='print')
    loc=page.evaluate('''(id)=>{
      const t=PyFlowTrace.getState();
      const map=PyFlowTrace.buildLineMap(PyFlowEngine.compile(PyFlowStudio.getProject()).code);
      return t.events.findIndex(ev=>map[ev.line]===id);
    }''',display['id'])
    assert loc>=0,real
    page.evaluate('(i)=>PyFlowTrace.move(i)',loc)
    assert 'Display output' in page.locator('.v7-current-node').inner_text()
    assert page.locator('.v7-trace-active').count()==1
    assert page.locator('.v7-code-line.current').count()==1
    assert 'sorted_fruits' in page.locator('.v7-var-list').inner_text()
    page.screenshot(path=str(ROOT/'preview_trace.png'))
    page.locator('[data-v7-action="prev"]').click()
    page.locator('[data-v7-action="next"]').click()
    page.locator('[data-v7-action="close"]').click()
    assert page.locator('#runtime-debugger').is_hidden()
    # Error inspection from real CPython generated program.
    page.evaluate('''()=>PyFlowStudio.update(p=>{
      const m=p.nodes.find(n=>n.type==='sort');
      m.type='math';m.params={name:'broken',left:'10',right:'0',operator:'/'};
      const old=p.dataLinks;p.dataLinks=[];
    })''')
    error_program=page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
    err=record(error_program)
    assert err['error']['kind']=='ZeroDivisionError',err
    page.evaluate('(fixture)=>window.__traceFixture=fixture',err)
    page.locator('#btn-trace').click();page.locator('[data-v7-action="run"]').click()
    page.wait_for_timeout(150)
    assert 'ZeroDivisionError' in page.locator('.v7-trace-error').inner_text()
    assert page.locator('.v7-stage.done').count()==1 # Python ran and produced an error, worker succeeded
    page.locator('[data-v7-action="close"]').click()
    assert not errors,errors
    mobile=browser.new_page(viewport={'width':390,'height':844});mobile_errors=[]
    mobile.on('pageerror',lambda e:mobile_errors.append(str(e)))
    mobile.set_content(html,wait_until='load');mobile.wait_for_timeout(90)
    assert mobile.locator('#btn-mobile-trace').is_visible()
    mobile.locator('#btn-mobile-trace').click()
    assert mobile.locator('#runtime-debugger').is_visible()
    assert mobile.locator('.v7-run-row button').count()==2
    mobile.screenshot(path=str(ROOT/'preview_mobile.png'))
    assert mobile.evaluate('document.documentElement.scrollWidth <= window.innerWidth+2')
    assert not mobile_errors,mobile_errors
    browser.close()
print('PASS v0.7 browser: 13 templates, real CPython trace displayed through worker API, navigation, node highlighting, errors, mobile layout')
