# PyFlow Studio v0.13 — Release Notes

**Date:** 18 November 2026  
**Type:** Usability and reliability upgrade to the local visual Python editor

### Added

- Guided forms for **Calculate, If / Else, Display, For Each, Sort, Assert** with upstream value discovery, typed constants, output-name checks and plain-language validation.
- Contextual **Configure with guided choices** in the existing Properties panel.
- Section **Preview**, **Rename**, and **Copy** controls with an insertion audit that warns about reused output variable names.
- Data-wire consistency: replacing an input with a literal disconnects its previous wire; picking a saved upstream value connects its source. No silent stale wire overrides.

### Preserved

- Wide editor as the default, and the existing 62 block types, 14 templates, Python export, visual components, type conversion, Data & Map, debugger, sections and JSON compatibility.
- No new permanent sidebar and no required project migration.

### Verification

- All 12 JavaScript suites and six CPython test suites passed; the generated code for the existing 14 templates remains valid.
- Chromium interaction tests passed for desktop 1680×960, laptop 1366×768 and mobile 390×844, plus v0.9–v0.12 regressions.
- Checked new guided action forms, numeric literal validation, connected-value selection, Python export consistency, section previews, copy, Undo and full-width canvas.
- Final ZIP integrity verified separately. Live external Pyodide runtime load remains unverified.

### Remaining work

- Guided forms for the remaining advanced action types; expression-free field builders for more APIs/Pandas/ML operations; deeper type/path checking; more robust section-variable remapping; browser runtime validation and security architecture; cloud hosting and account sync.

---

# PyFlow Studio v0.12 — Release Notes

**Date:** 17 November 2026  
**Type:** Incremental upgrade to the local-first no-code Python builder  
**UI:** Professional wide canvas retained, with new features under Data & Map

### Added

- **Type Conversion Wizard:** inserts a Convert Type action before a single-incoming-arrow receiver, automatically connects the chosen upstream output to that conversion and the converted result to the target input. Includes collision-safe generated output names, preview and type/semantics warnings.
- **Visual Collections:** row-based creation of text/number lists and text-value dictionaries, inserted using the existing Python action definitions.
- **Reusable Sections:** save one connected linear workflow sequence, store its internal data/execution links in project JSON, and reinsert a freshly ID-remapped copy anywhere with a Next execution port.
- **Visual Type Conversion template:** a fully connected example; exported Python produces `51.0`.
- **Type-aware ports:** Convert Type outputs are labeled from their requested target type instead of always `any`.

### Verified

- 11 JavaScript test suites and six Python test suites passed; all 14 template programs parse as Python.
- Actual Python execution for the new Visual Type Conversion example returned `51.0`.
- v0.5–v0.12 Chromium regression suites passed at 1680×960, 1366×768 and 390×844 viewports; tests include conversions, collections, sections, undo and continued full-width editing.
- ZIP integrity verified after packaging. No live Pyodide CDN download was available in the restricted testing environment.

### Deliberate limitations

- Automatic conversion splicing is restricted to a receiver with exactly one incoming execution arrow. Type conversion can still fail at runtime for unsuitable values.
- Reusable sections are straight-line graph snippets, not Python function definitions. Incoming external data wires, Start, branches and loops are excluded from this initial workflow.
- Basic list editor uses comma-separated entries under the hood, so commas inside entries are disallowed. Dictionary values are text-only.
- Neither hosted deployment nor installation on the user's PC is included. Browser code execution is not a secure sandbox for untrusted programs.

---

# PyFlow Studio v0.11 — Release Notes

**17 November 2026 — Local-first development release**

## New in v0.11

- Professional **Data & Map** overlay with two modes: type-aware upstream value browser and searchable workflow outline. The wide editor remains the default; no new permanent panels have been added.
- Users can explicitly connect or remove data values from existing predecessor actions, with type compatibility hints, no manual expressions for these supported inputs, and reversible changes.
- The workflow outline identifies connected and detached actions, jumps to a selected step, and offers a deterministic **Organize visual layout** command that leaves program logic unchanged.
- Added a contextual value-browser shortcut to Properties for actions with data inputs, and kept the old expression builder, command palette, debugger, and visual component studio.
- Pure JavaScript intelligence module and browser UI module added; project JSON schema is unchanged.

**Verification:** All 10 JavaScript suites, 6 Python suites, and the complete prior plus new desktop/mobile browser regression suites passed. Tests use inlined local page assets because network/localhost access is restricted in the test environment. Live Pyodide download remains unverified. This is a local prototype, not a cloud-hosted product.

## Improved navigation without crowding the editor

- New Ctrl+K / Cmd+K command palette for locating existing steps, adding Python actions and invoking editor commands. The search accepts words in any order and supports keyboard controls.
- New structural Workflow Check with clickable suggestions for unreachable nodes, missing Start, cycles, broken execution/data wires, duplicate data destinations, and compiler notes.
- Five-step optional visual onboarding tour, with actions linked to the actual interface.
- Keeps v0.9 full-width editor and overlay drawers as the default.
- Fixed legacy keyboard-handler conflict: Ctrl+K no longer opens the older Add Action popup.

## Compatibility and verification

- Backward compatible with saved v0.9 visual projects; no project schema migrations required.
- Preserves 62 Python actions, 13 templates, typed data previews, functions/classes, visual data links, trace replay and Python export.
- Passed all 9 JavaScript suites, 6 Python generator/trace suites and v0.5–v0.10 Chromium regression checks on desktop, laptop and mobile. A focused v0.10 test covers search, keyboard navigation, issue jumping and the tour.

## Boundaries

Workflow Check inspects structure; it does not prove runtime success. The real Python trace replay remains browser-runtime dependent; Pyodide downloading and arbitrary package execution have not been verified in this test environment. Running untrusted Python inside the browser Worker is unsafe; use trusted projects. No public cloud deployment or multiuser account sync in this release.
