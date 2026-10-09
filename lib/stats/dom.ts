// Small DOM and markup helpers shared by the views.

type Scope = ParentNode | null | undefined;

export function $<T extends Element = HTMLElement>(selector: string, scope?: Scope): T | null {
    return (scope || document).querySelector<T>(selector);
}

export function $$<T extends Element = HTMLElement>(selector: string, scope?: Scope): T[] {
    return Array.from((scope || document).querySelectorAll<T>(selector));
}

const ENTITIES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

export function esc(s: unknown): string {
    return String(s).replace(/[&<>"]/g, c => ENTITIES[c]);
}

/** A sprite icon from IconSprite, e.g. icon('chevron-down', 'seg__chev'). */
export function icon(name: string, cls?: string): string {
    return '<svg class="i' + (cls ? ' ' + cls : '') + '" aria-hidden="true"><use href="#i-' + name + '"/></svg>';
}

/** The element an event started on. Every listener here sits on elements or the document, so it is an Element. */
export function target(e: Event): Element {
    return e.target as Element;
}
