// The week (Robin, 2026-11-02): which events are on, from the real date, the same for everyone. Add an event to `data/calendar.json`.
import calendarJson from '../data/calendar.json' with { type: 'json' };

export const CALENDAR = calendarJson as unknown as { offsetHours: number; events: Record<string, { name: string; days: number[] }> };
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

const DAY_MS = 86_400_000;

/** A count of days, for what happens once a day. */
export function calendarDay(now: number): number {
  return Math.floor((now + CALENDAR.offsetHours * 3_600_000) / DAY_MS);
}

/** Today in the week, Monday as 0. The first of January 1970 was a Thursday. */
export function weekday(now: number): number {
  return (Math.floor((now + CALENDAR.offsetHours * 3_600_000) / DAY_MS) + 3) % 7;
}

/** Whether an event is on at this moment. */
export function isOn(event: string, now: number): boolean {
  return CALENDAR.events[event]?.days.includes(weekday(now)) ?? false;
}

/** The next day the event is on, today if it is on; its name. */
export function nextDay(event: string, now: number): string {
  const days = CALENDAR.events[event]?.days ?? [];
  const today = weekday(now);
  for (let i = 0; i < 7; i++) if (days.includes((today + i) % 7)) return DAY_NAMES[(today + i) % 7]!;
  return '';
}
