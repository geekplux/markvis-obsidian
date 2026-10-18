import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import MarkvisPlugin, { LANGUAGES } from "../src/main";
import { registeredLanguages } from "./obsidian-stub";
import type { Plugin as StubPlugin, Processor } from "./obsidian-stub";
import { CUT, EMPTY, HOSTILE, INVALID, UNTITLED, VALID } from "./fixtures";

// Paths, not URL objects: happy-dom replaces the global URL class.
const root = join(fileURLToPath(import.meta.url), "..", "..");

async function load(): Promise<StubPlugin> {
  const plugin = new MarkvisPlugin({} as never, {} as never);
  await plugin.onload();
  return plugin as unknown as StubPlugin;
}

async function processors(): Promise<Map<string, Processor>> {
  registeredLanguages.clear();
  return (await load()).processors;
}

async function draw(language: string, source: string, sourcePath = "Notes/Box office.md"): Promise<HTMLElement> {
  const handler = (await processors()).get(language);
  if (!handler) throw new Error(`no processor for ${language}`);
  const el = document.createElement("div");
  handler(source, el, { sourcePath });
  return el;
}

describe("code block processors", () => {
  it("registers exactly markvis, vis and chart, chart last", async () => {
    expect([...(await processors()).keys()]).toEqual(["markvis", "vis", "chart"]);
    expect(LANGUAGES).toEqual(["markvis", "vis", "chart"]);
  });

  it("still registers markvis and vis when another plugin owns chart", async () => {
    registeredLanguages.clear();
    const other: Processor = () => undefined;
    registeredLanguages.set("chart", other);
    const plugin = await load();
    expect([...plugin.processors.keys()]).toEqual(["markvis", "vis"]);
    expect(registeredLanguages.get("chart")).toBe(other);
  });

  for (const language of LANGUAGES) {
    describe(language, () => {
      it("draws a valid block as an SVG figure", async () => {
        const el = await draw(language, VALID);
        expect(el.classList.contains("markvis")).toBe(true);
        expect(el.innerHTML).toContain("<svg");
        const figure = el.querySelector("figure.markvis");
        expect(figure?.getAttribute("data-chart-type")).toBe("bar");
        const svg = el.querySelector("svg");
        expect(svg?.namespaceURI).toBe("http://www.w3.org/2000/svg");
        expect(svg?.getAttribute("aria-label")).toContain("Mar led Midtown box office");
        expect(el.querySelector(".markvis-error")).toBeNull();
      });

      it("keeps an invalid block as a table plus one error line", async () => {
        const el = await draw(language, INVALID);
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

  it("shows one error line for an empty block", async () => {
    const el = await draw("markvis", EMPTY);
    expect(el.querySelector("svg")).toBeNull();
    const errors = el.querySelectorAll(".markvis-error");
    expect(errors).toHaveLength(1);
    expect(errors[0]?.textContent).toContain("E_EMPTY_FENCE");
  });

  it("keeps a block cut mid-line as a table plus one error line", async () => {
    const el = await draw("markvis", CUT);
    expect(el.querySelector("svg")).toBeNull();
    expect(el.querySelector("table")).not.toBeNull();
    expect(el.querySelectorAll(".markvis-error")).toHaveLength(1);
  });

  it("draws markup in cells as text, never as elements", async () => {
    const el = await draw("chart", HOSTILE);
    expect(el.querySelector("img, script")).toBeNull();
    expect(el.textContent).toContain("<img src=x onerror=alert(1)>");
  });

  it("names an untitled chart after the note", async () => {
    const el = await draw("chart", UNTITLED, "Daily/Site visits.md");
    expect(el.querySelector("svg")?.getAttribute("aria-label")).toContain("Site visits");
  });
});

describe("review guards", () => {
  // No HTML string on a live element, no code from strings, no console noise.
  const FORBIDDEN = /innerHTML|outerHTML|insertAdjacentHTML|\beval\(|new Function|console\.log/;

  const sources = readdirSync(join(root, "src"), { recursive: true, encoding: "utf8" })
    .filter((file) => file.endsWith(".ts"))
    .map((file) => join("src", file));

  it("finds the sources", () => {
    expect(sources).toContain(join("src", "main.ts"));
  });

  for (const file of [...sources, "main.js"]) {
    it(`${file} uses none of the flagged APIs`, () => {
      expect(readFileSync(join(root, file), "utf8")).not.toMatch(FORBIDDEN);
    });
  }
});
