# Trip Connect — Production-Grade UI/UX Specification

**Document status:** Final  
**Version:** 1.0  
**Scope:** Web frontend (mobile-first, responsive); design system; navigation; routing; view-by-view behavior; accessibility; PWA.  
**Related:** [PRODUCT_SPEC_PROMPT.md](PRODUCT_SPEC_PROMPT.md) (product scope), [.cursor/plans/trip_connect_architecture_assessment.md](.cursor/plans/trip_connect_architecture_assessment.md) (architecture rationale).

Use this spec as the single source of truth for UI/UX implementation, design reviews, and handoff to development.

---

## 1. Product Vision & Constraints

| Item | Requirement |
|------|-------------|
| **Product name** | Trip Connect |
| **Positioning** | Mobile-first trip planning and contact management: contacts, smart lists, trip groups, expense splitting, itinerary, and notes in one cohesive experience. |
| **Platform** | Mobile-first; must work as a responsive desktop web experience. Prefer **PWA** for installability, offline capability, and push; **SPA** acceptable if PWA is not feasible. |
| **Quality bar** | Production-grade UI/UX: clear hierarchy, consistent patterns, accessible, performant, ready for real users. |
| **AI readiness** | Architecture and data model must support future AI features (expense analysis, itinerary suggestions, smart categorization). Expose structured data and extension points. |

---

## 2. Design Principles

- **Mobile-first:** Primary flows optimized for small screens; touch targets ≥ 44px; thumb-friendly primary actions; single-column content where appropriate.
- **Clear hierarchy:** One primary action per screen; consistent heading levels (page title → section → card); use design tokens for typography and spacing.
- **Consistency:** Single design system (tokens, typography, spacing, components). Same patterns for list/detail, empty/loading/error, and forms.
- **Accessibility:** WCAG 2.1 AA where feasible; focus management in modals/dialogs; semantic HTML and ARIA where needed; support `prefers-reduced-motion`.
- **Performance:** Lazy-load heavy views (calendar, map/flowchart, Kanban); keep lists and cards fast; PWA caching for key trip/card data when applicable.

---

## 3. Architecture Decisions

### 3.1 Routing: Trip-Centric URLs

- **Adopt nested trip routes.** Trip context lives in the path, not the query string.
- **Routes:**
  - `/groups` — list of trips.
  - `/groups/:id` — trip overview or default tab (e.g. redirect to `/groups/:id/expenses` or show dashboard).
  - `/groups/:id/expenses`, `/groups/:id/itinerary`, `/groups/:id/kanban`, `/groups/:id/tickets`, `/groups/:id/chat` — trip-scoped sub-routes.
- **Trip shell:** One shared component (e.g. TripShell) that:
  - Reads `id` from `useParams()`.
  - Fetches or caches trip name/details for header/breadcrumb.
  - Renders sub-navigation (tabs or horizontal nav) for Expenses, Itinerary, Kanban, Tickets, Chat.
- **Backward compatibility:** Redirect `/expenses?groupId=x` → `/groups/x/expenses`, `/itinerary?groupId=x` → `/groups/x/itinerary`.
- **Trip context:** Use a lightweight TripContext or hook (e.g. `useTripFromRoute()`) keyed by route `id` for header, breadcrumb, and optional offline cache.

### 3.2 Access Control

- **ProtectedRoute:** All app content requires authentication; redirect to login with return URL.
- **Admin-only (retained):** Contacts, Tags, Lists, and Users remain **admin-only**. Only ADMIN role can access these pages. No change to route protection for these surfaces.

### 3.3 Layout Variants

| Layout ID | Use case | Header | Sidebar / Bottom bar | Context panel |
|-----------|----------|--------|----------------------|---------------|
| **SYSTEM** | List/detail (contacts, smart lists, trips, notes) | Yes | Yes | Optional |
| **BOARD** | Kanban, Calendar | Yes | No (or minimal) | Optional |
| **FOCUS** | Smart info card full view, note detail | Yes | No | No |

Layout component(s) accept a layout ID and adjust structure; on mobile, context panel can collapse to bottom sheet or modal.

---

## 4. Navigation

### 4.1 Desktop

- **Pattern:** Sidebar (persistent).
- **Primary destinations:** Dashboard (Home), People (contacts + tags + smart lists — admin-only), Trips (groups list), Notes, Calendar, Settings. Optional: Inbox.
- **Trip context:** When inside a trip (`/groups/:id/...`), show trip shell with sub-nav (Expenses, Itinerary, Kanban, Tickets, Chat); sidebar remains for global nav.

### 4.2 Mobile

- **Pattern:** Bottom navigation bar (5 items).
- **Primary items:** People (admin-only), Trips, Notes, Calendar, More (Settings + optional Inbox).
- **Trip context:** Same trip shell with sub-nav when inside a trip; bottom bar can hide or show “Back to trips” when in trip.

### 4.3 Route Summary

| Route | Access | Layout |
|-------|--------|--------|
| `/` | All authenticated | SYSTEM |
| `/contacts` | Admin | SYSTEM |
| `/tags` | Admin | SYSTEM |
| `/lists` | Admin | SYSTEM |
| `/groups` | All | SYSTEM |
| `/groups/:id` | All (member) | SYSTEM (trip shell) |
| `/groups/:id/expenses` | All (member) | SYSTEM |
| `/groups/:id/itinerary` | All (member) | SYSTEM |
| `/groups/:id/kanban` | All (member) | BOARD |
| `/groups/:id/tickets` | All (member) | SYSTEM |
| `/groups/:id/chat` | All (member) | SYSTEM |
| `/notes` | All | SYSTEM |
| `/calendar` | All | BOARD |
| `/users` | Admin | SYSTEM |
| `/login`, `/register` | Public | — |

---

## 5. Layouts & Shells

### 5.1 SYSTEM Layout

- Header (app name / key actions).
- Sidebar (desktop) or bottom bar (mobile).
- Main content area.
- Optional context panel (e.g. contact detail, list detail).

### 5.2 BOARD Layout

- Header.
- Full-width main content (no sidebar).
- Optional context panel.
- Use for: Trip Kanban, Calendar month view.

### 5.3 FOCUS Layout

- Header (minimal).
- Full-width main content; no sidebar, no context panel.
- Use for: Single smart info card full view, standalone note detail when maximized.

### 5.4 Trip Shell

- Wraps all `/groups/:id/...` routes.
- Shows trip name (and optional dates) in header or breadcrumb.
- Sub-navigation: Overview (or first tab), Expenses, Itinerary, Kanban, Tickets, Chat.
- Uses TripContext or `useTripFromRoute()` for trip data.

---

## 6. View-by-View Specification

### 6.1 People (Contacts, Tags, Smart Lists) — Admin-only

- **Contacts:** List with search/sort; row shows name, primary contact, tags. Tap → detail (fields, tags, actions). Create/edit via modal. Standard fields: name, phone, email, address, notes.
- **Tags:** List of tags with counts and color; create/edit; tapping a tag opens the corresponding smart list.
- **Smart lists:** List of lists (auto from tag + manual); name, source tag if any, member count. **Detail:** Members grouped by tag (or single list); **add/remove contacts** (e.g. “Add to list” with contact picker; “Remove from list”). Indicate when list is tag-driven vs manually edited.

### 6.2 Trips (Groups)

- **List:** Cards or rows with name, dates, destination, member count, status. Search/filter. Primary action: open trip (→ `/groups/:id` or first tab).
- **Trip overview (`/groups/:id`):** Header with name, dates, destination; quick links to Expenses, Itinerary, Kanban, Tickets, Chat; participants list. Optionally redirect to `/groups/:id/expenses` as default.

### 6.3 Trip: Expenses

- **List by category:** Group expenses by category (Transport, Accommodation, Food, etc.); each row: title, amount, payer, date.
- **Detail:** Full expense; **split breakdown** (who owes whom, settlement status).
- **Categories:** User can add/edit categories (name, optional icon/color). Category management in settings or inline.
- **Tickets:** Per category, list of tickets (e.g. “Flight to Paris”); attach file; after OCR, link to **smart info card** (see §6.7).

### 6.4 Trip: Itinerary

- **Timeline view:** Vertical chronological timeline; each stop: time, title, location, optional note; add/edit location (address or place).
- **Map/flowchart view:** Lazy-loaded; visual sequence (map or flowchart); same stops with order and location; tap stop for detail.
- **Per destination:** Add/edit location; show in both timeline and map/flowchart.

### 6.5 Trip: Kanban

- **Board:** Columns (e.g. To Do, In Progress, Done); **draggable or actionable cards** (task/reminder for the trip).
- **Card:** Title, optional description, assignee if needed.
- **Create/edit:** Modal or inline form.
- **Layout:** BOARD (full-width).

### 6.6 Trip: Tickets & Smart Info Cards

- **Tickets list:** Per trip or per category; ticket title, file attachment, link to smart card when OCR data exists.
- **Smart info card:** Compact, scannable card (one per ticket). Show only: carrier, time, seat, gate, PNR, etc. Any trip member can open own or others’ cards. Full-screen or modal uses FOCUS layout when single-card view.

### 6.7 Trip: Chat

- **In-trip chat:** Messaging per trip group; message list and composer; real-time updates (e.g. Socket.io). Optional: global `/messages` that lists trips and opens trip chat.

### 6.8 Notes (Standalone)

- **List:** Notes with search; row shows title/preview, reminder date if set, follow-up state.
- **Detail:** Full note; edit; **reminder date/time**; **follow-up** (e.g. checkbox or status).
- **Create:** Short note with optional reminder.

### 6.9 Calendar

- **Month view:** Grid; trip date ranges shown (e.g. bar or badge on start–end dates); tap day or trip → trip detail or day view.
- **Quick visual:** Answer “Which trips this month?” at a glance.
- **Layout:** BOARD. Lazy-load calendar component.

---

## 7. Component Patterns

### 7.1 Smart Info Card (Ticket)

- Compact card; icon/type (flight, train, hotel).
- Key fields in fixed layout: carrier, time, seat, gate, PNR.
- Actions: open full, share.
- Types: ticket, hotel, bill, booking, document (align with UX component spec).

### 7.2 Kanban Card

- Small card: title, optional assignee/date.
- Drag handle or move actions (To Do / In Progress / Done).
- States: idea, todo, booked, active, done (align with UX component spec).

### 7.3 List / Detail

- Master list (left or full-screen on mobile) → detail (right or new screen on mobile).
- Use existing ListRow, GroupedList, SearchField patterns.

### 7.4 View States

| State | Behavior |
|-------|----------|
| **EMPTY** | Illustration + message + primary CTA (e.g. “Create first contact”). |
| **LOADING** | Skeleton or spinner; avoid layout shift. |
| **ERROR** | Message + retry action; use DelightfulError pattern where applicable. |
| **PARTIAL** | “Needs review” or similar when data is incomplete. |
| **SUCCESS** | Normal content; optional brief confirmation (e.g. pulse). |

---

## 8. Design System Reference

### 8.1 Tokens (existing)

- **Colors:** Primary, secondary, gray, success, error, warning, info (see `frontend/src/design-system/tokens.ts`).
- **Typography:** Font families (sans, mono), font sizes (xs–5xl), weights (normal, medium, semibold, bold).
- **Spacing:** 4px base scale (0.5–24 in tokens).
- **Border radius:** sm, DEFAULT, md, lg, xl, 2xl, 3xl, full.
- **Shadows:** sm, DEFAULT, md, lg, xl, 2xl, inner, none.
- **Z-index:** base, dropdown, sticky, fixed, modalBackdrop, modal, popover, tooltip.
- **Transitions:** duration (fast, DEFAULT, slow, slower), timing (DEFAULT, in, out, in-out).

### 8.2 Typography Usage

- Page title: 2xl–3xl, semibold.
- Section heading: xl, medium/semibold.
- Body: base; secondary text: sm, gray.
- Captions: xs, gray.

### 8.3 Touch & Spacing

- Minimum touch target: 44×44px.
- Consistent spacing between interactive elements (e.g. 8–16px).
- Avoid hover-only actions on mobile.

### 8.4 Responsive Breakpoints

- Use Tailwind defaults (sm: 640px, md: 768px, lg: 1024px, xl: 1280px).
- Sidebar visible from `md` up; bottom bar only below `md`.
- Multi-column or context panel from `lg` where appropriate.

---

## 9. Accessibility

- **Focus:** Visible focus ring (from tokens); trap focus in modals; restore focus on close.
- **Semantics:** Use semantic HTML (nav, main, header, section, button, a); ARIA where needed (e.g. live regions, labels).
- **Motion:** Respect `prefers-reduced-motion` for transitions and animations.
- **Keyboard:** All primary flows keyboard-accessible; skip link to main content where applicable.

---

## 10. Performance & PWA

### 10.1 Performance

- Lazy-load: Calendar, map/flowchart, Kanban board.
- Keep list and card views fast; virtualize only if needed for very long lists.
- Skeleton or inline loading for above-the-fold content.

### 10.2 PWA (if adopted)

- **Manifest:** App name, short name, theme color, icons (192, 512), display `standalone`, start URL.
- **Service worker:** Cache app shell and static assets; cache API responses for key data (current trip, smart cards); network-first or stale-while-revalidate for list endpoints.
- **Offline:** Show cached trip/smart cards when offline; queue writes for sync when back online; show offline indicator in UI.

---

## 11. Data Model & API Alignment

- **Contacts ↔ Tags ↔ Smart lists:** Tags drive smart lists; allow direct add/remove on smart list. API already supports lists and list members.
- **Trips:** Trip group → participants, messages, expenses (with categories), itinerary. Add: tickets (with files and OCR result), Kanban board. API: `/api/groups/:groupId/expenses`, `/api/groups/:groupId/itineraries`; add tickets and Kanban as needed.
- **Notes:** Standalone entity with reminder/follow-up fields; add Note model and CRUD if not present.
- **Calendar:** Derived from trip dates (and optionally note reminders); no new backend entity; aggregate from groups (and notes).

---

## 12. AI Integration Hooks (Future)

- **Expenses:** Structured data (category, amount, payer, participants, date) and clear APIs for analysis, category suggestions, summaries.
- **Itinerary:** Structured stops (locations, order, times) for ordering suggestions, gap detection, alternatives.
- **OCR:** Extracted ticket fields stored in structured form for smart cards and future features (e.g. delay alerts).
- **Notes/reminders:** Note content and reminder metadata for follow-up and prioritization.

---

## 13. Implementation Phases (Summary)

| Phase | Focus |
|-------|--------|
| **0** | Formalize UX config layer (schema, systems, navigation, layouts, states); optional route constants. |
| **1** | Navigation: mobile bottom bar; layout variants (SYSTEM/BOARD/FOCUS); trip sub-nav; nested routes `/groups/:id/...` and TripShell. |
| **2** | New views: Notes (standalone), Calendar, Trip Kanban; Itinerary timeline + map/flowchart; Expenses list-by-category and split breakdown. |
| **3** | Tickets and smart info cards: backend Ticket model + OCR; Tickets list; SmartCard component and full-screen view. |
| **4** | PWA (if chosen), performance tuning, accessibility audit. |

---

## Appendix A: Routing Diagrams

### Current (flat, query-based)

```
                    +----------+
                    | /groups  |
                    +----+-----+
                         |
         +---------------+---------------+
         |               |               |
         v               v               v
  +--------------+ +--------------+ +------------------+
  | /expenses    | | /itinerary   | | /messages        |
  | ?groupId=x   | | ?groupId=x   | | (group picker    |
  +--------------+ +--------------+ +------------------+  in page)
```

### Specified (nested, trip-centric)

```
  +----------+      +------------------+
  | /groups  | ---> | /groups/:id      |
  +----------+      | (trip overview)  |
                    +--------+---------+
                             |
     +--------+--------+-----+-----+--------+
     |        |        |           |        |
     v        v        v           v        v
  +-------+ +-------+ +-------+ +-------+ +--------+
  |expenses| |itinerary| |kanban | | chat  | |tickets |
  +-------+ +-------+ +-------+ +-------+ +--------+
     (all under /groups/:id/...)
```

---

## Appendix B: Reference Links

- **Product scope:** [PRODUCT_SPEC_PROMPT.md](PRODUCT_SPEC_PROMPT.md)
- **Architecture assessment:** [.cursor/plans/trip_connect_architecture_assessment.md](.cursor/plans/trip_connect_architecture_assessment.md)
- **Design tokens:** `frontend/src/design-system/tokens.ts`
- **Unified UX spec (patterns):** `frontend/unified_ux_system_spec_professional_refactor_kit.txt`

---

*End of Trip Connect UI/UX Specification. Use this document for implementation, design reviews, and handoff.*
