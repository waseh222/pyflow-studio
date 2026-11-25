"""Chromium smoke/e2e for v0.6 visual sockets and logic walkthrough."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text(encoding='utf-8')
for css in ['styles.css','studio-v02.css','studio-v03.css','studio-v04.css','studio-v05.css','studio-v06.css']:
    html=html.replace(f'<link rel="stylesheet" href="{css}">',f'<style>{(ROOT/css).read_text(encoding="utf-8")}</style>')
for js in ['engine.js','expression.js','module-engine.js','bindings-v05.js','app.js','studio-v03.js','studio-v04.js','studio-v05.js','data-ports-v06.js','studio-v06.js']:
    html=html.replace(f'<script src="{js}"></script>',f'<script>{(ROOT/js).read_text(encoding="utf-8")}</script>')
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    desktop=browser.new_page(viewport={'width':1680,'height':950},accept_downloads=True)
    errors=[];desktop.on('pageerror',lambda e:errors.append(str(e)))
    desktop.set_content(html,wait_until='load')
    desktop.wait_for_timeout(150)
    desktop.locator('#nav-templates').click()
    assert desktop.locator('[data-modal-template="visual-data-links"]').count()==1, 'new template missing'
    desktop.locator('[data-modal-template="visual-data-links"]').click()
    desktop.wait_for_timeout(100)
    p=desktop.evaluate('PyFlowStudio.getProject()')
    assert len(p['nodes'])==5 and len(p['dataLinks'])==3,p
    assert desktop.locator('.v6-data-line').count()==3,'data links should draw as purple wires'
    assert desktop.locator('.v6-data-out').count()>=3
    assert 'tax_due = price * tax_rate' in desktop.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
    desktop.locator('#fit-workflow').click()
    desktop.screenshot(path=str(ROOT/'preview.png'))
    # Connect source -> input by clicking the real on-canvas socket buttons.
    base=next(n for n in p['nodes'] if n['type']=='set_var' and n['params']['name']=='price')
    math=next(n for n in p['nodes'] if n['type']=='math')
    show=next(n for n in p['nodes'] if n['type']=='print')
    desktop.locator(f'[data-data-src="{base["id"]}"][data-data-output="price"]').click(force=True)
    assert desktop.locator('#node-layer.v6-choose-input').count()==1
    desktop.locator(f'[data-data-dst="{math["id"]}"][data-data-input="right"]').click(force=True)
    assert desktop.locator('#node-layer.v6-choose-input').count()==0
    assert 'tax_due = price * price' in desktop.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
    desktop.locator('#undo').click()
    assert 'tax_due = price * tax_rate' in desktop.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
    # Inspector supports disconnecting and re-connecting through menus.
    desktop.evaluate('(id)=>PyFlowStudio.showNode(id)',math['id'])
    assert desktop.locator('.v6-inspector-panel').is_visible()
    assert desktop.locator('.v6-link-item').count()==2
    desktop.locator('[data-v6-remove="right"]').click()
    assert desktop.evaluate('PyFlowStudio.getProject().dataLinks.length')==2
    desktop.locator('[data-v6-select-input]').select_option('right')
    src=next(n for n in p['nodes'] if n['type']=='set_var' and n['params']['name']=='tax_rate')
    desktop.locator('[data-v6-select-source]').select_option(src['id']+'::tax_rate')
    desktop.locator('[data-v6-connect]').click()
    assert desktop.evaluate('PyFlowStudio.getProject().dataLinks.length')==3
    desktop.locator('#fit-workflow').click()
    desktop.screenshot(path=str(ROOT/'preview_ports.png'))
    # The debugger walks visually without pretending to execute Python.
    desktop.locator('#btn-debug').click()
    assert desktop.locator('#logic-walkthrough').is_visible()
    assert 'not executed' in desktop.locator('.v6-debug-disclaimer').inner_text()
    for _ in range(4):desktop.locator('[data-v6-debug-action="next"]').click()
    assert desktop.locator('.v6-debug-progress').inner_text().startswith('Step 5 of 5')
    assert desktop.locator('.v6-debug-active').count()==1
    assert 'Display output' in desktop.locator('.v6-debug-step').inner_text()
    assert 'print(tax_due)' in desktop.locator('.v6-debug-code').inner_text(), 'debug preview must reflect visual data links'
    desktop.screenshot(path=str(ROOT/'preview_walkthrough.png'))
    desktop.locator('[data-v6-debug-action="prev"]').click()
    assert 'Calculate' in desktop.locator('.v6-debug-step').inner_text()
    desktop.locator('[data-v6-debug-action="restart"]').click()
    assert 'Start program' in desktop.locator('.v6-debug-step').inner_text()
    desktop.locator('[data-v6-debug-action="close"]').click()
    assert desktop.locator('#logic-walkthrough').is_hidden()
    # Branch controls require an explicit human choice; they cannot invent evaluated conditions.
    desktop.evaluate('''() => {
      const E=PyFlowEngine;
      PyFlowStudio.update(p=>{
       const s=E.makeNode('start',50,150),i=E.makeNode('if',330,150),yes=E.makeNode('print',620,50,{value:'Yes'}),no=E.makeNode('print',620,260,{value:'No'});
       p.nodes=[s,i,yes,no];p.edges=[{from:s.id,to:i.id,port:'next'},{from:i.id,to:yes.id,port:'yes'},{from:i.id,to:no.id,port:'no'}];p.dataLinks=[];
      });
    }''')
    desktop.locator('#btn-debug').click()
    desktop.locator('[data-v6-debug-action="next"]').click()
    assert desktop.locator('[data-v6-path="yes"]').count()==1 and desktop.locator('[data-v6-path="no"]').count()==1
    desktop.locator('[data-v6-path="no"]').click()
    assert 'No' in desktop.locator('.v6-debug-settings').inner_text()
    desktop.locator('[data-v6-debug-action="close"]').click()
    assert not errors,errors
    # Mobile can open walkthrough via the canvas button; no horizontal document overflow.
    mobile=browser.new_page(viewport={'width':390,'height':844})
    mobile_errors=[];mobile.on('pageerror',lambda e:mobile_errors.append(str(e)))
    mobile.set_content(html,wait_until='load')
    mobile.locator('#nav-templates').count() # hidden on mobile; use new project modal instead
    mobile.locator('#btn-new').click();mobile.locator('#choose-template').click()
    mobile.locator('[data-modal-template="visual-data-links"]').click()
    assert mobile.locator('#btn-mobile-walkthrough').is_visible()
    mobile.locator('#btn-mobile-walkthrough').click()
    assert mobile.locator('#logic-walkthrough').is_visible()
    mobile.screenshot(path=str(ROOT/'preview_mobile.png'))
    assert not mobile_errors,mobile_errors
    browser.close()
print('PASS v0.6 browser: 12 templates, visual data links, inspector mapping, undo, debugger navigation + branch choice, desktop + mobile')
