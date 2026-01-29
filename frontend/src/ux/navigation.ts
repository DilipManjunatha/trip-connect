/**
 * Navigation contract — desktop sidebar vs mobile bottom bar (unified_ux_system_spec §3).
 */

import type { UXNavSpec } from "./schema"

export const DESKTOP_NAV: UXNavSpec = {
  type: "sidebar",
  maxPrimary: 7,
  systems: ["people", "trips", "notes", "inbox", "settings"],
}

export const MOBILE_NAV: UXNavSpec = {
  type: "bottom-bar",
  systems: ["people", "trips", "inbox", "notes", "settings"],
}
