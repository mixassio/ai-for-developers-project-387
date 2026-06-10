import { useState } from "react";
import { ActionIcon, Badge, Button, Group, Stack, Table, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useAdminEventTypes, useDeleteEventType } from "../../api/admin";
import { type EventType } from "../../api/client";
import { errorMessage } from "../../api/errors";
import { EmptyState, ErrorState, LoadingState } from "../../components/states";
import { EventTypeFormModal } from "./EventTypeFormModal";

export function EventTypesAdminPage() {
  const { data, isPending, isError, error } = useAdminEventTypes();
  const deleteMutation = useDeleteEventType();

  const [modalOpened, setModalOpened] = useState(false);
  const [editing, setEditing] = useState<EventType | null>(null);

  const openCreate = () => {
    setEditing(null);
    setModalOpened(true);
  };

  const openEdit = (et: EventType) => {
    setEditing(et);
    setModalOpened(true);
  };

  const confirmDelete = (et: EventType) =>
    modals.openConfirmModal({
      title: "Удалить тип события?",
      children: <Text size="sm">«{et.title}» будет удалён без возможности восстановления.</Text>,
      labels: { confirm: "Удалить", cancel: "Отмена" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await deleteMutation.mutateAsync(et.id);
          notifications.show({ color: "green", message: "Тип события удалён." });
        } catch (err) {
          notifications.show({ color: "red", title: "Ошибка", message: errorMessage(err) });
        }
      },
    });

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={3}>Типы событий</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Добавить
        </Button>
      </Group>

      {isPending ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState error={error} />
      ) : data.items.length === 0 ? (
        <EmptyState message="Типы событий ещё не созданы." />
      ) : (
        <Table.ScrollContainer minWidth={480}>
          <Table verticalSpacing="sm" highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Название</Table.Th>
                <Table.Th>Описание</Table.Th>
                <Table.Th w={110}>Длительность</Table.Th>
                <Table.Th w={90} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {data.items.map((et) => (
                <Table.Tr key={et.id}>
                  <Table.Td>
                    <Text fw={500}>{et.title}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {et.description}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light">{et.durationMinutes} мин</Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4} justify="flex-end" wrap="nowrap">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => openEdit(et)}
                        aria-label="Изменить"
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => confirmDelete(et)}
                        aria-label="Удалить"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      )}

      <EventTypeFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        eventType={editing}
      />
    </Stack>
  );
}
