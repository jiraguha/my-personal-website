import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { loadDa } from "../../src/ui/lib/cover-da";

const DA_PATH = path.resolve(process.cwd(), "da.md");
const CUSTOM_DA_PATH = path.resolve(process.cwd(), "test-custom-da.md");
let originalDa: string;

beforeEach(() => {
  originalDa = fs.readFileSync(DA_PATH, "utf-8");
});

afterEach(() => {
  fs.writeFileSync(DA_PATH, originalDa);
  if (fs.existsSync(CUSTOM_DA_PATH)) {
    fs.unlinkSync(CUSTOM_DA_PATH);
  }
});

describe("cover-da", () => {
  it("loads da.md from project root", () => {
    const da = loadDa();
    expect(da).toContain("SYSTEM CONTEXT");
    expect(da).toContain("#0B1120");
    expect(da.length).toBeGreaterThan(100);
  });

  it("throws if da.md is missing", () => {
    fs.renameSync(DA_PATH, DA_PATH + ".bak");
    try {
      expect(() => loadDa()).toThrow("Missing da.md");
    } finally {
      fs.renameSync(DA_PATH + ".bak", DA_PATH);
    }
  });

  it("throws if da.md is empty", () => {
    fs.writeFileSync(DA_PATH, "");
    expect(() => loadDa()).toThrow("da.md is empty");
  });

  it("loads a custom DA file when path is provided", () => {
    fs.writeFileSync(CUSTOM_DA_PATH, "Custom DA content for testing");
    const da = loadDa("test-custom-da.md");
    expect(da).toBe("Custom DA content for testing");
  });

  it("falls back to da.md when custom path does not exist", () => {
    const da = loadDa("nonexistent-da.md");
    expect(da).toContain("SYSTEM CONTEXT");
  });

  it("trims whitespace from DA content", () => {
    fs.writeFileSync(DA_PATH, "  content with whitespace  \n\n");
    const da = loadDa();
    expect(da).toBe("content with whitespace");
  });
});
