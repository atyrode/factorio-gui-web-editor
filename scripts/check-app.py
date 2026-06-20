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
    "src/main.jsx",
    "package.json",
    "package-lock.json",
    "vite.config.js",
    "scripts/copy-static-docs.mjs",
    "README.md",
    "AGENTS.md",
    "docs/README.md",
    "docs/atom-specs.md",
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
]

FORBIDDEN_PAYLOADS = [
    "webcdn.factorio.com/assets/img",
    "data:image",
    "border-image:url",
    ".panel-hole-inner",
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
            "vite.config.js",
            "scripts/copy-static-docs.mjs",
            "README.md",
            "AGENTS.md",
            "docs/README.md",
            "docs/atom-specs.md",
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

    for forbidden in FORBIDDEN_PAYLOADS:
        if forbidden in source_blob:
            raise AssertionError(f"app appears to vendor forbidden Factorio payload: {forbidden}")

    for global_name in REMOVED_GLOBALS:
        if global_name in source_blob:
            raise AssertionError(f"removed fixture global is still present: {global_name}")

    check_sh = read("scripts/check.sh")
    assert_contains(check_sh, "scripts/check-app.py", "scripts/check.sh")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AssertionError as exc:
        print(f"check failed: {exc}", file=sys.stderr)
        raise SystemExit(1)
