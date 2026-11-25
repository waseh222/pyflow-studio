/* PyFlow Studio v0.4 — high-level visual component designer. */
(()=>{
'use strict';
const M=window.PyFlowModules,S=window.PyFlowStudio;
if(!M||!S)return;
const el=s=>document.querySelector(s);
const html=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const overlay=el('#component-overlay'),main=el('#component-main'),code=el('#component-code');
let draft=null,selectedMethod=0,stored=false,dirty=false;
const typeOptions={number:'Number (decimal)',integer:'Whole number',text:'Text',boolean:'Yes / No',list:'List',any:'Any value'};
const TYPE_OPTS={number:'Number',text:'Text',boolean:'Yes / No',variable:'Saved variable',none:'Nothing'};
const STEP_OPTS={assign:'Save a value',calculate:'Calculate a result',print:'Show output',return:'Return a value',choose:'Choose a return value',attribute:'Update object attribute'};
const OP_LABELS={'+':'Add (+)','-':'Subtract (−)','*':'Multiply (×)','/':'Divide (÷)','//':'Whole division','%':'Remainder','**':'Power'};
const CMP_LABELS={'==':'Equals','!=':'Not equal','>':'Greater than','>=':'At least','<':'Less than','<=':'At most'};
const params=()=>draft.kind==='function'?draft.parameters:(draft.methods[selectedMethod]?.parameters||[]);
const steps=()=>draft.kind==='function'?draft.steps:(draft.methods[selectedMethod]?.steps||[]);
const method=()=>draft.kind==='function'?draft:draft.methods[selectedMethod];
const library=()=>S.getProject().visualModules||[];
const trOptions=(data,selected)=>Object.entries(data).map(([k,v])=>`<option value="${html(k)}" ${k===String(selected)?'selected':''}>${html(v)}</option>`).join('');
function setSavedState(){el('#component-saved').textContent=dirty?'● Unsaved edits':'✓ Stored in this project';el('#component-saved').style.color=dirty?'#b98545':'#2c9b76';}
function variableNames(){const result=new Set();for(const p of params())if(p.name)result.add(p.name);
 for(const s of steps())if(['assign','calculate'].includes(s.kind)&&s.target)result.add(s.target);
 for(const a of draft.attributes||[])if(a.name)result.add(`self.${a.name}`);
 for(const n of S.getProject().nodes){for(const k of ['name','result','item'])if(/^[A-Za-z_]\w*$/.test(String(n.params?.[k]||'')))result.add(n.params[k]);}
 return [...result].filter(s=>/^(?:self\.)?[A-Za-z_]\w*$/.test(s)).sort();}
const field=(label,input,helper='')=>`<div class="component-field"><label>${html(label)}</label>${input}${helper?`<span class="component-helper">${html(helper)}</span>`:''}</div>`;
const input=(a,v,placeholder='')=>`<input data-bind="${a}" value="${html(v)}" placeholder="${html(placeholder)}" autocomplete="off">`;
function operandField(i,key,obj,title){const val=obj||M.DEFAULTS.number,options=variableNames();const type=val.type||'number';
 let control;
 if(type==='boolean')control=`<select data-step="${i}" data-operand="${key}" data-operand-key="value"><option value="True" ${val.value==='True'?'selected':''}>Yes / True</option><option value="False" ${val.value!=='True'?'selected':''}>No / False</option></select>`;
 else if(type==='none')control=`<input disabled value="None" aria-label="No value">`;
 else if(type==='variable'){const choices=[...new Set([val.value,...options])].filter(Boolean);control=`<select data-step="${i}" data-operand="${key}" data-operand-key="value" aria-label="Choose variable"><option value="">Choose a saved value</option>${choices.map(v=>`<option ${v===val.value?'selected':''} value="${html(v)}">${html(v)}</option>`).join('')}</select>`;}
 else control=`<input data-step="${i}" data-operand="${key}" data-operand-key="value" type="${type==='number'?'number':'text'}" ${type==='number'?'step="any"':''} value="${html(val.value)}" placeholder="${type==='number'?'0':'Enter text'}">`;
 return field(title,`<div class="component-operand"><select data-step="${i}" data-operand="${key}" data-operand-key="type" aria-label="Value type">${trOptions(TYPE_OPTS,type)}</select>${control}</div>`);}
function renderParamRows(){const p=params();if(!p.length)return `<div class="component-empty">No inputs. This component can run without arguments.</div>`;return p.map((x,i)=>`<div class="component-param-row">${field('Input name',`<input data-param="${i}" data-param-key="name" value="${html(x.name)}" placeholder="e.g. amount">`)}${field('Type',`<select data-param="${i}" data-param-key="type">${trOptions(typeOptions,x.type)}</select>`)}<button class="component-icon-remove" data-remove-param="${i}" aria-label="Delete input" title="Delete input">✕</button></div>`).join('');}
function renderAttrRows(){const a=draft.attributes||[];if(!a.length)return `<div class="component-empty">No attributes yet. Attributes store information inside objects.</div>`;return a.map((x,i)=>`<div class="component-attribute-row">${field('Attribute name',`<input data-attr="${i}" data-attr-key="name" value="${html(x.name)}" placeholder="e.g. currency">`)}${field('Type',`<select data-attr="${i}" data-attr-key="type">${trOptions(typeOptions,x.type)}</select>`)}${field('Starting value',`<input data-attr="${i}" data-attr-key="value" value="${html(x.default?.value??'')}" placeholder="Value">`)}<button class="component-icon-remove" data-remove-attr="${i}" title="Delete attribute" aria-label="Delete attribute">✕</button></div>`).join('');}
function renderSteps(){return steps().map((s,i)=>{let content='';
 if(['assign','calculate','attribute'].includes(s.kind))content+=field(s.kind==='attribute'?'Attribute to update':'Save result as',`<input data-step="${i}" data-step-field="target" value="${html(s.target||'result')}" placeholder="result">`);
 if(['assign','attribute','print','return'].includes(s.kind))content+=operandField(i,'value',s.value,'Value');
 if(s.kind==='calculate')content+=operandField(i,'left',s.left,'First value')+field('Operation',`<select data-step="${i}" data-step-field="operator">${trOptions(OP_LABELS,s.operator)}</select>`)+operandField(i,'right',s.right,'Second value');
 if(s.kind==='choose')content+=operandField(i,'left',s.left,'Compare')+field('Condition',`<select data-step="${i}" data-step-field="operator">${trOptions(CMP_LABELS,s.operator)}</select>`)+operandField(i,'right',s.right,'Against')+operandField(i,'yes',s.yes,'Return when YES')+operandField(i,'no',s.no,'Return when NO');
 return `<article class="component-step-card"><div class="component-step-top"><span class="component-step-number">${i+1}</span><select class="component-step-kind" data-step="${i}" data-step-field="kind" aria-label="Choose action for step ${i+1}">${trOptions(Object.fromEntries(Object.entries(STEP_OPTS).filter(([k])=>k!=='attribute'||draft.kind==='class')),s.kind)}</select><span style="flex:1"></span><button class="component-step-move" title="Move step up" data-move="up" data-i="${i}" ${i===0?'disabled':''}>↑</button><button class="component-step-move" title="Move step down" data-move="down" data-i="${i}" ${i===steps().length-1?'disabled':''}>↓</button><button class="component-icon-remove" title="Delete step" data-remove-step="${i}" aria-label="Delete step">✕</button></div><div class="component-step-content">${content}</div></article>`;
 }).join('')||`<div class="component-empty">No operations yet. Add your first step below.</div>`;}
function renderMethods(){if(draft.kind!=='class')return '';
 const choices=(draft.methods||[]).map((m,i)=>`<button class="component-method-pill ${selectedMethod===i?'active':''}" data-select-method="${i}">ƒ ${html(m.name||'New method')}</button>`).join('');
 return `<div class="component-section"><div class="component-section-head"><div><b>3. Methods</b><small>Choose a method to design what an object can do.</small></div><button class="component-inline-button" id="component-add-method">＋ Add method</button></div><div class="component-method-tabs">${choices||'<span class="component-empty">Create a method to give this class behavior.</span>'}</div>${method()?`<div class="component-grid">${field('Method name',`<input data-method-name value="${html(method().name)}" placeholder="e.g. calculate">`)}${field('Parameters',`<div class="component-helper" style="padding-top:12px">Configure below ↓</div>`)}</div><button class="component-icon-remove" style="margin-top:10px;padding:0 10px" id="component-remove-method">Remove selected method</button>`:''}</div>`;}
function renderEditor(){if(!draft)return;
 const curr=method();const isClass=draft.kind==='class';
 main.innerHTML=`<div class="component-editor-top"><div><span class="component-overline">${isClass?'OBJECT-ORIENTED PROGRAMMING':'REUSABLE FUNCTION'} · GUIDED EDITOR</span><h2>${isClass?'Design a Python class':'Design a Python function'}</h2><p>${isClass?'Organize shared data and actions in a reusable object. Start with attributes, then make methods with visual steps.':'Choose inputs, add operations, and decide what to return. Build logic without memorizing syntax.'}</p></div><div class="component-editor-icon">${isClass?'⬡':'ƒ'}</div></div>
 <div class="component-section"><div class="component-section-head"><div><b>1. Basic details</b><small>These names appear in your generated Python.</small></div></div><div class="component-grid">${field(isClass?'Class name':'Function name',input('name',draft.name,'Choose a name'),'Use letters, numbers and underscores.')}${isClass?field('Parent class (optional)',`<select data-bind="base"><option value="">No parent class</option>${[...new Set([...(library().filter(x=>x.kind==='class'&&x.id!==draft.id).map(x=>x.name)),...(draft.base?[draft.base]:[])])].map(x=>`<option value="${html(x)}" ${draft.base===x?'selected':''}>${html(x)}</option>`).join('')}</select>`):field('Return type',`<select data-bind="returnType">${trOptions(typeOptions,draft.returnType||'any')}</select>`)}<div class="full" style="grid-column:1/-1">${field('What does it do?',`<textarea data-bind="description" rows="2" placeholder="Describe this component">${html(draft.description||'')}</textarea>`)}</div></div></div>
 ${isClass?`<div class="component-section"><div class="component-section-head"><div><b>2. Object attributes</b><small>Information stored inside each object.</small></div><button class="component-inline-button" id="component-add-attr">＋ Attribute</button></div>${renderAttrRows()}</div>${renderMethods()}`:''}
 ${curr?`<div class="component-section"><div class="component-section-head"><div><b>${isClass?'4':'2'}. Inputs & parameters</b><small>Choose what information the ${isClass?'method':'function'} needs.</small></div><button class="component-inline-button" id="component-add-param">＋ Input</button></div>${renderParamRows()}</div><div class="component-section"><div class="component-section-head"><div><b>${isClass?'5':'3'}. Visual steps</b><small>Put actions in order. The Python code appears automatically on the right.</small></div><button class="component-inline-button" id="component-add-step">＋ Step</button></div>${renderSteps()}</div>`:''}`;
 renderPreview();
}
function renderList(){const data=library();el('#component-count').textContent=String(data.length);
 el('#component-list').innerHTML=data.length?data.map(m=>`<button class="component-list-item ${draft?.id===m.id?'active':''}" data-edit-component="${html(m.id)}"><span class="component-list-symbol">${m.kind==='class'?'⬡':'ƒ'}</span><span><b>${html(m.name)}</b><small>${m.kind==='class'?'Python class':'Python function'}</small></span></button>`).join(''):`<div class="component-empty">Create your first reusable function or class. You can use it in any workflow step.</div>`;
 el('#component-delete').hidden=!stored;
 setSavedState();}
function renderPreview(){if(!draft)return;const valid=el('#component-valid'),validation=el('#component-validation');let issues=M.check(draft),str='';
 const other=library().filter(x=>x.id!==draft.id).find(x=>x.name===draft.name);if(other)issues.push(`Another component is already named ${draft.name}.`);
 if(draft.kind==='class'&&draft.base&&!library().some(x=>x.kind==='class'&&x.name===draft.base&&x.id!==draft.id))issues.push('Select a parent class already saved in this project.');
 const declaredNames=new Set((draft.kind==='class'?[draft.name,...(draft.methods||[]).map(x=>x.name)]:[draft.name]));
 if(issues.length){str='# Resolve the settings below to generate Python.\n# '+issues.join('\n# ');valid.textContent='⚠ Check details';valid.classList.add('error');validation.textContent=issues.join(' • ');validation.classList.add('error');}
 else{try{str=M.compileOne(draft);valid.textContent='✓ Valid Python';valid.classList.remove('error');validation.textContent='Ready — Python code updates as you edit each step.';validation.classList.remove('error');}catch(e){str='# '+e.message;valid.textContent='⚠ Check details';valid.classList.add('error');validation.textContent=e.message;validation.classList.add('error');}}
 code.textContent=str;
 let flow=draft.kind==='class'?['Class',...draft.attributes.map(x=>'Attribute: '+x.name),...(draft.methods||[]).map(x=>'Method: '+x.name)]:['Inputs',...draft.steps.map(x=>STEP_OPTS[x.kind]||'Step'),'Output'];
 el('#component-flow').innerHTML=flow.map(x=>`<span>${html(x)}</span>`).join('');
 el('#component-save').disabled=issues.length>0;el('#component-insert').disabled=issues.length>0;setSavedState();}
function select(m,isStored=false){draft=M.clone(m);selectedMethod=0;stored=isStored;dirty=false;renderList();renderEditor();}
function unique(m){const names=new Set(library().map(x=>x.name));if(!names.has(m.name))return m;const base=m.kind==='class'?'NewClass':'new_function';let i=1;while(names.has(base+'_'+i))i++;m.name=base+'_'+i;return m;}
function startNew(kind){if(dirty&&!confirm('Discard unsaved edits in the component designer?'))return;select(unique(kind==='class'?M.makeClass():M.makeFunction()),false);}
function open(){overlay.hidden=false;document.body.classList.add('component-open');const list=library();select(list[0]||M.makeFunction(),!!list.length);el('#component-close').focus();}
function close(){if(dirty&&!confirm('Discard unsaved changes to this component?'))return;overlay.hidden=true;document.body.classList.remove('component-open');}
function save(){if(!draft)return false;const errors=M.check(draft),dup=library().some(x=>x.id!==draft.id&&x.name===draft.name);
 if(errors.length||dup){renderPreview();S.toast('Check the component settings before saving.');return false;}
 const data=M.clone(draft);S.update(project=>{project.visualModules=Array.isArray(project.visualModules)?project.visualModules:[];let i=project.visualModules.findIndex(x=>x.id===data.id);if(i<0)project.visualModules.push(data);else project.visualModules[i]=data;});stored=true;dirty=false;renderList();renderPreview();S.toast('Reusable component saved with your project.');return true;}
function demoArg(p){if(p.type==='text')return "''";if(p.type==='boolean')return 'False';if(p.type==='list')return '[]';if(['number','integer'].includes(p.type))return '0';return 'None';}
function snake(s){return String(s||'module').replace(/([A-Z])/g,'_$1').replace(/^_/,'').toLowerCase().replace(/[^a-z0-9_]/g,'_').slice(0,30)||'module';}
function insert(){if(!save())return;if(draft.kind==='function')S.addConfigured('call',{name:draft.name,args:'',result:'result',bindingMode:'guided',bindings:draft.parameters.map(window.PyFlowBindings.defaultBinding)});
 else{const objName=snake(draft.name),id=S.addConfigured('object',{name:objName,class:draft.name,args:''});if(draft.methods.length){const f=draft.methods[0];S.addConfigured('method',{object:objName,method:f.name,args:'',result:'result',bindingMode:'guided',bindings:f.parameters.map(window.PyFlowBindings.defaultBinding)},{from:id});}}
 close();S.toast('Component added to your workflow. Select its step to adjust the inputs.');}
function removeCurrent(){if(!stored){startNew('function');return;}if(!confirm(`Delete ${draft.name} from this project? Existing workflow steps using it will need updating.`))return;
 const id=draft.id;S.update(p=>{p.visualModules=(p.visualModules||[]).filter(x=>x.id!==id)});const list=library();select(list[0]||M.makeFunction(),!!list.length);S.toast('Component removed from this project.');}
function bind(elm){const key=elm.dataset.bind;if(key){draft[key]=elm.value;dirty=true;renderPreview();return;}
 if(elm.dataset.methodName!==undefined&&draft.kind==='class'){draft.methods[selectedMethod].name=elm.value;dirty=true;renderPreview();return;}
 if(elm.dataset.param!==undefined){const row=params()[+elm.dataset.param];if(!row)return;row[elm.dataset.paramKey]=elm.value;dirty=true;renderPreview();return;}
 if(elm.dataset.attr!==undefined){const row=draft.attributes[+elm.dataset.attr];if(!row)return;
 if(elm.dataset.attrKey==='value'){row.default.value=elm.value;row.default.type=row.type==='text'?'text':row.type==='boolean'?'boolean':row.type==='any'?'none':row.type==='list'?'variable':'number';}
 else{row[elm.dataset.attrKey]=elm.value;if(elm.dataset.attrKey==='type'){row.default=M.clone(M.DEFAULTS[row.type]||M.DEFAULTS.any);renderEditor();}}
 dirty=true;renderPreview();return;}
 if(elm.dataset.step!==undefined){const s=steps()[+elm.dataset.step];if(!s)return;
 if(elm.dataset.stepField){const k=elm.dataset.stepField;if(k==='kind'){const next=M.makeStep(elm.value);next.id=s.id;steps()[+elm.dataset.step]=next;renderEditor();}else s[k]=elm.value;}
 else if(elm.dataset.operand){const operand=s[elm.dataset.operand];if(!operand)return;const k=elm.dataset.operandKey;operand[k]=elm.value;
 if(k==='type'){operand.value=elm.value==='boolean'?'True':elm.value==='number'?'0':elm.value==='variable'?(variableNames()[0]||''):'';renderEditor();}}
 dirty=true;renderPreview();}
}
main.addEventListener('input',e=>{if(e.target.matches('[data-bind],[data-method-name],[data-param],[data-attr],[data-step]'))bind(e.target)});
main.addEventListener('change',e=>{if(e.target.matches('select[data-bind],select[data-param],select[data-attr],select[data-step]'))bind(e.target)});
main.addEventListener('click',e=>{const target=e.target;
 if(target.closest('#component-add-param')){params().push({name:'input_'+(params().length+1),type:'number'});dirty=true;renderEditor();}
 if(target.closest('[data-remove-param]')){params().splice(+target.closest('[data-remove-param]').dataset.removeParam,1);dirty=true;renderEditor();}
 if(target.closest('#component-add-attr')){draft.attributes.push({name:'attribute_'+(draft.attributes.length+1),type:'text',default:M.clone(M.DEFAULTS.text)});dirty=true;renderEditor();}
 if(target.closest('[data-remove-attr]')){draft.attributes.splice(+target.closest('[data-remove-attr]').dataset.removeAttr,1);dirty=true;renderEditor();}
 if(target.closest('#component-add-method')){draft.methods.push({id:window.PyFlowEngine.makeId(),kind:'function',name:'method_'+(draft.methods.length+1),parameters:[],steps:[M.makeStep('return')]});selectedMethod=draft.methods.length-1;dirty=true;renderEditor();}
 if(target.closest('#component-remove-method')){draft.methods.splice(selectedMethod,1);selectedMethod=Math.max(0,Math.min(selectedMethod,draft.methods.length-1));dirty=true;renderEditor();}
 if(target.closest('[data-select-method]')){selectedMethod=+target.closest('[data-select-method]').dataset.selectMethod;renderEditor();}
 if(target.closest('#component-add-step')&&method()){steps().push(M.makeStep('assign'));dirty=true;renderEditor();}
 if(target.closest('[data-remove-step]')){steps().splice(+target.closest('[data-remove-step]').dataset.removeStep,1);dirty=true;renderEditor();}
 if(target.closest('[data-move]')){const btn=target.closest('[data-move]');let i=+btn.dataset.i,j=i+(btn.dataset.move==='up'?-1:1);if(j>=0&&j<steps().length){[steps()[i],steps()[j]]=[steps()[j],steps()[i]];dirty=true;renderEditor();}}
});
el('#component-new-function').addEventListener('click',()=>startNew('function'));
el('#component-new-class').addEventListener('click',()=>startNew('class'));
el('#component-list').addEventListener('click',e=>{const item=e.target.closest('[data-edit-component]');if(!item)return;if(dirty&&!confirm('Discard unsaved edits?'))return;const found=library().find(m=>m.id===item.dataset.editComponent);if(found)select(found,true);});
el('#component-close').addEventListener('click',close);
el('#component-save').addEventListener('click',save);
el('#component-insert').addEventListener('click',insert);
el('#component-delete').addEventListener('click',removeCurrent);
el('#btn-component-nav').addEventListener('click',open);
el('#btn-module-editor').addEventListener('click',open);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!overlay.hidden){e.stopImmediatePropagation();e.preventDefault();close();}
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&overlay.hidden&&!window.PyFlowNavigation){e.preventDefault();el('#btn-add-step').click();}} ,true);
window.PyFlowComponentStudio={open,close,save,getDraft:()=>M.clone(draft),select};
})();
