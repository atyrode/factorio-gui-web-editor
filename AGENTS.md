# Agent Instructions

These instructions apply to the whole repository.

## Branch And Git Policy

- Fetch remote state before committing, branching, merging, or pushing when it
  is relevant to the task.
- Keep `main` stable and reserved for reviewed, working changes.
- Use short-lived feature branches for substantial work.
- Open pull requests early for visible feature work.
- Commit meaningful steps as work progresses instead of leaving completed work
  only in the working tree.
- Do not force-push shared branches, delete remote refs, or rewrite shared
  history unless the operator explicitly authorizes that exact action.
- Never revert user changes unless explicitly requested.

## Product Direction

- This project builds a browser tool for designing Factorio-style GUI layouts.
- Keep the tool constrained by Factorio GUI primitives and style behavior.
- Prefer a model that can later render to browser DOM and Factorio Lua
  structure from the same source.
- Do not let arbitrary CSS or freeform pixel dragging become the source of truth
  for Factorio GUI layout.
- Do not vendor Wube CSS, minified page styles, Factorio images, or other
  copyrighted assets.
- Keep the editor core free of bundled domain examples. Future examples should
  live outside the core model and renderer.

## Documentation Rule

- Update docs when changing architecture, workflows, validation, assumptions,
  model schemas, exported formats, or user-visible behavior.
- Keep GUI process guidance in `docs/spec-factory.md`.
- Keep roadmap and spike sequencing in `docs/roadmap.md`.
- Keep Factorio styling/source notes in `docs/factorio-style-sources.md`.
- Keep future example-specific specs under `docs/examples/` only after an
  example is intentionally introduced.
- Do not duplicate the same guidance across many files; update the owning doc
  and add short cross-references only when useful.

## Engineering Style

- Prefer small, explicit modules over broad abstractions.
- Keep edits scoped to the requested change.
- Use existing project patterns before inventing new ones.
- Use structured data/models where practical instead of parsing UI text.
- Keep browser code dependency-light until a dependency clearly earns its cost.
- Use stable anchors/IDs for elements that specs, checks, or future exports need
  to reference.
- Add comments only where they clarify non-obvious behavior or constraints.

## Factorio GUI Research

- Official Factorio API docs are authoritative for runtime behavior.
- Raiguard's Factorio GUI style guide is a high-value style reference.
- Public mod/source references may guide architecture, but cite exact inspected
  pages or files before turning observations into rules.
- Graphical Factorio style tools are important:
  - `Ctrl+F6`: GUI style inspector;
  - `Ctrl+F5`: bounding boxes;
  - `Ctrl+F7`: shadows.
- Factorio headless cannot provide the graphical style-inspector overlay.
  Script-visible GUI/style fields can be dumped by a graphical companion mod,
  but renderer-computed overlay fields still need graphical inspection.

## Visual Work Tracking

- For nuanced visual work with overlapping model, styling, shadow, or layout
  concerns, create or update a tracked issue or owning doc section with explicit
  acceptance criteria before implementation.
- Keep acceptance criteria tied to the user's visual language and reference
  crops, not only to inferred technical abstractions.
- Treat inspection toggles and structural checks as aids, not completion, unless
  the tracked criteria explicitly define them as the deliverable.
- Do not mark visual work complete without fresh screenshot evidence for the
  requested states, including shadow-disabled captures when Factorio `Ctrl+F7`
  behavior is part of the request.

## Validation

- Run the narrowest meaningful checks before committing.
- For current static app changes, run `scripts/check.sh`.
- If checks cannot be run, state why and describe the remaining risk.
- Structural checks do not replace visual review.

## Secret Handling

- Never write, paste, print, commit, or ask for plaintext passwords, API tokens,
  private keys, credentials, generated secrets, or secret-bearing URLs.
- Use ignored local env files, GitHub Secrets/Variables, password managers, or
  equivalent secret stores for sensitive values.
- Documentation may name variables but must use placeholders such as
  `<example-token>`.
- If secret material is printed, committed, or pushed, treat it as compromised
  and discuss rotation/remediation before continuing.

## Working Style

- Prefer `rg`/`rg --files` for searches.
- Use explicit file paths when staging in mixed worktrees.
- Keep final handoffs concrete: branch, commit, validation, remote URL, and
  remaining review risk.
