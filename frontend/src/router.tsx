import { createBrowserRouter, Navigate } from "react-router-dom";
import { RootLayout } from "./components/RootLayout";
import { EventTypesListPage } from "./features/public/EventTypesListPage";
import { EventTypeDetailPage } from "./features/public/EventTypeDetailPage";
import { BookingConfirmationPage } from "./features/public/BookingConfirmationPage";
import { AdminLayout } from "./features/admin/AdminLayout";
import { ProfilePage } from "./features/admin/ProfilePage";
import { EventTypesAdminPage } from "./features/admin/EventTypesAdminPage";
import { BookingsPage } from "./features/admin/BookingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      // Публичная часть (гость)
      { index: true, element: <EventTypesListPage /> },
      { path: "event-types/:id", element: <EventTypeDetailPage /> },
      { path: "bookings/:id", element: <BookingConfirmationPage /> },

      // Админская часть (владелец)
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: <ProfilePage /> },
          { path: "event-types", element: <EventTypesAdminPage /> },
          { path: "bookings", element: <BookingsPage /> },
        ],
      },

      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
