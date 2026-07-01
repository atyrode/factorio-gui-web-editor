import {
  FxButton,
  FxCheckbox,
  FxInset,
  FxLabel,
  FxNotice,
  FxSlotGrid,
  FxTable,
  FxTabs,
  FxTextInput,
  GuiWindow
} from "./factorioGui.jsx";
import { factorioStyleCatalog, getFactorioStyle } from "../factorioStyleCatalog.js";
import {
  frameStyleReference,
  frameStyleVariants,
  horizontalFlowStyleVariants,
  labelStyleVariants
} from "../factorioModel.js";

const atlasRows = [
  { Primitive: "frame", Style: "fx-frame", State: "raised panel" },
  { Primitive: "flow", Style: "fx-inset", State: "dark inset" },
  { Primitive: "label", Style: "fx-label", State: "base, disabled, title, caption, clickable" },
  { Primitive: "button", Style: "fx-button", State: "normal, hover, active, disabled" },
  { Primitive: "textfield", Style: "fx-text-input", State: "normal, focus, disabled" },
  { Primitive: "checkbox", Style: "fx-checkbox", State: "unchecked, checked, disabled" }
];

const styleEvidenceEntries = [
  {
    atom: "Label",
    role: "base",
    styleName: "label",
    browserFacts: [
      ["browser_color", labelStyleVariants.base.browserColor],
      ["disabled_color", labelStyleVariants.base.browserDisabledColor]
    ],
    gaps: ["font rasterization", "rich text rendering", "runtime click behavior"]
  },
  {
    atom: "Label",
    role: "frame title",
    styleName: "frame_title",
    browserFacts: [
      ["browser_color", labelStyleVariants.frameTitle.browserColor],
      ["title_top_margin", frameStyleReference.titleLabelTopMargin],
      ["title_bottom_padding", frameStyleReference.titleLabelBottomPadding]
    ],
    gaps: ["text content box", "squash behavior", "pixel-level title alignment"]
  },
  {
    atom: "Label",
    role: "caption",
    styleName: "caption_label",
    browserFacts: [["browser_color", labelStyleVariants.caption.browserColor]],
    gaps: ["font rasterization", "line box height"]
  },
  {
    atom: "Label",
    role: "heading",
    styleName: "heading_2_label",
    browserFacts: [["browser_color", labelStyleVariants.heading2.browserColor]],
    gaps: ["font rasterization", "line box height"]
  },
  {
    atom: "Label",
    role: "subheader caption",
    styleName: "subheader_caption_label",
    browserFacts: [
      ["browser_color", labelStyleVariants.subheaderCaption.browserColor],
      ["left_padding", labelStyleVariants.subheaderCaption.leftPadding]
    ],
    gaps: ["font rasterization", "line box height"]
  },
  {
    atom: "Label",
    role: "clickable",
    styleName: "clickable_label",
    browserFacts: [
      ["hover_color", labelStyleVariants.clickable.browserHoveredColor],
      ["clicked_color", labelStyleVariants.clickable.browserClickedColor]
    ],
    gaps: ["pointer states in Factorio", "focus behavior"]
  },
  {
    atom: "Filler",
    role: "primitive",
    styleName: "empty_widget",
    browserFacts: [["palette_preview", "stretchable placeholder"]],
    gaps: ["asset-backed drawing data", "runtime minimum size"]
  },
  {
    atom: "Filler",
    role: "generic spacer",
    styleName: "draggable_space",
    browserFacts: [
      ["horizontal_stretch", true],
      ["vertical_stretch", true]
    ],
    gaps: ["asset-backed drawing data", "runtime drag target behavior"]
  },
  {
    atom: "Filler",
    role: "window header",
    styleName: "draggable_space_header",
    browserFacts: [
      ["captured_left_margin", frameStyleReference.dragHandleLeftMargin],
      ["captured_right_margin", frameStyleReference.dragHandleRightMargin],
      ["captured_height", frameStyleReference.dragHandleHeight]
    ],
    gaps: ["asset-backed drawing data", "computed stretch width"]
  },
  {
    atom: "Frame",
    role: "root frame",
    styleName: "frame",
    browserFacts: [
      ["captured_top_padding", frameStyleReference.topPadding],
      ["captured_side_padding", frameStyleReference.leftPadding],
      ["outer_border", frameStyleReference.graphicalBorder]
    ],
    gaps: ["asset border pixels", "shadow geometry", "content and clip boxes"]
  },
  {
    atom: "Frame",
    role: "body frame",
    styleName: "inside_deep_frame",
    browserFacts: [
      ["captured_top_padding", frameStyleVariants.insideDeepFrame.topPadding],
      ["captured_vertical_spacing", frameStyleVariants.insideDeepFrame.verticalSpacing]
    ],
    gaps: ["asset border pixels", "shadow geometry", "computed child boxes"]
  },
  {
    atom: "Frame",
    role: "window shell",
    styleName: "inset_frame_container_frame",
    browserFacts: [
      ["captured_width", frameStyleReference.capturedSize.width],
      ["captured_height", frameStyleReference.capturedSize.height]
    ],
    gaps: ["asset border pixels", "body content boxes", "shadow geometry"]
  },
  {
    atom: "Flow",
    role: "authored horizontal",
    styleName: "horizontal_flow",
    browserFacts: [
      ["rendered_spacing", horizontalFlowStyleVariants.generic.horizontalSpacing]
    ],
    gaps: ["computed child boxes", "runtime stretch resolution"]
  },
  {
    atom: "Flow",
    role: "vertical",
    styleName: "vertical_flow",
    browserFacts: [["window_body_vertical_spacing", frameStyleReference.bodyVerticalSpacing ?? 18]],
    gaps: ["captured vertical body variant", "computed child boxes"]
  },
  {
    atom: "Flow",
    role: "window titlebar",
    styleName: "frame_header_flow",
    browserFacts: [
      ["captured_spacing", horizontalFlowStyleVariants.frameHeader.horizontalSpacing],
      ["captured_bottom_padding", horizontalFlowStyleVariants.frameHeader.bottomPadding]
    ],
    gaps: ["titlebar clip box", "optional slot behavior"]
  },
  {
    atom: "Flow",
    role: "window body",
    styleName: "inset_frame_container_horizontal_flow",
    browserFacts: [
      ["captured_spacing", horizontalFlowStyleVariants.insetFrameContainer.horizontalSpacing]
    ],
    gaps: ["body clip box", "runtime max squash size"]
  }
];

function AtlasSection({ title, children, className = "" }) {
  const anchor = `atlas_${title.toLowerCase().replaceAll(" ", "_")}`;

  return (
    <GuiWindow
      title={title}
      className={["fx-atlas-section", className].filter(Boolean).join(" ")}
      anchor={anchor}
    >
      {children}
    </GuiWindow>
  );
}

function formatFieldName(name) {
  return name.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function formatFieldValue(value) {
  if (value === true) {
    return "true";
  }

  if (value === false) {
    return "false";
  }

  if (value == null) {
    return "none";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}

function EvidenceFacts({ facts, emptyLabel = "none" }) {
  if (!facts.length) {
    return <span className="fx-style-evidence__empty">{emptyLabel}</span>;
  }

  return (
    <dl className="fx-style-evidence__facts">
      {facts.map(([name, value]) => (
        <div key={name}>
          <dt>{formatFieldName(name)}</dt>
          <dd>{formatFieldValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function StyleEvidenceRow({ entry }) {
  const catalogStyle = getFactorioStyle(entry.styleName);
  const declared = catalogStyle?.declared ?? {};
  const catalogFacts = Object.entries(catalogStyle?.resolvedFields ?? {});

  return (
    <div
      className="fx-style-evidence__row"
      data-evidence-style={entry.styleName}
      role="row"
    >
      <div className="fx-style-evidence__identity" role="cell">
        <strong>{entry.styleName}</strong>
        <span>{entry.atom}</span>
        <span>{entry.role}</span>
      </div>
      <div className="fx-style-evidence__prototype" data-evidence-section="catalog" role="cell">
        <div className="fx-style-evidence__meta">
          <span>{declared.type ?? "unknown"}</span>
          <span>parent {declared.parent ?? "none"}</span>
        </div>
        <EvidenceFacts facts={catalogFacts} />
      </div>
      <div className="fx-style-evidence__browser" data-evidence-section="browser" role="cell">
        <EvidenceFacts facts={entry.browserFacts} />
      </div>
      <div className="fx-style-evidence__gaps" data-evidence-section="gaps" role="cell">
        <ul>
          {entry.gaps.map((gap) => (
            <li key={gap}>{gap}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StyleEvidenceSection() {
  const source = factorioStyleCatalog.source;

  return (
    <div className="fx-style-evidence" data-anchor="atlas_style_evidence_panel">
      <dl className="fx-style-evidence__source" data-anchor="atlas_style_evidence_source">
        <div>
          <dt>schema</dt>
          <dd>{factorioStyleCatalog.schema}</dd>
        </div>
        <div>
          <dt>source</dt>
          <dd>{source.kind}</dd>
        </div>
        <div>
          <dt>factorio</dt>
          <dd>{source.factorioVersion}</dd>
        </div>
        <div>
          <dt>mods</dt>
          <dd>{source.activeMods.join(", ")}</dd>
        </div>
        <div>
          <dt>styles</dt>
          <dd>{factorioStyleCatalog.selectedStyleCount}</dd>
        </div>
      </dl>

      <div
        className="fx-style-evidence__table"
        role="table"
        aria-label="Style evidence"
      >
        <div className="fx-style-evidence__row fx-style-evidence__row--heading" role="row">
          <span role="columnheader">style</span>
          <span role="columnheader">catalog prototype facts</span>
          <span role="columnheader">browser evidence</span>
          <span role="columnheader">capture gaps</span>
        </div>
        {styleEvidenceEntries.map((entry) => (
          <StyleEvidenceRow entry={entry} key={entry.styleName} />
        ))}
      </div>
    </div>
  );
}

export function StyleAtlasPage() {
  return (
    <main className="fx-atlas-shell">
      <div className="fx-atlas-grid">
        <AtlasSection title="Style Evidence" className="fx-atlas-section--wide">
          <StyleEvidenceSection />
        </AtlasSection>

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

        <AtlasSection title="Labels">
          <div className="fx-atlas-stack" data-anchor="atlas_labels_samples">
            <FxLabel>Base label text</FxLabel>
            <FxLabel disabled>Disabled label text</FxLabel>
            <FxLabel variant="frame_title">Frame title</FxLabel>
            <FxLabel variant="caption_label">Caption label</FxLabel>
            <FxLabel variant="subheader_caption_label">Subheader caption</FxLabel>
            <div className="fx-atlas-flow">
              <FxLabel variant="clickable_label">Clickable</FxLabel>
              <FxLabel variant="clickable_label" state="hovered">Hovered</FxLabel>
              <FxLabel variant="clickable_label" state="clicked">Clicked</FxLabel>
            </div>
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
