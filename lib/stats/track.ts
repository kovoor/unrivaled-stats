// ==================================================================
// The track. One component renders every filter set on the page and
// in the drawer. A filter is { key, name, options, value, def, note }.
// Every filter is a menu segment, its value and a chevron, whatever
// its options count. An option can be disabled, and a note under the
// items says why. A fifth filter and on fold into a More menu at the
// end of the track.
// ==================================================================
import { $, $$, esc, icon, target } from '@/lib/stats/dom';

const TRACK_MAX = 4;

export type TrackOption = {
    value: string;
    label: string;
    /** The menu item's main line and sub line, when they differ from the label. */
    main?: string;
    sub?: string;
    /** What the More segment says for this value. */
    short?: string;
    logo?: string;
    /** The league mark, for an "All clubs" style option. */
    league?: boolean;
    disabled?: boolean;
};

export type TrackFilter = {
    key: string;
    id?: string;
    name: string;
    options: TrackOption[];
    value?: string;
    def?: string;
    note?: string;
};

export type TrackValues = Record<string, string>;

export type TrackApi = {
    set(key: string, value: string): void;
    get(key: string): string | undefined;
    values(): TrackValues;
};

export type TrackOptions = {
    root: HTMLElement;
    label: string;
    reset?: Element | null;
    filters: TrackFilter[];
    onChange?(key: string, value: string, api: TrackApi): void;
    onReset?(api: TrackApi): void;
};

type Filter = TrackFilter & { folded: boolean; value: string; def: string };

type OpenMenu = { btn: HTMLElement; pop: HTMLElement; place(): void; close(refocus: boolean): void };

/**
 * Returns the Track component. Its tracks share one open menu at a time, and `signal` removes every listener
 * they and the document-wide menu handlers add.
 */
export function createTrack(signal: AbortSignal): (o: TrackOptions) => TrackApi {
    let uid = 0;
    let openPop: OpenMenu | null = null;

    function Track(o: TrackOptions): TrackApi {
        const id = 'trk' + ++uid;
        const root = o.root;
        const filters: Filter[] = o.filters.map((f, i) =>
            Object.assign({}, f, {
                folded: i >= TRACK_MAX,
                value: f.value === undefined ? f.options[0].value : f.value,
                def: f.def === undefined ? f.options[0].value : f.def,
            }),
        );
        const byKey: Record<string, Filter> = {};
        filters.forEach(f => {
            byKey[f.key] = f;
        });
        const folded = filters.filter(f => f.folded);

        function opt(f: Filter, v: string) {
            return f.options.filter(x => x.value === v)[0] || f.options[0];
        }
        function popId(key: string) {
            return id + '-' + key + '-menu';
        }
        function btnId(f: Filter) {
            return f.id || id + '-' + f.key;
        }

        // Every option sits in the segment, stacked, with only the current one visible, so a segment is as wide
        // as its widest option and the track never reflows when a shorter value is chosen.
        function valueHtml(f: Filter) {
            return f.options
                .map(
                    x =>
                        '<span class="seg__opt" data-on="' +
                        (x.value === f.value) +
                        '">' +
                        (x.logo ? '<img class="seg__logo" src="' + x.logo + '" alt="">' : '') +
                        esc(x.label) +
                        '</span>',
                )
                .join('');
        }

        function slotHtml(f: Filter) {
            return (
                '<div class="slot" data-slot="' + f.key + '"><button type="button" class="seg seg--menu" id="' + btnId(f) +
                '" data-menu="' + f.key + '" aria-haspopup="menu" aria-expanded="false" aria-controls="' + popId(f.key) +
                '" aria-label="' + esc(f.name + ': ' + opt(f, f.value).label) + '">' +
                '<span class="seg__value" data-value-of="' + f.key + '">' + valueHtml(f) + '</span>' +
                icon('chevron-down', 'seg__chev') + '</button></div>'
            );
        }

        function moreSlotHtml() {
            return (
                '<div class="slot" data-slot="more"><button type="button" class="seg seg--menu" id="' + id +
                '-more" data-menu="more" aria-haspopup="menu" aria-expanded="false" aria-controls="' + popId('more') +
                '" aria-label="More filters">' +
                '<span class="seg__value" data-value-of="more">More</span>' + icon('chevron-down', 'seg__chev') +
                '</button></div>'
            );
        }

        function itemsHtml(f: Filter) {
            return (
                f.options
                    .map(x => {
                        const lead = x.logo
                            ? '<img class="pop__logo" src="' + x.logo + '" alt="">'
                            : x.league
                              ? '<span class="pop__logo pop__logo--league" aria-hidden="true"></span>'
                              : '';
                        return (
                            '<button type="button" class="pop__item" role="menuitemradio" tabindex="-1" aria-checked="' +
                            (x.value === f.value) + '"' + (x.disabled ? ' aria-disabled="true"' : '') + ' data-key="' +
                            f.key + '" data-value="' + esc(x.value) + '">' +
                            lead + '<span class="pop__main">' + esc(x.main || x.label) + '</span>' +
                            (x.sub ? '<span class="pop__sub">' + esc(x.sub) + '</span>' : '') + icon('check') + '</button>'
                        );
                    })
                    .join('') + (f.note ? '<p class="pop__note">' + esc(f.note) + '</p>' : '')
            );
        }

        function popHtml(f: Filter) {
            return (
                '<div class="pop" id="' + popId(f.key) + '" role="menu" aria-labelledby="' + btnId(f) + '" hidden>' +
                itemsHtml(f) + '</div>'
            );
        }
        function morePopHtml() {
            return (
                '<div class="pop" id="' + popId('more') + '" role="menu" aria-labelledby="' + id + '-more" hidden>' +
                folded
                    .map(
                        f =>
                            '<div role="group" aria-labelledby="' + id + '-' + f.key + '-label"><p class="pop__label" id="' +
                            id + '-' + f.key + '-label">' + esc(f.name) + '</p>' + itemsHtml(f) + '</div>',
                    )
                    .join('<div class="pop__rule" role="separator"></div>') +
                '</div>'
            );
        }

        const shown = filters.filter(f => !f.folded);
        root.innerHTML =
            '<div class="track" role="toolbar" aria-label="' + esc(o.label) + '">' + shown.map(slotHtml).join('') +
            (folded.length ? moreSlotHtml() : '') + '</div>' +
            shown.map(popHtml).join('') +
            (folded.length ? morePopHtml() : '');

        const track = $('.track', root)!;

        // ---------- State into the DOM ----------
        function paint() {
            filters.forEach(f => {
                $$('[data-key="' + f.key + '"]', root).forEach(b => {
                    b.setAttribute('aria-checked', String(b.getAttribute('data-value') === String(f.value)));
                });
                const label = $('[data-value-of="' + f.key + '"]', root);
                if (label) {
                    label.innerHTML = valueHtml(f);
                    (label.parentNode as Element).setAttribute('aria-label', f.name + ': ' + opt(f, f.value).label);
                }
            });
            // More names the folded value once it is not the default, so every choice stays readable at rest.
            if (folded.length) {
                const changed = folded.filter(f => f.value !== f.def);
                const more = $('[data-value-of="more"]', root)!;
                more.textContent = changed.length
                    ? changed
                          .map(f => {
                              const x = opt(f, f.value);
                              return x.short || x.label;
                          })
                          .join(', ')
                    : 'More';
                (more.parentNode as Element).setAttribute(
                    'aria-label',
                    'More filters' + (changed.length ? ': ' + more.textContent : ''),
                );
            }
            if (o.reset) o.reset.setAttribute('data-on', String(isChanged()));
        }

        function isChanged() {
            return filters.some(f => f.value !== f.def);
        }

        function choose(key: string, value: string) {
            const f = byKey[key];
            if (!f || String(f.value) === String(value)) return;
            f.value = value;
            paint();
            if (o.onChange) o.onChange(key, value, api);
        }

        // ---------- Keyboard: one toolbar, one tab stop, arrows along it ----------
        function rovers() {
            return $$<HTMLButtonElement>('button.seg', track);
        }
        function rove(to: Element | undefined) {
            rovers().forEach(b => {
                b.tabIndex = b === to ? 0 : -1;
            });
        }
        rove(rovers()[0]);
        track.addEventListener(
            'focusin',
            e => {
                const b = target(e).closest('button.seg');
                if (b) rove(b);
            },
            { signal },
        );
        track.addEventListener(
            'keydown',
            e => {
                const list = rovers();
                const i = list.indexOf(document.activeElement as HTMLButtonElement);
                if (i < 0) return;
                const b = list[i];
                let next: HTMLButtonElement | null = null;
                if (e.key === 'ArrowRight') next = list[(i + 1) % list.length];
                else if (e.key === 'ArrowLeft') next = list[(i - 1 + list.length) % list.length];
                else if (e.key === 'Home') next = list[0];
                else if (e.key === 'End') next = list[list.length - 1];
                else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && b.hasAttribute('data-menu')) {
                    e.preventDefault();
                    open(b, e.key === 'ArrowUp' ? 'last' : 'checked');
                    return;
                }
                if (next) {
                    e.preventDefault();
                    next.focus();
                }
            },
            { signal },
        );

        // ---------- Menus ----------
        function popFor(btn: Element) {
            return document.getElementById(btn.getAttribute('aria-controls')!)!;
        }

        function place(pop: HTMLElement, btn: HTMLElement) {
            const f = root.getBoundingClientRect();
            const r = btn.getBoundingClientRect();
            const scope = root.closest('.rv-notes');
            const box = scope ? scope.getBoundingClientRect() : { left: 0, right: document.documentElement.clientWidth };
            pop.style.minWidth = Math.round(Math.max(220, Math.min(r.width - 8, 320))) + 'px';
            const w = pop.offsetWidth;
            let left = r.left + r.width / 2 - w / 2;
            left = Math.max(box.left + 12, Math.min(left, box.right - 12 - w));
            pop.style.left = Math.round(left - f.left) + 'px';
            pop.style.top = Math.round(r.bottom - f.top + 4) + 'px';
        }

        function open(btn: HTMLElement, focus: 'last' | 'checked') {
            if (openPop && openPop.btn !== btn) openPop.close(false);
            const pop = popFor(btn);
            pop.hidden = false;
            btn.setAttribute('aria-expanded', 'true');
            place(pop, btn);
            openPop = {
                btn,
                pop,
                place: () => place(pop, btn),
                close: refocus => close(btn, refocus),
            };
            const items = $$('[role="menuitemradio"]', pop);
            const checked = $('[aria-checked="true"]', pop) || items[0];
            const item = focus === 'last' ? items[items.length - 1] : checked;
            if (item) item.focus({ preventScroll: true });
            // A long list scrolls its checked item into view.
            if (item && pop.scrollHeight > pop.clientHeight)
                pop.scrollTop = item.offsetTop - pop.clientHeight / 2 + item.offsetHeight / 2;
        }

        function close(btn: HTMLElement, refocus: boolean) {
            const pop = popFor(btn);
            if (pop.hidden) return;
            pop.hidden = true;
            btn.setAttribute('aria-expanded', 'false');
            if (openPop && openPop.btn === btn) openPop = null;
            if (refocus) btn.focus({ preventScroll: true });
        }

        root.addEventListener(
            'click',
            e => {
                const menuBtn = target(e).closest<HTMLElement>('button[data-menu]');
                if (menuBtn) {
                    if (menuBtn.getAttribute('aria-expanded') === 'true') close(menuBtn, true);
                    else open(menuBtn, 'checked');
                    return;
                }
                const item = target(e).closest('[role="menuitemradio"]');
                if (!item || item.getAttribute('aria-disabled') === 'true') return;
                const owner = document.getElementById(item.closest('.pop')!.getAttribute('aria-labelledby')!)!;
                close(owner, true);
                choose(item.getAttribute('data-key')!, item.getAttribute('data-value')!);
            },
            { signal },
        );

        root.addEventListener(
            'keydown',
            e => {
                const pop = target(e).closest('.pop');
                if (!pop) return;
                const owner = document.getElementById(pop.getAttribute('aria-labelledby')!)!;
                const items = $$('[role="menuitemradio"]', pop);
                const i = items.indexOf(document.activeElement as HTMLElement);
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    items[(i + 1) % items.length].focus();
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    items[(i - 1 + items.length) % items.length].focus();
                } else if (e.key === 'Home') {
                    e.preventDefault();
                    items[0].focus();
                } else if (e.key === 'End') {
                    e.preventDefault();
                    items[items.length - 1].focus();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    close(owner, true);
                }
                // Tab leaves from the button, so it lands on whatever follows the track.
                else if (e.key === 'Tab') close(owner, true);
            },
            { signal },
        );

        if (o.reset) {
            o.reset.addEventListener(
                'click',
                () => {
                    filters.forEach(f => {
                        f.value = f.def;
                    });
                    paint();
                    rovers()[0].focus({ preventScroll: true });
                    if (o.onReset) o.onReset(api);
                },
                { signal },
            );
        }

        const api: TrackApi = {
            set(key, value) {
                if (byKey[key]) {
                    byKey[key].value = value;
                    paint();
                }
            },
            get: key => byKey[key] && byKey[key].value,
            values() {
                const v: TrackValues = {};
                filters.forEach(f => {
                    v[f.key] = f.value;
                });
                return v;
            },
        };
        paint();
        return api;
    }

    // Outside a menu and its button, a press closes it; focus goes home when it was inside the menu.
    document.addEventListener(
        'pointerdown',
        e => {
            if (!openPop) return;
            const node = e.target as Node;
            if (openPop.pop.contains(node) || openPop.btn.contains(node)) return;
            const inside = openPop.pop.contains(document.activeElement);
            openPop.close(inside);
        },
        { signal },
    );
    document.addEventListener(
        'keydown',
        e => {
            if (e.key === 'Escape' && openPop) {
                e.stopPropagation();
                openPop.close(true);
            }
        },
        { capture: true, signal },
    );
    // A phone fires resize as its toolbar collapses, so an open menu follows its segment instead of closing.
    window.addEventListener(
        'resize',
        () => {
            if (openPop) openPop.place();
        },
        { signal },
    );

    return Track;
}
