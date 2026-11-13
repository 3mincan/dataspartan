# GOAL

Build a simple React web application that shows information about the Star Wars
universe, using the public REST API at https://swapi.dev/.

This file is the source of truth for **what** to build. `DESIGN.md` covers
**how**, `DECISIONS.md` records **why**.

## Constraints

- Framework: React (TypeScript).
- Data source: https://swapi.dev/ only. No hardcoded film or character data.
- No backend, no database. Data created in the app (viewing log) lives in
  client memory and may be lost on reload.
- The app may be initialised with sample data where appropriate.
- Unclear points: make a reasonable assumption and document it briefly in
  `README.md` (and in `DECISIONS.md`).

## Functional requirements

### F1 — Film list (side navigation)

- [x] Films are fetched at application startup.
- [x] Films are listed on the left side of the app as a side navigation.
- [x] Each entry shows episode number and title, e.g. `1 - The Phantom Menace`.
- [x] Clicking a film selects it; the selected film is visually highlighted.

### F2 — Film details (main zone)

- [x] Shows the film name as a heading (`<episode> - <title>`).
- [x] Shows the opening crawl text.
- [x] Shows the whole cast of the film as a list.

### F3 — Character details

- [x] Cast entries are clickable; the selected entry is highlighted.
- [x] Clicking shows a small information panel next to the cast list.
- [x] Robot characters show:
  - [x] a visual mark identifying them as an artificial being
  - [x] height
  - [x] mass
  - [x] manufacturing year
- [x] Non-robot characters show:
  - [x] species name
  - [x] species classification
  - [x] homeworld name
  - [x] height
  - [x] birth year

### F4 — Viewing log

- [x] Each film in the film list has an additional button that opens its
      viewing log.
- [x] The viewing log is a popup modal, scoped to that film.
- [x] A viewing consists of:
  - [x] date (required)
  - [x] time (required)
  - [x] description (optional free text)
- [x] Several viewings can be added for the same film.
- [x] Existing viewings for the film are listed when the modal opens.
- [x] A viewing can be deleted.
- [x] The modal closes with its close button, with Esc, and by clicking or
      tapping outside it.

### F5 — Shareable URLs

- [x] Everything the user opens is reflected in the address bar: the
      selected film, the selected character and an open viewing log modal.
- [x] Opening a copied URL in another browser or by another person shows
      the same view: same film, same character, same modal open.
- [x] Browser Back and Forward step through the views; reload keeps the view.
- [x] Film and cast entries are real links (open in new tab, copy link
      address work).
- [x] The page title reflects the current view.
- [x] Unknown or invalid URL values show a clear "not found" message instead
      of a broken or empty screen.
- [x] Limit: viewings themselves stay in the memory of the browser that
      recorded them (see Constraints). A shared link opens the same film's
      viewing log, but not the sender's entries (D-026).

## Non-functional requirements

- [x] Loading, error (with retry) and empty states for every remote resource.
- [x] No stale data: switching film or character quickly never shows the
      result of a superseded request.
- [ ] Accessibility: the application conforms to **WCAG 2.2 Level AA**.
      Every applicable success criterion is listed in `DESIGN.md`
      § Accessibility and verified in `PROGRESS.md` T7 with automated checks
      (lint, axe) **and** manual checks (keyboard, screen reader, zoom and
      reflow, contrast in both colour schemes).
- [x] Strict TypeScript, no `any`, no lint errors, no console errors.
- [x] Unit tests for the logic listed in `DESIGN.md` § Testing.
- [x] `README.md` with setup, scripts, assumptions and possible improvements.

## Out of scope

- Persistence (localStorage, backend), authentication, a router library,
  i18n, global state libraries, editing an existing viewing, sharing
  viewing data between users.

## Definition of done

Every checkbox above is ticked, `npm run lint`, `npm run typecheck`,
`npm test`, `npm run build` and `npm run guidance:scan` pass, the WCAG audit
in `PROGRESS.md` T7 is complete, and the README is up to date.
