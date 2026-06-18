/* global document */
(function () {
  "use strict";

  const root = document.getElementById("editor-root");
  const titleInput = document.getElementById("window-title");
  const createButton = document.getElementById("create-window");
  const resetButton = document.getElementById("reset-window");

  const state = {
    window: null
  };

  function h(tag, attrs, ...children) {
    const node = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([key, value]) => {
      if (value === false || value === null || value === undefined) {
        return;
      }
      if (key === "class") {
        node.className = value;
      } else if (key.startsWith("data")) {
        node.setAttribute(key.replace(/[A-Z]/g, (match) => "-" + match.toLowerCase()), value);
      } else if (key.startsWith("aria")) {
        node.setAttribute(key.replace(/[A-Z]/g, (match) => "-" + match.toLowerCase()), value);
      } else if (key === "disabled") {
        node.disabled = Boolean(value);
      } else {
        node.setAttribute(key, value);
      }
    });
    children.flat().forEach((child) => {
      if (child === null || child === undefined || child === false) {
        return;
      }
      node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
    });
    return node;
  }

  function windowTitle() {
    const value = titleInput.value.trim();
    return value || "Untitled window";
  }

  function renderWindow() {
    return h("section", { class: "fx-window", dataAnchor: "gui_window" },
      h("header", { class: "fx-window__titlebar", dataAnchor: "gui_window_titlebar" },
        h("strong", {}, state.window.title),
        h("div", {
          class: "fx-window__drag-handle",
          dataAnchor: "gui_window_drag_handle",
          ariaLabel: "Drag handle"
        })
      ),
      h("div", { class: "fx-window__body", dataAnchor: "gui_window_body" })
    );
  }

  function renderEmptyCanvas() {
    return h("div", { class: "fx-empty", dataAnchor: "editor_empty_state" }, "No window");
  }

  function render() {
    createButton.textContent = state.window ? "Recreate window" : "Create window";
    resetButton.disabled = !state.window;
    titleInput.disabled = !state.window;

    root.replaceChildren(
      h("div", { class: "fx-canvas", dataAnchor: "editor_canvas" },
        state.window ? renderWindow() : renderEmptyCanvas()
      )
    );
  }

  createButton.addEventListener("click", () => {
    state.window = {
      title: windowTitle()
    };
    render();
  });

  resetButton.addEventListener("click", () => {
    state.window = null;
    render();
  });

  titleInput.addEventListener("input", () => {
    if (!state.window) {
      return;
    }
    state.window.title = windowTitle();
    render();
  });

  render();
}());
