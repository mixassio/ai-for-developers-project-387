// Централизованные ключи кэша TanStack Query.
export const qk = {
  admin: {
    profile: ["admin", "profile"] as const,
    eventTypes: ["admin", "event-types"] as const,
    eventType: (id: string) => ["admin", "event-types", id] as const,
    bookings: (from?: string, to?: string) => ["admin", "bookings", { from, to }] as const,
  },
  public: {
    eventTypes: ["public", "event-types"] as const,
    eventType: (id: string) => ["public", "event-types", id] as const,
    slots: (id: string, from?: string, to?: string) =>
      ["public", "event-types", id, "slots", { from, to }] as const,
    booking: (id: string) => ["public", "bookings", id] as const,
  },
};
