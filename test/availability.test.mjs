import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localStore } from "../app-core/local-store.mjs";
import { handleApi } from "../app-core/api.mjs";
import {
  buildDaySlots,
  defaultTestDriveHours,
  isBookableTime,
  validateTestDriveHours,
  zonedParts,
  zonedTimeToUtc,
} from "../app-core/schedule.mjs";

const cfg = { timezone: "America/Halifax", testDriveHours: defaultTestDriveHours };
const env = {
  ADMIN_EMAIL: "owner@example.test",
  ADMIN_PASSWORD: "test-strong-password-for-suite",
};

test("local times convert to UTC across the daylight-saving change", () => {
  // Halifax is UTC-3 before 1 Nov 2026 and UTC-4 after.
  assert.equal(new Date(zonedTimeToUtc("2026-10-30", 540, cfg.timezone)).toISOString(), "2026-10-30T12:00:00.000Z");
  assert.equal(new Date(zonedTimeToUtc("2026-11-02", 540, cfg.timezone)).toISOString(), "2026-11-02T13:00:00.000Z");
  assert.deepEqual(zonedParts("2026-11-02T13:00:00Z", cfg.timezone), { date: "2026-11-02", day: "mon", minutes: 540 });
});

test("day slots follow opening hours and hide past or taken times", () => {
  const now = Date.parse("2026-10-26T15:10:00Z"); // Monday 12:10 in Halifax
  const taken = new Set(["2026-10-26T17:00:00.000Z"]);
  const day = buildDaySlots("2026-10-26", cfg, taken, now);
  assert.equal(day.day, "mon");
  assert.equal(day.slots.length, 18);
  assert.equal(day.slots[0].label, "09:00");
  assert.equal(day.slots.at(-1).label, "17:30");
  const open = day.slots.filter((s) => s.available).map((s) => s.label);
  assert.equal(open[0], "12:30");
  assert.ok(!open.includes("14:00"));
  const sunday = buildDaySlots("2026-11-01", cfg, new Set(), now);
  assert.equal(sunday.closed, true);
  assert.deepEqual(sunday.slots, []);
  for (const date of ["2026-10-25", "2027-03-01", "2026-02-30", "tomorrow", ""])
    assert.throws(() => buildDaySlots(date, cfg, new Set(), now), { status: 400 });
});

test("bookable times must match a slot inside hours", () => {
  assert.equal(isBookableTime("2026-11-02T13:00:00Z", cfg), true); // Mon 09:00
  assert.equal(isBookableTime("2026-11-02T21:30:00Z", cfg), true); // Mon 17:30
  assert.equal(isBookableTime("2026-11-02T22:00:00Z", cfg), false); // closing time
  assert.equal(isBookableTime("2026-11-02T13:15:00Z", cfg), false);
  assert.equal(isBookableTime("2026-11-01T14:00:00Z", cfg), false); // Sunday
});

test("test-drive hours validation rejects malformed schedules", () => {
  assert.deepEqual(validateTestDriveHours({ ...defaultTestDriveHours, sat: ["10:00", "16:00"] }).sat, ["10:00", "16:00"]);
  for (const bad of [
    null,
    [],
    { ...defaultTestDriveHours, mon: ["18:00", "09:00"] },
    { ...defaultTestDriveHours, mon: ["09:00", "09:00"] },
    { ...defaultTestDriveHours, mon: ["9:00", "18:00"] },
    { ...defaultTestDriveHours, mon: ["09:15", "18:00"] },
    { ...defaultTestDriveHours, mon: "09:00-18:00" },
    { ...defaultTestDriveHours, holiday: ["09:00", "12:00"] },
  ])
    assert.throws(() => validateTestDriveHours(bad), { status: 400 });
});

async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "northstar-availability-"));
  const db = localStore(dir);
  t.after(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  let cookie = "";
  let count = 0;
  const request = async (path, { method = "GET", body } = {}) => {
    const response = await handleApi(
      new Request("https://test.example/api" + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          "cf-connecting-ip": `availability-${count++}`,
          ...(cookie ? { Cookie: cookie } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
      env,
      db,
    );
    if (response.headers.get("set-cookie"))
      cookie = response.headers.get("set-cookie").split(";")[0];
    return { status: response.status, data: await response.json() };
  };
  await request("/auth/login", { method: "POST", body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD } });
  const vehicle = (
    await request("/admin/inventory", {
      method: "POST",
      body: { make: "Honda", model: "Civic", year: 2025, price: 28900, bodyType: "Sedan", fuelType: "Gasoline" },
    })
  ).data.vehicle;
  return { db, request, vehicle };
}

// The next date (at least two days out) in Halifax that falls on `day`.
const nextLocal = (day) => {
  let t = Date.now() + 2 * 86400000;
  while (zonedParts(t, cfg.timezone).day !== day) t += 86400000;
  return zonedParts(t, cfg.timezone).date;
};
const inquiry = { name: "Slot Tester", email: "slot@example.test", message: "Test drive please." };

test("availability API marks requested slots taken and frees cancelled ones", async (t) => {
  const f = await fixture(t);
  const date = nextLocal("wed");
  const before = await f.request(`/availability?date=${date}`);
  assert.equal(before.status, 200);
  assert.equal(before.data.timezone, "America/Halifax");
  assert.ok(before.data.slots.every((s) => s.available));
  const chosen = before.data.slots[4].start;
  const booked = await f.request("/inquiries", {
    method: "POST",
    body: { ...inquiry, vehicleId: f.vehicle.id, scheduledFor: chosen },
  });
  assert.equal(booked.status, 201);
  const after = await f.request(`/availability?date=${date}`);
  assert.equal(after.data.slots.find((s) => s.start === chosen).available, false);
  assert.equal(after.data.slots.filter((s) => !s.available).length, 1);
  assert.ok(!JSON.stringify(after.data).includes("Slot Tester"));
  await f.request("/admin/appointments/" + booked.data.appointment.id, { method: "PATCH", body: { status: "cancelled" } });
  const freed = await f.request(`/availability?date=${date}`);
  assert.equal(freed.data.slots.find((s) => s.start === chosen).available, true);
  assert.equal((await f.request("/availability?date=not-a-date")).status, 400);
});

test("requests outside test-drive hours are rejected without saving a lead", async (t) => {
  const f = await fixture(t);
  const sunday = nextLocal("sun");
  const sundayNoon = new Date(zonedTimeToUtc(sunday, 720, cfg.timezone)).toISOString();
  const lateWeekday = new Date(zonedTimeToUtc(nextLocal("tue"), 20 * 60, cfg.timezone)).toISOString();
  for (const scheduledFor of [sundayNoon, lateWeekday]) {
    const response = await f.request("/inquiries", {
      method: "POST",
      body: { ...inquiry, vehicleId: f.vehicle.id, scheduledFor },
    });
    assert.equal(response.status, 400);
    assert.match(response.data.error, /test-drive hours/);
  }
  assert.equal((await f.db.all("SELECT id FROM leads")).length, 0);
});

test("staff can open Saturday hours and shoppers see the new slots", async (t) => {
  const f = await fixture(t);
  const saturday = nextLocal("sat");
  assert.equal((await f.request(`/availability?date=${saturday}`)).data.closed, true);
  const invalid = await f.request("/admin/settings", {
    method: "PATCH",
    body: { testDriveHours: { ...defaultTestDriveHours, sat: ["16:00", "10:00"] } },
  });
  assert.equal(invalid.status, 400);
  const saved = await f.request("/admin/settings", {
    method: "PATCH",
    body: { testDriveHours: { ...defaultTestDriveHours, sat: ["10:00", "14:00"] } },
  });
  assert.equal(saved.status, 200);
  assert.deepEqual(saved.data.settings.testDriveHours.sat, ["10:00", "14:00"]);
  const open = (await f.request(`/availability?date=${saturday}`)).data;
  assert.deepEqual(open.slots.map((s) => s.label), ["10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30"]);
  const config = await f.request("/config");
  assert.deepEqual(config.data.testDriveHours.sat, ["10:00", "14:00"]);
  const booked = await f.request("/inquiries", {
    method: "POST",
    body: { ...inquiry, vehicleId: f.vehicle.id, scheduledFor: open.slots[0].start },
  });
  assert.equal(booked.status, 201);
});
