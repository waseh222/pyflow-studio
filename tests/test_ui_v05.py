from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text()
for css in ['styles.css','studio-v02.css','studio-v03.css','studio-v04.css','studio-v05.css']:
    html=html.replace(f'<link rel="stylesheet" href="{css}">',f'<style>{(ROOT/css).read_text()}</style>')
for js in ['engine.js','expression.js','module-engine.js','bindings-v05.js','app.js','studio-v03.js','studio-v04.js','studio-v05.js']:
    html=html.replace(f'<script src="{js}"></script>',f'<script>{(ROOT/js).read_text()}</script>')
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1680,'height':950},device_scale_factor=1,accept_downloads=True)
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.set_content(html,wait_until='load')
    page.wait_for_timeout(230)
    assert page.locator('.canvas-node').count()==9
    page.locator('#nav-templates').click()
    assert page.locator('[data-modal-template="visual-invoice"]').count()==1
    page.locator('[data-modal-template="visual-invoice"]').click()
    page.wait_for_timeout(250)
    p=page.evaluate('PyFlowStudio.getProject()')
    assert len(p['nodes'])==5 and len(p['visualModules'])==1
    call=next(n for n in p['nodes'] if n['type']=='call')
    page.evaluate('(id)=>PyFlowStudio.showNode(id)',call['id'])
    assert page.locator('.v5-inspector').is_visible()
    assert page.locator('[data-v5-source="price"]').input_value()=='variable'
    assert page.locator('[data-v5-var="tax_rate"]').input_value()=='tax_rate'
    assert 'invoice_total = calculate_total(price, tax_rate)' in page.locator('.v5-preview code').inner_text()
    assert 'invoice_total = calculate_total(price, tax_rate)' in page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
    page.locator('#toast').evaluate('(el)=>el.classList.remove("show")')
    page.locator('#fit-workflow').click()
    page.screenshot(path=str(ROOT/'preview.png'))
    # One input switches to a typed, safe literal.
    page.locator('[data-v5-source="price"]').select_option('literal')
    page.locator('[data-v5-value="price"]').fill('450')
    page.locator('[data-v5-value="price"]').press('Tab')
    assert 'calculate_total(450, tax_rate)' in page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
    page.locator('#toast').evaluate('(el)=>el.classList.remove("show")')
    page.screenshot(path=str(ROOT/'preview_mapping.png'))
    # Invalid upstream mapping is warned about and cannot inject arbitrary Python.
    page.locator('[data-v5-source="price"]').select_option('variable')
    page.locator('[data-v5-var="price"]').select_option('tax_rate')
    assert 'calculate_total(tax_rate, tax_rate)' in page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
    page.locator('[data-v5-action="auto"]').click()
    assert 'calculate_total(price, tax_rate)' in page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
    with page.expect_download() as dl:page.locator('#btn-download-py').click()
    assert dl.value.suggested_filename.endswith('.py')
    page.locator('#btn-component-nav').click()
    assert page.locator('#component-overlay').is_visible()
    page.locator('#toast').evaluate('(el)=>el.classList.remove("show")')
    page.screenshot(path=str(ROOT/'preview_designer.png'))
    page.locator('#component-close').click()
    page.locator('#btn-focus').click(); assert page.locator('body.focus-mode').count()==1
    page.locator('#toast').evaluate('(el)=>el.classList.remove("show")')
    page.screenshot(path=str(ROOT/'preview_focus.png'))
    # Guided class method: object and method choices are derived from connected, saved components.
    page.locator('#btn-focus').click()
    page.locator('#nav-templates').click()
    page.locator('[data-modal-template="visual-objects"]').click()
    class_project=page.evaluate('PyFlowStudio.getProject()')
    method=next(n for n in class_project['nodes'] if n['type']=='method')
    page.evaluate('(id)=>PyFlowStudio.showNode(id)',method['id'])
    assert page.locator('[data-v5-key="object"]').input_value()=='invoice'
    assert page.locator('[data-v5-key="method"]').input_value()=='total'
    assert page.locator('[data-v5-var="price"]').input_value()=='price'
    assert 'invoice_total = invoice.total(price)' in page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
    page.locator('#toast').evaluate('(el)=>el.classList.remove("show")')
    page.locator('#fit-workflow').click()
    page.screenshot(path=str(ROOT/'preview_class_mapping.png'))
    assert not errors,errors
    mobile=browser.new_page(viewport={'width':390,'height':844},device_scale_factor=1)
    mobile_errors=[];mobile.on('pageerror',lambda e:mobile_errors.append(str(e)))
    mobile.set_content(html,wait_until='load')
    mobile.locator('#btn-new').click();mobile.locator('#choose-template').click();mobile.locator('[data-modal-template="visual-invoice"]').click()
    cp=mobile.evaluate('PyFlowStudio.getProject()')
    callm=next(n for n in cp['nodes'] if n['type']=='call')
    mobile.evaluate('(id)=>PyFlowStudio.showNode(id)',callm['id'])
    mobile.locator('#toggle-inspector').click()
    assert mobile.locator('.v5-inspector').is_visible()
    mobile.locator('#toast').evaluate('(el)=>el.classList.remove("show")')
    mobile.screenshot(path=str(ROOT/'preview_mobile.png'))
    assert not mobile_errors,mobile_errors
    browser.close()
print('PASS browser: 11-template gallery, guided mapping, safe literals, automatic matching, class method, export, component studio, focus and mobile')
