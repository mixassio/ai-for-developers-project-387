import { Alert, Center, Loader, Stack, Text } from "@mantine/core";
import { IconAlertTriangle, IconInbox } from "@tabler/icons-react";
import { errorMessage } from "../api/errors";

export function LoadingState({ label = "Загрузка…" }: { label?: string }) {
  return (
    <Center py="xl">
      <Stack align="center" gap="xs">
        <Loader />
        <Text c="dimmed" size="sm">
          {label}
        </Text>
      </Stack>
    </Center>
  );
}

export function ErrorState({ error }: { error: unknown }) {
  return (
    <Alert
      icon={<IconAlertTriangle size={18} />}
      color="red"
      title="Не удалось загрузить данные"
      variant="light"
    >
      {errorMessage(error)}
    </Alert>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <Center py="xl">
      <Stack align="center" gap="xs">
        <IconInbox size={32} color="var(--mantine-color-gray-5)" />
        <Text c="dimmed" size="sm">
          {message}
        </Text>
      </Stack>
    </Center>
  );
}
