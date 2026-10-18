// Obsidian adds `addClass` to every element; happy-dom does not.
declare global {
  interface HTMLElement {
    addClass(...classes: string[]): void;
  }
}

HTMLElement.prototype.addClass = function addClass(this: HTMLElement, ...classes: string[]) {
  this.classList.add(...classes);
};

export {};
