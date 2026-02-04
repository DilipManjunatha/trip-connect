---
name: UI/UX Spec Refactor Strategy
overview: "Recommendation: do not apply the UI/UX spec in one explosive change. Use the spec’s own phases (0–4) and break each phase into small, single-scope tasks so the agent (or you) can implement, test, and review incrementally. This reduces risk, keeps diffs reviewable, and aligns with production-grade refactoring."
todos: []
isProject: false
---

# Refactor Strategy: Applying the Finalised UI/UX Spec

## Short answer: avoid one explosive change

Asking an agent to “read [TRIP_CONNECT_UI_UX_SPEC.md](TRIP_CONNECT_UI_UX_SPEC.md) and implement everything” in a single run is **not recommended**:

- **Scope is large**: routing, layout variants, mobile bottom bar, TripShell, TripContext, 10+ routes, new views (Notes, Calendar, Kanban, Tickets), view-by-view behaviour, accessibility, PWA. One big change = one big diff, hard to review and hard to bisect when something breaks.
- **Dependencies are ordered**: trip-centric routes and TripShell must exist before trip-scoped views can reliably move; layout variants (SYSTEM/BOARD/FOCUS) should exist before views that need BOARD or FOCUS. Doing everything at once blurs these dependencies and increases merge and regression risk.
- **Agent effectiveness**: Agents (and humans) make fewer mistakes when the prompt is scoped to one concrete task (e.g. “add route constants and redirects for Phase 1”) and the spec is referenced by section. A single “implement the whole spec” prompt tends to produce either incomplete work or a massive, unreviewable patch.

**Better approach:** treat the spec as the source of truth and implement it **in phases, with each phase split into small, testable tasks**. After each task, run the app and smoke-test, then move to the next. This gives you reviewable PRs, easy rollback, and clear prompts for the agent.

---

## How to proceed: phased, task-scoped implementation

The spec already defines implementation phases in **§13**. Use them as the backbone; subdivide each phase into **single-responsibility tasks** and give the agent (or yourself) one task at a time with a **narrow prompt** that points to the spec.

### Phase 0 — UX config layer (low risk, no UI behaviour change)

**Goal:** Formalise the UX schema, systems, navigation, layouts, and view states so the rest of the app can depend on a single config. No route or layout behaviour change yet.

- **Task 0.1** — Add `frontend/src/ux/` with schema, systems, navigation, layouts, states (and optionally routes constants). Reference: [TRIP_CONNECT_UI_UX_SPEC.md](TRIP_CONNECT_UI_UX_SPEC.md) §13 Phase 0 and [frontend/unified_ux_system_spec_professional_refactor_kit.txt](frontend/unified_ux_system_spec_professional_refactor_kit.txt) §1–6.
- **Prompt example:** “Implement Phase 0: add the ux config layer under `frontend/src/ux/` as per TRIP_CONNECT_UI_UX_SPEC.md §13 Phase 0 and unified_ux_system_spec_professional_refactor_kit.txt §1–6 (schema, systems, navigation, layouts, states). Do not change any routes or Layout yet.”

**Outcome:** A new `ux/` folder that the rest of the refactor will consume. No breaking changes.

---

### Phase 1 — Navigation, layouts, trip-centric routing (foundation)

**Goal:** Nested trip routes (`/groups/:id`, `/groups/:id/expenses`, etc.), TripShell, `useTripFromRoute()` (or TripContext), layout variants (SYSTEM / BOARD / FOCUS), mobile bottom bar, and backward-compat redirects. This is the highest-impact phase; splitting it into small steps keeps each step reviewable.

Suggested task order:

1. **Task 1.1 — Route constants and redirects**
  Add a single source of route paths (e.g. in `ux/routes.ts` or similar). In the router, add redirects: `/expenses?groupId=x` → `/groups/x/expenses`, `/itinerary?groupId=x` → `/groups/x/itinerary`. Reference: spec §3.1, §4.3, Appendix A.
2. **Task 1.2 — Nested trip routes and TripShell**
  Define nested routes under `/groups/:id` (overview, expenses, itinerary, kanban, tickets, chat). Create a `TripShell` component that reads `id` from `useParams()`, fetches/caches trip for header/breadcrumb, and renders sub-nav (tabs or horizontal nav). Reference: spec §3.1, §5.4.
3. **Task 1.3 — useTripFromRoute (or TripContext)**
  Implement a hook (or context) keyed by route `id` that exposes `{ trip, loading, error }` for TripShell and trip-scoped pages. Reference: spec §3.1, architecture assessment §2.2.
4. **Task 1.4 — Layout variants**
  Make Layout accept a layout ID (SYSTEM | BOARD | FOCUS) and switch structure (sidebar vs no sidebar, context panel or not). Route or page specifies layout per spec §5, §4.3. Reference: spec §3.3, §5.1–5.3.
5. **Task 1.5 — Mobile bottom bar**
  For viewports below `md`, show bottom nav (e.g. People, Trips, Notes, Calendar, More) and hide or simplify sidebar. Reference: spec §4.2, §8.4.
6. **Task 1.6 — Wire existing pages into new routes**
  Connect existing Expenses, Itinerary, Messages (as trip chat) to `/groups/:id/expenses`, `/groups/:id/itinerary`, `/groups/:id/chat`. Ensure they use `useTripFromRoute()` (or TripContext) and the correct layout. Remove or redirect old top-level `/expenses`, `/itinerary`, `/messages` to the new structure where appropriate.

**Prompt example for one task:** “Implement Task 1.2 only: add nested routes under `/groups/:id` and a TripShell component as per TRIP_CONNECT_UI_UX_SPEC.md §3.1 and §5.4. Use existing groups API. Do not change Layout or add bottom bar yet.”

**Outcome:** Trip-centric URLs, one trip shell, one trip context, layout variants, and mobile bottom bar. Existing trip-scoped features live under `/groups/:id/...`.

---

### Phase 2 — New views and view enhancements

**Goal:** Notes (standalone), Calendar, Trip Kanban; Itinerary timeline + map/flowchart; Expenses list-by-category and split breakdown. Add one view or one enhancement per task so each PR stays focused.

- **Task 2.1** — Notes list and detail (standalone route `/notes`), with reminder and follow-up. Reference: spec §6.8.
- **Task 2.2** — Calendar view (route `/calendar`, BOARD layout), lazy-loaded, trip date ranges. Reference: spec §6.9, §10.1.
- **Task 2.3** — Trip Kanban at `/groups/:id/kanban` (BOARD layout), columns and cards. Reference: spec §6.5.
- **Task 2.4** — Itinerary: timeline view + map/flowchart (lazy-loaded), add/edit location. Reference: spec §6.4.
- **Task 2.5** — Expenses: list by category, detail with split breakdown. Reference: spec §6.3.

**Backend:** Add or extend APIs only when needed (e.g. Notes CRUD, Kanban, calendar aggregation from groups/notes). Architecture assessment says existing backend is fine; extend incrementally per spec §11.

---

### Phase 3 — Tickets and smart info cards

**Goal:** Backend ticket model + OCR (if in scope), Tickets list per trip, SmartCard component and full-screen (FOCUS) view. Reference: spec §6.6, §6.7, §7.1.

- One task for backend: tickets API and optional OCR pipeline.
- One task for frontend: Tickets list + SmartCard + FOCUS layout for single-card view.

---

### Phase 4 — PWA, performance, accessibility

**Goal:** Lazy-loading audit, PWA manifest and service worker if adopted, accessibility (focus, semantics, `prefers-reduced-motion`). Reference: spec §9, §10.

- Can be broken into: performance/lazy-loading, PWA (manifest + SW + offline), a11y audit and fixes.

---

## How to use the agent effectively

- **One task per prompt:** e.g. “Implement Task 1.2: nested trip routes and TripShell (TRIP_CONNECT_UI_UX_SPEC.md §3.1, §5.4). Do not change Layout or add bottom bar.”
- **Reference the spec by section:** e.g. “per TRIP_CONNECT_UI_UX_SPEC.md §6.8” so the agent reads only what’s needed.
- **Constrain scope explicitly:** “Do not change …” or “Only add …” to avoid the agent rewriting unrelated code.
- **Run and test after each task:** start the app, click through affected routes, then proceed. If something breaks, the last small change is the likely cause.
- **Keep backend changes minimal until needed:** Phase 0–1 are frontend-only (plus optional route constants). Add Notes/Kanban/Tickets APIs in Phase 2–3 when those features are implemented.

---

## Summary


| Approach                                                | Risk   | Reviewability | Recommendation |
| ------------------------------------------------------- | ------ | ------------- | -------------- |
| One explosive “implement the whole spec” change         | High   | Low           | Avoid          |
| Phased (0 → 1 → 2 → 3 → 4) with one prompt per phase    | Medium | Medium        | Better         |
| Phased with small single-responsibility tasks per phase | Low    | High          | Preferred      |


Use the **phased, task-scoped approach**: Phase 0 first (ux config), then Phase 1 in small steps (routes, TripShell, trip context, layout variants, bottom bar, wire existing pages), then Phase 2–4 in similarly small tasks. Give the agent one task at a time with spec section references and explicit “do not change” boundaries. This keeps the refactor production-grade and maintainable while still moving fast with an AI agent.