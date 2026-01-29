/**
 * View states — EMPTY, LOADING, ERROR, PARTIAL, SUCCESS (TRIP_CONNECT_UI_UX_SPEC §7.4, unified_ux_system_spec §6).
 */

import type { UXStateID, UXViewStateConfig } from "./schema"

export const VIEW_STATES: Record<UXStateID, UXViewStateConfig> = {
  EMPTY: {
    icon: "plus",
    message: "Nothing here yet",
    action: "create",
  },

  LOADING: {
    type: "skeleton",
  },

  ERROR: {
    icon: "warning",
    message: "Something went wrong",
    action: "retry",
  },

  PARTIAL: {
    icon: "alert",
    message: "Needs review",
  },

  SUCCESS: {
    icon: "check",
    animation: "pulse",
  },
}
