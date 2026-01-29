/**
 * System definitions — UX systems (unified_ux_system_spec §2).
 */

import type { UXSystem } from "./schema"

export const UX_SYSTEMS: Record<string, UXSystem> = {
  people: {
    id: "people",
    label: "People",
    icon: "users",
    subsystems: ["contacts", "tags", "smartLists"],
  },
  trips: {
    id: "trips",
    label: "Trips",
    icon: "map",
    subsystems: ["groups", "expenses", "itinerary", "kanban", "chat", "documents"],
  },
  notes: {
    id: "notes",
    label: "Notes",
    icon: "note",
    subsystems: ["notes", "followUps"],
  },
  inbox: {
    id: "inbox",
    label: "Inbox",
    icon: "bell",
    subsystems: ["reminders", "ocr", "agentMessages"],
  },
  settings: {
    id: "settings",
    label: "Settings",
    icon: "gear",
    subsystems: ["profile", "sync", "preferences"],
  },
}
