// The slice of the Obsidian API the plugin touches, recorded for assertions.
export type Processor = (source: string, el: HTMLElement, ctx: { sourcePath: string }) => unknown;

export class Plugin {
  readonly processors = new Map<string, Processor>();

  constructor(
    readonly app: unknown = {},
    readonly manifest: unknown = {},
  ) {}

  registerMarkdownCodeBlockProcessor(language: string, handler: Processor): void {
    if (this.processors.has(language)) throw new Error(`registered twice: ${language}`);
    this.processors.set(language, handler);
  }
}
