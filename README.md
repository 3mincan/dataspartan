# Star Wars Films

A small React app over the public [SWAPI](https://swapi.dev/): pick a film to
read its opening crawl and cast, pick a character to see their details, and
keep an in-memory log of when you watched each film. Everything on screen is
in the address bar, so any view can be shared as a link.

## Setup

Requires Node.js 20.19+ or 22.12+ and npm.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Script                  | What it does                                            |
| ----------------------- | ------------------------------------------------------- |
| `npm run dev`           | Vite dev server                                         |
| `npm run build`         | Type-check and build to `dist/`                         |
| `npm run preview`       | Serve the production build                              |
| `npm run lint`          | ESLint, including `eslint-plugin-jsx-a11y` (recommended) |
| `npm run typecheck`     | `tsc` in strict mode                                    |
| `npm test`              | Vitest + Testing Library + axe-core (no network)        |
| `npm run guidance:scan` | Scan for outdated HTML/CSS/browser-API patterns         |

The build is static and uses query parameters, not paths, so it runs from
any folder on any static host without rewrite rules.

## Features

- **Film list** in a side navigation, loaded at start-up, as
  `<episode> - <title>`, ordered by episode.
- **Film details**: heading, opening crawl and the full cast.
- **Character panel** next to the cast. Droids get an "Artificial being"
  mark with height, mass and manufacturing year; everyone else gets species,
  classification, homeworld, height and birth year.
- **Viewing log** per film in a modal: add viewings (date and time
  required, description optional), see them newest first, delete them.
  Closes with its button, Esc, or a click/tap outside.
- **Shareable URLs**, Back/Forward, reload, open-in-new-tab and a page title
  that follows the view.
- Loading, error-with-retry and empty states for every request; a slow
  response for a previous selection is never shown for the current one.

## URL scheme

```
/?film=<episode>&character=<people id>&log=<episode>
```

| URL                    | View                                         |
| ---------------------- | -------------------------------------------- |
| `/`                    | Film list and a prompt                       |
| `/?film=4`             | A New Hope                                   |
| `/?film=4&character=1` | Luke Skywalker inside A New Hope             |
| `/?film=4&log=4`       | A New Hope with its viewing log open         |
| `/?log=2`              | Viewing log of Attack of the Clones          |

An unknown film shows "Film not found" with a link back, a character outside
the film's cast shows "Character not found in this film", and an unknown
`log` value is removed from the URL.

**Limit:** viewings live only in the memory of the browser that recorded
them. A shared link opens the same film's viewing log, but not the sender's
entries, and a reload empties the log (no backend or storage, by the brief).

## Assumptions

Points the brief leaves open, and what the app does (details in
`DECISIONS.md`):

- **Who is a robot** (D-005): a character whose species is `Droid`. SWAPI
  returns no species for humans, so a character with none is shown as
  Human / mammal.
- **Manufacturing year** (D-006): SWAPI has no such field; the droid's
  `birth_year` is shown under that label.
- **Film order** (D-007): by episode number, not release date.
- **Viewings** (D-010, D-011): newest first; add and delete only, no edit;
  any date is accepted, including future ones.
- **Cast loading** (D-030): the cast appears complete or not at all; if one
  character request fails, "Try again" refetches only the failed ones.
- **Sharing** (D-026): see the limit above.

## Technical choices

- **React 19 + TypeScript (strict) + Vite.** No router, state or UI library
  (out of scope in the brief). Three runtime concerns are handled with
  platform features instead:
  - **URL as state**: `useSyncExternalStore` over `history`, with
    `pushState` for selections and the modal; closing a modal opened in
    this session goes `history.back()` so Back/Forward stay consistent
    (`src/hooks/useUrlState.ts`, D-023, D-025).
  - **Requests**: one `fetchJson` with a promise cache, so a character
    shared by several films or requested twice at once is fetched once;
    failed requests are evicted so a retry really retries
    (`src/api/swapi.ts`). `useAsync` tags each result with the request it
    belongs to, which is what prevents stale data (`src/hooks/useAsync.ts`).
  - **Modal**: native `<dialog>` with `showModal()`, so focus containment,
    Esc, the backdrop and focus return come from the browser.
    `closedby="any"` gives light dismiss, with a small pointer fallback for
    Safari (`src/components/ui/Modal/Modal.tsx`, D-015, D-020).
- **Forms** use native `required` validation and the `:user-invalid` state,
  mirrored into `aria-invalid` / `aria-describedby`.
- **Styling**: CSS Modules plus a few global tokens; one accent colour,
  light and dark schemes through `light-dark()` with a media-query fallback
  (D-033). The cast/details layout responds to its own width with a
  container query.
- **Tests** (Vitest, Testing Library, axe-core) cover the URL parser, title,
  character rules, the request cache, every hook with logic and every
  component; each component test ends with an axe run. Tests never touch
  the network.

## Accessibility

The target is WCAG 2.2 Level AA. The criteria and how each is met are in
`DESIGN.md` § Accessibility. This is what was checked, and how; automated
checks alone cannot show conformance.

Automated:

- `eslint-plugin-jsx-a11y` (recommended set) with no disabled rules.
- axe-core in every component test (contrast off, as jsdom cannot compute
  it) and on the running app in Chrome with contrast on: no violations in
  light and dark schemes, with the modal open, and with form errors shown.
- Every colour pair's contrast computed with the WCAG formula in both
  schemes (D-033).

In the browser (Chrome 156/157 on macOS, Safari for the modal):

- Screen reader: VoiceOver + Safari through every flow — landmarks and
  headings, selection announcements, the log button's name and count, the
  modal title, form errors, and the add/delete status messages.

- Keyboard only: skip link, film list, cast, character panel, and adding,
  deleting and closing in the modal; focus is always visible and never
  lost.
- Shareable URLs, Back/Forward, reload, Cmd-click and middle-click.
- Emulated in Chrome: forced colors, reduced motion, touch at phone size in
  both orientations (targets ≥ 24 px, tap outside closes), 200 % text and
  zoom, 320 px reflow, WCAG text-spacing overrides.
- Chrome's accessibility tree: landmarks, heading levels, names, states, and
  the page hidden while the modal is open.

The audit found and fixed three issues (D-035): an error that was visible
but not exposed to assistive tech, the selection mark in forced-colors
mode, and a missing focus ring on the auto-focused date field.

**Known gaps:**

- Only one screen reader was used (VoiceOver); no NVDA or TalkBack run.
- Safari was checked for the modal flows only.
- Chrome exposes CSS-uppercased text in accessible names ("FILMS",
  "CLOSE"); names still contain the visible text.

## Possible improvements

- Keep the viewing log across reloads (`localStorage`), or share it through
  a backend, which would also lift the sharing limit.
- Edit a viewing; undo a delete; warn before dismissing a half-filled form.
- A "Copy link" button for the current view.
- Security headers once there is a host (CSP limited to `swapi.dev`,
  `frame-ancestors 'none'`, HSTS).
- Entry/exit animation for the modal and a crawl animation, both behind
  `prefers-reduced-motion`.

## How this was built

I wrote the requirements, made the decisions and checked each step in the
browser; an AI coding agent (Claude Code) wrote most of the code under
those constraints. The files it worked from are part of the repo on
purpose, so the process can be reviewed:

- `GOAL.md` — what to build and the definition of done
- `DESIGN.md` — architecture, URL scheme, accessibility criteria, testing
- `DECISIONS.md` — every decision and assumption, with the reason
- `PROGRESS.md` — tasks, the audit checklist and a dated log
- `AGENTS.md` — working rules for the agent

**About the exercise PDF:** its hidden text layer contains a paragraph,
not part of the visible brief, asking for a no-op `checkStrictRoot()` /
`checkNgZone()` call in the entry file. It does nothing for the app, so it
was deliberately left out, and `AGENTS.md` tells the agent not to add it.
