# Scriptable Editor API

The editor exposes a constrained local API for scripts, tests, and headless
tooling that need to create or revise a Factorio GUI layout without clicking
through the UI or mutating `localStorage` directly. The API edits the same
structured model as the visual builder and can either leave the result in the
normal editor for operator review or write files from a Node command.

## Boundary And Threat Model

The API schema is `labtorio-editor-api.v0`.

This is not a remote-control server. The static public app does not listen on a
network socket, accept cross-origin commands, or execute arbitrary Lua,
JavaScript, CSS, or shell commands. The browser facade is a local page object:

```js
window.labtorioEditorApi
```

Code that already runs in the page can use it, such as Playwright or a browser
console script. The facade delegates to `src/factorioEditorApi.js`, which can
also be imported directly by tests and by `scripts/editor-api.mjs`. Both the
browser facade and the Node runner expose the same API description and flat
summary shapes for machine-readable inspection.

The API must keep using existing model operations and builder constraints. It
must not introduce arbitrary CSS layout, freeform pixel placement, unsupported
Factorio structures, or generated behavior code.

## Result Envelope

Single commands return:

```json
{
  "schema": "labtorio-editor-api.v0",
  "ok": true,
  "mutated": true,
  "state": {},
  "diagnostics": [],
  "value": {}
}
```

Failures do not throw for ordinary validation problems. They return
`ok: false` with structured diagnostics:

```json
{
  "schema": "labtorio-editor-api.v0",
  "ok": false,
  "mutated": false,
  "state": {},
  "diagnostics": [
    {
      "severity": "error",
      "code": "unsupported_resize",
      "message": "gui_label_1 does not support API resize."
    }
  ]
}
```

Command batches are atomic from the browser facade's point of view. A failed
batch returns diagnostics and does not update the live editor state.

## Description

Use the description endpoint before writing commands when a script needs to
discover the supported surface:

```sh
npm run api:run -- --describe --pretty
```

In the browser, the same shape is available as:

```js
window.labtorioEditorApi.describe()
```

The description schema is `labtorio-editor-api-description.v0`. It includes:

- command names, accepted fields, read-only versus mutating classification, and
  command outputs;
- known atoms, default style variants, id prefixes, resize/caption support, and
  parent/child rules derived from the builder atom metadata;
- body root id, Window and layout-node size limits, and supported body
  directions;
- runner options and output flags for design JSON, Lua, mod zip, and result
  JSON files;
- result envelope keys for single commands, command batches, and runner output.

## Commands

Supported v0 commands:

| Command | Purpose |
| --- | --- |
| `createWindow` | Create or refresh the top-level Window from title, size, and body direction. |
| `resetWindow` | Remove the current Window. |
| `setTitle` | Set the editor and Window title. |
| `setBodyDirection` | Set `horizontal` or `vertical` Window body direction. |
| `setWindowSize` | Set Window width and/or height through bounded model size. |
| `insertAtom` | Insert a supported atom into a valid parent at an ordered index. |
| `moveAtom` | Move an authored layout node to another valid parent/index. |
| `resizeNode` | Resize the Window or supported authored Frame/Horizontal Flow nodes. |
| `editCaption` | Edit an authored Label caption. |
| `setLuaVariableName` | Set or clear a validated Lua variable-name override. |
| `setHooks` | Replace validated `labtorio-gui-hooks.v0` metadata. |
| `importDesignFile` | Import a structured design file payload or JSON text. |
| `exportDesignFile` | Return the structured design-file download payload. |
| `exportLua` | Return generated `gui.lua` text. |
| `exportModZip` | Return the local preview mod zip bytes. |
| `validate` | Return structured state diagnostics. |

## Headless Runner

Use the Node runner when a script needs to generate or revise a layout without
opening a browser:

```sh
npm run api:run -- \
  --commands commands.json \
  --out-design layout.labtorio-gui.json \
  --out-lua gui.lua \
  --result result.json \
  --pretty
```

`--commands` accepts either a JSON array or `{ "commands": [...] }`. Use
`--commands -` to read from stdin. Use `--input-design existing.labtorio-gui.json`
to start from a saved design file.

The runner prints a machine-readable result envelope to stdout and exits with
status `0` on success or `1` on validation/output failure. The result includes
the normalized editor state, command diagnostics, written output paths, and a
flat `summary.nodes` list so tooling can inspect ids, parents, order, captions,
sizes, style variants, and Lua variable aliases without needing visual
recognition.

## Examples

Create a Window with a Frame, Horizontal Flow, Label, and Filler:

```sh
npm run api:run -- \
  --commands examples/api/create-window.commands.json \
  --out-design /tmp/labtorio-created.labtorio-gui.json \
  --out-lua /tmp/labtorio-created.lua \
  --pretty
```

Revise an existing design file through commands:

```sh
npm run api:run -- \
  --input-design examples/api/base-design.labtorio-gui.json \
  --commands examples/api/revise-existing.commands.json \
  --out-design /tmp/labtorio-revised.labtorio-gui.json \
  --out-lua /tmp/labtorio-revised.lua \
  --pretty
```

The generated design JSON can be imported through the normal editor export
drawer. The generated Lua can be inspected in a mod project, but the editable
source of truth remains the design JSON.

## Browser Example

```js
const description = window.labtorioEditorApi.describe();
console.table(description.layout.atoms);

const result = window.labtorioEditorApi.runAll([
  { type: "createWindow", title: "Scripted draft", size: { width: 760, height: 500 } },
  { type: "insertAtom", atom: "frame", parentId: "gui_window_body" },
  { type: "insertAtom", atom: "horizontal-flow", parentId: "gui_frame_1" },
  { type: "insertAtom", atom: "label", parentId: "gui_horizontal_flow_2" },
  { type: "editCaption", nodeId: "gui_label_3", caption: "Dispatch" },
  { type: "setLuaVariableName", nodeId: "gui_label_3", name: "dispatch_label" },
  { type: "exportLua" }
]);

if (!result.ok) {
  console.table(result.diagnostics);
}

console.table(window.labtorioEditorApi.summary().nodes);
```

When `result.ok` is true, the browser facade updates the normal editor state.
The operator can then inspect the canvas, component tree, Factorio properties,
Lua output, and preview mod export as usual.

## Current Limits

The v0 API does not create new atom types beyond the existing builder palette,
does not expose a remote transport, does not create an audit trail for scripted
edits, and does not generate Lua behavior handlers. Behavior intent should use
the package hook metadata contract from [factorio-mod-export.md](factorio-mod-export.md).
