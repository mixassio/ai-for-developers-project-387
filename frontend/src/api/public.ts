import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type BookingCreate } from "./client";
import { unwrap } from "./errors";
import { qk } from "./queryKeys";

export function usePublicEventTypes() {
  return useQuery({
    queryKey: qk.public.eventTypes,
    queryFn: async () => unwrap(await api.GET("/public/event-types")),
  });
}

export function usePublicEventType(id: string | undefined) {
  return useQuery({
    queryKey: qk.public.eventType(id ?? ""),
    enabled: Boolean(id),
    queryFn: async () =>
      unwrap(await api.GET("/public/event-types/{id}", { params: { path: { id: id! } } })),
  });
}

export function useSlots(id: string | undefined, range?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: qk.public.slots(id ?? "", range?.from, range?.to),
    enabled: Boolean(id),
    queryFn: async () =>
      unwrap(
        await api.GET("/public/event-types/{id}/slots", {
          params: { path: { id: id! }, query: { from: range?.from, to: range?.to } },
        }),
      ),
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: qk.public.booking(id ?? ""),
    enabled: Boolean(id),
    queryFn: async () =>
      unwrap(await api.GET("/public/bookings/{id}", { params: { path: { id: id! } } })),
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: BookingCreate) => unwrap(await api.POST("/public/bookings", { body })),
    onSuccess: (booking) => {
      // После брони слоты этого типа события устарели (правило занятости).
      qc.invalidateQueries({ queryKey: ["public", "event-types", booking.eventTypeId, "slots"] });
      qc.invalidateQueries({ queryKey: ["admin", "bookings"] });
    },
  });
}
