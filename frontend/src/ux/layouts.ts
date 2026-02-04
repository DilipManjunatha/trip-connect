/**
 * Layout definitions — SYSTEM, BOARD, FOCUS (TRIP_CONNECT_UI_UX_SPEC §5, §4.3, unified_ux_system_spec §4).
 */

import type { UXLayoutID, UXLayoutSpec } from "./schema"
import { ROUTES } from "./routes"

export const LAYOUTS: Record<UXLayoutID, UXLayoutSpec> = {
  SYSTEM: {
    header: true,
    sidebar: true,
    contextPanel: true,
  },
  BOARD: {
    header: true,
    sidebar: false,
    contextPanel: true,
  },
  FOCUS: {
    header: true,
    sidebar: false,
    contextPanel: false,
  },
}

/**
 * Route → layout ID per spec §4.3. Use for Layout when layoutId is not passed explicitly.
 */
export function getLayoutIdForPath(pathname: string): UXLayoutID {
  if (pathname === ROUTES.CALENDAR) return "BOARD"
  if (pathname.startsWith(ROUTES.GROUPS + "/") && pathname.endsWith("/kanban")) return "BOARD"
  // Single-card view: full-screen smart card (spec §6.6, §7.1)
  if (pathname.includes("/tickets/card/")) return "FOCUS"
  return "SYSTEM"
}
