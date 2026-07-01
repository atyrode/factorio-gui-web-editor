#!/usr/bin/env node

import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const catalogPath = join(ROOT, "src/generated/factorioStyleCatalog.generated.json");

if (!existsSync(catalogPath)) {
  console.log("Style catalog check skipped until the generated catalog exists.");
  process.exit(0);
}

console.log("Style catalog check scaffold detected a generated catalog.");
