#!/usr/bin/env python3
"""Lightweight structural checks for the Factorio GUI web editor."""

from __future__ import annotations

from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parents[1]


REQUIRED_FILES = [
    "index.html",
    "compose.dev.yaml",
    "src/styles.css",
    "src/App.jsx",
    "src/components/BuilderPanel.jsx",
    "src/components/DocumentPage.jsx",
    "src/components/EditorPage.jsx",
    "src/components/SiteChrome.jsx",
    "src/components/StyleAtlasPage.jsx",
    "src/components/factorioGui.jsx",
    "src/styles/base.css",
    "src/styles/docs.css",
    "src/styles/editor.css",
    "src/styles/factorio-atoms.css",
    "src/styles/layout.css",
    "src/styles/style-atlas.css",
    "src/docs.js",
    "src/factorioDesignFile.js",
    "src/factorioEditorSettings.js",
    "src/factorioLayoutTree.js",
    "src/factorioModExport.js",
    "src/factorioStyleCatalog.js",
    "src/generated/factorioStyleCatalog.generated.json",
    "src/main.jsx",
    "package.json",
    "package-lock.json",
    "playwright.config.js",
    "vite.config.js",
    "scripts/copy-static-docs.mjs",
    "scripts/generate-factorio-style-catalog.mjs",
    "scripts/check-style-catalog.mjs",
    "scripts/check-hover-drop-geometry.mjs",
    "scripts/check-layout-tree.mjs",
    "tests/unit/factorioDesignFile.test.mjs",
    "tests/browser/layout-builder.spec.js",
    "README.md",
    "AGENTS.md",
    "docs/README.md",
    "docs/no-code-layout-builder.md",
    "docs/atom-specs.md",
    "docs/factorio-mod-export.md",
    "docs/hosting.md",
    "docs/spec-factory.md",
    "docs/roadmap.md",
    "docs/factorio-style-sources.md",
    "Dockerfile",
    "compose.yaml",
    "deploy/labtorio.Caddyfile",
    "deploy/edge-compose.yaml.example",
    "deploy/edge.Caddyfile.example",
]

REQUIRED_ANCHORS = [
    "editor-root",
    "editor_canvas",
    "editor_empty_state",
    "gui_window",
    "gui_window_titlebar",
    "gui_window_drag_handle",
    "gui_window_body",
    "editor_command_bar",
    "editor_tool_select",
    "editor_tool_inspect",
    "editor_export_drawer",
    "builder_panel",
    "component_tree_panel",
    "properties_panel",
    "properties_tab_properties",
    "properties_tab_factorio",
    "layout_settings_panel",
    "layout_settings_toggle",
    "layout_settings_window_size",
    "layout_setting_window_width",
    "layout_setting_window_height",
    "layout_setting_horizontal_flow_min_width",
    "frame_palette_item",
    "horizontal_flow_palette_item",
    "label_palette_item",
    "filler_palette_item",
    "builder_ghost_marker",
    "builder_copy_",
    "builder_paste_",
    "builder_edit_label_text_",
    "gui_label_text_edit_",
    "resize_mode_toggle",
    "resize_overlay",
    "gui_shadow_toggle",
    "atlas_labels_samples",
]

FORBIDDEN_PAYLOADS = [
    "webcdn.factorio.com/assets/img",
    "data:image",
    "border-image:url",
    ".panel-hole-inner",
    "LABTORIO_BASIC_AUTH",
    "edge-basic-auth",
    "basicauth",
]

REMOVED_GLOBALS = [
    "FACTORIO_GUI_WEB_EDITOR_MODEL",
]


def read(relative: str) -> str:
    path = ROOT / relative
    if not path.exists():
        raise AssertionError(f"missing required file: {relative}")
    return path.read_text(encoding="utf-8")


def assert_contains(blob: str, token: str, context: str) -> None:
    if token not in blob:
        raise AssertionError(f"{context} does not contain required token: {token}")


def main() -> int:
    for relative in REQUIRED_FILES:
        read(relative)

    if (ROOT / "examples").exists():
        raise AssertionError("bundled example directory still exists")
    if (ROOT / "docs" / "examples").exists():
        raise AssertionError("bundled example docs directory still exists")

    scanned_files = [
            "index.html",
            "compose.dev.yaml",
            "package.json",
            "package-lock.json",
            "playwright.config.js",
            "vite.config.js",
            "scripts/copy-static-docs.mjs",
            "scripts/generate-factorio-style-catalog.mjs",
            "scripts/check-style-catalog.mjs",
            "scripts/check-hover-drop-geometry.mjs",
            "scripts/check-layout-tree.mjs",
            "tests/browser/layout-builder.spec.js",
            "README.md",
            "AGENTS.md",
            "docs/README.md",
            "docs/no-code-layout-builder.md",
            "docs/atom-specs.md",
            "docs/factorio-mod-export.md",
            "docs/hosting.md",
            "docs/spec-factory.md",
            "docs/roadmap.md",
            "docs/factorio-style-sources.md",
            "Dockerfile",
            "compose.yaml",
            "deploy/labtorio.Caddyfile",
            "deploy/edge-compose.yaml.example",
            "deploy/edge.Caddyfile.example",
    ]
    scanned_files.extend(
        str(path.relative_to(ROOT))
        for path in sorted((ROOT / "src").rglob("*"))
        if path.is_file()
    )
    source_blob = "\n".join(read(relative) for relative in scanned_files)

    for anchor in REQUIRED_ANCHORS:
        assert_contains(source_blob, anchor, "app source")

    assert_contains(source_blob, "Window body Horizontal Flow", "app source")
    assert_contains(source_blob, "create-window", "app source")
    assert_contains(source_blob, "fx-body-direction-toggle", "app source")
    assert_contains(source_blob, "windowBodyDirection", "app source")
    assert_contains(source_blob, "fx-builder-row--locked", "app source")
    assert_contains(source_blob, "dragAndDropFeature", "app source")
    assert_contains(source_blob, "keyboardDragAndDropFeature", "app source")
    assert_contains(source_blob, "canDrag: (dragItems)", "app source")
    assert_contains(source_blob, "fx-builder-row__drag-handle", "app source")
    assert_contains(source_blob, "GuiFrameShell", "app source")
    assert_contains(source_blob, "GuiFillerShell", "app source")
    assert_contains(source_blob, "FxLabel", "app source")
    assert_contains(source_blob, "fx-label--clickable-label", "app source")
    assert_contains(source_blob, "FRAME_ATOM_ID", "app source")
    assert_contains(source_blob, "FILLER_ATOM_ID", "app source")
    assert_contains(source_blob, "data-fx-class={styleReference.bodyClassName}", "app source")
    assert_contains(source_blob, "data-fx-role=\"window-body\"", "app source")
    assert_contains(source_blob, "factorio_mod_download", "app source")
    assert_contains(source_blob, "design_file_download", "app source")
    assert_contains(source_blob, "design_file_import", "app source")
    assert_contains(source_blob, "labtorio-gui-design.v0", "app source")
    assert_contains(source_blob, "design.labtorio-gui.json", "app source")
    assert_contains(source_blob, "labtorio_gui_preview_0.1.0", "app source")
    assert_contains(source_blob, "data.raw[\"gui-style\"][\"default\"]", "app source")
    assert_contains(source_blob, "--dump-data", "app source")
    assert_contains(source_blob, "StyleSpecification", "app source")
    assert_contains(source_blob, "LuaPrototypes.style", "app source")
    assert_contains(source_blob, "factorio-style-catalog.v0", "app source")
    assert_contains(source_blob, "src/generated/factorioStyleCatalog.generated.json", "app source")

    for forbidden in FORBIDDEN_PAYLOADS:
        if forbidden in source_blob:
            raise AssertionError(f"app appears to vendor forbidden Factorio payload: {forbidden}")

    for global_name in REMOVED_GLOBALS:
        if global_name in source_blob:
            raise AssertionError(f"removed fixture global is still present: {global_name}")

    check_sh = read("scripts/check.sh")
    assert_contains(check_sh, "npm run check", "scripts/check.sh")
    package_json = read("package.json")
    assert_contains(package_json, "\"test:browser\"", "package.json")
    assert_contains(package_json, "\"test:unit\"", "package.json")
    assert_contains(package_json, "playwright test", "package.json")
    assert_contains(package_json, "node --test tests/unit/*.test.mjs", "package.json")
    assert_contains(package_json, "scripts/check-app.py", "package.json")
    assert_contains(package_json, "scripts/check-style-catalog.mjs", "package.json")
    assert_contains(package_json, "scripts/generate-factorio-style-catalog.mjs", "package.json")
    assert_contains(package_json, "scripts/check-layout-tree.mjs", "package.json")
    assert_contains(package_json, "scripts/check-hover-drop-geometry.mjs", "package.json")

    ci_workflow = read(".github/workflows/ci.yml")
    assert_contains(ci_workflow, "node-version: \"24\"", ".github/workflows/ci.yml")
    assert_contains(ci_workflow, "npm ci", ".github/workflows/ci.yml")
    assert_contains(ci_workflow, "npx playwright install --with-deps chromium", ".github/workflows/ci.yml")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"check failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
