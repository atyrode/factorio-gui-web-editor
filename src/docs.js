import styleSourcesMarkdown from "../docs/factorio-style-sources.md?raw";
import modelSchemaMarkdown from "../docs/model-schema.md?raw";
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
