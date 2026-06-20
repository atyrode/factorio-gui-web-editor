import {
  FxButton,
  FxCheckbox,
  FxInset,
  FxNotice,
  FxSlotGrid,
  FxTable,
  FxTabs,
  FxTextInput,
  GuiWindow
} from "./factorioGui.jsx";

const atlasRows = [
  { Primitive: "frame", Style: "fx-frame", State: "raised panel" },
  { Primitive: "flow", Style: "fx-inset", State: "dark inset" },
  { Primitive: "button", Style: "fx-button", State: "normal, hover, active, disabled" },
  { Primitive: "textfield", Style: "fx-text-input", State: "normal, focus, disabled" },
  { Primitive: "checkbox", Style: "fx-checkbox", State: "unchecked, checked, disabled" }
];

function AtlasSection({ title, children }) {
  const anchor = `atlas_${title.toLowerCase().replaceAll(" ", "_")}`;

  return (
    <GuiWindow title={title} className="fx-atlas-section" anchor={anchor}>
      {children}
    </GuiWindow>
  );
}

export function StyleAtlasPage() {
  return (
    <main className="fx-atlas-shell">
      <div className="fx-atlas-grid">
        <AtlasSection title="Frames And Insets">
          <div className="fx-atlas-stack">
            <FxInset>
              <p>Dark inset content surface</p>
            </FxInset>
            <FxInset variant="lighter">
              <p>Lighter inset content surface</p>
            </FxInset>
            <FxInset variant="hole">
              <p>Deep hole surface</p>
            </FxInset>
          </div>
        </AtlasSection>

        <AtlasSection title="Buttons">
          <div className="fx-atlas-flow">
            <FxButton>Default</FxButton>
            <FxButton active>Pressed</FxButton>
            <FxButton disabled>Disabled</FxButton>
            <FxButton variant="green">Confirm</FxButton>
            <FxButton variant="red">Remove</FxButton>
          </div>
        </AtlasSection>

        <AtlasSection title="Form Controls">
          <div className="fx-atlas-stack">
            <label className="fx-field">
              <span>Text field</span>
              <FxTextInput type="text" defaultValue="Assembling machine" />
            </label>
            <label className="fx-field">
              <span>Disabled field</span>
              <FxTextInput type="text" value="Locked" disabled readOnly />
            </label>
            <div className="fx-checklist">
              <FxCheckbox>Unchecked option</FxCheckbox>
              <FxCheckbox checked>Checked option</FxCheckbox>
              <FxCheckbox disabled>Disabled option</FxCheckbox>
            </div>
          </div>
        </AtlasSection>

        <AtlasSection title="Tabs">
          <FxTabs
            tabs={[
              { id: "layout", label: "Layout", active: true },
              { id: "style", label: "Style" },
              { id: "export", label: "Export" }
            ]}
          />
          <FxInset variant="lighter" className="fx-atlas-tab-panel">
            Active tab content
          </FxInset>
        </AtlasSection>

        <AtlasSection title="Slots">
          <FxSlotGrid
            slots={24}
            filledSlots={[
              { index: 0, label: "Iron plate", shortLabel: "Fe" },
              { index: 1, label: "Copper plate", shortLabel: "Cu" },
              { index: 7, label: "Circuit", shortLabel: "Ic" }
            ]}
          />
        </AtlasSection>

        <AtlasSection title="Tables">
          <FxTable columns={["Primitive", "Style", "State"]} rows={atlasRows} />
        </AtlasSection>

        <AtlasSection title="Notices">
          <div className="fx-atlas-stack">
            <FxNotice>Neutral notice</FxNotice>
            <FxNotice tone="success">Success notice</FxNotice>
            <FxNotice tone="warning">Warning notice</FxNotice>
            <FxNotice tone="error">Error notice</FxNotice>
          </div>
        </AtlasSection>

        <AtlasSection title="Scroll Pane">
          <FxInset className="fx-scroll-pane" role="region" aria-label="Scrollable atom sample">
            {Array.from({ length: 12 }, (_, index) => (
              <div className="fx-scroll-row" key={index}>
                Row {index + 1}
              </div>
            ))}
          </FxInset>
        </AtlasSection>
      </div>
    </main>
  );
}
