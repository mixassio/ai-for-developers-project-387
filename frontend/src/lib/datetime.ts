import dayjs from "dayjs";
import "dayjs/locale/ru";

dayjs.locale("ru");

// utcDateTime контракта — ISO 8601 строки. Отображаем в локальной зоне браузера.

export function formatDateTime(iso: string): string {
  return dayjs(iso).format("D MMMM YYYY, HH:mm");
}

export function formatTime(iso: string): string {
  return dayjs(iso).format("HH:mm");
}

export function formatDate(iso: string): string {
  return dayjs(iso).format("dddd, D MMMM");
}

/** Ключ дня для группировки слотов по датам. */
export function dayKey(iso: string): string {
  return dayjs(iso).format("YYYY-MM-DD");
}
