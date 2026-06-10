import { useMemo, useState } from "react";
import { Anchor, Badge, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconArrowLeft, IconClock } from "@tabler/icons-react";
import { Link, useParams } from "react-router-dom";
import { usePublicEventType, useSlots } from "../../api/public";
import { type Slot } from "../../api/client";
import { EmptyState, ErrorState, LoadingState } from "../../components/states";
import { dayKey, formatDate, formatTime } from "../../lib/datetime";
import { BookingForm } from "./BookingForm";

export function EventTypeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const eventTypeQuery = usePublicEventType(id);
  const slotsQuery = useSlots(id);

  const slotsByDay = useMemo(() => {
    const groups = new Map<string, Slot[]>();
    for (const slot of slotsQuery.data ?? []) {
      const key = dayKey(slot.start);
      (groups.get(key) ?? groups.set(key, []).get(key)!).push(slot);
    }
    return [...groups.values()];
  }, [slotsQuery.data]);

  if (eventTypeQuery.isPending) return <LoadingState />;
  if (eventTypeQuery.isError) return <ErrorState error={eventTypeQuery.error} />;

  const eventType = eventTypeQuery.data;

  return (
    <Stack>
      <Anchor component={Link} to="/" size="sm">
        <Group gap={4}>
          <IconArrowLeft size={14} /> К списку
        </Group>
      </Anchor>

      <div>
        <Group justify="space-between" align="flex-start">
          <Title order={2}>{eventType.title}</Title>
          <Badge size="lg" leftSection={<IconClock size={14} />} variant="light">
            {eventType.durationMinutes} мин
          </Badge>
        </Group>
        <Text c="dimmed" mt="xs">
          {eventType.description}
        </Text>
      </div>

      <Title order={4}>Свободные слоты (14 дней)</Title>

      {slotsQuery.isPending ? (
        <LoadingState label="Загрузка слотов…" />
      ) : slotsQuery.isError ? (
        <ErrorState error={slotsQuery.error} />
      ) : slotsByDay.length === 0 ? (
        <EmptyState message="Нет свободных слотов в ближайшие 14 дней." />
      ) : (
        <Stack>
          {slotsByDay.map((daySlots) => (
            <Card key={daySlots[0].start} withBorder padding="md">
              <Text fw={600} tt="capitalize" mb="sm">
                {formatDate(daySlots[0].start)}
              </Text>
              <Group gap="xs">
                {daySlots.map((slot) => (
                  <Button
                    key={slot.start}
                    variant="light"
                    size="compact-md"
                    onClick={() => setSelectedSlot(slot)}
                  >
                    {formatTime(slot.start)}
                  </Button>
                ))}
              </Group>
            </Card>
          ))}
        </Stack>
      )}

      <BookingForm
        eventType={eventType}
        slot={selectedSlot}
        onClose={() => setSelectedSlot(null)}
      />
    </Stack>
  );
}
