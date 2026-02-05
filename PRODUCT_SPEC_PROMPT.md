# Trip Connect — Product & UX Specification Prompt

**Use this prompt when:** briefing developers, AI agents, or design systems to build or extend the Trip Connect application. Treat it as the single source of truth for feature scope, UX behavior, and technical constraints.

---

## 1. Product Vision & Constraints

- **Product name:** Trip Connect  
- **Positioning:** A mobile-first trip planning and contact management application that combines contacts, smart lists, trips, expense splitting, itinerary planning, and notes in one cohesive experience.  
- **Platform:** Mobile-first; must work as a responsive desktop web experience. Prefer **PWA** for installability, offline capability, and push; **SPA** is acceptable if PWA is not feasible.  
- **Quality bar:** Production-grade UI/UX: clear hierarchy, consistent patterns, accessible, performant, and ready for real users.  
- **AI readiness:** Architecture and data model must make it straightforward to add AI features later (e.g., expense analysis, itinerary suggestions, smart categorization). Expose clear extension points and structured data (categories, amounts, dates, participants) for AI consumption.

---

## 2. Core Feature Domains

### 2.1 Contacts

- **Create contact:** User can create a new contact with standard fields (name, phone, email, etc.).  
- **Tag contacts:** User can add one or more tags to each contact.  
- **Smart lists (tag-based):**  
  - When a contact is saved with a tag, a **smart list** for that tag is created or updated automatically.  
  - A smart list = “all contacts that have this tag.”  
- **View smart lists:** User can open a smart list and see who is in it (grouped by tag).  
- **Edit smart lists directly:** User can open a smart list and add or remove contacts from it (e.g., add a contact to a list without necessarily editing the contact’s tags first). This keeps smart lists in sync with tags where appropriate and gives flexibility.  
- **Summary:** Contacts + tags drive smart lists; smart lists are both auto-generated and directly editable.

### 2.2 Trip Planning (Trips)

Each **trip** is a container for one trip and includes:

- **Create trip:** User can create a new trip (name, dates, optional description).  
- **Messaging:** In-app messaging per trip so participants can discuss the trip.  
- **Participants:** Add participants from the user’s contacts (and/or by invite). Participants are members of the trip.  
- **Expenses:**  
  - Create, edit, and delete expenses for the trip.  
  - **Sophisticated expense management:** Support multiple expenses per trip with amount, currency, payer, date, and optional description.  
  - **Categories:** Each expense can be assigned to a **category** (e.g., Transport, Accommodation, Food). User can **add new categories** and manage them (name, optional icon/color).  
  - **Tickets per category:** For a category (e.g., Flights, Trains, Accommodation), user can add **tickets** (e.g., “Flight to Paris”) and attach **ticket files** (PDF/image).  
  - **OCR & smart info cards:**  
    - System supports **OCR** (or integration with an OCR service) on ticket files to extract key details (flight number, seat, time, PNR, etc.).  
    - From this data, generate **smart info cards**: compact, scannable cards showing the most important information (carrier, time, seat, gate, etc.).  
    - **During the trip:** Any participant in the trip can **view these cards** (own and others’) quickly—no need to open the original file. Use case: “What’s your seat?” → open card, see seat and flight details. Works for flights, trains, accommodation, etc.  
  - **Split functionality:** A **sophisticated split** feature so expenses can be split among participants (equal, custom %, or by share). Clear view of who owes whom and settlement status.  
- **Itinerary:**  
  - **Detailed itinerary** per trip: list of destinations/activities with order, dates/times, and optional location.  
  - **Timeline view:** Chronological view of the itinerary (e.g., “next places to visit” with time and details). Easy to scan on mobile.  
  - **Flowchart / map view:** Visual representation of destinations (flowchart or map) so the user can see the sequence and geography of the trip.  
  - **Per destination:** Add location (address or place) and view it in both timeline and flowchart/map.  
- **Notes in trip context (Kanban):**  
  - **Trip-level Kanban** for to-dos: columns such as To Do / In Progress / Done (or similar).  
  - Each card = a task or reminder for that trip. User can see status and progress at a glance.  
- **Calendar view (global):**  
  - A **calendar view** (e.g., month view) where the user can see **when** trips are planned.  
  - Trips appear on the calendar so the user gets a quick visual of planned trips across the month.

### 2.3 Notes (Standalone)

- **Dedicated Notes** as a top-level feature (outside of a specific trip).  
- **Quick notes:** Create short notes with optional reminder date/time.  
- **Reminders & follow-up:** Add reminders to notes and track follow-up (e.g., “follow up on X”).  
- **Use case:** General reminders and quick captures that are not tied to a single trip.

### 2.4 Calendar

- **Month (or week) view** showing when trips are scheduled.  
- **Quick visual:** User can answer “Which trips do I have this month?” at a glance.  
- Trips from Trip Planning should be visible in this calendar.

---

## 3. UX & UI Requirements

- **Mobile-first:** All primary flows must be comfortable and readable on small screens; touch targets and spacing must meet accessibility guidelines.  
- **Desktop:** Same app works on desktop with responsive layout (e.g., sidebar, larger cards, multi-column where it helps).  
- **Consistency:** Use a single design system (tokens, typography, spacing, components). Align with existing UX spec (e.g., systems: people, trips, notes; layouts; states) where present.  
- **Views to implement:**  
  - **Smart lists:** List/detail view; ability to add/remove contacts from list.  
  - **Expenses:** List by category; detail with split breakdown; ticket list and **smart info card** view.  
  - **Itinerary:** **Timeline view** and **flowchart/map view**; add/edit location per stop.  
  - **Trip Kanban:** Board with columns and draggable (or actionable) cards.  
  - **Calendar:** Month grid with trip indicators.  
  - **Notes:** List + detail; reminders and follow-up visible.  
- **Smart info cards:**  
  - Design as compact, scannable cards (e.g., one per ticket).  
  - Show vital info only (carrier, time, seat, gate, PNR, etc.).  
  - Any group member can open their own or another member’s card for that trip.

---

## 4. AI Integration Hooks (Future)

- **Expenses:** Structured expense data (category, amount, payer, participants, date) and clear APIs so AI can analyze spending, suggest categories, or summarize by category/trip.  
- **Itinerary:** Structured itinerary (locations, order, times) so AI can suggest ordering, gaps, or alternatives.  
- **OCR:** Extracted ticket fields (flight, train, etc.) stored in a structured way so AI can power smart cards and future features (e.g., delay alerts, gate changes).  
- **Notes/reminders:** Note content and reminder metadata available for AI-driven follow-up or prioritization.

---

## 5. Technical Guidance (for Implementation)

- **Auth:** Secure auth; only authenticated users access contacts, trips, and notes.  
- **Trip membership:** Respect trip membership for messaging, expenses, itinerary, and smart card visibility.  
- **Offline / PWA:** If PWA is chosen, consider caching key data (e.g., current trip, smart cards) for offline viewing.  
- **Performance:** Lazy-load heavy views (e.g., flowchart, calendar); keep list and card views fast on mobile.  
- **Data model:**  
  - Contacts ↔ Tags ↔ Smart lists: tags drive smart lists; allow direct add/remove on smart list.  
  - Trips: trip → participants, messages, expenses (with categories), tickets (with files and OCR result), itinerary (stops with order and location), Kanban board.  
  - Notes: standalone entity with reminder/follow-up fields.  
  - Calendar: derived from trip dates (and optionally note reminders if desired).

---

## 6. One-Paragraph Summary (for quick briefs)

Trip Connect is a **mobile-first** (PWA or SPA) app for **contacts** (with tags and auto + editable **smart lists**), **trips** (messaging, **participants from contacts**, **sophisticated expenses** with categories, **tickets** and **ticket files**, **OCR → smart info cards** for quick viewing by any participant, **sophisticated split**), **detailed itinerary** (**timeline** and **flowchart/map** views, locations per stop), **trip Kanban** for to-dos, and a **calendar** view of planned trips. It also has **standalone Notes** with reminders and follow-up. UI/UX must be **production-grade**, **mobile-first** and desktop-responsive, and **AI-ready** (structured data and extension points for expense analysis and itinerary assistance).

---

*End of Product Spec Prompt. Use this document to scope work, generate tickets, or prompt AI/developers for implementation.*
