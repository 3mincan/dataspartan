# PROGRESS

Single place for task tracking. Update it in the same commit as the work.

Rules:

- One task `In progress` at a time. Finish or park it before starting another.
- Before a UI task, search and retrieve the Modern Web Guidance guides for it
  (`AGENTS.md` § Modern Web Guidance) and list the guide ids in the log entry.
- Mark a task done only after `npm run lint && npm run typecheck && npm test
  && npm run build && npm run guidance:scan` pass and the behaviour was
  checked in the browser.
- Tasks follow `DESIGN.md`; requirements live in `GOAL.md`. If a task needs a
  new assumption, record it in `DECISIONS.md` and reference the ID here.
- Found something out of scope for the current task? Add it to **Backlog**
  instead of fixing it on the side.
- Add a line to **Log** at the end of every working session.

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked

## Current

- **In progress:** T3 — Film list
- **Next up:** T4 — Film details and cast
- **Blocked:** —

## Tasks

### T1 — Foundation
- [x] Vite + React + TypeScript scaffold (ESLint)
- [x] API layer: `src/api/swapi.ts`, `src/api/types.ts`
- [x] Hooks: `useAsync`, `useFilms`, `useCast`, `useCharacterDetails`, `useViewingLog`
- [x] Utils: `src/utils/character.ts`
- [x] URL state: `src/utils/url.ts`, `src/hooks/useUrlState.ts`, `personUrl` in `src/api/swapi.ts`
- [x] Fix `react-hooks/set-state-in-effect` in `useAsync`
- [x] `lint`, `typecheck`, `dev` all clean on the scaffold
- [x] Modern Web Guidance review of `src/api`, `src/hooks`, `src/utils` (see Review)
- [x] Install the Modern Web Guidance skill; add the `guidance:scan` script
- [x] Vitest + Testing Library configured (`test` block in `vite.config.ts`, `src/test/setup.ts`, `test` script)
- [x] Accessibility tooling: `eslint-plugin-jsx-a11y` (recommended) in ESLint, `axe-core` installed (D-021, D-028)
- [x] Initial commit and push to `origin`

### T2 — App shell and base styles
Guides: `html`, `css-layout`, `responsive-design`, `size-aware-styling`, `dark-mode`, `accessibility`
- [x] Run `guidance:scan` on the Vite template files; note findings
- [x] Remove Vite template content (`App.css`, logos, counter)
- [x] `index.html`: `lang="en"`, meaningful `<title>`, `<meta name="color-scheme" content="light dark">`
- [x] Skip link to the main heading, visible on focus (D-022)
- [x] `ui/Announcer`: single polite live region in `App`
- [x] `.visually-hidden` utility
- [x] Tokens: `color-scheme: light dark` on `:root`, colours via `light-dark()`, spacing scale;
      every text pair ≥ 4.5:1 and every UI/focus pair ≥ 3:1 in both schemes
- [x] Base styles: `:focus-visible` outline, minimum 24×24 px targets, `rem`-based sizes
- [x] Shell: Grid, `100dvh`, labelled `<nav>` + single `<main>`, independent scrolling
- [x] Stack side nav above main below ~720px; no horizontal scroll at 320 CSS px
- [x] Empty main zone prompt when no film is selected
- [x] `App` reads the view from `useUrlState()`; no selection state in React (D-023)
- [x] `document.title` follows the view
- [x] Tests: `utils/url`, `useUrlState`

### T3 — Film list (GOAL F1)
Guides: `accessibility`, `spinner`, `single-line-overflow`, `scrollability-affordance-hints`
- [ ] `ui/Spinner` on indeterminate `<progress aria-label>`, reduced-motion aware
- [ ] `ui/ErrorMessage` with `role="alert"` and a retry button
- [ ] `FilmList` with `useFilms`: loading, error + retry
- [ ] Entries as links (`<a href>`, `<episode> - <title>`); plain left click handled in-app (D-024)
- [ ] Selected state with `aria-current="page"` and a non-colour cue
- [ ] "Film not found" state for an unknown `film` value (D-027)
- [ ] Viewing log button per row: sibling of the film link, `aria-haspopup="dialog"`,
      accessible name includes the film title
- [ ] Announce "Showing <film title>" on selection
- [ ] Component test with `axe-core` run

### T4 — Film details and cast (GOAL F2)
Guides: `css-layout`, `size-aware-styling`, `accessibility`
- [ ] `FilmDetails`: `<h1>` heading, opening crawl (`pre-line`, rendered as text)
- [ ] `CastList` with `useCast`: loading, error + retry; entries as links with
      `aria-current="true"` on the selected one
- [ ] Cast section as a size container; side by side / stacked via `@container`
- [ ] Selected character resets when the film changes
- [ ] Announce "Showing details for <name>" on selection
- [ ] Component test with `axe-core` run

### T5 — Character details (GOAL F3)
Guides: `accessibility`, `icons`
- [ ] `CharacterCard` with `useCharacterDetails`: loading, error + retry
- [ ] Robot card: artificial-being mark (icon + visible text), height, mass, manufacturing year
- [ ] Organic card: species name, classification, homeworld, height, birth year
- [ ] Label/value pairs as a `<dl>`
- [ ] Unknown values rendered via `formatValue`
- [ ] "Character not found in this film" state for an unknown `character` value (D-027)
- [ ] Tests: `loadCharacterDetails` (droid, non-human, human fallback); card test with `axe-core` run

### T6 — Viewing log (GOAL F4)
Guides: `dialog`, `prevent-page-scroll-under-modal-dialog`, `platform-controls-dismiss-dialog`, `light-dismiss-a-dialog`,
`forms`, `required-field-feedback`, `validate-input-after-interaction`, `accessible-error-announcement`
- [ ] `ui/Modal`: native `<dialog>`, `showModal()` from an effect, `aria-labelledby`,
      state synced on the `close` event (D-015)
- [ ] Modal follows the URL both ways: `log` set → open, unset → close; `close` event → `closeLog()` (D-025)
- [ ] Deep link `/?log=N`: opens after films load; on close, focus moves to that film's log button
- [ ] Unknown `log` value is removed from the URL (D-027)
- [ ] No `role="dialog"`, `aria-modal`, focus trap, Esc handler or focus-return code
- [ ] Visible close button in `<form method="dialog">`
- [ ] Light dismiss: `closedby="any"` + feature-detected pointer fallback for Safari (D-020)
- [ ] Scroll lock CSS on `dialog:modal` and `::backdrop`; layout scoped to `dialog[open]`
- [ ] `ViewingLogModal`: list (newest first), empty state, delete with a descriptive accessible name
- [ ] Add form: visible labels, "(required)" in the label text, date + time `required`,
      optional description (`maxlength`), `autofocus` on date
- [ ] Errors via `:user-invalid` with visible text; `aria-invalid` / `aria-describedby` synced (D-017)
- [ ] Form resets after add; modal stays open
- [ ] Polite status region inside the modal: "Viewing added" / "Viewing deleted"
- [ ] Focus after delete: next delete button, else previous, else date field
- [ ] Viewing count on the log button
- [ ] Verify by hand in Chrome and Safari: close button, Esc and outside click all close;
      focus returns to the log button; page does not scroll behind; drag-select ending on the
      backdrop does not close
- [ ] Tests: `useViewingLog`, modal validation / add / delete / focus after delete
      (stub `showModal` in jsdom), `axe-core` run

### T7 — Quality pass and WCAG 2.2 AA audit
Guides: `accessibility`, `performance`, `security`, `respect-os-text-scale`

Tests and robustness
- [ ] Tests: `api/swapi` (cache, de-duplication, eviction, sorting), `utils/character`
- [ ] `App` smoke test (select film → crawl + cast; change film clears character) with `axe-core` run
- [ ] No console errors or warnings; rapid film/character switching shows no stale data
- [ ] `guidance:scan` reports 0 findings

Shareable URLs (GOAL F5)
- [ ] Each of these opens the same view in a new tab and in a second browser:
      `/?film=4`, `/?film=4&character=1`, `/?film=4&log=4`, `/?log=2`
- [ ] Back and Forward step through film → character → modal open → modal closed with no
      duplicate or missing entries
- [ ] Reload keeps the view; closing a deep-linked modal does not leave the app
- [ ] Ctrl/Cmd-click and middle-click on film and cast links open a new tab
- [ ] Invalid `film`, `character` and `log` values behave as specified
- [ ] `App` deep-link tests pass

Automated accessibility
- [ ] `npm run lint` clean with `jsx-a11y` recommended, no disabled rules
- [ ] Every component test has a passing `axe-core` assertion
- [ ] Lighthouse accessibility audit or axe DevTools on the running app: 0 issues, light scheme
- [ ] Same in dark scheme
- [ ] Same with the modal open

Manual accessibility (record browser / assistive tech / date in the Log)
- [ ] Keyboard only: skip link, film list, cast list, character panel, modal add / delete / close
- [ ] Focus always visible, never obscured, never lost to `<body>` (2.4.7, 2.4.11, 2.4.3)
- [ ] Screen reader (VoiceOver + Safari): landmarks, headings, names, states, status messages,
      errors, modal title announced on open
- [ ] Second screen reader/browser pair if available (NVDA + Firefox or TalkBack + Chrome)
- [ ] Contrast of every colour pair, both schemes: text ≥ 4.5:1, UI and focus ≥ 3:1 (1.4.3, 1.4.11)
- [ ] 200% zoom: nothing clipped or overlapping (1.4.4)
- [ ] 320 CSS px width: no horizontal scroll (1.4.10)
- [ ] Text-spacing override: no clipped or overlapping text (1.4.12)
- [ ] Increased OS text size respected
- [ ] `prefers-reduced-motion`: no spinning or transitions beyond a fade
- [ ] Forced-colors mode: selection, focus and errors still distinguishable
- [ ] Touch: targets ≥ 24×24 CSS px; modal closes by tapping outside (2.5.8)
- [ ] Portrait and landscape both usable (1.3.4)
- [ ] Walk the criteria list in `DESIGN.md` § Accessibility; note any gap in Backlog or fix it

### T8 — Delivery
- [ ] `README.md`: setup, scripts, tech choices, assumptions, improvements
- [ ] README: URL scheme and the viewing-data sharing limit (D-026)
- [ ] README accessibility section: WCAG 2.2 AA target, what was tested and with what, known gaps
- [ ] All `GOAL.md` boxes ticked after verifying each in the running app
- [ ] Final `lint`, `typecheck`, `test`, `build`, `guidance:scan`
- [ ] Clean commit history; nothing unintended committed

## Review

### 2026-11-12 — Modern Web Guidance review of existing code

Scope: `src/api`, `src/hooks`, `src/utils` as authored outside the repo
(the GitHub remote was empty, so the Vite template files were not reviewed;
that is the first item of T2). CLI version 1.0.0.

- `legacy-scan`: 0 findings from 33 qualified guides.
- `src/api/swapi.ts`: every request is user-critical, so no `fetch`
  `priority` hint applies (`deprioritize-background-fetches`). No change.
- Hooks and utils contain no markup, styles or DOM APIs; nothing in the
  guidance applies to them directly. No change.
- The planned UI did conflict with the guidance in four places. These were
  fixed in `DESIGN.md` and recorded as decisions before any UI was written:
  1. Dialog: dropped manual focus return and `role="dialog"`; native
     `<dialog>` already provides both (`dialog`). → D-015, D-016
  2. Form errors: `:user-invalid` with ARIA synced to it, instead of
     submit-time validation with a static `aria-describedby`
     (`required-field-feedback`, `accessible-error-announcement`). → D-017
  3. Layout: `dvh` and a container query for the cast section instead of
     `vh` and viewport breakpoints only (`responsive-design`,
     `size-aware-styling`). → D-018
  4. Added: scroll lock CSS for the modal, `<progress>`-based spinner,
     `color-scheme`, `:focus-visible`, 24×24 px targets. → D-019 and
     `DESIGN.md` § Accessibility

## Backlog

Ideas and findings outside the current task. Not committed scope.

- Persist the viewing log (localStorage)
- Edit an existing viewing
- Opening crawl animation
- Unsaved-input guard when the modal is dismissed with a draft in the form
- Undo for a deleted viewing
- Share viewings through the URL or a backend (lifts D-026)
- "Copy link" button (`copy-button` guide)
- Entry/exit animation for the modal (`animate-to-from-top-layer`)

## Log

Newest first. One or two lines per session: what was done, what is next.

- 2026-11-12 — Owner checked T2 in the browser: nav stacks below 720px,
  no horizontal scroll at 320 px / 400% zoom, light scheme readable.
  T2 done. Next: T3.

- 2026-11-12 — T2: shell, tokens (D-029), skip link, Announcer, `pageTitle`;
  tests for `utils/url`, `useUrlState` (incl. Back/Forward and both
  close-log paths), `pageTitle`, Announcer, App shell (axe clean). Template
  scan: 0 findings. Checked in Chrome (dark scheme) against the real API:
  title follows `?film=4`, skip link visible on focus and focuses the h1,
  no console errors. Guides: `html`, `css-layout`, `responsive-design`,
  `dark-mode`, `accessibility`. Next: owner check of narrow layout, then T3.

- 2026-11-12 — Verified swapi.dev with curl: films list (`episode_id`,
  `opening_crawl`, `characters` URLs), people 1 (`species: []`) and 2
  (`species/2` = Droid, `classification: "artificial"`) match
  `api/types.ts`; CORS `*`. Added `jsx-a11y` (D-028), `axe-core`, Vitest
  config with a toolchain smoke test (`src/test/setup.test.ts`, remove once
  T2 tests exist). lint, typecheck, test, build, guidance:scan clean
  (0 findings). Owner chose to commit the agent docs. Initial commit
  pushed. Next: T2.

- 2026-11-12 — Scope change from the owner: every view is URL-addressable
  and shareable (GOAL F5, D-023–D-027). Added `utils/url.ts` and
  `hooks/useUrlState.ts` (type-check and lint clean; parser checked against
  sample URLs; history behaviour not yet exercised in a browser). Film and
  cast entries become links. Searched the guidance for URL/navigation
  guides: none specific; `accessibility` § Titles applies. Next: finish T1.
- 2026-11-12 — Scope change from the owner: modal closes on outside click
  (D-020, supersedes D-016) and WCAG 2.2 AA is the accessibility target
  (D-021). Added skip link (D-022). Updated `GOAL.md`, `DESIGN.md`
  § Viewing log modal and § Accessibility, `AGENTS.md`; expanded T1, T2–T6
  and turned T7 into a WCAG audit. Guides read: `dialog` (fallback section),
  `accessibility` (forms, live regions, dialogs, testing). Next: finish T1.
- 2026-11-12 — Adopted Modern Web Guidance (D-014). Reviewed existing code:
  0 findings. Aligned `DESIGN.md`, added D-014–D-019, expanded T2–T7.
  Guides read: `dialog`, `platform-controls-dismiss-dialog`,
  `light-dismiss-a-dialog`, `declarative-dialog-popover-control`,
  `required-field-feedback`, `validate-input-after-interaction`,
  `accessible-error-announcement`, `spinner`, `responsive-design`,
  `size-aware-styling`, `deprioritize-background-fetches`; parts of
  `accessibility`, `html`, `dark-mode`. Next: finish T1, then T2.
- 2026-11-12 — Scaffolded with Vite (react-ts, ESLint). Added API layer, hooks
  and utils. Reworked `useAsync` to derive idle/loading during render after a
  `set-state-in-effect` lint error. `lint`, `typecheck`, `dev` clean.
