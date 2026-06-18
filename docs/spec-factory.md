# GUI Spec Factory

This document defines how this project writes Factorio GUI specs before
changing renderer, editor, or Lua-export code. It is a process document, not a
product spec. A product spec created from this factory must be concrete enough
that an implementation agent can build only what is written, a reviewer can
compare screenshots against named anchors, and the team can revise the design
without reverse-engineering code.

The first bundled product spec built from this factory is the
[Turret XP example](examples/turret-xp/README.md).

## Purpose

GUI work has two separate problems:

- deciding what experience should exist;
- implementing that experience correctly in Factorio GUI code.

These must not happen in the same undocumented pass. When design intent is
only carried in chat, screenshots, or half-built Lua, the next edit can
accidentally preserve bad layout assumptions. This factory creates a written
contract between design and implementation.

The contract must answer:

- what screens and modes exist;
- what each screen is for;
- what information is always visible;
- what can scroll and what must stay pinned;
- which controls mutate live state, planned state, or display preferences;
- how the GUI behaves in representative fixtures;
- what visual anchors reviewers should inspect in screenshots;
- what automated tests can prove without human taste judgment.

## Definitions

- Factory: this document. It explains how to create and maintain GUI specs.
- Product spec: a concrete GUI spec created by this factory for one UI surface.
- Fixture: a named gameplay state used to design, test, and screenshot the GUI.
- Anchor: a named visual or structural element that must exist in a screen.
- Contract: a precise rule for layout, behavior, data, visibility, or testing.
- Static shell: a rendered GUI frame with real structure and placeholder data,
  before deep behavior is wired.
- Visual gate: a stop point where screenshots are reviewed before more code is
  written.
- Drift: code, tests, or screenshots no longer matching the product spec.

## Operating Rule

No major GUI implementation starts until the product spec exists.

No GUI implementation is accepted if it implements behavior, screens, modes, or
layout concepts that are not present in the product spec.

If the implementation reveals a better design, update the product spec first,
then update code. The spec is not ceremony after the fact; it is the source of
truth for the next implementation pass.

## Roles

The operator owns taste, product acceptance, and final visual approval.

The agent owns:

- turning product direction into a precise spec;
- preserving feature coverage;
- refusing to hide uncertain design choices inside code;
- creating fixtures and contracts that can be checked mechanically;
- stopping at visual gates when screenshots do not satisfy the spec.

The code owns:

- rendering named anchors from the product spec;
- keeping stable IDs or element names that tests can inspect;
- updating predictable parts of the GUI in place;
- avoiding unreviewed layout inventions.

## Factory Workflow

### 1. Problem Frame

Start with a short problem statement:

- What is wrong with the current GUI?
- What player job is failing?
- What previous implementation direction is explicitly rejected?
- What must be preserved from the existing product?

The problem frame should separate functional coverage from layout inheritance.
For example, "keep specialization choices" is a functional requirement;
"show specialization in the old right column" is a layout assumption.

### 2. Feature Inventory

List every player-visible feature that the current GUI supports. Do this before
designing the new structure so the redesign does not silently drop behavior.

Each feature must get one of these outcomes:

- Preserve: same behavior, possibly new presentation.
- Merge: behavior remains but moves into another component.
- Split: behavior needs multiple clearer surfaces.
- Defer: behavior is intentionally not part of this pass.
- Remove: behavior is intentionally deleted, with a reason.

Use a table with these columns:

```text
Feature | Current job | New location | State | Notes
```

Do not use vague rows such as "stats" or "automation" when the feature has
separate player jobs. Split them into observable behaviors: "toggle Follow
build", "inspect current DPS", "preview planned range delta", and so on.

### 3. Player Jobs

Define the jobs the GUI must support. A good job is written from the player's
point of view and implies what must be visible.

Examples:

- Install one exact Veteran Core into this turret.
- Spend a point and immediately see what changed.
- Plan a copied build without mutating the live core.
- Confirm why Follow build is blocked.
- Rename the core and choose which label parts float above the turret.
- Inspect detailed stats when debugging a build.

Every top-level screen or mode must map to at least one job. A screen with no
job should not exist.

### 4. Information Architecture

Group features around player jobs, not around legacy modules.

For each screen or mode, define:

- entry condition;
- exit condition;
- primary job;
- secondary jobs;
- always-visible anchors;
- scroll regions;
- hidden or deferred information;
- destructive or high-impact actions.

Prefer fewer screens with stronger persistent context. If an action changes a
stat, the affected stat should be visible in the same screen unless the spec
has a clear reason not to show it.

### 5. State Fixtures

Create named fixtures before writing wireframes. The product spec must say how
the GUI behaves for each fixture.

Recommended minimum fixture fields:

```text
id:
screen:
turret:
core:
level:
xp:
unspent_core_points:
unspent_augment_points:
specialization:
sub_specialization:
elements:
build_mode:
follow_build:
copied_target:
inventory_cores:
platform_cores:
dev_mode:
expected_primary_job:
```

Fixtures should cover:

- empty turret, no cores available;
- empty turret, inventory cores available;
- empty turret, platform cores available;
- installed new core;
- installed high-level core with unspent points;
- installed specialized core with elements;
- build-plan mode with previewed deltas;
- copied build with conflicts;
- Follow build active;
- developer controls enabled.

Fixtures are not only test data. They are design tools. If a screen looks good
only in the simplest fixture, the spec is not ready.

### 6. Visibility Matrix

Create a visibility matrix for important controls and data. This prevents
"where did that go?" regressions.

Example format:

```text
Element                  Empty picker  Live workbench  Build plan  Details
Core install action      yes           no              no          no
XP progress              no            yes             yes         optional
Live stat inspector      no            yes             yes         yes
Build plan toggle        no            yes             yes         yes
Follow build toggle      no            yes             yes         yes
Full combat history      no            hidden          hidden      yes
```

Use `yes`, `no`, `hidden`, `disabled`, or `optional`, and explain any
non-obvious entry below the table.

### 7. ASCII Wireframes

Before code, write ASCII wireframes for each screen. They are not pixel-perfect,
but they must define structure, pinning, and scroll behavior.

Rules:

- Name every anchor in brackets, such as `[Core Header]`.
- Mark scroll regions explicitly with `[Scroll: ...]`.
- Mark pinned regions explicitly with `[Pinned: ...]`.
- Show relative hierarchy and columns.
- Include approximate width intent when it matters.
- Do not use decorative boxes that imply nesting without purpose.

Example:

```text
Turret XP Workbench
+--------------------------------------------------------------+
| [Core Header: slot, name, level, XP, actions]                |
| [Mode Bar: Live | Build Plan] [Follow Build] [Warnings]      |
+--------------------------------------+-----------------------+
| [Scroll: Progression Editor]          | [Pinned: Stat        |
| - Core upgrades                       |  Inspector]          |
| - Role path                           | - Damage             |
| - Elements                            | - DPS                |
| - Augments                            | - Range              |
|                                       | - HP/Shield          |
+--------------------------------------+-----------------------+
```

If the intended layout changes at small interface scale, include a second
wireframe for that scale. Do not assume the code will discover a good
responsive shape on its own.

### 8. Component Contracts

Each reusable component must have a contract. A contract says what the
component owns and what it must never own.

Template:

```text
Component:
Purpose:
Inputs:
Outputs/actions:
Always visible:
Visible only when:
Never shows:
Scroll behavior:
Sizing rules:
Color rules:
Refresh behavior:
Test anchors:
```

Contracts prevent generic containers from becoming dumping grounds. If a
component cannot be described this way, it is probably not a component yet.

### 9. Behavior Scenarios

Write scenarios for important interactions using plain Given/When/Then. These
scenarios should be understandable by a human and translatable into headless or
structural tests where possible.

Example:

```gherkin
Scenario: Spending a Damage point previews affected stats
  Given the installed workbench is open for a level 100 core with one unspent core point
  When the player clicks the Damage plus control
  Then the Damage row shows rank 1
  And the core point budget decreases by 1
  And the pinned stat inspector shows the changed damage value without changing screens
```

Keep scenarios focused. Do not write one scenario that tries to verify an
entire screen.

### 10. Visual Anchors

Define what a screenshot reviewer should inspect.

For each screen, list:

- the screenshot fixture;
- expected first read;
- visual anchors;
- spacing risks;
- clipping risks;
- color risks;
- unacceptable resemblance to rejected designs.

This is where taste becomes concrete enough for an agent to respect. Avoid
plain adjectives such as "beautiful" unless the spec ties them to observable
traits like rhythm, hierarchy, whitespace, native Factorio styles, or absence
of dead panels.

### 11. Style Tokens

Define local visual tokens for the GUI surface. A token can be conceptual if
Factorio styles provide the exact value.

Examples:

```text
panel_shell: native outer frame, no card nesting
section_header: native dark strip with gold title text
row_height: stable compact row; controls cannot resize the row on hover
benefit_delta: muted green for numeric improvements only
harm_delta: muted red for numeric drawbacks only
neutral_value: plain light text
inactive_text: native disabled gray
warning: restrained amber text or icon, not a full-width alarm block unless blocking
```

Tokens must reinforce meaning. Do not introduce new colors only for variety.

### 12. Implementation Plan

The product spec must include an implementation sequence:

1. docs/spec only;
2. static shell with fixtures/placeholders;
3. screenshot review gate;
4. behavior wiring in small slices;
5. structural tests;
6. manual screenshot review;
7. final validation.

The plan must name stop conditions. If a static shell still resembles a
rejected layout, implementation stops and the spec changes before behavior is
wired.

### 13. Validation Plan

Use layered validation:

- Documentation review proves design intent is agreed.
- Structural GUI tests prove anchors, visibility, and mode isolation.
- Headless behavior tests prove mutations and persistence.
- Screenshot review proves visual hierarchy, spacing, clipping, and taste.
- Manual playtest proves the workflow feels good in Factorio's real client.

No automated test can approve visual taste. Automated tests can only prevent
drift after visual direction is accepted.

## Required Product Spec Sections

A product spec created by this factory must use these sections unless the spec
explains why a section does not apply:

1. Status
2. Problem Frame
3. Design Thesis
4. Non-Goals And Rejected Shapes
5. Feature Inventory
6. Player Jobs
7. Screens And Modes
8. State Fixtures
9. Visibility Matrix
10. ASCII Wireframes
11. Component Contracts
12. Behavior Scenarios
13. Visual Style And Tokens
14. Visual Review Gates
15. Automated Test Contracts
16. Implementation Sequence
17. Open Questions

## Agent-Readable Writing Rules

- Use `MUST`, `SHOULD`, and `MAY` for obligations.
- Name controls and anchors exactly once, then reuse the same names.
- Prefer specific nouns over generic containers: `Stat Inspector`, not
  `right panel`; `Build Plan Mode`, not `automation stuff`.
- Every top-level screen needs a job.
- Every scroll region needs a reason.
- Every hidden feature needs a reveal path.
- Every color rule needs a meaning.
- Every destructive action needs an explicit confirmation or preservation rule.
- Every placeholder in a static shell must point to the real component that
  will replace it.
- Do not encode old layout terms unless the spec intentionally preserves them.
- Do not use "clean", "nice", "modern", or "wow" as requirements by themselves.
  Translate them into anchors, hierarchy, spacing, density, and interaction
  behavior.

## Drift Controls

Implementation must expose spec anchors through stable GUI names or structural
markers where practical. Tests should assert these anchors rather than brittle
pixel positions.

Suggested structural checks:

- exactly one root screen for the active GUI mode;
- required anchors exist for each fixture;
- disallowed anchors do not exist for each fixture;
- pinned components are outside scroll containers;
- controls that should remain visible during progression edits are not inside
  collapsed or tab-only panes;
- empty picker mode does not instantiate installed-workbench anchors;
- build-plan mode and live mode share the progression editor surface while
  changing mutation target and preview labels.

When code needs a new anchor, the product spec must be updated in the same
change.

## Visual Gate Checklist

Before wiring behavior beyond a static shell, capture screenshots for all
required fixtures and answer:

- Does the first read match the screen's primary job?
- Are persistent context elements visible without scrolling?
- Are high-value stat changes visible beside progression edits?
- Are controls aligned to a stable row rhythm?
- Are there dead slabs, nested cards, clipped rows, or text under scrollbars?
- Does the screen accidentally resemble a rejected layout?
- Does the empty state feel intentional instead of like a missing list?
- Does Factorio interface scale change the hierarchy or cause clipping?

If any answer fails, revise the product spec before writing more Lua.

## Change Workflow

Use this sequence for GUI redesign changes:

1. Update the product spec.
2. Update fixtures and contracts.
3. Implement the smallest matching code slice.
4. Add or update structural tests.
5. Capture screenshots when layout changes.
6. Compare screenshots against visual anchors.
7. Record any accepted spec change in the same PR.

Do not patch the GUI visually and then backfill the spec. That makes the spec a
description of accidents instead of a design tool.

## Failure Conditions

Stop implementation and return to the product spec when:

- the static shell resembles a rejected design;
- a required player job has no obvious screen;
- a screen exists but has no primary job;
- a key action requires switching away from the feedback it changes;
- a scroll region contains controls that the player needs while editing;
- screenshots reveal clipping, dead panels, or incoherent hierarchy;
- the code needs a new mode or container not named in the spec;
- reviewer feedback is about basic layout intent rather than a small polish fix.

Stopping at these points is not failure. Continuing to wire behavior into an
unaccepted shape is the failure this factory is meant to prevent.
