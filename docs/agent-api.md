# Agent-Friendly Editor API

The editor exposes a constrained local API for agents, scripts, and tests that
need to create or revise a Factorio GUI layout without clicking through the UI
or mutating `localStorage` directly. The API edits the same structured model as
the visual builder and leaves the result in the normal editor for operator
review.

## Boundary And Threat Model

The API schema is `labtorio-editor-api.v0`.

This is not a remote-control server. The static public app does not listen on a
network socket, accept cross-origin commands, or execute arbitrary Lua,
JavaScript, CSS, or shell commands. The browser facade is a local page object:

```js
window.labtorioEditorApi
```

Code that already runs in the page can use it, such as Playwright, a browser
console script, or a local agent harness. The facade delegates to
`src/factorioEditorApi.js`, which can also be imported directly by tests or
future headless tooling.

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

## Browser Example

```js
const result = window.labtorioEditorApi.runAll([
  { type: "createWindow", title: "Agent draft", size: { width: 760, height: 500 } },
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
```

When `result.ok` is true, the browser facade updates the normal editor state.
The operator can then inspect the canvas, component tree, Factorio properties,
Lua output, and preview mod export as usual.

Successful mutating `run` and `runAll` calls also append
`labtorio-agent-provenance.v0` metadata to the editor state. The caller may pass
an optional label and summary:

```js
window.labtorioEditorApi.runAll(commands, {
  label: "Codex agent",
  summary: "Created first pass of the dispatch window."
});
```

The provenance entry records timestamp, author, command types, touched node ids,
and summary text. The Properties tab shows the latest agent entry so the
operator can tell that the current draft came from the API and which nodes were
most directly touched. The metadata is also serialized into
`*.labtorio-gui.json` design files.

## Current Limits

The v0 API does not create new atom types beyond the existing builder palette,
does not expose a remote transport, does not provide a full per-node authorship
diff, and does not generate Lua behavior handlers. Behavior intent should use
the package hook metadata contract from [factorio-mod-export.md](factorio-mod-export.md).
