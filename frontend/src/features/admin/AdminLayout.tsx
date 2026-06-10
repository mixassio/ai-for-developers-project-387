import { Group, Stack, Tabs } from "@mantine/core";
import { IconCalendarTime, IconLayoutList, IconUser } from "@tabler/icons-react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";

const TABS = [
  { value: "/admin", label: "Профиль", icon: IconUser },
  { value: "/admin/event-types", label: "Типы событий", icon: IconLayoutList },
  { value: "/admin/bookings", label: "Записи", icon: IconCalendarTime },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = TABS.find((t) => t.value === pathname)?.value ?? "/admin";

  return (
    <Stack>
      <Tabs value={active} onChange={(v) => v && navigate(v)}>
        <Tabs.List>
          {TABS.map((t) => (
            <Tabs.Tab key={t.value} value={t.value} leftSection={<t.icon size={16} />}>
              <Group gap={6}>{t.label}</Group>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs>
      <Outlet />
    </Stack>
  );
}
