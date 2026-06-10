import { Button, Card, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconCircleCheck, IconHome } from "@tabler/icons-react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useBooking } from "../../api/public";
import { type Booking } from "../../api/client";
import { ErrorState, LoadingState } from "../../components/states";
import { formatDateTime } from "../../lib/datetime";

export function BookingConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  // Бронь, переданная со страницы создания, — мгновенный фолбэк, пока грузится запрос.
  const passed = (location.state as { booking?: Booking } | null)?.booking;

  // С реальным бэкендом запрашиваем бронь по id (работает и при прямом переходе).
  const query = useBooking(id);
  const booking = query.data ?? passed;

  if (!booking && query.isPending) return <LoadingState />;
  if (!booking && query.isError) return <ErrorState error={query.error} />;
  if (!booking) return <ErrorState error={new Error("Бронирование не найдено.")} />;

  return (
    <Stack align="center" gap="lg" py="xl">
      <ThemeIcon size={64} radius="xl" color="green" variant="light">
        <IconCircleCheck size={40} />
      </ThemeIcon>
      <div style={{ textAlign: "center" }}>
        <Title order={2}>Вы записаны!</Title>
        <Text c="dimmed">Подтверждение отправлено на {booking.guestEmail}.</Text>
      </div>

      <Card withBorder padding="lg" w="100%" maw={420}>
        <Stack gap="xs">
          <Field label="Имя гостя" value={booking.guestName} />
          <Field label="Начало" value={formatDateTime(booking.start)} />
          <Field label="Окончание" value={formatDateTime(booking.end)} />
          {booking.notes && <Field label="Заметки" value={booking.notes} />}
          <Field label="Номер брони" value={booking.id} />
        </Stack>
      </Card>

      <Button component={Link} to="/" leftSection={<IconHome size={16} />} variant="default">
        На главную
      </Button>
    </Stack>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <Group justify="space-between" wrap="nowrap">
      <Text c="dimmed" size="sm">
        {label}
      </Text>
      <Text size="sm" fw={500} ta="right">
        {value}
      </Text>
    </Group>
  );
}
