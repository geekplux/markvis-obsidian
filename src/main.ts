import { Plugin } from "obsidian";
import type { MarkdownPostProcessorContext } from "obsidian";
import { render } from "markvis";

/** The three fence languages markvis reads. One parser sits behind all of them. */
export const LANGUAGES = ["chart", "markvis", "vis"] as const;

/**
 * Draws one chart block into `el`.
 *
 * `render()` never throws. A block it can draw comes back as a `<figure>` with
 * an SVG; a block it cannot draw comes back as its rows in a table plus one
 * error line, so the numbers are never lost.
 *
 * The chart is drawn at markvis's default width (720) and scaled down by
 * `styles.css`: `el` has no width yet while the block mounts.
 */
export function drawBlock(
  source: string,
  el: HTMLElement,
  ctx: Pick<MarkdownPostProcessorContext, "sourcePath">,
): void {
  el.addClass("markvis");
  // `filename` lets markvis derive a title when the block has no `title:`.
  const { html } = render(source, { filename: ctx.sourcePath });
  // Parse into a detached document and move the nodes over, so no HTML string
  // is ever assigned to a live element. markvis escapes every value it writes.
  const parsed = new DOMParser().parseFromString(html, "text/html");
  el.append(...Array.from(parsed.body.childNodes));
}

export default class MarkvisPlugin extends Plugin {
  async onload(): Promise<void> {
    // One processor covers Reading view and Live Preview. It adds no listeners,
    // so there is nothing to clean up on unload.
    for (const language of LANGUAGES) {
      this.registerMarkdownCodeBlockProcessor(language, (source, el, ctx) => {
        drawBlock(source, el, ctx);
      });
    }
  }
}
