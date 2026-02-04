/**
 * Route paths — single source of truth (TRIP_CONNECT_UI_UX_SPEC §3.1, §4.3, Appendix A).
 * Use for router config, redirects, and links. Trip context lives in path, not query.
 */

/** Query param for backward compatibility: ?groupId=x → redirect to /groups/x/... */
export const GROUP_ID_QUERY = "groupId"

/** Path constants for router and links (spec §4.3). */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  CONTACTS: "/contacts",
  TAGS: "/tags",
  LISTS: "/lists",
  GROUPS: "/groups",
  MESSAGES: "/messages",
  EXPENSES: "/expenses",
  ITINERARY: "/itinerary",
  NOTES: "/notes",
  CALENDAR: "/calendar",
  USERS: "/users",
} as const

/** Trip-scoped path builders. Use for redirects and links. */
export function group(id: string): string {
  return `${ROUTES.GROUPS}/${id}`
}

export function groupExpenses(id: string): string {
  return `${ROUTES.GROUPS}/${id}/expenses`
}

export function groupItinerary(id: string): string {
  return `${ROUTES.GROUPS}/${id}/itinerary`
}

export function groupKanban(id: string): string {
  return `${ROUTES.GROUPS}/${id}/kanban`
}

export function groupTickets(id: string): string {
  return `${ROUTES.GROUPS}/${id}/tickets`
}

/** Single ticket smart card view (FOCUS layout, spec §6.6, §7.1). */
export function groupTicketCard(groupId: string, ticketId: string): string {
  return `${ROUTES.GROUPS}/${groupId}/tickets/card/${ticketId}`
}

export function groupChat(id: string): string {
  return `${ROUTES.GROUPS}/${id}/chat`
}

/** Note detail path (standalone notes, spec §6.8). */
export function noteDetail(id: string): string {
  return `${ROUTES.NOTES}/${id}`
}
