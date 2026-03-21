import fs from "node:fs";
import path from "node:path";

const DEFAULT_DA_PATH = path.resolve(process.cwd(), "da.md");

export function loadDa(customPath?: string): string {
  const daPath = customPath
    ? path.resolve(process.cwd(), customPath)
    : DEFAULT_DA_PATH;

  if (!fs.existsSync(daPath)) {
    if (customPath) {
      console.warn(`Custom DA file not found: ${daPath}, falling back to da.md`);
      return loadDa();
    }
    throw new Error("Missing da.md — the design aesthetic file is required for cover generation.");
  }

  const content = fs.readFileSync(daPath, "utf-8").trim();
  if (!content) {
    throw new Error(`da.md is empty — the design aesthetic file must contain a prompt.`);
  }

  if (content.length > 10_000) {
    console.warn(`Warning: da.md is ${content.length} chars (>10KB) — large DA may dilute the prompt.`);
  }

  return content;
}
