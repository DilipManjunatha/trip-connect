/**
 * Navigation contract — desktop sidebar vs mobile bottom bar (spec §4.1, §4.2, unified_ux_system_spec §3).
 */

import type { UXNavSpec } from "./schema"
import { ROUTES } from "./routes"

export const DESKTOP_NAV: UXNavSpec = {
  type: "sidebar",
  maxPrimary: 7,
  systems: ["people", "trips", "notes", "inbox", "settings"],
}

export const MOBILE_NAV: UXNavSpec = {
  type: "bottom-bar",
  systems: ["people", "trips", "notes", "inbox", "settings"],
}

/** Mobile bottom bar items per spec §4.2: People, Trips, Notes, Calendar, More. */
export const MOBILE_NAV_ITEMS = [
  { id: "people", label: "People", href: ROUTES.CONTACTS, adminOnly: true as const },
  { id: "trips", label: "Trips", href: ROUTES.GROUPS },
  { id: "notes", label: "Notes", href: ROUTES.NOTES },
  { id: "calendar", label: "Calendar", href: ROUTES.CALENDAR },
  { id: "more", label: "More", openDrawer: true as const },
] as const
