import { useState } from "react";

function windowTitle(value) {
  return value.trim() || "Untitled window";
}

function GuiWindow({ title }) {
  return (
    <section className="fx-window" data-anchor="gui_window">
      <header className="fx-window__titlebar" data-anchor="gui_window_titlebar">
        <strong>{title}</strong>
        <div
          className="fx-window__drag-handle"
          data-anchor="gui_window_drag_handle"
          aria-label="Drag handle"
        />
      </header>
      <div className="fx-window__body" data-anchor="gui_window_body" />
    </section>
  );
}

function EditorCanvas({ currentWindow }) {
  return (
    <div className="fx-canvas" data-anchor="editor_canvas">
      {currentWindow ? (
        <GuiWindow title={currentWindow.title} />
      ) : (
        <div className="fx-empty" data-anchor="editor_empty_state">
          No window
        </div>
      )}
    </div>
  );
}

export function App() {
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
    <>
      <header className="fx-sitebar">
        <div className="fx-sitebar__inner">
          <div>
            <strong>Factorio GUI</strong>
            <span>Web Editor</span>
          </div>
          <nav aria-label="Project links">
            <a href="/docs/spec-factory.md">Spec Factory</a>
            <a href="/docs/roadmap.md">Roadmap</a>
            <a href="/docs/factorio-style-sources.md">Style Sources</a>
          </nav>
        </div>
      </header>

      <main className="fx-editor-shell">
        <aside className="fx-rail" aria-label="Editor controls">
          <section className="fx-panel">
            <h1>Window</h1>
            <label className="fx-field">
              <span>Title</span>
              <input
                id="window-title"
                type="text"
                value={title}
                autoComplete="off"
                disabled={!currentWindow}
                onChange={updateTitle}
              />
            </label>
            <div className="fx-actions">
              <button id="create-window" className="fx-button" type="button" onClick={createWindow}>
                {currentWindow ? "Recreate window" : "Create window"}
              </button>
              <button
                id="reset-window"
                className="fx-button"
                type="button"
                disabled={!currentWindow}
                onClick={resetWindow}
              >
                Reset
              </button>
            </div>
          </section>
          <section className="fx-panel">
            <h2>Constraints</h2>
            <ul className="fx-checklist">
              <li>Use Factorio GUI primitives.</li>
              <li>Avoid freeform pixel dragging.</li>
              <li>Keep anchors stable for export.</li>
              <li>Do not vendor Factorio image assets.</li>
            </ul>
          </section>
        </aside>

        <section className="fx-stage" aria-label="Editor canvas">
          <div id="editor-root">
            <EditorCanvas currentWindow={currentWindow} />
          </div>
        </section>
      </main>
    </>
  );
}
