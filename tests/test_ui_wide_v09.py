"""Canvas-first layout checks for PyFlow Studio v0.9.
Run: python tests/test_ui_wide_v09.py
"""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
html=(R/'index.html').read_text()
html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+ (R/m.group(1)).read_text()+'</style>',html)
html=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+ (R/m.group(1)).read_text()+'</script>',html)
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in ((1680,960),(1366,768)):
  page=browser.new_page(viewport={'width':width,'height':height})
  errors=[];page.on('pageerror',lambda x:errors.append(str(x)))
  page.set_content(html,wait_until='load');page.wait_for_timeout(360)
  assert page.locator('#wide-toggle').count()==1,errors
  assert page.evaluate('document.body.classList.contains("editor-wide")'), 'Wide layout should default on'
  assert page.evaluate('document.body.classList.contains("library-hidden")')
  assert page.evaluate('document.body.classList.contains("inspector-hidden")')
  canvas=page.locator('#canvas-viewport').bounding_box()
  assert canvas and canvas['width']>=width-60, (width,canvas)
  assert canvas['height']>height*.64,(width,canvas)
  assert not page.locator('.results-section').is_visible(), 'Collapsed results should not crowd the editor'
  page.locator('#toggle-library').click();page.wait_for_timeout(70)
  assert page.locator('.sidebar').is_visible()
  assert abs(page.locator('#canvas-viewport').bounding_box()['width']-canvas['width'])<3, 'Side drawer must overlay, not resize the canvas'
  page.locator('#dock-scrim').click(position={'x':width/2,'y':height*.6});page.wait_for_timeout(40)
  assert not page.locator('.sidebar').is_visible()
  page.locator('.canvas-node').nth(1).click(position={'x':70,'y':25});page.wait_for_timeout(70)
  assert page.locator('.inspector').is_visible(), 'Clicking an action should reveal properties'
  assert abs(page.locator('#canvas-viewport').bounding_box()['width']-canvas['width'])<3
  page.keyboard.press('Escape');page.wait_for_timeout(50)
  assert not page.locator('.inspector').is_visible()
  page.locator('#wide-advanced-button').click();assert page.locator('#wide-advanced-menu').is_visible()
  page.locator('#wide-advanced-menu [data-forward="auto-layout"]').click()
  page.locator('#btn-show-results').click()
  assert page.locator('.results-section').is_visible()
  page.locator('#btn-show-results').click()
  assert not page.locator('.results-section').is_visible()
  page.locator('#wide-toggle').click();page.wait_for_timeout(90)
  assert not page.evaluate('document.body.classList.contains("editor-wide")')
  standard=page.locator('#canvas-viewport').bounding_box()
  assert standard['width'] < canvas['width']-250,(standard,canvas)
  page.locator('#wide-toggle').click();page.wait_for_timeout(100)
  assert page.locator('#canvas-viewport').bounding_box()['width']>standard['width']+250
  assert not errors,(width,errors)
  if width==1680:
   page.locator('#fit-workflow').click();page.wait_for_timeout(200)
   page.evaluate("document.querySelector('#toast')?.classList.remove('show')")
   page.screenshot(path=str(R/'preview_wide_editor.png'),full_page=False)
   page.locator('#toggle-inspector').click();page.wait_for_timeout(90)
   page.screenshot(path=str(R/'preview_wide_settings.png'),full_page=False)
  page.close()
 mobile=browser.new_page(viewport={'width':390,'height':844});mobile.set_default_timeout(2300)
 errs=[];mobile.on('pageerror',lambda x:errs.append(str(x)))
 mobile.set_content(html,wait_until='load');mobile.wait_for_timeout(220)
 assert mobile.evaluate('document.documentElement.scrollWidth<=window.innerWidth+3')
 mobile.locator('#toggle-library').click();assert mobile.locator('.sidebar').is_visible()
 assert mobile.evaluate('document.documentElement.scrollWidth<=window.innerWidth+3')
 mobile.locator('#close-library').click()
 mobile.evaluate("document.querySelector('#toast')?.classList.remove('show')")
 mobile.screenshot(path=str(R/'preview_mobile_wide.png'),full_page=False)
 assert not errs,errs
 browser.close()
print('PASS v0.9 wide layout: desktop widths, overlay panels, click-to-configure, shortcuts, advanced tools, output dock, mobile')
