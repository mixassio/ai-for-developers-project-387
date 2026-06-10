import { useEffect } from "react";
import { Button, Group, Modal, NumberInput, Stack, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useCreateEventType, useUpdateEventType } from "../../api/admin";
import { type EventType } from "../../api/client";
import { errorMessage } from "../../api/errors";

interface Props {
  opened: boolean;
  onClose: () => void;
  // Передан — режим редактирования, иначе создание.
  eventType?: EventType | null;
}

interface FormValues {
  title: string;
  description: string;
  durationMinutes: number;
}

export function EventTypeFormModal({ opened, onClose, eventType }: Props) {
  const isEdit = Boolean(eventType);
  const createMutation = useCreateEventType();
  const updateMutation = useUpdateEventType();

  const form = useForm<FormValues>({
    initialValues: { title: "", description: "", durationMinutes: 30 },
    validate: {
      title: (v) =>
        v.trim().length < 1 ? "Обязательное поле" : v.length > 200 ? "Не более 200" : null,
      description: (v) => (v.length > 2000 ? "Не более 2000 символов" : null),
      durationMinutes: (v) => (v < 1 || v > 1440 ? "Длительность от 1 до 1440 минут" : null),
    },
  });

  // Заполняем форму при открытии в режиме редактирования.
  useEffect(() => {
    if (opened) {
      form.setValues(
        eventType
          ? {
              title: eventType.title,
              description: eventType.description,
              durationMinutes: eventType.durationMinutes,
            }
          : { title: "", description: "", durationMinutes: 30 },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opened, eventType]);

  const handleSubmit = form.onSubmit(async (values) => {
    try {
      if (isEdit && eventType) {
        await updateMutation.mutateAsync({ id: eventType.id, body: values });
        notifications.show({ color: "green", message: "Тип события обновлён." });
      } else {
        await createMutation.mutateAsync(values);
        notifications.show({ color: "green", message: "Тип события создан." });
      }
      onClose();
    } catch (err) {
      notifications.show({
        color: "red",
        title: "Ошибка сохранения",
        message: errorMessage(err),
      });
    }
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isEdit ? "Редактировать тип события" : "Новый тип события"}
      centered
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput required label="Название" maxLength={200} {...form.getInputProps("title")} />
          <Textarea
            label="Описание"
            autosize
            minRows={2}
            maxLength={2000}
            {...form.getInputProps("description")}
          />
          <NumberInput
            required
            label="Длительность, мин"
            min={1}
            max={1440}
            {...form.getInputProps("durationMinutes")}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              Сохранить
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
