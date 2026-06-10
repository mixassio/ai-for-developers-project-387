import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type EventTypeCreate, type EventTypeUpdate } from "./client";
import { unwrap } from "./errors";
import { qk } from "./queryKeys";

export function useProfile() {
  return useQuery({
    queryKey: qk.admin.profile,
    queryFn: async () => unwrap(await api.GET("/admin/profile")),
  });
}

export function useAdminEventTypes() {
  return useQuery({
    queryKey: qk.admin.eventTypes,
    queryFn: async () => unwrap(await api.GET("/admin/event-types")),
  });
}

export function useAdminBookings(range?: { from?: string; to?: string }) {
  return useQuery({
    queryKey: qk.admin.bookings(range?.from, range?.to),
    queryFn: async () =>
      unwrap(
        await api.GET("/admin/bookings", {
          params: { query: { from: range?.from, to: range?.to } },
        }),
      ),
  });
}

export function useCreateEventType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: EventTypeCreate) =>
      unwrap(await api.POST("/admin/event-types", { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.admin.eventTypes }),
  });
}

export function useUpdateEventType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: EventTypeUpdate }) =>
      unwrap(await api.PUT("/admin/event-types/{id}", { params: { path: { id } }, body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.admin.eventTypes }),
  });
}

export function useDeleteEventType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      unwrap(await api.DELETE("/admin/event-types/{id}", { params: { path: { id } } }));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.admin.eventTypes }),
  });
}
