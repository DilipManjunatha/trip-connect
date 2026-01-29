/**
 * Component registry — slots, types, actions, states (unified_ux_system_spec §5).
 */

import type { UXComponentSpec } from "./schema"

export const COMPONENTS: Record<string, UXComponentSpec> = {
  SystemLayout: {
    slots: ["header", "nav", "content", "context"],
  },

  SmartCard: {
    types: ["ticket", "hotel", "bill", "booking", "document"],
    actions: ["open", "share", "link", "delete"],
  },

  KanbanCard: {
    types: ["task", "expense", "itinerary", "document"],
    drag: true,
    states: ["idea", "todo", "booked", "active", "done"],
  },

  ChatBubble: {
    types: ["text", "expense", "task", "card", "system"],
  },

  TagChip: {
    actions: ["filter", "edit", "delete"],
  },
}
