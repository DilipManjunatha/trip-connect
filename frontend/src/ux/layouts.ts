/**
 * Layout definitions — SYSTEM, BOARD, FOCUS (TRIP_CONNECT_UI_UX_SPEC §5, unified_ux_system_spec §4).
 */

import type { UXLayoutID, UXLayoutSpec } from "./schema"

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
