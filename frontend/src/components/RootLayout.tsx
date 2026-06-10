import { AppShell, Group, Button, Title, Container } from "@mantine/core";
import { IconCalendarEvent, IconSettings, IconUsers } from "@tabler/icons-react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

/** Общий каркас с переключением между публичной и админской частями. */
export function RootLayout() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group gap="xs">
            <IconCalendarEvent size={24} />
            <Title order={4}>Календарь звонков</Title>
          </Group>
          <Group gap="xs">
            <Button
              component={NavLink}
              to="/"
              variant={isAdmin ? "subtle" : "light"}
              leftSection={<IconUsers size={16} />}
            >
              Гостю
            </Button>
            <Button
              component={NavLink}
              to="/admin"
              variant={isAdmin ? "light" : "subtle"}
              leftSection={<IconSettings size={16} />}
            >
              Владельцу
            </Button>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Main>
        <Container size="md">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
