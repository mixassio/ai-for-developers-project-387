import { Button, Card, Group, Stack, Table, Text, Title } from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconFilterOff } from "@tabler/icons-react";
import { useState } from "react";
import { useAdminBookings } from "../../api/admin";
import { EmptyState, ErrorState, LoadingState } from "../../components/states";
import { formatDateTime } from "../../lib/datetime";

export function BookingsPage() {
  const [range, setRange] = useState<[Date | null, Date | null]>([null, null]);

  const from = range[0] ? range[0].toISOString() : undefined;
  // Верхняя граница исключительна — берём конец выбранного дня.
  const to = range[1]
    ? new Date(range[1].getTime() + 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  const { data, isPending, isError, error } = useAdminBookings({ from, to });

  return (
    <Stack>
      <Group justify="space-between" align="flex-end">
        <Title order={3}>Предстоящие записи</Title>
        <Group align="flex-end" gap="xs">
          <DatePickerInput
            type="range"
            label="Период"
            placeholder="Все даты"
            value={range}
            onChange={setRange}
            clearable
            w={260}
          />
          <Button
            variant="default"
            leftSection={<IconFilterOff size={16} />}
            onClick={() => setRange([null, null])}
            disabled={!range[0] && !range[1]}
          >
            Сбросить
          </Button>
        </Group>
      </Group>

      {isPending ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} />
      ) : data.items.length === 0 ? (
        <EmptyState message="Записей за выбранный период нет." />
      ) : (
        <Card withBorder padding={0}>
          <Table.ScrollContainer minWidth={520}>
            <Table verticalSpacing="sm" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Начало</Table.Th>
                  <Table.Th>Окончание</Table.Th>
                  <Table.Th>Гость</Table.Th>
                  <Table.Th>Email</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.items.map((b) => (
                  <Table.Tr key={b.id}>
                    <Table.Td>{formatDateTime(b.start)}</Table.Td>
                    <Table.Td>{formatDateTime(b.end)}</Table.Td>
                    <Table.Td>
                      <Text fw={500}>{b.guestName}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {b.guestEmail}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Card>
      )}
    </Stack>
  );
}
