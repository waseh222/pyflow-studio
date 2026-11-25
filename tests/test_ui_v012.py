"""v0.12 visual transform and reusable section browser tests, Chrome/Chromium."""
from pathlib import Path
import re
from playwright.sync_api import sync_playwright
R=Path(__file__).resolve().parents[1]
html=(R/'index.html').read_text()
html=re.sub(r'<link rel="stylesheet" href="([^"]+)">',lambda m:'<style>'+(R/m.group(1)).read_text()+'</style>',html)
html=re.sub(r'<script src="([^"]+)"></script>',lambda m:'<script>'+(R/m.group(1)).read_text()+'</script>',html)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
 for width,height in [(1680,960),(1366,768),(390,844)]:
  page=b.new_page(viewport={'width':width,'height':height},accept_downloads=True)
  errors=[]
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content(html,wait_until='load');page.wait_for_timeout(240)
  assert page.evaluate('document.body.classList.contains("editor-wide")'),width
  assert page.locator('#canvas-viewport').bounding_box()['width']>=width-60
  assert page.locator('#v11-open').is_visible()
  # Start from the wired calculator and automatically splice a typed conversion before Print.
  page.evaluate('''()=>{let p=PyFlowEngine.templates.find(t=>t.id==='visual-data-links').create();PyFlowStudio.update(t=>{t.nodes=p.nodes;t.edges=p.edges;t.dataLinks=p.dataLinks;t.visualModules=p.visualModules||[];});}''')
  page.locator('#v11-open').click()
  page.locator('[data-v12-tab="transform"]').click()
  assert page.locator('#v12-target').is_visible()
  receiver=page.evaluate('PyFlowStudio.getProject().nodes.find(n=>n.type==="print").id')
  page.locator('#v12-target').select_option(receiver)
  expected=page.evaluate('PyFlowStudio.getProject().nodes.find(n=>n.type==="math")')
  source=expected['id']+'::tax_due'
  page.locator('#v12-source').select_option(source)
  page.locator('#v12-kind').select_option('str')
  assert 'str(tax_due)' in page.locator('.v12-codehint code').inner_text()
  n=page.evaluate('PyFlowStudio.getProject().nodes.length')
  page.locator('#v12-apply-convert').click()
  assert page.evaluate('PyFlowStudio.getProject().nodes.length')==n+1
  assert 'str(tax_due)' in page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
  assert page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).warnings.length')==0
  if width==1680:page.screenshot(path=str(R/'preview_v012_transform.png'))
  # Create a list via rows, never manually writing a list literal.
  page.locator('[data-v12-builder="list"]').click()
  page.locator('#v12-collection-name').fill('snacks')
  page.locator('#v12-collection-type').select_option('Text')
  page.locator('[data-v12-list="0"]').fill('pear')
  page.locator('[data-v12-list="1"]').fill('peach')
  page.locator('#v12-create-collection').click()
  assert page.evaluate('PyFlowStudio.getProject().nodes.some(n=>n.type==="list_create"&&n.params.name==="snacks")')
  assert '["pear", "peach"]' in page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).code')
  # Build dictionary from row controls.
  page.locator('[data-v12-builder="dictionary"]').click()
  page.locator('#v12-collection-name').fill('contact')
  page.locator('#v12-create-collection').click()
  assert page.evaluate('PyFlowStudio.getProject().nodes.some(n=>n.type==="dictionary"&&n.params.name==="contact")')
  page.locator('[data-v12-tab="sections"]').click()
  assert page.locator('#v12-save-section').is_visible()
  # Save a contiguous chain from the same workflow.
  page.evaluate('''()=>{let p=PyFlowEngine.blank('Reusable Demo');let a=PyFlowEngine.makeNode('set_var',350,175,{name:'quantity',kind:'Number',value:'100'}),b=PyFlowEngine.makeNode('convert',640,175,{name:'quantity_text',kind:'str',value:'quantity'}),c=PyFlowEngine.makeNode('print',930,175,{mode:'Variable / expression',value:'quantity_text'});p.nodes.push(a,b,c);p.edges=[{from:p.nodes[0].id,to:a.id,port:'next'},{from:a.id,to:b.id,port:'next'},{from:b.id,to:c.id,port:'next'}];PyFlowPorts.connect(p,{from:a.id,output:'quantity',to:b.id,input:'value'});PyFlowPorts.connect(p,{from:b.id,output:'quantity_text',to:c.id,input:'value'});PyFlowStudio.update(t=>{t.nodes=p.nodes;t.edges=p.edges;t.dataLinks=p.dataLinks;t.visualModules=[];});}''')
  page.locator('[data-v12-tab="transform"]').click();page.locator('[data-v12-tab="sections"]').click()
  for item in page.locator('[data-v12-select]').all():item.check()
  page.locator('#v12-section-name').fill('Show formatted quantity')
  page.locator('#v12-save-section').click()
  assert page.evaluate('PyFlowStudio.getProject().reusableSections.length')==1
  if width==1680:page.screenshot(path=str(R/'preview_v012_sections.png'))
  page.locator('[data-v12-insert]').click()
  assert page.evaluate('PyFlowStudio.getProject().nodes.length')==7
  assert page.evaluate('PyFlowStudio.getProject().dataLinks.length')==4
  assert page.evaluate('PyFlowEngine.compile(PyFlowStudio.getProject()).warnings.length')==0
  # Undo restores the exact node set before inserting the saved section.
  page.locator('#v11-close').click()
  page.keyboard.press('Control+z')
  assert page.evaluate('PyFlowStudio.getProject().nodes.length')==4
  assert page.evaluate('PyFlowStudio.getProject().reusableSections.length')==1
  assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth+4'),width
  assert page.locator('#canvas-viewport').bounding_box()['width']>=width-60
  assert not errors,(width,errors)
  if width==390:page.screenshot(path=str(R/'preview_v012_mobile.png'))
  page.close()
 b.close()
print('PASS v0.12 browser: no-code typed conversions, list, dictionary, reusable sections, undo, full-width mobile/desktop')
