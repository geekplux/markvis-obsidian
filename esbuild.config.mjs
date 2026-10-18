import esbuild from "esbuild";

const production = process.argv[2] === "production";

const context = await esbuild.context({
  banner: {
    js: "/* markvis for Obsidian. Bundles markvis (MIT). Source: https://github.com/geekplux/markvis-obsidian */",
  },
  entryPoints: ["src/main.ts"],
  bundle: true,
  // Obsidian provides `obsidian` at runtime; markvis is bundled in.
  external: ["obsidian"],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: production ? false : "inline",
  treeShaking: true,
  minify: production,
  outfile: "main.js",
});

if (production) {
  await context.rebuild();
  await context.dispose();
} else {
  await context.watch();
}
