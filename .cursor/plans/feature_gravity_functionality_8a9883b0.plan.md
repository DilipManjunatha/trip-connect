---
name: Feature Gravity Functionality
overview: Add in-app "feature gravity" to measure and compare usability/engagement across Trip Connect features (Gravity Score style), using event telemetry, backend aggregation, and an admin-facing comparison surface.
todos: []
isProject: false
---

# Feature Gravity Functionality Plan

## Goal

Implement **Gravity Score–style** measurement: quantify and compare usability/engagement across features (routes and key flows) so the team can see which areas have strong vs weak "gravity" and prioritize improvements. This is done **in-app** via telemetry and derived scores, with optional room to feed external tools (e.g. Helio) later.

## Context

- **Gravity Score (Helio):** Survey-based usability method (SUS-style questions after interaction); produces one comparable score per page/experience. We are not building Helio; we are building an **in-app approximation** that gives comparable, feature-level metrics.
- **Existing gap:** The unified UX spec ([frontend/unified_ux_system_spec_professional_refactor_kit.txt](frontend/unified_ux_system_spec_professional_refactor_kit.txt)) defines `UX_EVENTS` and a `telemetry.ts` module (§12) but they were never implemented — no [frontend/src/ux/telemetry.ts](frontend/src/ux/telemetry.ts), no backend event store.
- **Scope:** Event emission (frontend), event storage and aggregation (backend), and an admin-only surface to view/compute "gravity" scores per feature.

---

## 1. Define feature set and events

**Feature set (scope for gravity):** Map to existing routes and key actions so each "feature" can get a score. Suggested granularity:

- **Route-level:** Dashboard, Contacts, Tags, Lists, Groups (list), Notes, Calendar, Users; per-trip: Expenses, Itinerary, Kanban, Tickets, Chat.
- **Key actions (optional, for richer scores):** e.g. contact_created, expense_added, kanban_moved, error_shown (align with spec’s `UX_EVENTS`).

**Event taxonomy:**

- **View:** `feature_view` — route or feature area viewed (e.g. `route:/groups/:id/expenses`).
- **Action:** `feature_action` — key action succeeded (e.g. `expense_added`, `contact_created`).
- **Error:** `feature_error` — error or failure (e.g. `error_shown` with optional context).

All events should include: `featureId` (stable id for the route/feature), `timestamp`, optional `sessionId`, and no PII (anonymous or user-id only if already authenticated; avoid logging sensitive payloads).

---

## 2. Frontend: telemetry layer

- **Add [frontend/src/ux/telemetry.ts](frontend/src/ux/telemetry.ts):**
  - Export `UX_EVENTS` (or `GRAVITY_EVENTS`) constants for view/action/error.
  - Export a small `gravity` (or `telemetry`) API: e.g. `trackView(featureId, route?)`, `trackAction(eventName, featureId?, payload?)`, `trackError(featureId, code?)`.
  - Implementation: call a frontend service that POSTs to the backend (see below); no dependency on Helio or third-party in v1.
- **Optional:** Lightweight queue/batch to avoid one request per event (e.g. batch every N seconds or on idle).
- **Instrumentation points:**
  - **Route views:** In the router or a single layout component (e.g. [frontend/src/components/Layout.tsx](frontend/src/components/Layout.tsx) or route wrapper), on pathname change emit `trackView(featureId)` with a map from path pattern to `featureId` (use [frontend/src/ux/routes.ts](frontend/src/ux/routes.ts) and path-to-feature mapping).
  - **Key actions:** In relevant pages (Dashboard, Expenses, Itinerary, TripKanban, Contacts, etc.), call `trackAction` on success (and optionally `trackError` on failure) for events already listed in the spec (e.g. expense_added, contact_created, kanban_moved, ocr_used, error_shown).
- **Privacy:** Do not send PII in event payloads; backend may store `userId` if needed for "per-user" aggregation only (admin-only), or keep events anonymous by not storing userId.

---

## 3. Backend: event storage and gravity aggregation

- **New Prisma model(s)** in [backend/prisma/schema.prisma](backend/prisma/schema.prisma):
  - **Option A (recommended):** `UxEvent` — raw events: `id`, `type` (view | action | error), `featureId`, `userId` (optional), `sessionId` (optional), `payload` (Json?), `createdAt`. Index on `(featureId, createdAt)` and optionally `(userId, createdAt)` for aggregation.
  - **Option B:** Same as A plus a separate `FeatureGravityScore` table (e.g. `featureId`, `period` (day/week), `score`, `viewCount`, `actionCount`, `errorCount`, etc.) updated by a job/cron. Start with A and compute scores on read; add B if performance requires pre-aggregation.
- **API:**
  - **POST /api/ux/events** (or `/api/gravity/events`): body `{ events: [{ type, featureId, ... }] }`. Auth: required (authenticated user). Validates and inserts into `UxEvent`. Rate-limit per user to avoid abuse.
  - **GET /api/ux/gravity** (or `/api/gravity/scores`): query params `period=7d|30d`, optional `featureIds[]`. Returns aggregated "gravity" per feature. **Auth: admin only** (reuse [backend/src/middleware/authorize.ts](backend/src/middleware/authorize.ts) and ADMIN check).
- **Gravity score formula (per feature):** Keep it simple and comparable. Example:
  - **Inputs:** view count, action count, error count in the period.
  - **Score:** e.g. `(actions / max(views, 1)) * weight - errorPenalty`, or a 0–100 normalized score combining usage and error rate. Document the formula in code and in a short admin UI tooltip.
  - Goal: higher score = more engagement and/or fewer errors so features can be **compared** (e.g. "Expenses 72, Itinerary 45").

---

## 4. Admin surface: compare usability across features

- **New admin-only route:** e.g. `/gravity` or `/admin/gravity` (or under Settings as "Feature gravity"). Guard with existing admin check (e.g. [frontend/src/components/AdminRoute.tsx](frontend/src/components/AdminRoute.tsx)).
- **Page content:**
  - Period selector: last 7 days, 30 days.
  - Table or cards: one row per feature (feature id, display name, gravity score, optional: view count, action count, error count).
  - Simple comparison (e.g. sort by score, or a bar chart). No need for complex charts in v1.
- **Data:** Page calls `GET /api/ux/gravity?period=7d` and renders the result.

---

## 5. Integration and docs

- **UX barrel:** Export telemetry from [frontend/src/ux/index.ts](frontend/src/ux/index.ts) so components can `import { trackView, trackAction } from '@/ux'` (or similar).
- **Navigation:** Add a link to the new Gravity page in the admin section (e.g. under "More" or in sidebar for admins). Prefer a single, clear label like "Feature gravity" or "Usability scores."
- **Docs:** Short note in [README.md](README.md) or [TRIP_CONNECT_UI_UX_SPEC.md](TRIP_CONNECT_UI_UX_SPEC.md): what feature gravity is, that it’s admin-only, and that it uses in-app events (no PII in payloads). Optional: "To run full Helio Gravity Score tests, use Helio with your app URLs."

---

## 6. Optional later extensions

- **Helio / external:** Export event stream or periodic report (anonymized) for use in Helio or another tool.
- **Pre-aggregation:** If the events table grows large, add `FeatureGravityScore` and a scheduled job to compute scores.
- **Surveys:** Add in-app survey entry points (e.g. after key flows) and feed results into the same featureId so "gravity" can blend usage and satisfaction later.

---

## Implementation order (suggested)

1. **Backend:** Prisma model + migration for `UxEvent`; POST `/api/ux/events` and GET `/api/ux/gravity` (admin) with a simple score formula.
2. **Frontend telemetry:** Add `ux/telemetry.ts` and `trackView` / `trackAction` / `trackError` calling the new API; wire route-view tracking in layout/router.
3. **Instrument key actions:** Add `trackAction` (and where relevant `trackError`) in a few high-value pages (Expenses, Groups, Contacts, TripKanban).
4. **Admin UI:** New route and page for gravity scores; link in admin nav.
5. **Docs and cleanup:** Export telemetry from ux index; short doc update.

---

## Files to add or change (summary)


| Area                   | Files                                                                                                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend                | [backend/prisma/schema.prisma](backend/prisma/schema.prisma) (new model), new migration, new controller e.g. `uxController.ts` or `gravityController.ts`, new route e.g. `ux.ts` or `gravity.ts`, register in [backend/src/server.ts](backend/src/server.ts) |
| Frontend UX            | New [frontend/src/ux/telemetry.ts](frontend/src/ux/telemetry.ts), update [frontend/src/ux/index.ts](frontend/src/ux/index.ts)                                                                                                                                |
| Frontend API           | Extend [frontend/src/services/api.ts](frontend/src/services/api.ts) (or add gravity/ux service) for POST events and GET gravity                                                                                                                              |
| Frontend layout/router | [frontend/src/App.tsx](frontend/src/App.tsx) or Layout: pathname → featureId mapping and `trackView`                                                                                                                                                         |
| Frontend pages         | Selected pages: call `trackAction` / `trackError` where appropriate                                                                                                                                                                                          |
| Admin UI               | New page e.g. [frontend/src/pages/Gravity.tsx](frontend/src/pages/Gravity.tsx) (or AdminGravity), route and AdminRoute, nav link                                                                                                                             |
| Docs                   | [README.md](README.md) or spec: short "Feature gravity" subsection                                                                                                                                                                                           |


No change to existing auth or RBAC beyond protecting the new API and route with current admin checks.