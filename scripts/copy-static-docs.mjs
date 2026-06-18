import { cpSync, mkdirSync } from "node:fs";

mkdirSync("dist", { recursive: true });
cpSync("docs", "dist/docs", { recursive: true });
cpSync("README.md", "dist/README.md");
