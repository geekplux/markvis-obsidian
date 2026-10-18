import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import MarkvisPlugin, { LANGUAGES } from "../src/main";
import type { Plugin as StubPlugin, Processor } from "./obsidian-stub";
import { HOSTILE, INVALID, UNTITLED, VALID } from "./fixtures";

function processors(): Map<string, Processor> {
  const plugin = new MarkvisPlugin({} as never, {} as never) as unknown as StubPlugin;
  void (plugin as unknown as MarkvisPlugin).onload();
  return plugin.processors;
}

function draw(language: string, source: string, sourcePath = "Notes/Box office.md"): HTMLElement {
  const handler = processors().get(language);
  if (!handler) throw new Error(`no processor for ${language}`);
  const el = document.createElement("div");
  handler(source, el, { sourcePath });
  return el;
}

describe("code block processors", () => {
  it("registers exactly chart, markvis and vis", () => {
    expect([...processors().keys()]).toEqual(["chart", "markvis", "vis"]);
    expect(LANGUAGES).toEqual(["chart", "markvis", "vis"]);
  });

  for (const language of LANGUAGES) {
    describe(language, () => {
      it("draws a valid block as an SVG figure", () => {
        const el = draw(language, VALID);
        expect(el.classList.contains("markvis")).toBe(true);
        expect(el.innerHTML).toContain("<svg");
        const figure = el.querySelector("figure.markvis");
        expect(figure?.getAttribute("data-chart-type")).toBe("bar");
        const svg = el.querySelector("svg");
        expect(svg?.namespaceURI).toBe("http://www.w3.org/2000/svg");
        expect(svg?.getAttribute("aria-label")).toContain("Mar led Midtown box office");
        expect(el.querySelector(".markvis-error")).toBeNull();
      });

      it("keeps an invalid block as a table plus one error line", () => {
        const el = draw(language, INVALID);
        expect(el.classList.contains("markvis")).toBe(true);
        expect(el.querySelector("svg")).toBeNull();
        expect(el.innerHTML).toContain("<table");
        const errors = el.querySelectorAll(".markvis-error");
        expect(errors).toHaveLength(1);
        expect(errors[0]?.textContent).toContain("E_UNKNOWN_TYPE");
        const cells = [...el.querySelectorAll("td")].map((td) => td.textContent);
        expect(cells).toEqual(["A", "1", "B", "2"]);
      });
    });
  }

  it("draws markup in cells as text, never as elements", () => {
    const el = draw("chart", HOSTILE);
    expect(el.querySelector("img, script")).toBeNull();
    expect(el.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("names an untitled chart after the note", () => {
    const el = draw("chart", UNTITLED, "Daily/Site visits.md");
    expect(el.querySelector("svg")?.getAttribute("aria-label")).toContain("Site visits");
  });

  it("never assigns an HTML string to a live element", () => {
    const source = readFileSync(join(fileURLToPath(import.meta.url), "..", "..", "src", "main.ts"), "utf8");
    expect(source).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write/);
  });
});
