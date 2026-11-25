"""Browser checks for v0.10. No network required. Run: python tests/test_ui_v010.py"""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
html=(R/'index.html').read_text()
html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+ (R/m.group(1)).read_text()+'</style>',html)
html=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+ (R/m.group(1)).read_text()+'</script>',html)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in [(1680,960),(1366,768),(390,844)]:
  page=browser.new_page(viewport={'width':width,'height':height},accept_downloads=True)
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load');page.wait_for_timeout(240)
  assert page.locator('#v10-find').count()==1,errors
  assert page.locator('#v10-check').count()==1,errors
  assert page.locator('#wide-toggle').count()==1
  assert page.evaluate('document.body.classList.contains("editor-wide")')
  canvas=page.locator('#canvas-viewport').bounding_box()
  assert canvas and canvas['width']>=width-60,(width,canvas)
  page.keyboard.press('Control+k')
  assert page.locator('#v10-overlay').is_visible()
  assert page.evaluate('document.activeElement?.id==="v10-search"'),(width,page.evaluate('document.activeElement?.outerHTML'),page.evaluate('document.querySelector("#action-picker").className'))
  page.locator('#v10-search').fill('sales')
  assert page.locator('#v10-results .v10-item').count()>=1
  page.keyboard.press('ArrowDown');page.keyboard.press('ArrowUp');page.keyboard.press('Enter')
  assert page.locator('#v10-overlay').is_hidden()
  page.locator('#v10-check').click()
  assert page.locator('.v10-check-head').is_visible()
  assert page.locator('.v10-all-clear').is_visible() or '0 critical' in page.locator('.v10-check-head').inner_text()
  page.keyboard.press('Escape');assert page.locator('#v10-overlay').is_hidden()
  # Introduce a disconnected step and navigate from the review panel.
  id=page.evaluate('''()=>{let id='';PyFlowStudio.update(p=>{const n=PyFlowEngine.makeNode('print',1450,390,{value:'Detached'});p.nodes.push(n);id=n.id;});return id;}''')
  page.locator('#v10-check').click()
  assert page.locator('.v10-issue').count()>=1
  assert 'Action cannot run' in page.locator('#v10-content').inner_text()
  page.locator(f'[data-v10-jump="{id}"]').first.click()
  assert page.evaluate('PyFlowStudio.selected()')==id
  assert page.locator('#v10-overlay').is_hidden()
  page.keyboard.press('Escape') # close settings drawer
  page.locator('#v10-help').click() if page.locator('#v10-help').is_visible() else page.evaluate('PyFlowNavigation.open("guide")')
  assert 'STEP 1 OF 5' in page.locator('#v10-content').inner_text()
  page.locator('#v10-tour-next').click();assert 'STEP 2 OF 5' in page.locator('#v10-content').inner_text()
  page.locator('#v10-tour-back').click();assert 'STEP 1 OF 5' in page.locator('#v10-content').inner_text()
  page.locator('#v10-close').click()
  page.keyboard.press('Control+k');page.locator('#v10-search').fill('workflow check');page.keyboard.press('Enter')
  assert 'Workflow Check' in page.locator('#v10-title').inner_text()
  page.keyboard.press('Escape')
  assert page.locator('#canvas-viewport').bounding_box()['width']>=width-60
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 3')
  assert not errors,(width,errors)
  if width==1680:
   page.locator('#fit-workflow').click();page.wait_for_timeout(220)
   page.screenshot(path=str(R/'preview_v010_wide.png'))
   page.locator('#v10-find').click();page.locator('#v10-search').fill('calculate')
   page.screenshot(path=str(R/'preview_v010_navigator.png'))
   page.keyboard.press('Escape');page.locator('#v10-check').click()
   page.screenshot(path=str(R/'preview_v010_check.png'))
  if width==390:
   page.screenshot(path=str(R/'preview_v010_mobile.png'))
  page.close()
 action=browser.new_page(viewport={'width':1440,'height':900},accept_downloads=True)
 action.set_content(html,wait_until='load');action.wait_for_timeout(150)
 before=action.evaluate('PyFlowStudio.getProject().nodes.length')
 action.locator('#v10-find').click();action.locator('#v10-search').fill('add calculate')
 assert action.locator('#v10-results .v10-item').count()>=1
 action.locator('#v10-results .v10-item').first.click()
 assert action.evaluate('PyFlowStudio.getProject().nodes.length')==before+1
 assert action.locator('#v10-overlay').is_hidden()
 with action.expect_download() as download:
  action.locator('#btn-json').click()
 assert download.value.suggested_filename.endswith('.json')
 action.close()
 browser.close()
print('PASS v0.10 browser: wide layout, command search + insertion, JSON export, keyboard controls, issue-to-step, guided tour, mobile')
