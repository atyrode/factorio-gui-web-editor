# Turret XP GUI Spec Assembly

This directory contains the split working spec for the next Turret XP GUI
design. It is produced by [../../spec-factory.md](../../spec-factory.md) and
assembled from focused contracts so the browser prototype and future Lua
export or implementation can target named surfaces instead of chat memory.

These files own the current design slices used by the standalone browser
prototype. Turret XP is the first example project bundled with the editor.

## Assembly Order

1. [factorio-style-sources.md](../../factorio-style-sources.md): public
   Factorio web, Mod Portal, and API-docs styling notes used to shape local
   tokens.
2. [core-picker.md](core-picker.md): empty-turret picker contract.
3. [workbench.md](workbench.md): installed-core workbench shell contract.
4. [build-plan.md](build-plan.md): Build Plan mode contract.
5. [stat-inspector.md](stat-inspector.md): pinned consequence panel contract.
6. [browser-prototype.md](browser-prototype.md): prototype tool contract,
   fixture coverage, and stop conditions.
7. [roadmap.md](../../roadmap.md): future
   Factorio-constrained builder, shared model, Lua skeleton export, and web demo
   renderer roadmap.

## Current Product Shape

The accepted high-level shape is:

- Empty turret: a focused Core Picker, no dashboard shell.
- Installed turret: one Veteran Core Workbench surface.
- Main workbench body: Progression Editor plus pinned Stat Inspector.
- Build Plan: a mode of the workbench, not a separate tab or page.
- Automation controls: visible where they affect build planning, not isolated
  away from progression feedback.
- Detailed stats, combat history, naming, labels, and dev controls: reachable
  drawers, not primary layout drivers.

## Implementation Rule

New work on the Turret XP example SHOULD target this split spec or update it
first. The browser prototype at [../../../index.html](../../../index.html) is
the first implementation target. Lua implementation is intentionally out of
scope for this example until the browser prototype passes human visual review.

The broader builder and shared-renderer direction is tracked in
[../../roadmap.md](../../roadmap.md). It is intentionally sequential: static
viewer first, constrained layout model next, Lua skeleton export after that,
and only then richer no-code-like editing.

## Drift Rule

When a prototype or Lua screen needs a new anchor, fixture, mode, or component,
update this directory in the same change. Do not let code become the only place
where a design decision exists.
