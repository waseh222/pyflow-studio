"""PyFlow v0.7 execution-trace recorder.
The browser worker supplies `_pyflow_source_text`, then executes this source in Pyodide.
It records real Python line events for a bounded, post-run replay.
It does not stop live execution between steps, and is not a security sandbox.
"""
import sys as _pf_sys
import io as _pf_io
import json as _pf_json
import contextlib as _pf_contextlib
import traceback as _pf_traceback

_pf_filename = '<PyFlow workflow>'
_pf_events = []
_pf_buffer = _pf_io.StringIO()
_pf_errors = _pf_io.StringIO()
_pf_result_error = None
_pf_max_events = 300
_pf_namespace = {'__name__': '__main__'}


def _pf_value(v):
    try:
        text = repr(v)
    except BaseException:
        return '<unavailable>'
    return text[:130] + ('…' if len(text) > 130 else '')


def _pf_snapshot(frame):
    result = {}
    # The locals of the generated module or function are the relevant state.
    for key, val in list(frame.f_locals.items()):
        if len(result) >= 30:
            break
        if key.startswith('_') or key in ('__builtins__',):
            continue
        if callable(val) or getattr(type(val), '__name__', '') == 'module':
            continue
        result[str(key)[:50]] = _pf_value(val)
    return result


# v0.9: structured previews are created by Python itself, without parsing repr
# or evaluating any user-supplied text in the browser. Only a small sample is sent.
def _pf_cell(value):
    if value is None or isinstance(value, (bool, int, float, str)):
        if isinstance(value, float) and (value != value or abs(value) == float('inf')):
            return str(value)
        return value[:120] if isinstance(value, str) else value
    return _pf_value(value)[:120]


def _pf_structured_value(value):
    try:
        kind = type(value).__name__
        if isinstance(value, list) or isinstance(value, tuple):
            total = len(value)
            shown = list(value[:8])
            # A list of dictionaries becomes a real table, not a guessed one.
            if shown and all(isinstance(item, dict) for item in shown):
                columns = []
                for item in shown:
                    for key in item:
                        key_text = str(key)[:60]
                        if key_text not in columns and len(columns) < 8:
                            columns.append(key_text)
                rows = [[_pf_cell(next((v for k,v in item.items() if str(k)[:60] == col), None)) for col in columns] for item in shown]
            elif shown and all(isinstance(item, (list, tuple)) for item in shown):
                size = min(8, max(len(item) for item in shown))
                columns = [str(i) for i in range(size)]
                rows = [[_pf_cell(item[i]) if i < len(item) else None for i in range(size)] for item in shown]
            else:
                columns = ['Index', 'Value']
                rows = [[i, _pf_cell(item)] for i,item in enumerate(shown)]
            return {'kind':'table', 'type':kind, 'columns':columns,
                    'rows':rows, 'totalRows':total,
                    'truncated':total > len(shown)}
        if isinstance(value, dict):
            items = list(value.items())[:8]
            return {'kind':'table', 'type':'dict', 'columns':['Key','Value'],
                    'rows':[[_pf_cell(k),_pf_cell(v)] for k,v in items],
                    'totalRows':len(value), 'truncated':len(value)>len(items)}
        if type(value).__module__.startswith('pandas.') and kind == 'DataFrame':
            columns = [str(k)[:60] for k in list(value.columns)[:8]]
            rows = [[_pf_cell(v) for v in row] for row in value.iloc[:8,:8].itertuples(index=False,name=None)]
            return {'kind':'table', 'type':'DataFrame', 'columns':columns,
                    'rows':rows, 'totalRows':int(len(value)),
                    'totalColumns':int(len(value.columns)),
                    'truncated':len(value)>8 or len(value.columns)>8}
        if value is None or isinstance(value, (bool, int, float, str)):
            return {'kind':'scalar','type':kind,'value':_pf_cell(value)}
    except BaseException:
        return None
    return None


def _pf_structured(frame):
    results={}
    for key,value in list(frame.f_locals.items()):
        if len(results)>=12:break
        if str(key).startswith('_') or callable(value):continue
        entry=_pf_structured_value(value)
        if entry is not None:results[str(key)[:50]]=entry
    return results


def _pf_trace(frame, event, arg):
    if frame.f_code.co_filename != _pf_filename:
        return None
    if event not in ('line', 'return'):
        return _pf_trace
    if len(_pf_events) < _pf_max_events:
        _pf_events.append({
            'line': frame.f_lineno,
            'event': event,
            'function': frame.f_code.co_name,
            'variables': _pf_snapshot(frame),
            'structured': _pf_structured(frame),
            'return': _pf_value(arg) if event == 'return' and frame.f_code.co_name != '<module>' else None
        })
    return _pf_trace

try:
    _pf_source = str(_pyflow_source_text)
    with _pf_contextlib.redirect_stdout(_pf_buffer), _pf_contextlib.redirect_stderr(_pf_errors):
        _pf_sys.settrace(_pf_trace)
        try:
            exec(compile(_pf_source, _pf_filename, 'exec'), _pf_namespace, _pf_namespace)
        finally:
            _pf_sys.settrace(None)
except BaseException as _pf_exception:
    _pf_sys.settrace(None)
    _pf_line = None
    for _pf_frame in _pf_traceback.extract_tb(_pf_exception.__traceback__):
        if _pf_frame.filename == _pf_filename:
            _pf_line = _pf_frame.lineno
    _pf_result_error = {
        'kind': type(_pf_exception).__name__,
        'message': str(_pf_exception)[:300],
        'line': _pf_line
    }

_pf_trace_result_json = _pf_json.dumps({
    'events': _pf_events,
    'stdout': _pf_buffer.getvalue()[:24000],
    'stderr': _pf_errors.getvalue()[:12000],
    'error': _pf_result_error,
    'truncated': len(_pf_events) >= _pf_max_events,
}, ensure_ascii=False)
