/**
 * Unit tests for 003-mermaid — theme config contract.
 * Verifies API-3: mermaidConfig has correct palette values.
 */

import { describe, it, expect } from "vitest";
import { mermaidConfig } from "../../src/ui/lib/mermaid-theme";

describe("API-3: mermaid theme config", () => {
  it("has startOnLoad: false", () => {
    expect(mermaidConfig.startOnLoad).toBe(false);
  });

  it("uses base theme", () => {
    expect(mermaidConfig.theme).toBe("base");
  });

  it("has teal primary color", () => {
    expect(mermaidConfig.themeVariables?.primaryColor).toBe("#0d9488");
  });

  it("has dark background", () => {
    expect(mermaidConfig.themeVariables?.background).toBe("#111827");
    expect(mermaidConfig.themeVariables?.mainBkg).toBe("#111827");
  });

  it("has light primary text", () => {
    expect(mermaidConfig.themeVariables?.primaryTextColor).toBe("#e2e8f0");
  });

  it("has teal border color", () => {
    expect(mermaidConfig.themeVariables?.primaryBorderColor).toBe("#0f766e");
  });
});
