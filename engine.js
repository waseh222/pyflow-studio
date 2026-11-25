/* PyFlow Studio: dependency-free visual Python graph compiler.
   All source generation is deterministic and runs locally in the browser. */
(function (root) {
  'use strict';
  const categoryList = [
    ['fundamentals','Python fundamentals','◆'],['collections','Collections & text','▦'],
    ['control','Logic & control flow','⑂'],['functions','Functions & OOP','ƒ'],
    ['advanced','Advanced Python','✦'],['files','Files & formats','▤'],
    ['web','Web, APIs & backend','◎'],['data','Data science','▥'],
    ['ai','Machine learning','✺'],['database','Databases','◫'],
    ['quality','Testing & automation','✓']
  ];
  const defs = [];
  function add(id, title, category, icon, summary, fields=[], ports=['next'], color='blue', needs=[]) {
    defs.push({id,title,category,icon,summary,fields,ports,color,needs});
  }
  const F=(key,label,kind='text',def='',help='',options=[])=>({key,label,kind,default:def,help,options});
  add('start','Start program','fundamentals','▶','Entry point for your Python program.',[],['next'],'green');
  add('set_var','Create variable','fundamentals','x','Store a value using a variable name.',[F('name','Variable name','identifier','total'),F('kind','Value type','select','Number','', ['Number','Text','Boolean','List of numbers','List of text','Expression']),F('value','Value','text','100','For lists, separate values with commas.')]);
  add('print','Display output','fundamentals','▣','Show text, values, or variables in the console.',[F('mode','Output mode','select','Text','',['Text','Variable / expression']),F('value','Text or variable','text','Hello from PyFlow!')]);
  add('input','Ask user for input','fundamentals','⌨','Read text from a user.',[F('name','Save answer as','identifier','user_name'),F('prompt','Question to ask','text','What is your name?')]);
  add('math','Calculate','fundamentals','∑','Calculate with two values or variables.',[F('name','Store result in','identifier','result'),F('left','First value / variable','text','10'),F('operator','Operation','select','+','',['+','-','*','/','//','%','**']),F('right','Second value / variable','text','5')]);
  add('convert','Convert type','fundamentals','⇄','Convert a value to int, float, string or bool.',[F('name','Store result in','identifier','converted'),F('kind','Convert to','select','int','',['int','float','str','bool','list','set','tuple']),F('value','Source variable / value','text','total')]);
  add('comment','Add note','fundamentals','☰','Document what a workflow section does.',[F('value','Note','textarea','Explain what this section does.')]);
  add('string','Text operation','collections','T','Change text, split, replace, or join.',[F('name','Store result in','identifier','clean_text'),F('source','Text variable','text','message'),F('operation','Operation','select','strip','',['strip','lower','upper','title','split','replace','startswith','endswith']),F('arg','Option (if needed)','text',',','For replace, enter old,new.')]);
  add('list_create','Create list','collections','☷','Create a list with visual comma-separated values.',[F('name','List name','identifier','items'),F('kind','Item type','select','Text','',['Text','Number']),F('values','Items (comma separated)','textarea','apple, banana, mango')]);
  add('list_add','Add to list','collections','⊕','Append an item to an existing list.',[F('list','List variable','identifier','items'),F('value','New item','text','orange'),F('mode','Item type','select','Text','',['Text','Number / expression'])]);
  add('dictionary','Create dictionary','collections','{}','Define a mapping using key/value pairs.',[F('name','Dictionary name','identifier','profile'),F('entries','Entries, one key = value per line','textarea','name = Ayesha\nrole = Developer')]);
  add('sort','Sort collection','collections','↕','Sort a list or iterable.',[F('name','Save sorted list as','identifier','sorted_items'),F('value','Input variable','identifier','items'),F('reverse','Descending order','boolean',false)]);
  add('regex','Find text pattern','collections','⌕','Use regular expressions to find matches.',[F('name','Save matches as','identifier','matches'),F('pattern','Pattern','text','[A-Za-z]+'),F('text','Text variable / expression','text','message')],['next'],'purple');
  add('if','If / Else branch','control','◇','Send execution down Yes or No paths.',[F('left','Compare this','text','total'),F('operator','Comparison','select','>','',['==','!=','>','>=','<','<=','in','not in','is','is not']),F('right','Against this','text','50')],['yes','no'],'orange');
  add('for','For each item','control','↻','Repeat a connected sequence for every item.',[F('item','Loop item name','identifier','item'),F('source','List / iterable variable','text','items')],['body','next'],'orange');
  add('while','While loop','control','∞','Repeat while a condition remains true.',[F('left','Value to check','text','counter'),F('operator','Comparison','select','<','',['==','!=','>','>=','<','<=']),F('right','Compare with','text','5')],['body','next'],'orange');
  add('break','Break loop','control','■','Stop the current loop.');
  add('continue','Continue loop','control','↪','Skip to the next iteration.');
  add('merge','Join paths','control','⊙','Join logical paths into a shared next step.',[],['next'],'orange');
  add('try','Try / Except','control','⚠','Handle errors without crashing.',[F('error','Error type','select','Exception','',['Exception','ValueError','TypeError','KeyError','FileNotFoundError','ZeroDivisionError']),F('alias','Error variable','identifier','error')],['body','error','next'],'orange');
  add('raise','Raise error','control','!','Raise an error with a message.',[F('kind','Error type','select','ValueError','',['ValueError','TypeError','RuntimeError','Exception']),F('message','Message','text','Something went wrong')]);
  add('function','Define function','functions','ƒ','Make a reusable function. Connect its body port.',[F('name','Function name','identifier','process_data'),F('args','Parameter names (comma separated)','text','data'),F('async','Asynchronous function','boolean',false)],['body','next'],'purple');
  add('call','Call function','functions','↗','Invoke an existing function.',[F('name','Function name','identifier','process_data'),F('args','Arguments / variables (comma separated)','text','items'),F('result','Save return as (optional)','identifier','result')],['next'],'purple');
  add('return','Return value','functions','⤴','Return a result from a function.',[F('value','Variable / expression','text','result')],['next'],'purple');
  add('class','Create class','functions','⬡','Design an object-oriented Python class.',[F('name','Class name','identifier','DataProcessor'),F('base','Parent class (optional)','identifier',''),F('attributes','Instance attributes (comma separated)','text','data, config')],['body','next'],'purple');
  add('object','Create object','functions','◈','Instantiate a configured class.',[F('name','Store object as','identifier','processor'),F('class','Class name','identifier','DataProcessor'),F('args','Constructor arguments (optional)','text','')],['next'],'purple');
  add('method','Call object method','functions','⌘','Call a method on an object.',[F('object','Object name','identifier','processor'),F('method','Method name','identifier','process'),F('args','Arguments','text',''),F('result','Save result (optional)','identifier','result')],['next'],'purple');
  add('import','Import package','advanced','▧','Import a Python standard or third-party package.',[F('module','Module name','text','math'),F('alias','Use alias (optional)','identifier','')],['next'],'violet');
  add('list_comp','List comprehension','advanced','≋','Create a list from items using an expression.',[F('name','Store list as','identifier','doubled'),F('item','Loop item','identifier','x'),F('source','Source iterable','text','numbers'),F('expression','Transformation','text','x * 2'),F('filter','Optional condition','text','')],['next'],'violet');
  add('lambda','Lambda function','advanced','λ','Create a short anonymous function.',[F('name','Save function as','identifier','square'),F('args','Parameter names','text','x'),F('expression','Result expression','text','x * x')],['next'],'violet');
  add('generator','Yield item','advanced','⇢','Produce values lazily from a generator function.',[F('value','Variable / expression','text','item')],['next'],'violet');
  add('decorator','Apply decorator','advanced','★','Add a decorator to a function definition.',[F('name','Decorator expression','text','staticmethod')],['body','next'],'violet');
  add('await','Await task','advanced','◷','Wait for an asynchronous operation.',[F('value','Awaitable call','text','asyncio.sleep(1)')],['next'],'violet');
  add('sleep','Pause execution','advanced','⏱','Wait for a number of seconds.',[F('seconds','Seconds','number',1)],['next'],'violet');
  add('read_file','Read text file','files','▤','Read a UTF-8 file.',[F('name','Save content as','identifier','content'),F('path','File path','text','notes.txt')],['next'],'teal');
  add('write_file','Write text file','files','⇣','Write or append text to a file.',[F('path','File path','text','output.txt'),F('mode','File mode','select','Overwrite','',['Overwrite','Append']),F('source','Write mode','select','Text','',['Text','Variable / expression']),F('value','Content','textarea','Report completed.')],['next'],'teal');
  add('json_read','Read JSON','files','{}','Parse data from a JSON file.',[F('name','Save object as','identifier','settings'),F('path','JSON file','text','config.json')],['next'],'teal');
  add('json_write','Export JSON','files','⇩','Save a variable as a formatted JSON file.',[F('value','Object variable','identifier','settings'),F('path','Output path','text','settings.json')],['next'],'teal');
  add('csv_read','Read CSV','files','▦','Read a CSV file into rows.',[F('name','Save rows as','identifier','rows'),F('path','CSV file','text','data.csv')],['next'],'teal');
  add('csv_write','Export CSV','files','⇲','Save list of dictionaries as a CSV file.',[F('rows','Rows variable','identifier','rows'),F('path','Output CSV path','text','report.csv')],['next'],'teal');
  add('request','HTTP API request','web','◎','Fetch an API response using requests.',[F('name','Save result as','identifier','response_data'),F('method','Method','select','GET','',['GET','POST']),F('url','URL','text','https://httpbin.org/get'),F('timeout','Timeout (seconds)','number',15)],['next'],'cyan',['requests']);
  add('web_scrape','Extract page title','web','⌕','Fetch a web page and extract its title.',[F('name','Save page title as','identifier','page_title'),F('url','Website URL','text','https://example.org')],['next'],'cyan',['requests','beautifulsoup4']);
  add('flask_app','Create Flask app','web','⬡','Create a Flask web application.',[F('name','App variable','identifier','app')],['next'],'cyan',['flask']);
  add('flask_route','Web route','web','⤴','Connect a URL path to a simple text/JSON response.',[F('app','App variable','identifier','app'),F('route','URL path','text','/'),F('response','Response text','text','Hello from PyFlow')],['next'],'cyan',['flask']);
  add('flask_start','Run web server','web','◉','Start a local Flask development server.',[F('app','App variable','identifier','app'),F('port','Port','number',5000)],['next'],'cyan',['flask']);
  add('pandas_read','Load dataset','data','▥','Load a CSV file into a Pandas DataFrame.',[F('name','DataFrame name','identifier','df'),F('path','CSV file path','text','sales.csv')],['next'],'indigo',['pandas']);
  add('pandas_clean','Clean missing data','data','✧','Remove empty rows from a DataFrame.',[F('name','DataFrame variable','identifier','df'),F('method','Cleanup method','select','Drop incomplete rows','',['Drop incomplete rows','Fill with zero','Remove duplicates'])],['next'],'indigo',['pandas']);
  add('pandas_filter','Filter DataFrame','data','▽','Filter rows using a selected column and value.',[F('name','DataFrame name','identifier','df'),F('column','Column name','text','amount'),F('operator','Operator','select','>','',['==','!=','>','>=','<','<=']),F('value','Compare to (number)','number',100)],['next'],'indigo',['pandas']);
  add('pandas_group','Group & summarize','data','▥','Group data and calculate aggregate statistics.',[F('name','Save result as','identifier','summary'),F('source','DataFrame','identifier','df'),F('group','Group by column','text','category'),F('value','Number column','text','amount'),F('agg','Aggregation','select','sum','',['sum','mean','max','min','count'])],['next'],'indigo',['pandas']);
  add('numpy','NumPy array','data','◫','Create a NumPy array from numbers.',[F('name','Array name','identifier','arr'),F('values','Values (comma separated)','text','1, 2, 3, 4, 5')],['next'],'indigo',['numpy']);
  add('chart','Create chart','data','▤','Plot a line or bar chart.',[F('source','Data variable','identifier','sales'),F('type','Chart type','select','Bar chart','',['Bar chart','Line chart','Histogram']),F('title','Chart title','text','Sales trends')],['next'],'indigo',['matplotlib']);
  add('ml_iris','Load example ML dataset','ai','✺','Load built-in iris data for ML experiments.',[F('data','Features variable','identifier','X'),F('target','Labels variable','identifier','y')],['next'],'pink',['scikit-learn']);
  add('ml_train','Train classification model','ai','◈','Split data and train a Random Forest classifier.',[F('features','Features variable','identifier','X'),F('labels','Target variable','identifier','y'),F('model','Save model as','identifier','model'),F('test_size','Test size (%)','number',20)],['next'],'pink',['scikit-learn']);
  add('ml_score','Evaluate classifier','ai','★','Calculate and print the model accuracy.',[F('model','Model variable','identifier','model')],['next'],'pink',['scikit-learn']);
  add('sqlite_connect','Connect SQLite','database','◫','Open a local SQLite database.',[F('name','Connection variable','identifier','conn'),F('path','Database file','text','app.db')],['next'],'amber');
  add('sqlite_table','Create SQLite table','database','▦','Create a simple database table if absent.',[F('conn','Connection variable','identifier','conn'),F('table','Table name','identifier','records'),F('columns','Column names (comma separated)','text','name, value')],['next'],'amber');
  add('sqlite_insert','Insert database record','database','⇢','Insert a new row safely using placeholders.',[F('conn','Connection variable','identifier','conn'),F('table','Table name','identifier','records'),F('columns','Column names (comma separated)','text','name, value'),F('values','Values (comma separated, quoted strings allowed)','text',"'Demo', 100")],['next'],'amber');
  add('sqlite_fetch','Read table','database','▤','Fetch and print database records.',[F('conn','Connection variable','identifier','conn'),F('table','Table name','identifier','records'),F('result','Save rows as','identifier','results')],['next'],'amber');
  add('assert','Assert a condition','quality','✓','Verify an expected property.',[F('left','Value','text','total'),F('operator','Comparison','select','>=','',['==','!=','>','>=','<','<=']),F('right','Expected','text','0'),F('message','Error message','text','Validation failed')],['next'],'green');
  add('datetime','Current date and time','quality','◷','Store the current local date and time.',[F('name','Save as','identifier','now')],['next'],'green');
  add('random','Random integer','quality','⚄','Choose a random integer in a range.',[F('name','Save as','identifier','random_number'),F('low','Minimum','number',1),F('high','Maximum','number',100)],['next'],'green');
  add('schedule','Repeat task (timer)','quality','⌛','Use a timer to pause and repeat in a loop.',[F('seconds','Pause seconds','number',1)],['next'],'green');

  const BY_ID=Object.fromEntries(defs.map(d=>[d.id,d]));
  let uid=0; const makeId=()=>`n_${Date.now().toString(36)}_${(++uid).toString(36)}`;
  function makeNode(type, x=150, y=200, overrides={}) {const def=BY_ID[type];if(!def)throw Error('Unknown block type '+type);const p={};for(const f of def.fields)p[f.key]=f.default;return {id:makeId(),type,x,y,params:{...p,...overrides}};}
  function blank(name='Untitled Python App'){return {id:'p_'+Date.now().toString(36),name,created:new Date().toISOString(),nodes:[makeNode('start',65,180)],edges:[]};}
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function pyString(v){return JSON.stringify(String(v??''));}
  function ident(v, fallback='value'){const x=String(v??'').trim();return /^[A-Za-z_][A-Za-z0-9_]*$/.test(x)&&!['class','if','else','for','while','return','pass','def','import','from','in','try','except','lambda','with','as','async','await','None','True','False'].includes(x)?x:fallback;}
  function expr(v, fallback='None'){return String(v??'').trim()||fallback;}
  function identList(v){return String(v??'').split(',').map(s=>ident(s.trim(),'item')).filter(Boolean).join(', ');}
  function numberLiteral(v, fallback=0){const n=Number(v);return Number.isFinite(n)?String(n):String(fallback);}
  function listLiteral(v, kind='Text'){return '['+String(v??'').split(',').filter(x=>x.trim()).map(x=>kind==='Number'?numberLiteral(x.trim()):pyString(x.trim())).join(', ')+']';}
  function valueLiteral(p){switch(p.kind){case 'Text':return pyString(p.value);case 'Boolean':return /^(true|yes|1)$/i.test(String(p.value).trim())?'True':'False';case 'List of numbers':return listLiteral(p.value,'Number');case 'List of text':return listLiteral(p.value,'Text');case 'Expression':return expr(p.value);default:return numberLiteral(p.value);}}
  function rowEntries(v){return String(v||'').split('\n').map(l=>l.split(/=(.+)/).map(x=>x.trim())).filter(x=>x[0]).map(([k,val])=>`${pyString(k)}: ${pyString(val??'')}`).join(', ');}
  function statement(n, imports, requirements){
    const p=n.params||{},I=(k,f)=>ident(p[k],f), E=(k,f)=>expr(p[k],f),S=k=>pyString(p[k]);
    switch(n.type){
      case 'start':return ['# Program starts here'];
      case 'set_var':return [`${I('name','value')} = ${valueLiteral(p)}`];
      case 'print':return [`print(${p.mode==='Variable / expression'?E('value'):S('value')})`];
      case 'input':return [`${I('name','answer')} = input(${S('prompt')})`];
      case 'math':return [`${I('name','result')} = ${E('left','0')} ${p.operator||'+'} ${E('right','0')}`];
      case 'convert':return [`${I('name','converted')} = ${p.kind||'str'}(${E('value')})`];
      case 'comment':return String(p.value||'').split('\n').map(s=>'# '+s);
      case 'string':{const src=E('source','message'),nm=I('name','text');if(p.operation==='replace'){let [a,b]=String(p.arg||'').split(',');return [`${nm} = ${src}.replace(${pyString(a||'')}, ${pyString(b||'')})`];}if(['startswith','endswith'].includes(p.operation))return [`${nm} = ${src}.${p.operation}(${S('arg')})`];if(p.operation==='split')return [`${nm} = ${src}.split(${S('arg')})`];return [`${nm} = ${src}.${p.operation||'strip'}()`];}
      case 'list_create':return [`${I('name','items')} = ${listLiteral(p.values,p.kind)}`];
      case 'list_add':return [`${I('list','items')}.append(${p.mode==='Text'?S('value'):E('value')})`];
      case 'dictionary':return [`${I('name','profile')} = {${rowEntries(p.entries)}}`];
      case 'sort':return [`${I('name','sorted_items')} = sorted(${I('value','items')}, reverse=${p.reverse?'True':'False'})`];
      case 'regex':imports.add('import re');return [`${I('name','matches')} = re.findall(${S('pattern')}, ${E('text','message')})`];
      case 'break':return ['break'];case 'continue':return ['continue'];case 'merge':return ['# Joined paths'];
      case 'raise':return [`raise ${p.kind||'ValueError'}(${S('message')})`];
      case 'call':return [`${String(p.result||'').trim()?I('result','result')+' = ':''}${I('name','process_data')}(${expr(p.args,'')})`];
      case 'return':return [`return ${E('value')}`];
      case 'object':return [`${I('name','obj')} = ${I('class','DataProcessor')}(${expr(p.args,'')})`];
      case 'method':return [`${String(p.result||'').trim()?I('result','result')+' = ':''}${I('object','obj')}.${I('method','run')}(${expr(p.args,'')})`];
      case 'import':{const m=String(p.module||'math').trim();if(!/^[\w.]+$/.test(m))return ['# Invalid module name'];imports.add(`import ${m}${p.alias?' as '+I('alias','alias'):''}`);return ['# Import ready'];}
      case 'list_comp':return [`${I('name','results')} = [${E('expression','x')} for ${I('item','x')} in ${E('source','items')}${p.filter?' if '+E('filter'):''}]`];
      case 'lambda':return [`${I('name','fn')} = lambda ${identList(p.args)}: ${E('expression','None')}`];
      case 'generator':return [`yield ${E('value')}`];
      case 'await':imports.add('import asyncio');return [`await ${E('value','asyncio.sleep(1)')}`];
      case 'sleep':imports.add('import time');return [`time.sleep(${numberLiteral(p.seconds,1)})`];
      case 'read_file':return [`with open(${S('path')}, 'r', encoding='utf-8') as file:`,`    ${I('name','content')} = file.read()`];
      case 'write_file':return [`with open(${S('path')}, '${p.mode==='Append'?'a':'w'}', encoding='utf-8') as file:`,`    file.write(str(${p.source==='Variable / expression'?E('value'):S('value')}))`];
      case 'json_read':imports.add('import json');return [`with open(${S('path')}, 'r', encoding='utf-8') as file:`,`    ${I('name','data')} = json.load(file)`];
      case 'json_write':imports.add('import json');return [`with open(${S('path')}, 'w', encoding='utf-8') as file:`,`    json.dump(${I('value','data')}, file, indent=2, ensure_ascii=False)`];
      case 'csv_read':imports.add('import csv');return [`with open(${S('path')}, 'r', newline='', encoding='utf-8') as file:`,`    ${I('name','rows')} = list(csv.DictReader(file))`];
      case 'csv_write':imports.add('import csv');return [`with open(${S('path')}, 'w', newline='', encoding='utf-8') as file:`,`    writer = csv.DictWriter(file, fieldnames=list(${I('rows','rows')}[0].keys()))`,`    writer.writeheader()`,`    writer.writerows(${I('rows','rows')})`];
      case 'request':imports.add('import requests');requirements.add('requests');return [`${I('name','response')} = requests.${String(p.method||'GET').toLowerCase()}(${S('url')}, timeout=${numberLiteral(p.timeout,15)}).json()`];
      case 'web_scrape':imports.add('import requests');imports.add('from bs4 import BeautifulSoup');requirements.add('requests');requirements.add('beautifulsoup4');return [`${I('name','title')} = BeautifulSoup(requests.get(${S('url')}, timeout=15).text, 'html.parser').title.string`];
      case 'flask_app':imports.add('from flask import Flask');requirements.add('flask');return [`${I('name','app')} = Flask(__name__)`];
      case 'flask_route':imports.add('from flask import Flask');requirements.add('flask');return [`@${I('app','app')}.route(${S('route')})`,`def route_${String(p.route||'/').replace(/\W/g,'_')||'home'}():`,`    return ${S('response')}`];
      case 'flask_start':return [`${I('app','app')}.run(debug=False, port=${numberLiteral(p.port,5000)})`];
      case 'pandas_read':imports.add('import pandas as pd');requirements.add('pandas');return [`${I('name','df')} = pd.read_csv(${S('path')})`];
      case 'pandas_clean':{let op=p.method==='Fill with zero'?'.fillna(0)':p.method==='Remove duplicates'?'.drop_duplicates()':'.dropna()';return [`${I('name','df')} = ${I('name','df')}${op}`];}
      case 'pandas_filter':return [`${I('name','df')} = ${I('name','df')}[${I('name','df')}[${S('column')}] ${p.operator||'>'} ${numberLiteral(p.value,0)}]`];
      case 'pandas_group':return [`${I('name','summary')} = ${I('source','df')}.groupby(${S('group')})[${S('value')}].${p.agg||'sum'}()`];
      case 'numpy':imports.add('import numpy as np');requirements.add('numpy');return [`${I('name','arr')} = np.array(${listLiteral(p.values,'Number')})`];
      case 'chart':imports.add('import matplotlib.pyplot as plt');requirements.add('matplotlib');{let t=p.type==='Line chart'?'plot':p.type==='Histogram'?'hist':'bar';return [`plt.${t}(${t==='bar'?`range(len(${I('source','sales')})), `:''}${I('source','sales')})`,`plt.title(${S('title')})`,`plt.show()`];}
      case 'ml_iris':imports.add('from sklearn.datasets import load_iris');requirements.add('scikit-learn');return [`${I('data','X')}, ${I('target','y')} = load_iris(return_X_y=True)`];
      case 'ml_train':imports.add('from sklearn.model_selection import train_test_split');imports.add('from sklearn.ensemble import RandomForestClassifier');requirements.add('scikit-learn');return [`X_train, X_test, y_train, y_test = train_test_split(${I('features','X')}, ${I('labels','y')}, test_size=${Math.max(.01,Math.min(.9,Number(p.test_size)/100||.2))}, random_state=42)`,`${I('model','model')} = RandomForestClassifier(n_estimators=100, random_state=42)`,`${I('model','model')}.fit(X_train, y_train)`];
      case 'ml_score':return [`print('Accuracy:', round(${I('model','model')}.score(X_test, y_test), 4))`];
      case 'sqlite_connect':imports.add('import sqlite3');return [`${I('name','conn')} = sqlite3.connect(${S('path')})`];
      case 'sqlite_table':{const columns=String(p.columns||'name').split(',').map(s=>ident(s.trim(),'field'));return [`${I('conn','conn')}.execute(${pyString(`CREATE TABLE IF NOT EXISTS ${I('table','records')} (id INTEGER PRIMARY KEY, ${columns.map(c=>'"'+c+'" TEXT').join(', ')})`)})`,`${I('conn','conn')}.commit()`];}
      case 'sqlite_insert':{const cols=String(p.columns||'name').split(',').map(s=>ident(s.trim(),'field'));return [`${I('conn','conn')}.execute(${pyString(`INSERT INTO ${I('table','records')} (${cols.map(x=>'"'+x+'"').join(', ')}) VALUES (${cols.map(()=>'?').join(', ')})`)}, (${expr(p.values)}${cols.length===1?',':''}))`,`${I('conn','conn')}.commit()`];}
      case 'sqlite_fetch':return [`${I('result','rows')} = ${I('conn','conn')}.execute(${pyString(`SELECT * FROM ${I('table','records')}`)}).fetchall()`,`print(${I('result','rows')})`];
      case 'assert':return [`assert ${E('left','0')} ${p.operator||'=='} ${E('right','0')}, ${S('message')}`];
      case 'datetime':imports.add('from datetime import datetime');return [`${I('name','now')} = datetime.now()`];
      case 'random':imports.add('import random');return [`${I('name','number')} = random.randint(${numberLiteral(p.low,1)}, ${numberLiteral(p.high,100)})`];
      case 'schedule':imports.add('import time');return [`time.sleep(${numberLiteral(p.seconds,1)})`];
      default:return [`# Unsupported block: ${n.type}`];
    }
  }
  function compile(project){
    const nodes=project.nodes||[], byId=new Map(nodes.map(n=>[n.id,n])), edges=(project.edges||[]).filter(e=>byId.has(e.from)&&byId.has(e.to));
    const imports=new Set(),requirements=new Set(), warnings=[];
    let visited=new Set(),count=0;
    const out=(id,port='next')=>edges.find(e=>e.from===id&&(e.port||'next')===port)?.to;
    function reachable(id,limit=100){const arr=[],seen=new Set();function visit(x){if(!x||seen.has(x)||seen.size>limit)return;seen.add(x);arr.push(x);for(const e of edges.filter(e=>e.from===x))visit(e.to);}visit(id);return arr;}
    function common(a,b){if(!a||!b)return null;let br=new Set(reachable(b));return reachable(a).find(x=>br.has(x))||null;}
    function emitChain(id,indent=0,stops=new Set(),stack=new Set()){
      let lines=[];
      while(id&&!stops.has(id)){
        if(stack.has(id)){warnings.push('Cycle detected. Use a loop block for repetition.');break;}
        if(++count>300){warnings.push('Compilation limit reached (300 blocks).');break;}
        const n=byId.get(id);if(!n)break;visited.add(id);let nextStack=new Set(stack);nextStack.add(id);const pad='    '.repeat(indent),p=n.params||{};
        // Source map marker (a Python comment) connects executed lines back to visual nodes.
        // Do not insert it between a decorator and the decorated function.
        if(n.type!=='decorator')lines.push(pad+'# PYFLOW_NODE:'+n.id);
        const nest=(ls,lev)=>ls.map(x=>'    '.repeat(lev)+x);
        if(n.type==='if'){
          const yes=out(id,'yes'),no=out(id,'no'),join=common(yes,no);
          lines.push(pad+`if ${expr(p.left,'True')} ${p.operator||'=='} ${expr(p.right,'True')}:`);
          let y=emitChain(yes,indent+1,new Set([...stops,...(join?[join]:[])]),nextStack);lines.push(...(y.length?y:[pad+'    pass']));
          if(no){lines.push(pad+'else:');let z=emitChain(no,indent+1,new Set([...stops,...(join?[join]:[])]),nextStack);lines.push(...(z.length?z:[pad+'    pass']));}
          id=join||null;continue;
        }
        if(n.type==='for'||n.type==='while'){
          let start=n.type==='for'?`for ${ident(p.item,'item')} in ${expr(p.source,'[]')}:`:`while ${expr(p.left,'0')} ${p.operator||'<'} ${expr(p.right,'0')}:`;
          lines.push(pad+start);let body=emitChain(out(id,'body'),indent+1,new Set([...stops,id,out(id,'next')].filter(Boolean)),nextStack);
          lines.push(...(body.length?body:[pad+'    pass']));id=out(id,'next');continue;
        }
        if(n.type==='function'||n.type==='class'||n.type==='try'||n.type==='decorator'){
          if(n.type==='function')lines.push(pad+`${p.async?'async ':''}def ${ident(p.name,'my_function')}(${identList(p.args)}):`);
          if(n.type==='class')lines.push(pad+`class ${ident(p.name,'MyClass')}${p.base?'('+ident(p.base,'object')+')':''}:`);
          if(n.type==='try')lines.push(pad+'try:');
          if(n.type==='decorator')lines.push(pad+'@'+expr(p.name,'staticmethod'));
          if(n.type==='decorator'){id=out(id,'body')||out(id,'next');continue;}
          if(n.type==='class'&&p.attributes){let attrs=String(p.attributes).split(',').map(x=>ident(x.trim(),'attribute'));lines.push(pad+'    def __init__(self):');for(let a of attrs)lines.push(pad+`        self.${a} = None`);}
          let body=emitChain(out(id,'body'),indent+1,new Set([...stops,id,out(id,'next')].filter(Boolean)),nextStack);
          lines.push(...(body.length?body:(n.type==='class'&&p.attributes?[]:[pad+'    pass'])));
          if(n.type==='try'){lines.push(pad+`except ${p.error||'Exception'} as ${ident(p.alias,'error')}:`);let er=emitChain(out(id,'error'),indent+1,new Set([...stops,id,out(id,'next')].filter(Boolean)),nextStack);lines.push(...(er.length?er:[pad+'    print('+pyString('Error:')+', '+ident(p.alias,'error')+ ')']));}
          id=out(id,'next');continue;
        }
        lines.push(...nest(statement(n,imports,requirements),indent));id=out(id,'next');stack=nextStack;
      }
      return lines;
    }
    const start=nodes.find(n=>n.type==='start')||nodes[0];let body=start?emitChain(start.id):['pass'];
    if(!start)warnings.push('Add a Start block to compile a program.');
    const disconnected=nodes.filter(n=>!visited.has(n.id));if(disconnected.length)warnings.push(`${disconnected.length} unconnected block(s) omitted from Python output.`);
    const header=['# Generated visually by PyFlow Studio','# Project: '+String(project.name||'Untitled').replace(/[\n\r]/g,' '),'# No manual Python coding required'];
    const code=[...header,'',...[...imports].sort(),...(imports.size?['']:[]),...body,''].join('\n');
    return {code,warnings,requirements:[...requirements].sort(),connectedCount:visited.size,blockCount:nodes.length,imports:[...imports].sort()};
  }
  function template(name, specs, edges){const p=blank(name);p.nodes=[];let keys={};specs.forEach(([key,type,x,y,params])=>{const n=makeNode(type,x,y,params||{});keys[key]=n.id;p.nodes.push(n);});p.edges=edges.map(([a,b,port])=>({from:keys[a],to:keys[b],port:port||'next'}));return p;}
  const TEMPLATES=[
    {id:'sales',title:'Sales Report Automation',icon:'▥',tag:'Fundamentals + Logic',description:'Process sales, calculate totals and generate a summary — all with visual blocks.',create:()=>template('Sales Report Automation',[
      ['s','start',55,100],['a','list_create',295,100,{name:'sales',kind:'Number',values:'1250, 900, 1800, 750, 2100'}],['b','set_var',545,100,{name:'total',kind:'Number',value:'0'}],['c','for',795,100,{item:'sale',source:'sales'}],['d','math',1055,20,{name:'total',left:'total',operator:'+',right:'sale'}],['e','print',1055,250,{mode:'Variable / expression',value:'total'}],['f','if',1315,250,{left:'total',operator:'>',right:'5000'}],['g','print',1565,150,{value:'Target achieved!'}],['h','print',1565,370,{value:'Keep improving next month.'}]
    ],[['s','a'],['a','b'],['b','c'],['c','d','body'],['c','e','next'],['e','f'],['f','g','yes'],['f','h','no']])},
    {id:'starter',title:'Hello, Python!',icon:'✦',tag:'Fundamentals',description:'Learn variables, input, calculations and output with a working program.',create:()=>template('My First Visual Python App',[
      ['s','start',75,205],['a','set_var',320,205,{name:'name',kind:'Text',value:'World'}],['b','print',570,205,{mode:'Variable / expression',value:"'Hello, ' + name + '!'"}]
    ],[['s','a'],['a','b']])},
    {id:'text',title:'Text Processing',icon:'T',tag:'Strings + Functions',description:'Build a reusable text cleaner using functions and string tools.',create:()=>template('Text Processing Workflow',[
      ['s','start',70,200],['a','set_var',320,200,{name:'message',kind:'Text',value:'  Welcome to PyFlow  '}],['b','string',580,200,{name:'clean_text',source:'message',operation:'strip'}],['c','string',850,200,{name:'clean_text',source:'clean_text',operation:'upper'}],['d','print',1130,200,{mode:'Variable / expression',value:'clean_text'}]
    ],[['s','a'],['a','b'],['b','c'],['c','d']])},
    {id:'database',title:'SQLite CRUD Starter',icon:'◫',tag:'Database',description:'Create a database, define a table, insert and retrieve data.',create:()=>template('SQLite Visual Database',[
      ['s','start',70,210],['a','sqlite_connect',315,210],['b','sqlite_table',570,210],['c','sqlite_insert',835,210],['d','sqlite_fetch',1090,210]
    ],[['s','a'],['a','b'],['b','c'],['c','d']])},
    {id:'files',title:'File & JSON Automation',icon:'▤',tag:'Files + I/O',description:'Produce structured JSON and export it as a file.',create:()=>template('JSON Automation',[
      ['s','start',65,210],['a','dictionary',310,210,{name:'profile',entries:'name = Sample User\nrole = Developer\nlevel = Advanced'}],['b','json_write',575,210,{value:'profile',path:'profile.json'}],['c','print',835,210,{value:'Saved JSON file successfully.'}]
    ],[['s','a'],['a','b'],['b','c']])},
    {id:'ml',title:'Machine Learning Model',icon:'✺',tag:'AI + Data Science',description:'Train and evaluate a classification model on a built-in dataset.',create:()=>template('Iris ML Classifier',[
      ['s','start',75,210],['a','ml_iris',340,210],['b','ml_train',610,210],['c','ml_score',900,210]
    ],[['s','a'],['a','b'],['b','c']])},
    {id:'api',title:'API Data Fetcher',icon:'◎',tag:'Web + APIs',description:'Fetch JSON data from a public endpoint with proper timeouts.',create:()=>template('API Data Fetcher',[
      ['s','start',75,210],['a','request',340,210],['b','print',610,210,{mode:'Variable / expression',value:'response_data'}]
    ],[['s','a'],['a','b']])},
    {id:'web',title:'Flask Web App',icon:'⬡',tag:'Web Backend',description:'Generate a minimal web service and route, ready to run locally.',create:()=>template('Flask Web App',[
      ['s','start',70,210],['a','flask_app',320,210],['b','flask_route',570,210],['c','flask_start',850,210]
    ],[['s','a'],['a','b'],['b','c']])},
    {id:'oop',title:'Class & Object Designer',icon:'◈',tag:'Object Oriented',description:'Create a class and instantiate it with visual configuration.',create:()=>template('Object-Oriented Python',[
      ['s','start',70,210],['a','class',340,210,{name:'Customer',attributes:'name, email'}],['b','object',640,210,{name:'customer',class:'Customer'}],['c','print',930,210,{mode:'Variable / expression',value:'customer.__dict__'}]
    ],[['s','a'],['a','b'],['b','c']])}
  ];
  root.PyFlowEngine={categories:categoryList,defs,byId:BY_ID,makeNode,blank,clone,compile,templates:TEMPLATES,template,makeId};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.PyFlowEngine;
})(typeof window!=='undefined'?window:globalThis);
