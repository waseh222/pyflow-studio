/* Visual expression composer — produces valid Python literals and operators from form choices. */
(function(root){
'use strict';
const OPS={none:'',add:'+',subtract:'-',multiply:'*',divide:'/',power:'**',equal:'==',not_equal:'!=',greater:'>',less:'<',greater_equal:'>=',less_equal:'<=',and:'and',or:'or',contains:'in'};
const OPERANDS={variable:'Saved value',number:'Number',text:'Text',boolean:'True / False'};
function identifier(s){return /^[A-Za-z_][A-Za-z0-9_]*$/.test(String(s||'')) && !['True','False','None','and','or','not','class','for','while','if','else','return','import','def','lambda','pass','try','except','with','as','in','is'].includes(String(s));}
function literal(part){const p=part||{};const s=String(p.value??'');switch(p.type){case 'variable':return identifier(s)?s:null;case 'number':return s.trim()!==''&&Number.isFinite(Number(s))?String(Number(s)):null;case 'text':return JSON.stringify(s);case 'boolean':return s==='True'||s==='False'?s:null;default:return null;}}
function build(parts){const l=literal(parts.left);if(l===null)return {ok:false,message:'Choose a valid first value or saved variable.'};const op=OPS[parts.operator||'none'];if(op===undefined)return {ok:false,message:'Unknown operation.'};if(!op)return {ok:true,code:l,human:'Use '+(parts.left.type==='variable'?`saved value “${parts.left.value}”`:parts.left.type==='text'?`text “${parts.left.value}”`:parts.left.value)};const r=literal(parts.right);if(r===null)return {ok:false,message:'Choose a valid second value or saved variable.'};return {ok:true,code:parts.operator==='contains'?`(${r} in ${l})`:`(${l} ${op} ${r})`,human:parts.operator==='contains'?`Check whether ${parts.left.value} contains ${parts.right.value}`:`Combine ${parts.left.value} ${op} ${parts.right.value}`};}
root.PyFlowExpressions={OPERANDS,OPS,identifier,literal,build};
if(typeof module!=='undefined'&&module.exports)module.exports=root.PyFlowExpressions;
})(typeof window!=='undefined'?window:globalThis);
