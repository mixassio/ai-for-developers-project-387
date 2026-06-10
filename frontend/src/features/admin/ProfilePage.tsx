import { Avatar, Card, Group, Stack, Text, Title } from "@mantine/core";
import { IconMail, IconWorld } from "@tabler/icons-react";
import { useProfile } from "../../api/admin";
import { ErrorState, LoadingState } from "../../components/states";

export function ProfilePage() {
  const { data, isPending, isError, error } = useProfile();

  if (isPending) return <LoadingState />;
  if (isError) return <ErrorState error={error} />;

  return (
    <Card withBorder padding="lg" maw={480}>
      <Group>
        <Avatar size="lg" radius="xl" color="indigo">
          {data.name.slice(0, 1).toUpperCase()}
        </Avatar>
        <Stack gap={2}>
          <Title order={3}>{data.name}</Title>
          <Text c="dimmed" size="sm">
            Владелец календаря
          </Text>
        </Stack>
      </Group>

      <Stack gap="xs" mt="lg">
        <Group gap="xs">
          <IconMail size={16} />
          <Text size="sm">{data.email}</Text>
        </Group>
        <Group gap="xs">
          <IconWorld size={16} />
          <Text size="sm">{data.timezone}</Text>
        </Group>
      </Stack>
    </Card>
  );
}
