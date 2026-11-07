import { NotificationDay } from "@/types/notifications";
import { startOfToday } from "@/utils/date-format";

// Which section of the notifications page a timestamp belongs to, by local date.
// null (e.g. a like made before liked_at existed) counts as "earlier"
export function toNotificationDay(timestamp: string | null): NotificationDay {
  if (!timestamp) return "earlier";

  const time = new Date(timestamp).getTime();
  const today = startOfToday();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (time >= today.getTime()) return "today";
  if (time >= yesterday.getTime()) return "yesterday";
  return "earlier";
}
