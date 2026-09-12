'use strict';

/*
 * Purpose-built minimal DOM shim for unit-testing main.js with zero
 * dependencies (no jsdom/Playwright — see CLAUDE.md "no npm" philosophy).
 *
 * main.js is a sequence of IIFEs that run immediately and touch a handful
 * of browser globals. This shim provides just enough of `document`/`window`/
 * `localStorage`/`navigator` for the whole file to execute without throwing:
 * querySelectorAll/getElementById are backed by a lookup table keyed on the
 * exact selector strings main.js uses, NOT a generic CSS engine. Selectors
 * outside that table resolve to null/[], which trips main.js's own
 * `if (!el) return;` guards so unrelated IIFEs no-op safely.
 */

function createElement(seed = {}) {
  const attrs = { ...(seed.attrs || {}) };
  const dataset = {};
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('data-')) {
      const camel = k.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      dataset[camel] = v;
    }
  }

  const classes = new Set((seed.className || '').split(/\s+/).filter(Boolean));
  const children = [];
  const listeners = {};

  let text = seed.text || '';

  const el = {
    id: seed.id || attrs.id || '',
    tagName: (seed.tag || 'div').toUpperCase(),
    style: {},

    // Real DOM coerces any assigned value (e.g. a number) to a string.
    get textContent() { return text; },
    set textContent(v) { text = String(v); },

    dataset,
    children,
    listeners,

    get className() { return [...classes].join(' '); },
    set className(v) { classes.clear(); v.split(/\s+/).filter(Boolean).forEach(c => classes.add(c)); },

    classList: {
      add: (...names) => names.forEach(n => classes.add(n)),
      remove: (...names) => names.forEach(n => classes.delete(n)),
      contains: name => classes.has(name),
      toggle: (name, force) => {
        const has = classes.has(name);
        const want = force === undefined ? !has : !!force;
        if (want) classes.add(name); else classes.delete(name);
        return want;
      },
    },

    setAttribute(name, value) {
      attrs[name] = String(value);
      if (name.startsWith('data-')) {
        const camel = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        dataset[camel] = String(value);
      }
    },
    getAttribute(name) { return Object.prototype.hasOwnProperty.call(attrs, name) ? attrs[name] : null; },
    removeAttribute(name) {
      delete attrs[name];
      if (name.startsWith('data-')) {
        const camel = name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        delete dataset[camel];
      }
    },
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(attrs, name); },

    addEventListener(type, handler) {
      (listeners[type] = listeners[type] || []).push(handler);
    },
    removeEventListener(type, handler) {
      if (!listeners[type]) return;
      listeners[type] = listeners[type].filter(h => h !== handler);
    },
    dispatch(type, evt = {}) {
      (listeners[type] || []).forEach(h => h.call(el, evt));
    },

    appendChild(child) { children.push(child); return child; },

    // Just enough to handle the literal pattern initDurations emits:
    // '<span class="timeline-duration">· 2 yr 3 mo</span>'
    insertAdjacentHTML(position, html) {
      const m = /<span class="([^"]*)">([^<]*)<\/span>/.exec(html);
      const sibling = m
        ? createElement({ tag: 'span', className: m[1], text: m[2] })
        : createElement({ tag: 'span', text: html });
      sibling.__position = position;
      el.nextSiblings = el.nextSiblings || [];
      el.nextSiblings.push(sibling);
    },
  };

  return el;
}

function createShim(seed = {}) {
  const byId = new Map();
  const bySelector = new Map();

  for (const [id, def] of Object.entries(seed.byId || {})) {
    byId.set(id, createElement({ id, ...def }));
  }
  for (const [selector, defs] of Object.entries(seed.bySelector || {})) {
    bySelector.set(selector, defs.map(def => createElement(def)));
  }

  const documentElement = createElement({ tag: 'html' });
  const docListeners = {};

  const store = {};
  const localStorage = {
    getItem: k => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
    get __store() { return store; },
  };

  const document = {
    documentElement,
    getElementById: id => byId.get(id) || null,
    querySelectorAll: selector => bySelector.get(selector) || [],
    querySelector: selector => (bySelector.get(selector) || [])[0] || null,
    createElement: tag => createElement({ tag }),
    addEventListener(type, handler) { (docListeners[type] = docListeners[type] || []).push(handler); },
    dispatch(type, evt = {}) { (docListeners[type] || []).forEach(h => h.call(document, evt)); },
  };

  const winListeners = {};
  const window = {
    addEventListener(type, handler) { (winListeners[type] = winListeners[type] || []).push(handler); },
    dispatch(type, evt = {}) { (winListeners[type] || []).forEach(h => h.call(window, evt)); },
    scrollY: 0,
    innerHeight: 800,
    scrollTo() {},
  };

  class IntersectionObserver {
    constructor(callback) { this.callback = callback; this.observed = []; }
    observe(el) { this.observed.push(el); }
    unobserve(el) { this.observed = this.observed.filter(o => o !== el); }
    trigger(entries) { this.callback(entries, this); }
  }

  const navigator = { clipboard: { writeText: () => Promise.resolve() } };
  const requestAnimationFrame = () => 0;

  return {
    document,
    window,
    localStorage,
    navigator,
    IntersectionObserver,
    requestAnimationFrame,
    byId,
    bySelector,
  };
}

module.exports = { createShim, createElement };
