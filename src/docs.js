import styleSourcesMarkdown from "../docs/factorio-style-sources.md?raw";
import atomSpecsMarkdown from "../docs/atom-specs.md?raw";
import modelSchemaMarkdown from "../docs/model-schema.md?raw";
import noCodeLayoutBuilderMarkdown from "../docs/no-code-layout-builder.md?raw";
import roadmapMarkdown from "../docs/roadmap.md?raw";
import specFactoryMarkdown from "../docs/spec-factory.md?raw";

export const docPages = [
  {
    path: "/spec-factory",
    title: "Spec Factory",
    summary: "Process notes for turning GUI ideas into implementation-ready specs.",
    markdown: specFactoryMarkdown
  },
  {
    path: "/roadmap",
    title: "Roadmap",
    summary: "Sequencing for the constrained builder, shared renderer, and exports.",
    markdown: roadmapMarkdown
  },
  {
    path: "/no-code-layout-builder",
    title: "No-Code Builder",
    summary: "Product spec for constrained Frame and Flow insertion.",
    markdown: noCodeLayoutBuilderMarkdown
  },
  {
    path: "/atom-specs",
    title: "Atom Specs",
    summary: "Completion contract for reconstructing Factorio GUI atoms.",
    markdown: atomSpecsMarkdown
  },
  {
    path: "/model-schema",
    title: "Model Schema",
    summary: "Structured GUI model used by preview, inspector, and Lua export.",
    markdown: modelSchemaMarkdown
  },
  {
    path: "/style-sources",
    title: "Style Sources",
    summary: "Factorio GUI styling references, source notes, and inspection workflow.",
    markdown: styleSourcesMarkdown
  }
];

export function findDocPage(pathname) {
  const normalizedPath = pathname !== "/" && pathname.endsWith("/") ? pathname.slice(0, -1) : pathname;
  return docPages.find((page) => page.path === normalizedPath) || null;
}
