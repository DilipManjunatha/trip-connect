/**
 * UX Schema — Type safety & validation
 * Phase 0: Formalize UX config layer (TRIP_CONNECT_UI_UX_SPEC §13, unified_ux_system_spec §1).
 */

export type UXRole = "OWNER" | "MEMBER" | "VIEWER"
export type UXPlatform = "desktop" | "mobile"
export type UXSystemID = "people" | "trips" | "notes" | "inbox" | "settings"
export type UXLayoutID = "SYSTEM" | "BOARD" | "FOCUS"
export type UXStateID = "EMPTY" | "LOADING" | "ERROR" | "PARTIAL" | "SUCCESS"

export interface UXSystem {
  id: UXSystemID
  label: string
  icon: string
  subsystems: string[]
}

export interface UXNavSpec {
  type: "sidebar" | "bottom-bar"
  maxPrimary?: number
  systems: UXSystemID[]
}

export interface UXLayoutSpec {
  header: boolean
  sidebar: boolean
  contextPanel: boolean
}

export interface UXComponentSpec {
  slots?: string[]
  types?: string[]
  actions?: string[]
  drag?: boolean
  states?: string[]
}

export interface UXFeatureFlag {
  enabled: boolean
  beta?: boolean
  rollout?: "friends" | "beta" | "public"
}

export interface UXFlow {
  id: string
  steps: string[]
}

/** View-state config for EMPTY, LOADING, ERROR, PARTIAL, SUCCESS (TRIP_CONNECT_UI_UX_SPEC §7.4). */
export interface UXViewStateConfig {
  icon?: string
  message?: string
  action?: string
  type?: "skeleton" | "spinner"
  animation?: string
}
