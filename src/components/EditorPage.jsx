import { useState } from "react";
import { FxButton, FxCheckbox, FxFrame, FxTextInput, GuiWindow } from "./factorioGui.jsx";

function windowTitle(value) {
  return value.trim() || "Untitled window";
}

function EditorCanvas({ currentWindow }) {
  return (
    <div className="fx-editor-canvas" data-anchor="editor_canvas">
      {currentWindow ? (
        <GuiWindow title={currentWindow.title} />
      ) : (
        <div className="fx-editor-empty" data-anchor="editor_empty_state">
          No window
        </div>
      )}
    </div>
  );
}

export function EditorPage() {
  const [title, setTitle] = useState("Untitled window");
  const [currentWindow, setCurrentWindow] = useState(null);

  function createWindow() {
    setCurrentWindow({ title: windowTitle(title) });
  }

  function resetWindow() {
    setCurrentWindow(null);
  }

  function updateTitle(event) {
    const nextTitle = event.target.value;
    setTitle(nextTitle);
    if (currentWindow) {
      setCurrentWindow({ title: windowTitle(nextTitle) });
    }
  }

  return (
    <main className="fx-editor-shell">
      <aside className="fx-editor-rail" aria-label="Editor controls">
        <FxFrame title="Window" className="fx-editor-panel">
          <label className="fx-field">
            <span>Title</span>
            <FxTextInput
              id="window-title"
              type="text"
              value={title}
              autoComplete="off"
              disabled={!currentWindow}
              onChange={updateTitle}
            />
          </label>
          <div className="fx-actions">
            <FxButton id="create-window" onClick={createWindow}>
              {currentWindow ? "Recreate window" : "Create window"}
            </FxButton>
            <FxButton id="reset-window" disabled={!currentWindow} onClick={resetWindow}>
              Reset
            </FxButton>
          </div>
        </FxFrame>

        <FxFrame title="Constraints" className="fx-editor-panel">
          <div className="fx-checklist">
            <FxCheckbox checked>Factorio GUI primitives</FxCheckbox>
            <FxCheckbox checked>No freeform pixel dragging</FxCheckbox>
            <FxCheckbox checked>Stable export anchors</FxCheckbox>
            <FxCheckbox checked>No bundled Wube assets</FxCheckbox>
          </div>
        </FxFrame>
      </aside>

      <section className="fx-editor-stage" aria-label="Editor canvas">
        <div id="editor-root">
          <EditorCanvas currentWindow={currentWindow} />
        </div>
      </section>
    </main>
  );
}
