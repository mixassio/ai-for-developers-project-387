import { Badge, Button, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconClock, IconArrowRight } from "@tabler/icons-react";
import { useNavigate } from "react-router-dom";
import { usePublicEventTypes } from "../../api/public";
import { EmptyState, ErrorState, LoadingState } from "../../components/states";

export function EventTypesListPage() {
  const navigate = useNavigate();
  const { data, isPending, isError, error } = usePublicEventTypes();

  return (
    <Stack>
      <div>
        <Title order={2}>Выберите тип встречи</Title>
        <Text c="dimmed">Запишитесь на свободное время в ближайшие 14 дней.</Text>
      </div>

      {isPending ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} />
      ) : data.items.length === 0 ? (
        <EmptyState message="Пока нет доступных типов встреч." />
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {data.items.map((et) => (
            <Card key={et.id} withBorder padding="lg" radius="md">
              <Stack gap="sm" h="100%" justify="space-between">
                <div>
                  <Group justify="space-between" align="flex-start">
                    <Title order={4}>{et.title}</Title>
                    <Badge leftSection={<IconClock size={12} />} variant="light">
                      {et.durationMinutes} мин
                    </Badge>
                  </Group>
                  <Text c="dimmed" size="sm" mt="xs" lineClamp={3}>
                    {et.description}
                  </Text>
                </div>
                <Button
                  fullWidth
                  rightSection={<IconArrowRight size={16} />}
                  onClick={() => navigate(`/event-types/${et.id}`)}
                >
                  Записаться
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
}
