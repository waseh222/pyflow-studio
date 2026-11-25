"""Browser regression for v0.11 Data & Map. Run: python tests/test_ui_v011.py"""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
html=(R/'index.html').read_text()
html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+(R/m.group(1)).read_text()+'</style>',html)
html=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+(R/m.group(1)).read_text()+'</script>',html)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in [(1680,960),(1366,768),(390,844)]:
  page=browser.new_page(viewport={'width':width,'height':height},accept_downloads=True)
  errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.set_content(html,wait_until='load');page.wait_for_timeout(210)
  assert page.evaluate('document.body.classList.contains("editor-wide")')
  assert page.locator('#canvas-viewport').bounding_box()['width']>=width-60
  assert page.locator('#v11-open').is_visible()
  page.locator('#v11-open').click()
  assert page.locator('#v11-overlay').is_visible()
  assert page.locator('[data-v11-tab="values"]').get_attribute('aria-selected')=='true'
  # Source values should be scoped to the selected connected workflow.
  page.evaluate('''()=>{const t=PyFlowEngine.templates.find(t=>t.id==='visual-data-links').create();PyFlowStudio.update(p=>{p.nodes=t.nodes;p.edges=t.edges;p.dataLinks=t.dataLinks;p.visualModules=t.visualModules||[];});}''')
  target=page.evaluate('PyFlowStudio.getProject().nodes.find(n=>n.type==="print").id')
  page.locator('#v11-close').click()
  page.locator('#v11-open').click()
  page.locator('#v11-target').select_option(target)
  assert 'tax_due' in page.locator('#v11-values').inner_text()
  assert page.locator('#v11-input').input_value()=='value'
  before=page.evaluate('PyFlowStudio.getProject().dataLinks.length');assert before==3
  price=page.evaluate('PyFlowStudio.getProject().nodes.find(n=>n.type==="set_var").id')
  page.locator(f'[data-v11-source="{price}"]').click()
  assert page.locator('#v11-connect').is_enabled()
  page.locator('#v11-connect').click()
  assert page.evaluate('PyFlowStudio.getProject().dataLinks.length')==3
  assert page.evaluate('PyFlowStudio.getProject().dataLinks.find(l=>l.to===PyFlowStudio.getProject().nodes.find(n=>n.type==="print").id).output')=='price'
  page.locator('#v11-unlink').click()
  assert page.evaluate('PyFlowStudio.getProject().dataLinks.length')==2
  page.locator('#v11-close').click()
  assert page.locator('#v11-overlay').is_hidden()
  # Undo restores removed data link
  page.keyboard.press('Control+z')
  assert page.evaluate('PyFlowStudio.getProject().dataLinks.length')==3
  page.locator('#v11-open').click();page.locator('[data-v11-tab="outline"]').click()
  assert page.locator('.v11-outline-item').count()==5
  assert page.locator('.v11-outline-summary').is_visible()
  before_edges=page.evaluate('JSON.stringify(PyFlowStudio.getProject().edges)')
  page.locator('#v11-arrange').click()
  assert page.locator('#v11-overlay').is_hidden()
  assert page.evaluate('JSON.stringify(PyFlowStudio.getProject().edges)')==before_edges
  page.locator('#v11-open').click();page.locator('[data-v11-tab="outline"]').click()
  page.locator('#v11-outline-search').fill('math')
  assert page.locator('.v11-outline-item').count()==1
  page.locator('#v11-outline-search').fill('calculate')
  assert page.locator('[data-v11-jump]').count()>=1
  page.locator('[data-v11-jump]').first.click()
  assert page.locator('#v11-overlay').is_hidden()
  page.keyboard.press('Escape')  # dismiss Properties drawer after jumping to a block
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth+4'), width
  assert page.locator('#canvas-viewport').bounding_box()['width']>=width-60
  assert not errs,(width,errs)
  if width==1680:
   page.locator('#v11-open').click();page.locator('[data-v11-tab="outline"]').click()
   page.screenshot(path=str(R/'preview_v011_outline.png'))
   page.locator('[data-v11-tab="values"]').click()
   page.screenshot(path=str(R/'preview_v011_values.png'))
  if width==390:
   page.screenshot(path=str(R/'preview_v011_mobile.png'))
  page.close()
 browser.close()
print('PASS v0.11 browser: full-width, scoped values, typed links, undo, outline navigation, arrangement and mobile')
