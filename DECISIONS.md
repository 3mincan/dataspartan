# DECISIONS

Short decision log. Append new entries at the bottom; never rewrite an
accepted entry — supersede it with a new one and link back.

Format: **ID — Title** · Status · Context · Decision · Consequences.
Entries tagged *Assumption* must also appear in the README.

---

**D-001 — React with Vite and TypeScript** · Accepted
- Context: the brief allows Angular or React and asks for a simple app.
- Decision: Vite + React + strict TypeScript.
- Consequences: minimal boilerplate, fast feedback, typed API contracts.

**D-002 — No global state library** · Accepted
- Context: three pieces of UI state and one in-memory collection.
- Decision: `useState` in `App` plus custom hooks. No Redux/Zustand/Context.
- Consequences: props are passed at most two levels; revisit only if the
  tree grows.

**D-003 — Hand-written fetch layer with a promise cache** · Accepted
- Context: the same people, species and planets are requested repeatedly.
- Decision: `fetchJson` caches the promise per URL and evicts on failure.
  No data-fetching library.
- Consequences: no duplicate requests, retry works, less to explain. No
  background revalidation, which static SWAPI data does not need.

**D-004 — Drop stale results instead of aborting requests** · Accepted
- Context: quick film/character switches can resolve out of order; cached
  promises are shared between consumers.
- Decision: `useAsync` ignores results of superseded runs with a
  `cancelled` flag; requests are left to complete and fill the cache.
- Consequences: no stale UI; a few requests may finish unused.

**D-005 — Robot detection and human fallback** · Accepted · *Assumption*
- Context: SWAPI has no "robot" flag, and swapi.dev returns an empty
  `species` array for humans.
- Decision: a character is a robot when one of its species is named
  `Droid`. A character with no species is shown as Human / mammal.
- Consequences: detection is data-driven, not name-based; the fallback is
  documented in the README.

**D-006 — Manufacturing year uses `birth_year`** · Accepted · *Assumption*
- Context: SWAPI has no manufacturing-year field.
- Decision: show the droid's `birth_year` under the label
  "Manufacturing year".

**D-007 — Films ordered by episode number** · Accepted · *Assumption*
- Context: the API returns release order; the mockup starts with
  `1 - The Phantom Menace`.
- Decision: sort by `episode_id` and prefix titles with it.

**D-008 — Character details are fetched on demand** · Accepted
- Context: a film has up to ~40 characters, each with species and homeworld.
- Decision: load cast names when a film is selected; load species and
  homeworld only when a character is clicked.
- Consequences: fewer requests up front; a short loading state per first
  click, instant afterwards thanks to the cache.

**D-009 — Viewing log is in-memory, keyed by `episode_id`** · Accepted
- Context: the brief says client memory is enough and loss on reload is fine.
- Decision: `useViewingLog` holds `Record<episode_id, Viewing[]>` in React
  state. No localStorage.
- Consequences: simplest thing that meets the brief; persistence is listed
  as a possible improvement.

**D-010 — Viewings listed newest first; no edit** · Accepted · *Assumption*
- Context: ordering and editing are not specified.
- Decision: sort by date and time descending. Add and delete only.

**D-011 — Future dates are allowed** · Accepted · *Assumption*
- Context: the brief only says date and time are required.
- Decision: no upper bound on the date; only presence is validated.

**D-012 — Native `<dialog>` for the modal** · Accepted
- Context: the modal needs focus trapping, Esc handling and a backdrop.
- Decision: use `<dialog>` + `showModal()` instead of a library.
- Consequences: accessible by default, zero dependencies. jsdom lacks
  `showModal`, so tests stub it.

**D-013 — CSS Modules, no UI kit** · Accepted
- Context: one screen, a handful of components.
- Decision: CSS Modules with a few custom properties for colours/spacing.

**D-014 — Modern Web Guidance is the reference for platform code** · Accepted
- Context: HTML, CSS and browser-API patterns change faster than habits.
- Decision: before implementing UI, consult Google Chrome's Modern Web
  Guidance (`npx -y modern-web-guidance@latest search|retrieve`) and follow
  it unless a decision here says otherwise. `legacy-scan` runs before a task
  is marked done.
- Consequences: guides consulted are noted in the `PROGRESS.md` log.
  Deviations get their own entry.

**D-015 — Dialog opened with `showModal()`, not invoker commands** · Accepted
- Context: the guidance prefers `command="show-modal"` / `commandfor`, but
  the modal is driven by React state (`logFilmId`) and invoker commands only
  became Baseline in December 2025.
- Decision: call `showModal()` in an effect and sync state back in the
  dialog's `close` event. The guidance allows `showModal()` when opening
  from script.
- Consequences: no polyfill; works in every browser with `<dialog>`.

**D-016 — No light dismiss on the viewing log** · Accepted
- Context: `closedby="any"` is not supported in Safari and needs a scripted
  fallback; the modal contains a form whose input a stray backdrop click
  would discard.
- Decision: keep the modal default (Esc, back gesture, close button).

**D-017 — Native constraint validation with `:user-invalid`** · Accepted
- Context: date and time are required; errors should not show before the
  user interacts.
- Decision: `required` attributes, no `novalidate`, styling via
  `:user-invalid`, `aria-invalid` / `aria-describedby` synced to that state.
  Supersedes the "validate on submit, link with `aria-describedby`" wording
  originally in `DESIGN.md`.
- Consequences: no form library, no `touched` state in React.

**D-018 — Container query for the cast section, `dvh` for the shell** · Accepted
- Context: the cast/character area should adapt to its own width; `100vh`
  breaks under mobile browser chrome.
- Decision: `@container` for the cast section, a media query only for the
  page-level shell, `100dvh` for full height.

**D-019 — Light and dark colour schemes** · Accepted
- Context: the guidance asks for `color-scheme` on `:root`; the Vite
  template already ships both schemes.
- Decision: `color-scheme: light dark` with `light-dark()` tokens. No theme
  toggle.

**D-020 — Light dismiss on the viewing log** · Accepted · supersedes D-016
- Context: requested behaviour: clicking or tapping outside the modal
  closes it.
- Decision: `closedby="any"` on the `<dialog>`, plus the scripted fallback
  from the `dialog` guide where `closedBy` is unsupported (Safari). A
  visible close button and Esc remain. An unsaved draft in the add form is
  discarded on close; there is no confirmation step.
- Consequences: one small feature-detected fallback in `ui/Modal`. Losing
  three short fields on a stray click is accepted; a dirty-form guard is in
  the backlog.

**D-021 — WCAG 2.2 Level AA is the accessibility target** · Accepted
- Context: accessibility is an explicit requirement.
- Decision: conform to WCAG 2.2 AA. The applicable success criteria and
  how each is met are listed in `DESIGN.md` § Accessibility. Checks are
  automated (`eslint-plugin-jsx-a11y`, `axe-core` in tests, Lighthouse or
  axe DevTools) and manual (keyboard, screen reader, zoom/reflow, contrast).
- Consequences: two dev dependencies (`eslint-plugin-jsx-a11y`, `axe-core`).
  A task is not done until its accessibility checks pass. Conformance is
  claimed in the README only for what was actually tested, with the test
  setup named.

**D-022 — Skip link** · Accepted
- Context: keyboard users would tab through every film (two buttons each)
  before reaching the main zone (WCAG 2.4.1).
- Decision: one skip link to the main heading, visible on focus.

**D-023 — The URL is the source of truth for view state** · Accepted · partly supersedes D-002
- Context: every view the user opens must be shareable and look the same
  for whoever opens the link.
- Decision: selected film, selected character and the open viewing log live
  in query parameters (`?film=&character=&log=`). React holds no selection
  state; `useUrlState` reads the address bar with `useSyncExternalStore` and
  exposes the navigation actions. No router library.
- Consequences: reload, Back/Forward and sharing work by construction.
  Query parameters need no host rewrite rules. D-002's "state in `App`" now
  applies only to the viewing log data.

**D-024 — Film and cast entries are links** · Accepted
- Context: they now lead to a URL.
- Decision: render them as `<a href>` with in-app handling for plain left
  clicks only; `aria-current` marks the selected one. The viewing log
  trigger stays a `<button>` because it opens a dialog.
- Consequences: open-in-new-tab and copy-link work; replaces the earlier
  button + `aria-pressed` plan for the cast list.

**D-025 — History behaviour** · Accepted
- Context: Back should undo the last view change, including closing the
  modal, without ever leaving the app unexpectedly.
- Decision: selections and opening the log push entries; closing the log
  goes back if this session pushed the entry, otherwise replaces the URL.
- Consequences: no duplicate entries; a shared modal link closes cleanly.

**D-026 — Viewings are not part of the URL** · Accepted · *Assumption*
- Context: the brief keeps created data in client memory with no backend,
  so there is nowhere shared to load another user's viewings from.
- Decision: a shared link reproduces the view (film, character, open log)
  but not the sender's viewing entries.
- Consequences: documented in `GOAL.md` F5 and the README. Encoding
  viewings in the URL or adding a backend would lift the limit; both are
  out of scope for now.

**D-027 — Invalid URL values show a message, the URL is not rewritten** · Accepted
- Context: shared links can be mistyped or point at data that does not exist.
- Decision: unknown `film` or `character` render a not-found message in
  place; only an unknown `log` is removed from the URL.

**D-028 — `eslint-plugin-jsx-a11y` under ESLint 10 via an npm override** · Accepted
- Context: D-021 requires `jsx-a11y`. Its latest release (6.10.2,
  October 2024) declares peer support up to ESLint 9; the scaffold uses
  ESLint 10, so a plain install fails with `ERESOLVE`.
- Decision: keep ESLint 10 and add `overrides` in `package.json` so the
  plugin accepts the project's ESLint. Verified on 2026-11-12 that the
  recommended rules report under ESLint 10 (probe file with a missing
  `alt`, a clickable `<div>` and an `<a>` without `href`: all four
  violations reported). Rejected: downgrading ESLint (loses the current
  `react-hooks` 7 setup for a dev-only plugin) and the unofficial fork
  `eslint-plugin-jsx-a11y-x` (less known, harder to justify).
- Consequences: dev-only; no runtime impact. Remove the override once
  the plugin publishes an ESLint 10 peer range.

**D-029 — Colour palette and app name** · Accepted
- Context: D-021 needs text ≥ 4.5:1 and borders/focus ≥ 3:1 in both
  colour schemes; the page title needs an app name.
- Decision: a neutral grey palette with one blue accent, defined as raw
  light/dark custom properties in `src/index.css`, combined with
  `light-dark()` and a `prefers-color-scheme` fallback (`light-dark()` is
  only newly available Baseline). Every pair (text, muted, accent on bg,
  surface and selected; border on the same) was computed with the WCAG
  formula on 2026-11-12; the tightest is 3.25:1 (light border on
  selected). App name: "Star Wars Films".
- Consequences: any new colour pair must be checked the same way before use.


**D-030 — Cast loads all-or-nothing** · Accepted
- Context: the brief requires "the whole casting of the film"; one failed
  character request currently fails the list.
- Decision: keep `Promise.all`. Never render a partial cast. Retry
  re-fetches only the failed requests because successful ones stay cached
  (`fetchJson` caches each promise and evicts only failed entries).
- Consequences: simplest code; a transient failure costs one retry click.
