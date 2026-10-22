// Test-drive booking hours and slot availability, computed in the
// dealership's own time zone. Dependency-free so it runs on Node and Workers.
export const SLOT_MINUTES = 30;
export const BOOKING_WINDOW_DAYS = 90;
export const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
export const defaultTestDriveHours = {
  sun: null,
  mon: ["09:00", "18:00"],
  tue: ["09:00", "18:00"],
  wed: ["09:00", "18:00"],
  thu: ["09:00", "18:00"],
  fri: ["09:00", "18:00"],
  sat: null,
};

const fail = (message) => {
  throw Object.assign(new Error(message), { status: 400 });
};
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const pad = (n) => String(n).padStart(2, "0");

// Wall-clock parts of an instant in a time zone.
export function zonedParts(instant, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
    })
      .formatToParts(new Date(instant))
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    day: parts.weekday.slice(0, 3).toLowerCase(),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
}

// UTC instant for a wall-clock time in a time zone (DST-aware).
export function zonedTimeToUtc(date, minutes, timeZone) {
  const [y, mo, d] = date.split("-").map(Number);
  const wall = Date.UTC(y, mo - 1, d, Math.floor(minutes / 60), minutes % 60);
  let guess = wall;
  for (let i = 0; i < 2; i++) {
    const p = zonedParts(guess, timeZone);
    const [py, pm, pd] = p.date.split("-").map(Number);
    const seen = Date.UTC(py, pm - 1, pd, Math.floor(p.minutes / 60), p.minutes % 60);
    guess += wall - seen;
  }
  return guess;
}

export function validateTestDriveHours(value) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail("Test-drive hours must list each day of the week.");
  const hours = {};
  for (const day of DAYS) {
    const range = value[day];
    if (range === null || range === undefined) {
      hours[day] = null;
      continue;
    }
    if (
      !Array.isArray(range) ||
      range.length !== 2 ||
      !range.every((t) => typeof t === "string" && /^([01]\d|2[0-3]):(00|30)$/.test(t)) ||
      toMinutes(range[0]) + SLOT_MINUTES > toMinutes(range[1])
    )
      fail(`Enter ${day} hours as opening and closing times on the hour or half hour.`);
    hours[day] = [range[0], range[1]];
  }
  if (Object.keys(value).some((key) => !DAYS.includes(key)))
    fail("Test-drive hours contain an unknown day.");
  return hours;
}

// Slot start times (local minutes) bookable on a given weekday.
const slotStarts = (range) => {
  if (!range) return [];
  const starts = [];
  for (let m = toMinutes(range[0]); m + SLOT_MINUTES <= toMinutes(range[1]); m += SLOT_MINUTES)
    starts.push(m);
  return starts;
};

export function isBookableTime(instant, cfg) {
  const hours = cfg.testDriveHours || defaultTestDriveHours;
  const local = zonedParts(instant, cfg.timezone);
  return slotStarts(hours[local.day]).includes(local.minutes);
}

// All slots for a local calendar date; `taken` is a Set of ISO strings.
export function buildDaySlots(date, cfg, taken, now = Date.now()) {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date))
    fail("Choose a date in YYYY-MM-DD format.");
  const [y, m, d] = date.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d, 12));
  if (probe.getUTCMonth() !== m - 1 || probe.getUTCDate() !== d) fail("Choose a valid date.");
  const today = zonedParts(now, cfg.timezone).date;
  const last = zonedParts(now + BOOKING_WINDOW_DAYS * 86400000, cfg.timezone).date;
  if (date < today || date > last)
    fail(`Choose a date between today and the next ${BOOKING_WINDOW_DAYS} days.`);
  const hours = cfg.testDriveHours || defaultTestDriveHours;
  const day = DAYS[probe.getUTCDay()];
  const slots = slotStarts(hours[day])
    .map((minutes) => {
      const start = new Date(zonedTimeToUtc(date, minutes, cfg.timezone)).toISOString();
      return {
        start,
        label: `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`,
        available: !taken.has(start) && Date.parse(start) > now,
      };
    })
    // A DST jump can map two wall-clock times to one instant; keep the first.
    .filter((slot, i, all) => all.findIndex((s) => s.start === slot.start) === i);
  return { date, day, timezone: cfg.timezone, closed: slots.length === 0, slots };
}
