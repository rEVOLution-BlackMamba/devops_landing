'use strict';

/*
 * main.js's IIFEs run immediately on load and touch browser globals, so each
 * scenario re-evaluates the file in a fresh sandbox via vm.runInThisContext —
 * Node's real global context already provides setTimeout/console/performance/
 * etc., so only document/window/localStorage/navigator/IntersectionObserver
 * need stubbing (see dom-shim.js for why this isn't jsdom).
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createShim } = require('./dom-shim');

const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');

function runMain(seed) {
  const shim = createShim(seed);

  // Left in place after returning (rather than restored): main.js's click/keydown
  // handlers close over the *global* `document`/`window` bindings and fire later,
  // when assertions dispatch synthetic events — they must still resolve to this
  // shim. Each call simply overwrites these with a fresh shim, so tests stay isolated.
  Object.assign(globalThis, {
    document: shim.document,
    window: shim.window,
    localStorage: shim.localStorage,
    navigator: shim.navigator,
    IntersectionObserver: shim.IntersectionObserver,
    requestAnimationFrame: shim.requestAnimationFrame,
  });

  const realLog = console.log;
  console.log = () => {}; // silence the console-easter-egg banner during test runs
  try {
    new vm.Script(SOURCE, { filename: 'main.js' }).runInThisContext();
  } finally {
    console.log = realLog;
  }
  return shim;
}

test('initFooterYear writes the current year into #footer-year', () => {
  const shim = runMain({ byId: { 'footer-year': { tag: 'span' } } });
  assert.equal(shim.byId.get('footer-year').textContent, String(new Date().getFullYear()));
});

test('initDurations computes and formats experience spans from data-start/data-end', () => {
  const cases = [
    { id: 'd-same',    attrs: { 'data-start': '2020-01', 'data-end': '2020-01' } }, // 0 months
    { id: 'd-months',  attrs: { 'data-start': '2021-01', 'data-end': '2021-07' } }, // 6 months
    { id: 'd-years',   attrs: { 'data-start': '2019-03', 'data-end': '2021-03' } }, // 24 months
    { id: 'd-mixed',   attrs: { 'data-start': '2019-01', 'data-end': '2020-04' } }, // 15 months
    { id: 'd-present', attrs: { 'data-start': '2000-01', 'data-end': 'present' } },
  ];
  const shim = runMain({
    bySelector: {
      '.timeline-date[data-start]': cases.map(c => ({ tag: 'span', className: 'timeline-date', ...c })),
    },
  });

  const els = shim.bySelector.get('.timeline-date[data-start]');
  const byId = Object.fromEntries(els.map(el => [el.id, el]));

  assert.equal(byId['d-same'].nextSiblings, undefined, 'a zero-length span gets no duration badge (dur > 0 guard)');
  assert.equal(byId['d-months'].nextSiblings[0].textContent, '· 6 mo');
  assert.equal(byId['d-years'].nextSiblings[0].textContent, '· 2 yr');
  assert.equal(byId['d-mixed'].nextSiblings[0].textContent, '· 1 yr 3 mo');
  assert.equal(byId['d-months'].nextSiblings[0].className, 'timeline-duration');

  // "present" depends on today's date — assert shape, not an exact value, to stay stable over time
  assert.match(byId['d-present'].nextSiblings[0].textContent, /^· (\d+ mo|\d+ yr|\d+ yr \d+ mo)$/);
});

test('initTheme persists the chosen theme to localStorage and syncs data-theme/.active', () => {
  const shim = runMain({
    bySelector: {
      '.theme-btn': [
        { tag: 'button', className: 'theme-btn', attrs: { 'data-theme': 'dark' } },
        { tag: 'button', className: 'theme-btn', attrs: { 'data-theme': 'light' } },
        { tag: 'button', className: 'theme-btn', attrs: { 'data-theme': 'system' } },
      ],
    },
  });
  const [dark, light, system] = shim.bySelector.get('.theme-btn');
  const html = shim.document.documentElement;

  // No stored preference on first load -> 'system' wins, no data-theme override
  assert.equal(html.getAttribute('data-theme'), null);
  assert.equal(shim.localStorage.getItem('theme'), null);
  assert.equal(system.classList.contains('active'), true);
  assert.equal(dark.classList.contains('active'), false);
  assert.equal(light.classList.contains('active'), false);

  // Choosing 'dark' applies and persists it, and moves the .active marker
  dark.dispatch('click');
  assert.equal(html.getAttribute('data-theme'), 'dark');
  assert.equal(shim.localStorage.getItem('theme'), 'dark');
  assert.equal(dark.classList.contains('active'), true);
  assert.equal(system.classList.contains('active'), false);

  // Switching back to 'system' clears both the attribute and the stored override
  system.dispatch('click');
  assert.equal(html.getAttribute('data-theme'), null);
  assert.equal(shim.localStorage.getItem('theme'), null);
  assert.equal(system.classList.contains('active'), true);
  assert.equal(dark.classList.contains('active'), false);
});
