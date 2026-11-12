# DESIGN

How the application in `GOAL.md` is built. Keep this file in sync with the
code; if you change the structure, update it in the same change.

## Stack

| Concern  | Choice                                   |
| -------- | ---------------------------------------- |
| Build    | Vite                                     |
| UI       | React + TypeScript (strict)              |
| State    | URL (view state) + custom hooks          |
| Routing  | History API + `useSyncExternalStore`     |
| Data     | `fetch` + in-memory promise cache        |
| Styling  | CSS Modules, CSS Grid, CSS custom props  |
| Tests    | Vitest + React Testing Library           |
| Lint     | ESLint (typescript-eslint, react-hooks)  |

## Folder structure

```
src/
  api/
    swapi.ts               fetchJson + cache, getFilms/getPerson/getSpecies/getPlanet, personUrl
    types.ts               API types and view models
  hooks/
    useAsync.ts            generic loader with stale-result protection + retry
    useFilms.ts            films at startup
    useCast.ts             people of the selected film
    useCharacterDetails.ts robot / organic view model
    useViewingLog.ts       in-memory viewings per film
    useUrlState.ts         view state from the address bar + navigation actions
  utils/
    character.ts           isDroid, HUMAN_FALLBACK, formatValue
    url.ts                 ViewState, parse/serialise, toHref, personIdFromUrl, isPlainLeftClick
    title.ts               APP_NAME, pageTitle (document.title per view)
  components/
    FilmList/              side nav; per row: film link + log button
    FilmDetails/           heading, opening crawl, cast section
    CastList/
    CharacterCard/         RobotCard / OrganicCard by `details.kind`
    ViewingLogModal/       list + add form + delete
    ui/                    Announcer, Spinner, ErrorMessage (with retry), Modal
  test/setup.ts            jest-dom matchers, cleanup between tests
  index.css                colour tokens, base styles, .visually-hidden
  App.tsx                  shell (skip link, nav, main, announcer), title
  App.module.css
  main.tsx
```

Already implemented: everything under `api/`, `hooks/`, `utils/`, the app
shell, base styles and `ui/Announcer`.
To build: the remaining components, their styles and tests, README.

## Layout

```
+-----------+--------------------------------------------+
| Films     |  1 - The Phantom Menace                    |
|           | +----------------------------------------+ |
| [1 - ...] | | opening crawl                          | |
| [2 - ...] | +----------------------------------------+ |
|   ...     | +---------+------------------------------+ |
|           | | CAST    |  Obi-Wan Kenobi              | |
|           | | C-3PO   |  Label: info   Label: info   | |
|           | | R2-D2   |  Label: info   Label: info   | |
|           | +---------+------------------------------+ |
+-----------+--------------------------------------------+
```

- App shell: CSS Grid, `grid-template-columns: 16rem 1fr`, height `100dvh`
  (not `vh`), side nav and main zone scroll independently.
- Below ~720px the side nav stacks above the main zone (page-level media
  query).
- Cast section is a size container (`container-type: inline-size`): cast list
  and character panel sit side by side (`14rem 1fr`) when the container is
  wide enough and stack otherwise (`@container`, not a viewport query).
- `:root { color-scheme: light dark; }`; colour tokens use `light-dark()`.
- Opening crawl: `white-space: pre-line`, centred.
- Before a film is selected the main zone shows a short prompt.

## Component tree and props

```
App
├─ FilmList            films (AsyncResult<Film[]>), selectedFilmId, onSelect, onOpenLog,
│                      viewingCount(filmId) (added in T6)
├─ FilmDetails         film, headingId, cast (AsyncResult<Person[]>), selectedCharacterId,
│  │                   onSelectCharacter, characterPanel (ReactNode)
│  ├─ CastList         filmId, cast, selectedId, onSelect
│  └─ characterPanel   CharacterCard (name, details: AsyncResult<CharacterDetails>)
│                      / prompt / "Character not found in this film"
└─ ViewingLogModal     film (URL's log film or undefined), getViewings, onAdd, onRemove,
   │                   onClose, logButtonId
   └─ ui/Modal         open, labelledBy, onClose, fallbackFocusId
```

## State

There is no selection state in React. The address bar is the single source
of truth for what is on screen (D-023); `App` reads it with `useUrlState()`.

| State                | Where                         | Notes                                  |
| -------------------- | ----------------------------- | -------------------------------------- |
| selected film        | URL `film`                    | `episode_id`                           |
| selected character   | URL `character`               | SWAPI people id; dropped on film change |
| open viewing log     | URL `log`                     | `episode_id`; independent of `film`    |
| viewings             | `useViewingLog` (React state) | in memory, not in the URL (D-026)      |
| form draft           | the form's DOM                | not in the URL                         |

`App` owns the remote data (films, cast, character details) because the
page title and the announcer need it; components below it are
presentational. Remote data is derived from the URL:
`useFilms()` → `selectedFilm = films.find(episode_id === view.filmId)` →
`useCast(selectedFilm)` → `useCharacterDetails(personUrl(view.characterId))`.

## URL and navigation

```
/?film=<episode_id>&character=<people id>&log=<episode_id>
```

| URL                          | View                                             |
| ---------------------------- | ------------------------------------------------ |
| `/`                          | film list, prompt in the main zone               |
| `/?film=4`                   | A New Hope selected                              |
| `/?film=4&character=1`       | Luke Skywalker's details inside A New Hope       |
| `/?film=4&log=4`             | A New Hope selected, its viewing log open        |
| `/?log=2`                    | nothing selected, viewing log of episode 2 open  |

Rules:

- Query parameters, not paths, so the app works on any static host without
  rewrite rules. Canonical order: `film`, `character`, `log`. `character`
  without `film` is ignored. Parsing and serialising live in `utils/url.ts`.
- **Every view change goes through `useUrlState` actions.** Components never
  call `history.*` or read `location` themselves.
- History:
  - selecting a film or character **pushes** an entry; re-selecting the
    current one does nothing;
  - selecting a film drops `character`;
  - opening the log **pushes** an entry marked `{ logPushed: true }`;
  - closing the log (button, Esc, outside click) calls `history.back()` when
    the current entry carries that marker, otherwise **replaces** the URL
    without `log` (page was loaded straight into the modal);
  - Back/Forward (`popstate`) only re-reads the URL; the UI follows.
- The modal follows the URL in both directions: `view.logFilmId` set →
  `showModal()`; unset → `dialog.close()`. The dialog's `close` event calls
  `closeLog()`, which is a no-op when the URL has already changed.
- Film and cast entries are `<a href={toHref(...)}>`. `onClick` calls the
  action and `preventDefault()` only when `isPlainLeftClick(event)`;
  modified clicks and middle clicks are left to the browser (D-024).
- The log trigger stays a `<button>`: it opens a dialog, it does not go
  somewhere.
- Deep links: views render only from data, so a shared URL waits for the
  films request, then selects. The modal opens once its film is known.
- Invalid values:
  - `film` not in the loaded films → "Film not found" in the main zone with
    a link back to `/`;
  - `character` not in the selected film's cast → "Character not found in
    this film" in the character panel;
  - `log` not in the loaded films → replace the URL without `log`.
  The URL is otherwise left as the user typed it.
- `document.title` follows the view (WCAG 2.4.2):
  `<app name>` · `<film title> – <app name>` ·
  `<character> – <film title> – <app name>` ·
  `Viewing log: <film title> – <app name>`.
- Focus and announcements on navigation:
  - in-app selection keeps focus on the activated link and announces
    "Showing …" through `ui/Announcer`;
  - Back/Forward do not move focus; the same announcement is made;
  - when the modal closes and focus would fall to `<body>` (deep link, no
    invoker), move focus to that film's log button.
- Scroll: leave scroll position alone on selection; the main zone scrolls
  to top when the film changes.

## Data flow

1. Startup: `GET /films/` → sort by `episode_id` → side nav.
2. Film selected: `GET` each URL in `film.characters` in parallel → cast list.
3. Character selected: `GET person` (cached) → `GET` each `species` URL →
   - species named `Droid` → robot view model (`birth_year` shown as
     manufacturing year); no homeworld request.
   - otherwise → `GET homeworld` → organic view model; empty `species`
     falls back to Human / mammal.

### API layer rules

- All requests go through `fetchJson`, which caches the **promise** per URL
  (de-duplicates concurrent calls) and evicts failed entries.
- `http://` URLs in payloads are upgraded to `https://`.
- Components never call `fetch` or `api/swapi` directly; they use hooks.
- Stale results are dropped in `useAsync` via a `cancelled` flag. Requests
  are not aborted, because a cached promise may be shared by several
  consumers.

## Viewing log modal

Follows the Modern Web Guidance `dialog`, `prevent-page-scroll-under-modal-dialog`,
`required-field-feedback` and `accessible-error-announcement` guides.

- Native `<dialog>` opened with `showModal()` from an effect driven by
  `logFilmId` (see D-015). The platform provides the inert page, focus
  containment, top layer, `::backdrop`, Esc / back-gesture dismissal and
  focus return to the invoker. Do **not** add `role="dialog"`, `aria-modal`,
  a focus trap, an Esc handler or focus-return code.
- Named with `aria-labelledby` pointing at its heading
  (`Viewing log — <film title>`). `autofocus` on the date field.
- Closing: three ways, all ending in the dialog's `close` event, where React
  state is synced (`onClose` → `logFilmId = null`). Never toggle the `open`
  attribute.
  1. A visible close button inside `<form method="dialog">` (always present,
     so pointer-only and keyboard-only users both have a control).
  2. Esc / platform back gesture (modal default).
  3. Light dismiss: `closedby="any"` on the `<dialog>` (D-020). Safari does
     not support `closedby`, so `ui/Modal` adds the scripted fallback from
     the `dialog` guide when `'closedBy' in HTMLDialogElement.prototype` is
     false: close only when both `pointerdown` and `pointerup` land outside
     the dialog's bounding rect (a text-selection drag that ends on the
     backdrop must not dismiss). If JSX types reject `closedby`, set it
     with `setAttribute` in the ref callback.
- An unsaved draft in the add form is discarded on close (D-020).
- The modal keeps rendering the last film while it closes: the browser only
  returns focus to the opener if focus is still inside the dialog at close.
- Focus fallback: if, at the `close` event, focus is on `<body>` or still
  inside the closed dialog (deep link without opener; light dismiss, where
  the outside press first focuses the dialog itself), focus moves to the
  film's log button (D-032).
- `autofocus` on the date field is written as a real attribute through a ref,
  because React's `autoFocus` never reaches the DOM (D-032).
- Status texts name the viewing ("Viewing from <when> added"), so two adds
  in a row both change the live region and are announced.
- Scroll lock, in CSS only:
  `dialog:modal { overscroll-behavior: contain; }` and
  `dialog::backdrop { overflow: hidden; overscroll-behavior: contain; }`.
  Never `overflow: hidden` on `html`/`body`. Layout styles are scoped to
  `dialog[open]` so the closed state is not overridden.
- List: newest first, each row shows date, time, description and a delete
  button with an accessible name (`Delete viewing from <date> <time>`).
  Empty state: "No viewings recorded yet."
- Form: `<input type="date" required>`, `<input type="time" required>`,
  `<textarea>` (optional, `maxlength="500"`), each with a `<label>`.
  Native constraint validation stays on (no `novalidate`).
  - Error styling and message visibility use `:user-invalid`, so nothing
    looks invalid before the user interacts or submits.
  - Error text is always visible text (worded as an error, e.g.
    "Date is required."), never colour alone.
  - `aria-invalid` is `"false"` until the field matches `:user-invalid`, then
    `"true"`; the error id is added to `aria-describedby` only while the
    field is invalid (small sync handler on `blur`/`change`/`input`/`invalid`).
  - After a successful add: reset the form, keep the modal open.
- The log button in the film list shows the number of viewings when > 0.

## Accessibility (WCAG 2.2 Level AA)

Target: conformance to WCAG 2.2 at Level AA (D-021). Conformance is the
floor, not the goal: the app must be comfortably usable with a keyboard and
with a screen reader. Implementation patterns come from the Modern Web
Guidance `accessibility` guide.

### Structure and semantics

- `<html lang="en">`; `document.title` describes the current view and
  updates on every navigation (3.1.1, 2.4.2).
- Landmarks: `<nav aria-label="Films">` and exactly one `<main id="main">`.
  One `<h1>`; `<h2>` for "Films", "Opening crawl", "Cast", character name;
  no skipped levels (1.3.1, 2.4.6).
- Skip link "Skip to main content" as the first focusable element, targeting
  the main heading (worded generically because the main zone is not always
  film details: empty prompt, not-found) (`tabindex="-1"`), visible on focus (2.4.1, D-022).
- Lists are real lists: films, cast and viewings as `<ul>`/`<ol>`; character
  label/value pairs as `<dl>` (1.3.1).
- DOM order equals visual order; no positive `tabindex` (1.3.2, 2.4.3).
- Native elements first: `<a href>` for navigation, `<button>` for actions,
  never a clickable `<div>`. ARIA only where HTML has no equivalent (4.1.2).

### Names, states and status

- Every control has an accessible name that contains its visible text
  (2.5.3). Icon-only buttons get visually hidden text, e.g.
  "Viewing log for The Phantom Menace"; decorative icons are
  `aria-hidden="true"` (1.1.1).
- Film and cast entries are links, because they navigate to a URL.
  Selected film: `aria-current="page"`. Selected cast entry:
  `aria-current="true"`. Both also have a non-colour visual cue (1.4.1).
- The viewing log trigger is a `<button>` with `aria-haspopup="dialog"`.
- Robot mark: icon plus visible text "Artificial being" (1.1.1, 1.4.1).
- Loading: native indeterminate `<progress aria-label="Loading …">` inside a
  region with `aria-busy`; no "Loading" live-region announcements.
- Request failures: `role="alert"` with a retry button (4.1.3).
- Status messages (4.1.3) go through `ui/Announcer`, a single polite live
  region in `App`: "Showing <film title>", "Showing details for <name>".
- While the modal is open the page is inert, so the page-level region is
  unreachable. The modal therefore owns its own polite region for
  "Viewing added" / "Viewing deleted".

### Keyboard and focus

- Everything works with Tab, Shift+Tab, Enter, Space and Esc; no keyboard
  trap outside the modal, and the modal's containment is the platform's
  (2.1.1, 2.1.2).
- Selecting happens on activation, never on focus (3.2.1, 3.2.2).
- Focus is never lost (2.4.3): after deleting a viewing, move focus to the
  next delete button, else the previous one, else the date field. After the
  modal closes the browser returns focus to the log button; verify, do not
  re-implement.
- Focus indicator: `:focus-visible` with a 2px+ `outline` and offset,
  contrast ≥ 3:1 against adjacent colours (2.4.7, 1.4.11).
- Focused elements are never hidden behind sticky or scrolling chrome; use
  `scroll-padding` where a region scrolls under a sticky header (2.4.11).
- Targets ≥ 24×24 CSS px via `min-block-size` / `min-inline-size` or padding,
  larger under `@media (pointer: coarse)` (2.5.8).

### Forms (viewing log)

- Each field has a visible `<label for>`; required fields say so in text
  ("Date (required)"), not only with an asterisk or colour (3.3.2, 1.3.1).
- Errors are identified in text next to the field and say how to fix them
  ("Enter the date you watched the film.") (3.3.1, 3.3.3).
- `aria-invalid` and `aria-describedby` follow the `:user-invalid` state;
  on a failed submit focus lands on the first invalid field (native
  validation does this).
- No placeholder-as-label, no auto-submit on change.

### Visual presentation

- Text contrast ≥ 4.5:1 (≥ 3:1 for large text); UI component and graphic
  contrast ≥ 3:1, in **both** colour schemes (1.4.3, 1.4.11).
- Sizes in `rem`; text resizes to 200% without loss (1.4.4).
- Reflow: at 320 CSS px wide (400% zoom at 1280px) there is no horizontal
  scrolling and nothing is clipped (1.4.10).
- Layout survives the WCAG text-spacing overrides: no fixed heights on text
  containers (1.4.12).
- No information appears only on hover; no custom tooltips (1.4.13).
- Works in both orientations (1.3.4).
- Motion: spinner and any transitions honour `prefers-reduced-motion`;
  nothing flashes (2.3.1).
- Forced-colors mode: borders/outlines, not background colour alone, carry
  selection and focus.

### Security note

- API text (titles, opening crawl, names) is rendered as text; never
  `dangerouslySetInnerHTML`.

### How conformance is checked

Automated checks find only a part of WCAG issues; both columns are required.

| Automated | Manual |
| --------- | ------ |
| `eslint-plugin-jsx-a11y` (recommended) in `npm run lint` | Keyboard-only run of every flow |
| `axe-core` assertion in each component test and the `App` smoke test (zero violations; `color-contrast` disabled in jsdom) | Screen reader run: VoiceOver + Safari, and one of NVDA + Firefox / TalkBack + Chrome if available |
| Lighthouse accessibility audit or axe DevTools on the running app, light and dark | 200% zoom, 320px reflow, text-spacing override |
| `npm run guidance:scan` | Contrast of every colour pair, both schemes; forced-colors; reduced motion |

## Testing

Minimum set:

- `utils/character`: `isDroid`, `formatValue`.
- `loadCharacterDetails`: droid, non-human organic, human fallback
  (mock `api/swapi`).
- `api/swapi`: caching, concurrent de-duplication, eviction on failure,
  film sorting (mock `fetch`).
- `useViewingLog`: add, add several, remove, isolation between films.
- `ViewingLogModal`: required validation, add, delete.
- `App` smoke test: films render, selecting a film shows crawl and cast,
  changing film clears the character panel.
- `utils/url`: parse/serialise round trip, malformed values, `character`
  without `film`, `personIdFromUrl`, `isPlainLeftClick`.
- `useUrlState`: select pushes, re-select does not, film change drops
  `character`, open/close log (pushed entry → back; deep link → replace),
  `popstate` updates the view.
- `App` deep links: `/?film=4&character=1` and `/?film=4&log=4` render the
  right view after films load; invalid `film` and `character` show the
  not-found messages; title matches the view.
- Accessibility: every component test and the smoke test end with an
  `axe-core` run that must report zero violations (see
  § Accessibility → How conformance is checked).
- `ViewingLogModal`: focus moves correctly after delete; status region text
  updates on add and delete.

## README outline

Setup and scripts · Tech choices · Assumptions (copy from `DECISIONS.md`
entries marked *Assumption*) · What I would do with more time.
