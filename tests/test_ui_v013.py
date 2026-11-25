"""Browser regression: guided no-code actions, safe reusable section review, wide canvas."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re
R=Path(__file__).resolve().parents[1]
html=(R/'index.html').read_text(encoding='utf8')
html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+(R/m.group(1)).read_text(encoding='utf8')+'</style>',html)
html=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+(R/m.group(1)).read_text(encoding='utf8')+'</script>',html)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in [(1680,960),(1366,768),(390,844)]:
  page=browser.new_page(viewport={'width':width,'height':height},accept_downloads=True)
  errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
  page.set_content(html,wait_until='load');page.wait_for_timeout(200)
  assert page.evaluate('document.body.classList.contains("editor-wide")')
  assert page.locator('#canvas-viewport').bounding_box()['width']>=width-60
  page.evaluate('''()=>{const p=PyFlowEngine.templates.find(t=>t.id==='visual-data-links').create();PyFlowStudio.update(v=>{v.nodes=p.nodes;v.edges=p.edges;v.dataLinks=p.dataLinks;v.visualModules=p.visualModules||[];v.reusableSections=[];});}''')
  if width==1680:page.screenshot(path=str(R/'preview_v013_wide.png'))
  mid=page.evaluate('PyFlowStudio.getProject().nodes.find(n=>n.type==="math").id')
  page.evaluate('(id)=>PyFlowStudio.showNode(id)',mid)
  assert page.locator('#v13-inspector-launch').count()==1
  page.locator('#v11-open').click()
  page.locator('[data-v13-tab="guided"]').click()
  assert page.locator('#v13-preview').is_visible()
  assert 'tax_due' in page.locator('#v13-preview').inner_text()
  page.locator('[data-v13-prop="operator"]').select_option('+')
  assert 'price + tax_rate' in page.locator('#v13-preview').inner_text()
  page.locator('#v13-apply').click()
  assert 'tax_due = price + tax_rate' in page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
  if width==1680:page.screenshot(path=str(R/'preview_v013_guided.png'))
  # Display the saved result through a picker, rather than by typing Python.
  output=page.evaluate('PyFlowStudio.getProject().nodes.find(n=>n.type==="print").id')
  page.locator('#v13-action').select_option(output)
  page.locator('[data-v13-prop="mode"]').select_option('variable')
  page.locator('[data-v13-prop="source"]').select_option('tax_due')
  page.locator('#v13-apply').click()
  assert 'print(tax_due)' in page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
  # Changing a wired operand to a literal must remove the old purple data link.
  page.locator('#v13-action').select_option(mid)
  page.locator('[data-v13-mode="right"]').select_option('number')
  page.locator('input[data-v13-val="right"]').fill('7')
  page.locator('#v13-apply').click()
  assert 'tax_due = price + 7' in page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
  assert page.evaluate('(id)=>PyFlowStudio.getProject().dataLinks.every(l=>l.to!==id||l.input!=="right")',mid)
  # Reusable sections: preview collisions, rename and copy, then ensure the original remains.
  page.evaluate('''()=>{const E=PyFlowEngine,p=E.blank('Reusable');const x=E.makeNode('set_var',320,140,{name:'quantity',kind:'Number',value:'100'}),y=E.makeNode('convert',620,140,{name:'quantity_text',kind:'str',value:'quantity'}),z=E.makeNode('print',920,140,{mode:'Variable / expression',value:'quantity_text'});p.nodes.push(x,y,z);p.edges=[[p.nodes[0],x],[x,y],[y,z]].map(([a,b])=>({from:a.id,to:b.id,port:'next'}));PyFlowPorts.connect(p,{from:x.id,output:'quantity',to:y.id,input:'value'});PyFlowPorts.connect(p,{from:y.id,output:'quantity_text',to:z.id,input:'value'});PyFlowStudio.update(t=>{t.nodes=p.nodes;t.edges=p.edges;t.dataLinks=p.dataLinks;t.reusableSections=[];});}''')
  page.locator('[data-v12-tab="sections"]').click()
  for checkbox in page.locator('[data-v12-select]').all():checkbox.check()
  page.locator('#v12-section-name').fill('Quantity card')
  page.locator('#v12-save-section').click()
  page.wait_for_timeout(100)
  assert page.locator('[data-v13-preview]').count()==1
  page.locator('[data-v13-preview]').click()
  assert page.locator('.v13-review').is_visible()
  assert 'Existing output names' in page.locator('.v13-review').inner_text()
  if width==1680:page.screenshot(path=str(R/'preview_v013_sections.png'))
  page.locator('[data-v13-copy]').click();page.wait_for_timeout(100)
  assert page.evaluate('PyFlowStudio.getProject().reusableSections.length')==2
  assert page.locator('[data-v12-insert]').count()==2
  page.locator('#v11-close').click()
  page.keyboard.press('Control+z')
  assert page.evaluate('PyFlowStudio.getProject().reusableSections.length')==1
  assert page.locator('#canvas-viewport').bounding_box()['width']>=width-60
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth+4')
  assert not errors,(width,errors)
  if width==390:page.screenshot(path=str(R/'preview_v013_mobile.png'))
  page.close()
 browser.close()
print('PASS v0.13 browser: guided math/print, reusable-section audit/copy, undo, wide desktop/mobile')
