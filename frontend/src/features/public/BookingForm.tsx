import { Button, Group, Modal, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";
import { useCreateBooking } from "../../api/public";
import { type PublicEventType, type Slot } from "../../api/client";
import { ApiError } from "../../api/errors";
import { formatDateTime } from "../../lib/datetime";

interface Props {
  eventType: PublicEventType;
  slot: Slot | null;
  onClose: () => void;
}

export function BookingForm({ eventType, slot, onClose }: Props) {
  const navigate = useNavigate();
  const createBooking = useCreateBooking();

  const form = useForm({
    initialValues: { guestName: "", guestEmail: "", notes: "" },
    validate: {
      guestName: (v) => (v.trim().length < 1 ? "Укажите имя" : null),
      guestEmail: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "Некорректный email"),
      notes: (v) => (v.length > 2000 ? "Не более 2000 символов" : null),
    },
  });

  const handleSubmit = form.onSubmit(async (values) => {
    if (!slot) return;
    try {
      const booking = await createBooking.mutateAsync({
        eventTypeId: eventType.id,
        start: slot.start,
        guestName: values.guestName.trim(),
        guestEmail: values.guestEmail.trim(),
        notes: values.notes.trim() || undefined,
      });
      notifications.show({ color: "green", message: "Бронирование создано." });
      onClose();
      form.reset();
      // Передаём бронь через router state: при мок-сервере Prism повторный GET
      // вернёт другие данные, поэтому показываем то, что вернул POST.
      navigate(`/bookings/${booking.id}`, { state: { booking } });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        notifications.show({
          color: "red",
          title: "Время уже занято",
          message: "Этот слот только что забронировали. Выберите другое время.",
        });
        onClose();
        return;
      }
      notifications.show({
        color: "red",
        title: "Не удалось забронировать",
        message: err instanceof Error ? err.message : "Ошибка запроса.",
      });
    }
  });

  return (
    <Modal opened={slot !== null} onClose={onClose} title="Подтверждение записи" centered>
      {slot && (
        <form onSubmit={handleSubmit}>
          <Stack>
            <Text size="sm">
              <b>{eventType.title}</b> — {eventType.durationMinutes} мин
            </Text>
            <Text size="sm" c="dimmed">
              Начало: {formatDateTime(slot.start)}
            </Text>

            <TextInput
              required
              label="Ваше имя"
              maxLength={200}
              {...form.getInputProps("guestName")}
            />
            <TextInput required label="Email" type="email" {...form.getInputProps("guestEmail")} />
            <Textarea
              label="Заметки"
              autosize
              minRows={2}
              maxLength={2000}
              {...form.getInputProps("notes")}
            />

            <Group justify="flex-end">
              <Button variant="default" onClick={onClose}>
                Отмена
              </Button>
              <Button type="submit" loading={createBooking.isPending}>
                Забронировать
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}
