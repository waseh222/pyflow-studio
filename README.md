# PyFlow Studio v0.13 — Guided Python Actions & Safer Reusable Sections

PyFlow Studio is a **local-first visual Python editor**. This v0.13 release retains the wide workflow canvas, 62 Python block types, 14 starter templates, direct data wires, Function & Class Designer, Data Explorer and Python export.

## New: Guided Action Setup

Open **Data & Map → ✦ Guided setup**. Select an action on the canvas. Choose how its inputs should work using friendly forms:

- **Calculate** — Add, subtract, multiply, divide, remainder, integer division or power; choose two saved values or typed numbers; name the result.
- **If / Else** — Compare two selected values, numbers, words, or booleans; select a comparison through a dropdown; connect Yes and No outputs as before.
- **Display output** — Print a message or a saved value without writing an expression.
- **For each** — Choose an existing iterable and a loop-item name, then wire the Body and Next paths.
- **Sort collection** — Select an upstream list, choose ascending/descending and name the output.
- **Assert** — Set a comparison and friendly error message.

The wizard previews the generated Python and validates missing values, malformed numbers, reserved Python keywords, and duplicate output names. It warns about probable type mismatches and literal division by zero. A **Configure with guided choices** shortcut appears in the Properties inspector for supported actions.

**Important:** If you replace a previously wired input with a constant, PyFlow also removes that input's prior purple data link; if you choose an upstream saved value, it creates the appropriate data link. The Python source is generated from the actual resulting connections, not from the UI preview alone. The existing detailed action inspector continues to support the other 56 action types and advanced expressions.

## Improved reusable-section management

Open **Data & Map → Reusable sections**. Besides saving and inserting straight-line sections, you can now:

- **Preview** the saved sequence, internal data-link count, and potential name collisions with the current project.
- **Rename** saved sections without changing the stored steps.
- **Copy** a saved section inside the project as a separate reusable entry. Copying does not insert actions into the canvas.

Potential collisions are advisory: **using a saved section may overwrite variables with the same names**, so inspect and review generated Python before running. This release does not automatically rewrite arbitrary expressions or rename variables across a section. Existing v0.12 section insertion, Undo, and JSON export remain unchanged.

## Start the site

1. Extract the ZIP to a new folder (keep the `.js` and `.css` files beside `index.html`).
2. Double-click `index.html` in Chrome or Edge. Optional: run `start_windows.bat` if Python is installed to serve it locally.
3. Choose **Templates → Connected Data Calculator**; select its Calculate action, then **Data & Map → Guided setup**.
4. Use the form and click **Apply to this action**. Save a project JSON backup before major changes.

## Files added in v0.13

- `guided-actions-v013.js` — deterministic validation, safe operand creation, section preview/rename/copy helpers.
- `studio-v013.js` and `studio-v013.css` — guided action editor and reusable-section controls.
- `tests/test_guided_v013.js`, `tests/test_ui_v013.py` — pure and interactive browser tests.
- `preview_v013_guided.png`, `preview_v013_sections.png`, `preview_v013_wide.png`, `preview_v013_mobile.png` — actual Chromium screenshots.

## Testing and limits

12 JavaScript suites and six Python suites passed. Desktop and mobile Chromium tests for v0.9–v0.13 passed, including guided math/print edits, data-link replacement with a literal, section preview, duplicate and Undo. All 14 starter templates remain available and compile to Python. The browser runtime's first-time Pyodide CDN download was **not** verified from this restricted environment.

This is a **working local prototype**, not a public hosting service or complete syntax-free support for every Python feature. Some advanced actions still require Python-like expressions. Browser execution through a worker is not a secure sandbox for untrusted workflows. No cloud account or synchronization, production API deployment or automatic installation on your connected Windows computer is included. Export Python for workloads needing unsupported packages or server functionality.

---

# PyFlow Studio v0.12 — Wide Visual Python Editor + Transform & Reuse

Build increasingly sophisticated Python programs with a wide node canvas, guided input settings, visual data wires, reusable functions/classes, and **new v0.12 transformation and collection tools**. The application is a local-first prototype, not a publicly hosted Python service.

## New in v0.12 — no-code type conversion and reusable workflow sections

Open **Data & Map** (editor toolbar) and choose either **⇄ Transform data** or **▣ Reusable sections**. Both open inside a temporary overlay; the full-width canvas is not squeezed.

### 1. Convert values without typing Python

- Pick an action that will receive data, then select one of its input fields and a value created in an earlier connected action.
- Choose Text, Number/decimal, Whole number, True/False, List, Set or Tuple. The wizard shows readable Python code and a descriptive warning when conversion might fail or behave unexpectedly.
- Give the converted output a unique name or accept the suggested name. Click **Insert conversion and connect**. PyFlow inserts the existing Convert Type block into the execution path immediately before the receiving action and wires both value connections for you.
- This automated insertion requires **exactly one incoming execution connection** to the receiving action. More complex joins must be handled manually. Python may still reject some input values (for example `int('hello')`); the conversion wizard is not a universal validator.

### 2. Build a list or dictionary using rows

- In **Transform data**, scroll to **Create lists and dictionaries**.
- Choose a List and add individual Text or Number items, or choose Dictionary and add key/text-value pairs using form rows. No Python bracket or dictionary syntax is required.
- Choose **Insert after** and click **Add collection to workflow**. The generated Python uses the existing `list_create` or `dictionary` actions.
- Dictionary values are **text-only** in this first visual collection builder. List items containing commas are not supported in the row-to-CSV bridge; there is an explicit warning. Up to 30 rows can be added to one collection.

### 3. Save and reuse workflow sections

- Under **Data & Map → Reusable sections**, check actions that form a *single connected, straight-line path*. Name the section and click **Save selected actions as section**.
- Saved sections appear in this project's section library, which is included in its exported JSON. Choose an action with a Next output and click **Use section** to insert a duplicate of the saved actions and internal links, with fresh graph identifiers.
- The wizard intentionally excludes Start, branching, loops and external value inputs from these reusable snippets. It does not turn a snippet into a standalone Python function; for that use **Functions & Classes**. Reusing variables with the same name may overwrite earlier values; review the generated Python.

### 4. New working template

**Visual Type Conversion** shows a text price (`'25.5'`) converted into a number, multiplied by two, and displayed as `51.0`. The template uses actual graph data connections. There are now **14 templates** and **62 existing Python action types**.

### Compatibility and validation

- Existing v0.11 projects load unchanged. Type conversions are ordinary existing Convert Type blocks; saved reusable sections are stored in optional `reusableSections` project metadata.
- Undo works for conversions, collections, section insertions and section saves.
- The default **Wide Editor**, overlay panels, Value Browser, Workflow Outline, Run & Inspect, Data Explorer and Python export are retained.
- Tests passed: 11 JavaScript suites, six Python suites, desktop/laptop/mobile Chromium v0.5–v0.12 interaction regressions. All 14 templates parse as valid Python; the new template executed and printed `51.0`. Live downloading of Pyodide from the CDN remains unverified in this test environment.

### Screenshots

- `preview_v012_wide.png` — actual default full-width workspace
- `preview_v012_transform.png` — guided conversion wizard
- `preview_v012_collections.png` — visual list and dictionary builder
- `preview_v012_sections.png` — saved reusable workflow section library
- `preview_v012_mobile.png` — 390 px layout

### Launch

1. Extract the ZIP into its own folder.
2. Open `index.html` in Chrome/Edge, or run `start_windows.bat` if Python is installed for a local-server origin.
3. Choose **Templates → Visual Type Conversion**, then open **Data & Map** and explore the new Transform and Reusable sections tabs.
4. Export project JSON regularly for backups. Export Python for running outside the browser when external packages or server capabilities are required.

**Important limitations:** This is a local prototype; it is not installed on your Windows PC automatically. Some advanced settings still allow Python expressions. A browser Worker is not a hardened sandbox: only run trusted workflows. There is no cloud sync, hosted deployment or universal Python coverage yet.

---

# PyFlow Studio v0.11 — Wide Visual Python Editor + Data & Map

## New in v0.11 — Data & Map (type-aware visual connections)

This release keeps the **Wide Editor** full-width and adds only one compact **Data & Map** toolbar button. Its two tabs open in a temporary overlay, so they do **not** shrink the visual programming canvas.

- **Available values:** Choose the receiving workflow action, browse only values produced by earlier actions on its connected execution path, see their Python data types and source actions, and link a saved value to an input using buttons. Compatible types are indicated; likely mismatches are flagged for review. Linking and unlinking are opt-in and Undo works.
- **Workflow outline:** Search and jump to steps, see whether each action belongs to the execution path or is disconnected, inspect link totals, and optionally **Organize visual layout**. This deterministic layout operation moves only node cards, not Python code or execution/data links. It can be undone.
- **Properties integration:** A small **Browse available values** shortcut appears in the settings panel for actions that have supported visual data inputs.
- **No new project file format:** Saved projects and the existing 62 Python actions, 13 templates, Function & Class Designer, generated Python, trace debugger, Data Explorer and v0.10 command palette are retained. Previous workflows load without migration.

Try it: open **Templates → Connected Data Calculator**, then **Data & Map**. Select the *Calculate* or *Display output* action as the receiver and choose an upstream number. Click **Connect selected value** to create the data wire. Open **Workflow outline** to search the graph or organize the card positions.

### What this is not

The value browser is *conservative*: it considers variables produced by connected predecessor actions, not every Python variable or every possible runtime branch. A highlighted type match is a useful hint, not proof that a program will run. No hosted execution, cloud sync, or complete syntax-free coverage for all Python libraries is claimed. Pyodide loading from the CDN was not verified in this restricted test environment. **Do not run untrusted Python** in the browser worker; it is not a secure sandbox.

### v0.11 verification

- 10 JavaScript unit suites passed, including upstream typed variables, graph outline and layout stability.
- 6 Python tests passed, including generated-code execution and CPython trace tests.
- v0.5–v0.11 browser regression tests passed at desktop, laptop and mobile widths. v0.11 specifically checks the wide canvas, typed link creation/removal and Undo, graph outline, non-destructive layout and mobile accessibility.
- Archive integrity checked. The ZIP contains the website, source, screenshots, documentation, and tests.

---

## What's new in v0.10 — navigate and learn without losing canvas space

The default **Wide Editor** remains full width. Three small controls have been added to the editor toolbar; they open **overlays** and never permanently reduce the working canvas:

- **Find steps** (`Ctrl+K` or `/`): search any existing block by name, parameter, or position; search the Python action catalog to insert a new step; and find editor commands such as Templates, Fit, and Functions & Classes. Use arrow keys and Enter, or click a result. The chosen workflow node is centered and selected.
- **Workflow Check**: a non-executing graph preflight, with clear links to problematic steps. It identifies unreachable nodes, missing Start, broken execution and data wires, duplicate input wires, loops in the execution graph, and existing compiler warnings. A green check means the *structure* appears valid, not that Python has executed successfully.
- **Guide**: five optional short lessons showing how to start from a template, add an action, configure data connections, inspect a workflow, and export the visual project. Each lesson has a real action to try. You can skip it at any time.

The previous `Ctrl+K` Add Action shortcut now opens Find steps; **Add action** still works by button or action search. All existing v0.9 features, 62 actions, 13 templates, visual modules, data ports, Data Explorer and Run & Inspect remain available.

### Quick launch

Extract the ZIP, then open `index.html` in Chrome or Edge. For a consistent browser origin and reliable local saving, run `start_windows.bat` if Python is installed on Windows. The visual editor and Python export work without installing JavaScript packages. Browser Python execution via Pyodide may need internet access and supported packages.

### Shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+K` / `Cmd+K` | Find actions, workflow steps and commands |
| `/` | Open step/action finder while not editing text |
| `W` | Wide/standard editor |
| `L` | Action library |
| `P` | Properties |
| `F` | Focus mode |
| `G` | Output / code dock |

### Safety and limitations

The checker is static, and cannot guarantee successful runtime behavior. The Pyodide browser worker is **not a hardened security sandbox**. Do not run untrusted workflows. Local storage may be unavailable with `file://` pages; use Export project (JSON) for durable backups. This software is not hosted publicly and does not yet offer production deployment, cloud sync or every Python concept without an expression field.


A **local-first visual Python programming website** that turns workflow actions, reusable functions, classes and guided data mappings into real Python source code. It is inspired by workflow builders such as n8n but is **not affiliated with n8n**. The focus is people who want to build useful programs without memorizing Python syntax.

## Open the application

1. Extract `PyFlow_Studio_v0_11.zip`.
2. Double-click `index.html` in Chrome or Edge. No account, Node.js installation, or website hosting is required for editing and exporting.
3. Select **Templates → Connected Data Calculator** for direct data wiring, **No-Code Invoice Calculator** for guided functions, or **Visual Class & Method** for object-oriented workflows.
4. In the Connected Data Calculator, click the purple output socket of a value-producing step and then the purple input socket of a later step; alternatively, select the destination and use **Connect workflow data** in the right-hand panel. In function/class examples, configure the inputs from dropdowns.
5. Click **Export Python** to download a `.py` file. Run that file using Python on your computer when your workflow requires a full Python environment.

For a local HTTP launch on Windows, `start_windows.bat` uses an existing Python installation to serve the folder. Browser local storage behavior depends on browser security settings. Use **Export project** (`.json`) for durable backups.


## New in v0.9 — Wide Editor and Data Explorer

The default layout now opens in **Wide Editor** mode. The canvas occupies nearly the full browser window. The action library and settings are **temporary overlay drawers**, not permanent columns. Open them with **Actions (L)** and **Properties (P)**. Clicking an action opens its settings without shrinking the workspace. Close a drawer with its **×**, by clicking outside, or by pressing **Escape**.

- **Wide Editor** button or **W** switches between the spacious editor and the traditional three-column view. Your view preference is saved in browser storage when supported.
- The extra full-width tool rail was intentionally removed: **Add action**, **Actions**, **Properties**, **Fit**, **Output**, **Focus**, and **More tools (⋯)** are accessible from the top toolbar without covering any programming blocks.
- The lower results area is hidden when collapsed, freeing vertical space. **Output (G)** reveals it on demand. The full-height canvas and workflow minimap are preserved.
- **Data Explorer** opens from a recorded result on a canvas block. It renders sampled list, dictionary, and DataFrame values as searchable rows/columns, with export of the recorded visible sample to CSV. Preview samples are not complete datasets and are never fabricated.
- **Guided error help** offers actionable steps for common Python exceptions and a button to open the relevant node's settings. It never silently edits the program.
- The 62 Python blocks, 13 templates, visual function/class editor, Python generator, data links, and debugger are retained.

The entire new UI is usable without a server for editing and code export. Browser execution depends on first-use Pyodide loading; the CDN download was not verified in this restricted test environment. The execution worker is **not a hardened sandbox** and must not be used for untrusted code.

### v0.9 keyboard shortcuts

- **W** — toggle Wide Editor
- **L** — toggle Python Actions drawer
- **P** — toggle Properties drawer
- **F** — toggle Focus Mode
- **G** — toggle code and output panel
- **Escape** — close temporary drawers/menus

### v0.9 test coverage

All eight JavaScript suites and six Python suites passed, as did the earlier v0.5–v0.9 browser suites and the new wide-layout browser test at 1680×960, 1366×768, and mobile 390×844. The new test checks that opening either dock **never shrinks the canvas**, clicking a workflow block opens settings, standard/wide switching works, controls remain accessible, and output is minimized by default.

## New in v0.8 — Execution results on every action card

**After a successful Run & Inspect recording**, action cards on the canvas now display a compact status and the most recent captured value. You can click each result card to jump to that Python execution event in the inspector. All of these values originate from the actual Python trace; no artificial execution or guessed outputs are displayed.

- **Executed** — the action had at least one actual Python trace event. A typed preview (number, text, boolean, list, dictionary, etc.) is shown when the trace captures a declared output or a changed variable.
- **Python error** — the action containing the exception line is highlighted in red, with the Python error and a contextual troubleshooting tip in the inspector.
- **Not executed** — an action had no matching trace event. This may mean it was disconnected, did not execute on the chosen branch, or the trace recording was truncated. The Start entry marker is not counted as a Python action.
- **Inputs & outputs** — the inspector shows the actual upstream values available in the current variable snapshot and the values produced/changed by the selected action. These are best-effort summaries of available trace data, not a full Python object debugger.
- **Project edits invalidate old results** — after modifying any workflow node, action statuses disappear and the inspector warns that the trace belongs to an earlier project version. Rerun to refresh them.
- **Pure, testable insight engine** — `insights-v08.js` provides the line-to-block result analysis and Python error guidance; `studio-v08.css` provides the professional action status cards and data panel.

### Try it

1. Open **Templates → Visual Lists & Data Types**.
2. Click **Run & Inspect**, then **Run Python & trace** (requires first-time Pyodide download).
3. Once Python finishes, close the inspector to see the canvas. Each executed action displays a green result strip; click one to inspect its variables and generated Python line.
4. Modify any input to see the old results disappear. Rerun to get new values.

**Testing boundary:** The v0.8 browser test uses real traces created by executing generated Python in CPython, then passes those fixtures through a mock browser Worker. The live CDN-dependent Pyodide download was not tested in this environment. The browser Worker is not a security sandbox; use only trusted projects. There is still no cloud hosting, user authentication or server-side deployment.

### Verification

- 13 templates retained, 62 Python actions retained, backward compatibility with v0.7 project JSON.
- Existing JavaScript, Python, and v0.5–v0.7 browser regression tests passed.
- New pure analyzer tests and v0.8 desktop/mobile browser tests passed, including real trace fixtures, action previews, error guidance, saved-result invalidation, and click-to-inspect.

## New in v0.7

### Run & Inspect — real execution trace, then replay

Click **Run & Inspect** in the project toolbar, or the corresponding button beneath the canvas on mobile. The inspector downloads the open-source **Pyodide** browser Python runtime on first use, then runs generated Python in a separate browser Worker. It records up to 300 actual Python line/return events, selected variable values, printed output, return values, and Python errors. After completion, move backward/forward through the recorded events, scrub through the timeline, and see the corresponding workflow block highlighted.

**Important distinction:** This is a replay of a real Python execution, not a live breakpoint debugger. The existing **Walkthrough** remains available to explore possible branches *without executing them*. Run & Inspect does run Python, including calculations and conditions, and reports real Python exceptions. It runs user-authored code locally in the browser; **a browser Worker is not a hardened security sandbox**. Open and execute only workflows you trust. The runner stops after a time limit; some long loops, interactive input, web servers and network-dependent actions are not supported. No production-grade multi-user execution service is provided.

The first run needs internet access to load Pyodide. If the runtime is blocked by a browser restriction, use the optional `start_windows.bat` to serve the folder locally and try again. **Export Python** remains the reliable route for unsupported packages, long computations and complex applications. The CDN was not reachable from the automated test environment, so browser tests validate the worker UI with recorded real CPython fixtures; the Python recording script itself was executed and verified under CPython.

### More useful data sockets and corrected output metadata

- Expanded input sockets for list append targets, comprehensions, return/yield values, pandas cleaning/filtering, JSON output, SQLite connections, selected Flask app variables, and more.
- Fixed output-variable metadata for SQLite connections, NumPy arrays, iris machine-learning features/labels, DataFrame transformations, Flask app objects, web scraping and list comprehensions, so the UI exposes the names generated by Python.
- Added a thirteenth **Visual Lists & Data Types** starter: `fruits` → sorted collection → display. Two purple data connections generate a real program that prints `['apple', 'banana', 'mango']`.
- The generator now includes harmless `# PYFLOW_NODE:<id>` comments to map Python lines to their corresponding visual blocks during trace replay. Exported Python still parses and executes normally.

### Validation for v0.7

- Existing JavaScript generator, expression, component and v0.5/v0.6 port tests: passed.
- Existing Python execution and syntax tests: passed.
- New unit tests: passed for 13 templates, repaired typed outputs and SQLite/ML data ports.
- New real Python recorder tests: passed for line events, values, printed output, function returns and exception line locations.
- New browser checks (desktop and mobile): passed for recorded-trace visualization, timeline navigation, block highlighting and error messages. The Pyodide CDN itself was unavailable in the test environment, so live network-dependent browser runtime loading is **not** certified by these tests.
- Existing v0.5 and v0.6 desktop/mobile UI regression checks: passed.

## New in v0.6

### Connect data directly on the canvas

Visual Python now has **two different types of connections**:

- **Gray arrows** control the order in which actions run.
- **Purple dotted wires** connect a named value produced by one action to a specific input on a later action.

Choose **Templates → Connected Data Calculator** to see it working. Click a purple data output on a source block, then a purple data input on a later block; alternatively select the destination and use **Connect workflow data** in the right-hand inspector. The project saves the connection in `dataLinks`, and the Python generator uses the connected variable names in the exported program. Data connections are independent of execution edges; connect the workflow path first. Use Undo to reverse a change.

For example, the included template creates `price = 200` and `tax_rate = 0.15`, wires both into multiplication to calculate `tax_due`, then wires that result into Display output. The generated Python executes and prints `30.0`.

**Important:** A few data inputs may remain manual in advanced blocks; some links crossing conditional paths trigger warnings because their variables may not exist on every branch.

### Logic Walkthrough (human-guided, not execution)

Click **Walkthrough** in the top toolbar, or the matching canvas action on smaller screens. This side overlay:

- Highlights one selected action at a time.
- Shows its configured settings, incoming data names and generated Python snippet.
- Provides **Next**, **Previous** and **Restart** navigation.
- Prompts the user to choose **Yes** or **No** when multiple control-flow branches are available instead of pretending to evaluate a real condition.

For actual execution, export a `.py` file to run using a local Python installation, or use the existing optional Pyodide runner for supported workflows.

### Compatibility, scope and testing

- Existing v0.5 projects import with their saved nodes, edges, mappings and components. If `dataLinks` is absent, it behaves like an empty list.
- Thirteen templates compile with no structural warnings. The new data-wired template generates executable Python that prints `30.0`.
- `tests/test_data_ports.js` checks distinct control/data links, inputs/outputs, type warnings, safety checks and JSON round-trip; `tests/test_data_ports_python.py` executes the generated example.
- `tests/test_ui_v06.py` checks data port clicks, editor inspector, undo, generated Python, walkthrough navigation/branches and mobile controls in headless Chromium.

## New in v0.5

### Guided Data Mapping — no expression syntax required

- Select a saved **Function** or **Class method** from dropdown menus.
- For every input, choose **Use saved workflow data** or **Enter a value**.
- Choose a saved variable produced by a **connected earlier step**. The dropdown shows its name, inferred type and originating action.
- Enter safe literal numbers, whole numbers, text, true/false, lists of text, or empty values through type-specific fields.
- Choose **Match saved values** to wire inputs to earlier variables with matching names automatically.
- Assign an output variable using the **Save the result as** field so the result is available to downstream steps.
- Preview the generated function/method call directly in the inspector before exporting.
- Receive compiler warnings for missing components, missing upstream variables, invalid literals or likely type mismatches. Invalid typed values are not interpolated as raw code.
- Older imported projects remain supported. Legacy function/method calls keep their previous argument strings until the user explicitly chooses **Switch to guided inputs**.

### New working templates

- **No-Code Invoice Calculator:** visually maps `price` and `tax_rate` into a reusable function, returning `230.0` for the included data.
- **Visual Class & Method:** creates a configured object, visually selects its `total()` method and maps its `price` input; returns `230.0`.

Total ready-made starter workflows: **13**, including Connected Data Calculator and Visual Lists & Data Types. Python action catalog: **62**.

### Retained capabilities

- Canvas-first, resizable editor and Focus Mode.
- 62 node actions across Python fundamentals, loops and conditions, functions/OOP, files, web/API, databases, data science and ML.
- Component Studio for visually creating and saving functions and classes, their attributes, methods and statements.
- Visual Expression Builder for supported standard blocks, contextual action picker, auto-layout, zoom, workflow minimap and optional browser execution via Pyodide.
- Generated `.py` and package requirements, visual project JSON import/export, undo/redo and local saves where browser permissions allow.

## Shortcuts

`F` = Focus canvas, `L` = action library, `P` = properties, `G` = results, `A` = action picker, `/` = search, `Ctrl+Z` = undo, `Ctrl+S` = save.

## Tests

Run from the extracted project directory with Python 3 and Node.js installed:

```bash
node tests/test_generator.js
node tests/test_components.js
node tests/test_expression.js
node tests/test_bindings.js
python tests/test_generated_python.py
python tests/test_components_python.py
python tests/test_bindings_python.py
python tests/test_ui_v05.py
node tests/test_data_ports.js
python tests/test_data_ports_python.py
python tests/test_ui_v06.py
node tests/test_trace_features_v07.js
python tests/test_trace_runtime_v07.py
python tests/test_ui_v07.py
```

The browser check uses Playwright and a compatible Chromium installation. The browser tests embed the source files in a test page because file/HTTP navigation is restricted in the test environment.

## Project architecture

- `index.html` — desktop and mobile GUI
- `styles.css`, `studio-v02.css`, `studio-v03.css`, `studio-v04.css`, `studio-v05.css`, `studio-v06.css`, `studio-v07.css` — layered styling
- `engine.js` — Python graph compiler and 62-action catalog
- `expression.js` — guided expression conversion
- `module-engine.js` — reusable function/class compiler
- `bindings-v05.js` — safe data binding, upstream context, template examples and compiler integration
- `data-ports-v06.js` — visual data inputs/outputs, validation, stored data links, and Python code generation integration
- `studio-v06.js`, `studio-v06.css` — visual walkthrough and socket/wire interface
- `trace_runtime_v07.py` — real Python line tracing, variable snapshotting and errors; source is embedded into the Worker
- `trace-worker-v07.js`, `trace-worker-inline-v07.js` — background browser Python runner and file:// compatible worker source bundle
- `trace-ui-v07.js`, `studio-v07.css` — execution inspector, variable timeline, source block highlighting
- `app.js`, `studio-v03.js`, `studio-v04.js`, `studio-v05.js`, `studio-v06.js` — visual editor, component designer, guided wiring inspector and logic walkthrough
- `tests/` — syntax, execution, validation and browser interaction checks
- `start_windows.bat` — optional local HTTP server launcher
- `preview.png`, `preview_ports.png`, `preview_walkthrough.png`, `preview_mapping.png`, `preview_class_mapping.png`, `preview_designer.png`, `preview_focus.png`, `preview_mobile.png`, `preview_trace.png` — screenshots of the actual running UI

## Important scope and security notes

This is a **working prototype**, not a complete visual replacement for every Python language feature. The guided data mapping supports saved visual functions/methods and safe typed values. Version 0.6 adds direct data ports for a growing subset of standard Python operations, including variables, calculations, condition inputs, loops, display, and selected file/data/ML blocks. This is not yet a fully generalized data-flow system across every Python action and is not a full static type checker; branch-dependent variables and unusual control flow need additional validation. Older actions still contain Python-like fields.

No public website is deployed; there is no account login, cloud synchronization, collaboration, hosted Python runtime, one-click deployment service, or live Python breakpoint debugger. The v0.6 Logic Walkthrough remains a human-guided explanation of possible paths; v0.7 adds real recorded Python execution for supported browser programs but does not pause live execution at each step. Running code through optional Pyodide requires the internet to fetch the runtime; many third-party packages, local files, API servers and interactive scripts require a local Python environment. Do not execute scripts from untrusted projects.

The source code and project data remain local to the browser unless the user explicitly exports files or runs code that accesses configured remote endpoints. Browser storage can be cleared by browser settings; export JSON backups for important work.
