# Atom Specs

This document defines how this project reconstructs Factorio GUI atoms. An atom
is a reusable GUI component or reported component family, such as Window,
Horizontal Flow, Vertical Flow, Label, Filler, Frame, Button, Table, or
Scroll Pane. Style names such as `frame_header_flow`, `frame_title`,
`inside_deep_frame`, and `inset_frame_container_horizontal_flow` are evidence
and variants of atoms, not atom names by themselves.

The goal is not to collect screenshots forever. The goal is to turn each atom
into a constrained model primitive that can render in the browser, inspect like
Factorio, validate its own assumptions, and export useful Lua as soon as it
exists.

## Completion Contract

An atom is not complete until these surfaces agree:

| Surface | Required result |
| --- | --- |
| Evidence | Captures and official/API facts identify the component, style variants, fields, and unresolved questions. |
| Model | The shared JSON model can represent the atom with stable ids, Factorio primitive, style, direction, reference sizing, style fields, and children. |
| Renderer | Browser DOM/CSS renders the atom from model data without making arbitrary CSS the source of truth. |
| Inspector | The in-app inspector exposes captured and inferred fields from structured data, with unknown values marked as planned or unresolved. |
| Lua export | The atom exports immediately to a Factorio Lua skeleton using the closest valid primitive, style, direction, names, and supported style assignments. |
| Behavior | Any runtime interaction that belongs to the atom is modeled or explicitly deferred with stable hook names. |
| Validation | `scripts/check.sh` and any atom-specific checks pass; visual review gaps are documented. |
| Tracking | The atom registry, owning docs, issue, and draft PR say what is implemented, hardcoded, assumed, and missing. |

The Lua export requirement is part of the atom definition. If an atom cannot yet
export perfect Lua, it should still export the best structural skeleton we can
defend, with behavior hooks or TODO comments where Factorio-side behavior is not
known yet.

Container atoms can be complete before every child atom is complete. For a
container such as Window, completion means the shell, layout contract, optional
slots, and export boundaries are stable enough that later child atoms can be
inserted without reworking the container. The child atom still owns its own
renderer, export, and runtime behavior.

## Evidence Intake

Start each atom with evidence, not code. Prefer sources in this order:

1. Official Factorio API docs for runtime primitives, properties, style fields,
   and Lua behavior.
2. Graphical Factorio inspection using `Ctrl+F6` for style/layout fields,
   `Ctrl+F5` for bounding boxes, and `Ctrl+F7` for shadows.
3. Raiguard's Factorio GUI style guide and public mod sources when they explain
   practical composition or naming.
4. Existing project captures and screenshots.

For every capture, record:

- Factorio version or source context when known.
- UI scale, resolution, viewport, and display mode when they are known.
- Screen/window name.
- Reported class, primitive if known, style, and derived style.
- `relative`, `size`, `content_size`, `clip_size`, `size_before_stretching`,
  squash sizes, and style fields shown by the inspector.
- Ordered children with class and size.
- Whether a value appears instance-derived, style-derived, inherited, or
  renderer-computed.

Do not promote one capture into a rule until conflicting captures have been
checked. If a rule is still uncertain, keep it as an assumption or planned task
instead of hiding it in code.

## Implementation Pass

Build each atom through the same sequence:

1. Register the atom in `src/factorioAtomRegistry.js` with fields, captures,
   progress checks, implemented items, assumptions, hardcoded values, and missing
   work.
2. Extend the shared model in `src/factorioModel.js` or a focused model module.
   Keep stable ids and Factorio primitives explicit.
3. Render the atom from model data in `src/components/factorioGui.jsx` and
   `src/styles/factorio-atoms.css`.
4. Expose inspector rows from structured data, not parsed DOM text.
5. Extend `src/factorioExport.js` so the atom has valid Lua output in the same
   pass that makes it visible in the editor.
6. Update owning docs when model schema, assumptions, exported format, style
   rules, or user-visible behavior change.
7. Run `scripts/check.sh`; add narrower checks when the atom gets behavior or
   nontrivial export logic.

An implementation can be partial, but the partial state must be honest. Prefer
an exported skeleton plus documented missing behavior over a browser-only atom
that cannot translate to Factorio.

## Field Classification

Classify every atom field so future agents know how much to trust it:

| State | Meaning |
| --- | --- |
| `captured` | Directly observed in `Ctrl+F6` or an equivalent trusted source. |
| `official` | Defined by official Factorio docs. |
| `inferred` | Derived from captured values by a stated formula. |
| `editorOwned` | Chosen by this editor, such as stable ids or placeholder captions. |
| `implemented` | Present in model, renderer, inspector, and export. |
| `planned` | Known requirement with incomplete implementation. |
| `unknown` | Observed gap with no defensible rule yet. |

The atom registry should carry the field state; docs should explain only the
rules or assumptions that need prose.

## Progress Scoring

Progress percentages should be derived from named checks, not hand-entered
confidence. Each check belongs to one dimension and has one state:

| State | Score |
| --- | --- |
| `done` | 1 |
| `partial` | 0.5 |
| `todo` | 0 |
| `blocked` | 0 |

The dimension percentage is the average of its check scores. A blocked check is
not a failure; it means the next useful step requires in-game evidence, a source
inspection, or a separate atom implementation.

## Lua Export Rules

Every atom should define how it maps to Lua:

- `primitive` maps to Factorio `type` where possible.
- `id` maps to stable `name`.
- `style` maps to Factorio style when the style exists in Factorio.
- `direction` is emitted only for primitives that support it.
- Captions, selected indexes, numeric sizes, stretch flags, padding, spacing,
  and margins are emitted only when the field is known and Factorio's API
  supports assignment.
- Unknown style fields stay out of export until confirmed.
- Behavior exports as named hook placeholders only when behavior is part of the
  atom contract.

Generated Lua should be structurally useful even before it is final. It should
not silently claim exact parity for fields that remain inferred or unknown.

## Definition Of Done

An atom reaches 100% only when:

- The registry evidence, model, renderer, Lua export, and behavior dimensions
  are all complete for the claimed scope.
- Known variants are either implemented or explicitly excluded from the scope.
- The editor can create, render, inspect, and export the atom without special
  one-off code paths.
- Open questions have either been answered or moved to future issues with
  concrete requested captures/tests.
- Documentation and the draft PR describe the exact remaining visual review
  risk, if any.

Do not block useful partial work on full parity. Instead, keep the scope narrow,
make the exported structure valid, and track the missing facts where the next
agent or operator will look first.
