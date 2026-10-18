import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { render } from "markvis";
import { INVALID, THEMING, VALID } from "./fixtures";

// Paths, not URL objects: happy-dom replaces the global URL class.
const root = join(fileURLToPath(import.meta.url), "..", "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");
const json = (path: string) => JSON.parse(read(path));

const manifest = json("manifest.json");
const pkg = json("package.json");

describe("release files", () => {
  it("keeps manifest.json and package.json on one version", () => {
    expect(manifest.version).toBe(pkg.version);
  });

  it("lists the manifest version in versions.json", () => {
    expect(json("versions.json")[manifest.version]).toBe(manifest.minAppVersion);
  });

  it("has a directory-ready manifest", () => {
    expect(manifest.id).toBe("markvis");
    expect(manifest.id).not.toMatch(/obsidian/i);
    expect(manifest.name).not.toMatch(/obsidian/i);
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(manifest.isDesktopOnly).toBe(false);
    expect(manifest.description.length).toBeLessThanOrEqual(250);
    expect(manifest.description).toMatch(/\.$/);
    expect(manifest.description).not.toMatch(/obsidian|this plugin/i);
  });

  it("maps every markvis paint variable in styles.css", () => {
    const css = read("styles.css").replace(/\/\*[\s\S]*?\*\//g, "");
    const names = [
      "ink", "muted", "grid", "paper", "plate", "plot",
      ...Array.from({ length: 8 }, (_, i) => `series-${i + 1}`),
      "accent", "up", "down", "total",
    ];
    expect(names).toHaveLength(18);
    for (const name of names) expect(css).toMatch(new RegExp(`--markvis-${name}:\\s*var\\(--`));
    // The font stays opt-in until it is checked against real vault fonts.
    expect(css).not.toMatch(/--markvis-font:/);
    expect(css).toMatch(/\.markvis svg\s*{[^}]*max-width:\s*100%/);
    expect(css).toMatch(/\.markvis \.markvis-error\s*{[^}]*color:\s*var\(--text-error\)/);
  });
});

describe("theming", () => {
  // `font` is the one name left unset on purpose: chart text keeps markvis's
  // font unless a vault opts in (documented in styles.css and the README).
  const OPT_IN = new Set(["font"]);

  const outputs = Object.entries(THEMING).map(([type, block]) => {
    const result = render(block);
    if (!result.ok) throw new Error(`${type} fixture did not draw: ${result.error.code}`);
    expect(result.chart.type).toBe(type);
    return result.html;
  });

  it("paints a valid block through CSS variables with fallbacks", () => {
    const html = render(VALID).html;
    expect(html).toContain("var(--markvis-ink,");
    expect(html).toContain("var(--markvis-series-1,");
  });

  it("declares in styles.css every variable markvis paints with", () => {
    const css = read("styles.css").replace(/\/\*[\s\S]*?\*\//g, "");
    const declared = new Set([...css.matchAll(/--markvis-([a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    const emitted = new Set(outputs.flatMap((html) => [...html.matchAll(/--markvis-([a-z0-9-]+)/g)].map((m) => m[1])));
    expect(emitted.size).toBeGreaterThan(10);
    const missing = [...emitted].filter((name) => !declared.has(name) && !OPT_IN.has(name));
    expect(missing).toEqual([]);
  });

  it("draws grid lines from the text color, not the faint border color", () => {
    const css = read("styles.css").replace(/\/\*[\s\S]*?\*\//g, "");
    expect(css).toMatch(/--markvis-grid:\s*var\(--text-normal\)/);
  });
});

describe("built main.js", () => {
  const path = join(root, "main.js");

  it("exists (run `npm run build` first)", () => {
    expect(existsSync(path)).toBe(true);
  });

  it("is at most 300 kB", () => {
    expect(statSync(path).size).toBeLessThanOrEqual(300 * 1024);
  });

  it("requires nothing but obsidian at runtime", () => {
    const required = new Set([...read("main.js").matchAll(/require\("([^"]+)"\)/g)].map((m) => m[1]));
    expect([...required]).toEqual(["obsidian"]);
  });

  it("loads in a CommonJS sandbox, survives a taken chart fence, and draws both blocks", async () => {
    class Plugin {
      processors = new Map<string, (s: string, el: HTMLElement, ctx: { sourcePath: string }) => void>();
      registerMarkdownCodeBlockProcessor(language: string, handler: never) {
        // Another plugin owns `chart` here; Obsidian throws on a second claim.
        if (language === "chart") throw new Error("Code block postprocessor for language chart is already registered");
        this.processors.set(language, handler);
      }
    }
    const module = { exports: {} as { default?: new () => Plugin & { onload(): Promise<void> } } };
    const require = (id: string) => {
      if (id !== "obsidian") throw new Error(`unexpected require: ${id}`);
      return { Plugin };
    };
    new Function("module", "exports", "require", read("main.js"))(module, module.exports, require);
    const Bundled = module.exports.default;
    if (!Bundled) throw new Error("main.js has no default export");
    const plugin = new Bundled();
    await plugin.onload();
    expect([...plugin.processors.keys()]).toEqual(["markvis", "vis"]);

    const good = document.createElement("div");
    plugin.processors.get("vis")?.(VALID, good, { sourcePath: "a.md" });
    expect(good.querySelector("svg")).not.toBeNull();

    const bad = document.createElement("div");
    plugin.processors.get("markvis")?.(INVALID, bad, { sourcePath: "a.md" });
    expect(bad.querySelector(".markvis-error")).not.toBeNull();
    expect(bad.querySelector("table")).not.toBeNull();
  });
});
