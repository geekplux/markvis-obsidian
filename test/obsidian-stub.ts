// The slice of the Obsidian API the plugin touches, recorded for assertions.
export type Processor = (source: string, el: HTMLElement, ctx: { sourcePath: string }) => unknown;

/**
 * Obsidian keeps one registry of code block languages across all plugins and
 * throws when a language is registered twice. Tests clear it between plugins.
 */
export const registeredLanguages = new Map<string, Processor>();

export class Plugin {
  readonly processors = new Map<string, Processor>();

  constructor(
    readonly app: unknown = {},
    readonly manifest: unknown = {},
  ) {}

  registerMarkdownCodeBlockProcessor(language: string, handler: Processor): void {
    if (registeredLanguages.has(language)) {
      throw new Error(`Code block postprocessor for language ${language} is already registered`);
    }
    registeredLanguages.set(language, handler);
    this.processors.set(language, handler);
  }
}
