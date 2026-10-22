import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localStore } from "../app-core/local-store.mjs";
import { handleApi } from "../app-core/api.mjs";
import { buildInsights, firstResponseMinutes, furthestStage, median } from "../app-core/insights.mjs";
import { zonedParts, zonedTimeToUtc } from "../app-core/schedule.mjs";

const now = Date.parse("2026-10-22T16:00:00Z");
const ago = (hours) => new Date(now - hours * 3600000).toISOString();
const ev = (type, actor, hoursAgo, extra = {}) => ({ id: `${type}-${hoursAgo}`, type, actor, at: ago(hoursAgo), ...extra });
const lead = (id, createdHoursAgo, status, activity, extra = {}) => ({
  id, status, createdAt: ago(createdHoursAgo), activity, name: `Lead ${id}`, email: `${id}@example.test`, ...extra,
});
const vehicles = [
  { id: "rav4", year: 2025, make: "Toyota", model: "RAV4" },
  { id: "civic", year: 2025, make: "Honda", model: "Civic" },
];
const leads = [
  // Contacted after 30 minutes, then closed: still counts as contacted.
  lead("a", 100, "closed", [
    ev("created", "shopper", 100),
    ev("status_changed", "staff", 99.5, { from: "new", to: "contacted" }),
    ev("status_changed", "staff", 90, { from: "contacted", to: "closed" }),
  ], { vehicleId: "rav4", vehicleName: "2025 Toyota RAV4" }),
  // Reached won; first response was a note after 2 hours.
  lead("b", 50, "won", [
    ev("created", "shopper", 50),
    ev("appointment_requested", "shopper", 50),
    ev("notes_updated", "staff", 48),
    ev("status_changed", "staff", 40, { from: "new", to: "won" }),
  ], { vehicleId: "rav4", vehicleName: "2025 Toyota RAV4" }),
  // Phone lead, qualified after 10 hours.
  lead("c", 20, "qualified", [
    ev("created", "phone", 20),
    ev("status_changed", "staff", 10, { from: "new", to: "qualified" }),
  ], { source: "voice" }),
  // No staff response yet; shopper-only activity does not count.
  lead("d", 5, "new", [ev("created", "shopper", 5), ev("appointment_cancelled", "shopper", 4)], { vehicleId: "civic", vehicleName: "2025 Honda Civic" }),
  // Saved before the timeline existed.
  lead("e", 30, "contacted", undefined, { vehicleId: "gone", vehicleName: "2019 Kia Soul" }),
  // Outside a 7-day window, inside 30 days.
  lead("f", 24 * 10, "new", [ev("created", "shopper", 240)], { vehicleId: "civic" }),
];
const appointments = [
  { id: "1", leadId: "b", vehicleId: "rav4", status: "completed", scheduledFor: ago(45) },
  { id: "2", leadId: "a", vehicleId: "rav4", status: "confirmed", scheduledFor: ago(80) },
  { id: "3", leadId: "d", vehicleId: "civic", status: "cancelled", scheduledFor: ago(2) },
  { id: "4", leadId: "d", vehicleId: "civic", status: "requested", scheduledFor: ago(1) },
  { id: "5", leadId: "b", vehicleId: "rav4", status: "confirmed", scheduledFor: new Date(now + 86400000).toISOString() },
  { id: "6", leadId: "f", vehicleId: "civic", status: "completed", scheduledFor: ago(24 * 9) },
];

test("median and per-lead helpers", () => {
  assert.equal(median([]), null);
  assert.equal(median([5]), 5);
  assert.equal(median([9, 1, 5]), 5);
  assert.equal(median([1, 2, 3, 10]), 2.5);
  assert.equal(furthestStage(leads[0]), 1);
  assert.equal(furthestStage(leads[1]), 3);
  assert.equal(furthestStage({ status: "closed" }), 0);
  assert.equal(firstResponseMinutes(leads[0]), 30);
  assert.equal(firstResponseMinutes(leads[3]), null);
});

test("seven-day insights: funnel, response time, show rate and leads per vehicle", () => {
  const result = buildInsights({ leads, appointments, vehicles, days: 7, now });
  assert.deepEqual(
    result.funnel.map((s) => [s.stage, s.count, s.percent]),
    [["received", 5, 100], ["contacted", 4, 80], ["qualified", 2, 40], ["won", 1, 20]],
  );
  // Responses of 30, 120 and 600 minutes; lead d is awaiting, lead e predates the timeline.
  assert.deepEqual(result.response, { medianMinutes: 120, responded: 3, awaiting: 1, untracked: 1 });
  assert.deepEqual(result.testDrives, {
    completed: 1, notCompleted: 1, cancelled: 1, unconfirmed: 1, showRate: 50, upcoming: 1,
  });
  assert.deepEqual(result.leadsPerVehicle, [
    { vehicleId: "rav4", vehicleName: "2025 Toyota RAV4", listed: true, leads: 2, testDrives: 3, won: 1 },
    { vehicleId: "civic", vehicleName: "2025 Honda Civic", listed: true, leads: 1, testDrives: 2, won: 0 },
    { vehicleId: "gone", vehicleName: "2019 Kia Soul", listed: false, leads: 1, testDrives: 0, won: 0 },
  ]);
  assert.equal(result.generalInquiries, 1);
  assert.deepEqual(result.sources, { web: 4, voice: 1 });
  assert.equal(result.since, "2026-10-15T16:00:00.000Z");
  // Insights are aggregates: no shopper names or contact details.
  assert.doesNotMatch(JSON.stringify(result), /example\.test|Lead [a-f]/);
});

test("longer periods include older activity; empty data gives empty metrics", () => {
  const month = buildInsights({ leads, appointments, vehicles, days: 30, now });
  assert.equal(month.funnel[0].count, 6);
  assert.equal(month.testDrives.completed, 2);
  assert.equal(month.testDrives.showRate, 66.7);
  assert.equal(month.leadsPerVehicle.find((r) => r.vehicleId === "civic").leads, 2);
  const empty = buildInsights({ leads: [], appointments: [], vehicles: [], days: 30, now });
  assert.deepEqual(empty.funnel.map((s) => [s.count, s.percent]), [[0, null], [0, null], [0, null], [0, null]]);
  assert.equal(empty.response.medianMinutes, null);
  assert.equal(empty.testDrives.showRate, null);
  assert.deepEqual(empty.leadsPerVehicle, []);
});

test("insights API is staff-only and reflects real workflow events", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "northstar-insights-"));
  const db = localStore(dir);
  t.after(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  const env = { ADMIN_EMAIL: "owner@example.test", ADMIN_PASSWORD: "test-strong-password-for-suite" };
  let cookie = "";
  let count = 0;
  const request = async (path, { method = "GET", body, staff = true } = {}) => {
    const response = await handleApi(
      new Request("https://test.example/api" + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          "cf-connecting-ip": `insights-${count++}`,
          ...(staff && cookie ? { Cookie: cookie } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
      env,
      db,
    );
    if (response.headers.get("set-cookie")) cookie = response.headers.get("set-cookie").split(";")[0];
    return { status: response.status, data: await response.json() };
  };
  assert.equal((await request("/admin/insights", { staff: false })).status, 401);
  await request("/auth/login", { method: "POST", body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD } });
  for (const bad of ["0", "14", "abc", "-7", ""]) assert.equal((await request(`/admin/insights?days=${bad}`)).status, 400, bad);
  const { vehicle } = (
    await request("/admin/inventory", {
      method: "POST",
      body: { make: "Mazda", model: "CX-30", year: 2025, price: 34120, bodyType: "SUV", fuelType: "Gasoline" },
    })
  ).data;
  let t0 = Date.now() + 2 * 86400000;
  while (zonedParts(t0, "America/Halifax").day !== "wed") t0 += 86400000;
  const scheduledFor = new Date(zonedTimeToUtc(zonedParts(t0, "America/Halifax").date, 600, "America/Halifax")).toISOString();
  const booked = (
    await request("/inquiries", {
      method: "POST",
      staff: false,
      body: { name: "Quinn", email: "quinn@example.test", message: "Hi", vehicleId: vehicle.id, scheduledFor },
    })
  ).data;
  await request("/inquiries", { method: "POST", staff: false, body: { name: "Rae", email: "rae@example.test", message: "General question" } });
  await request("/admin/leads/" + booked.id, { method: "PATCH", body: { status: "contacted" } });
  await request("/admin/appointments/" + booked.appointment.id, { method: "PATCH", body: { status: "confirmed" } });
  const insights = await request("/admin/insights");
  assert.equal(insights.status, 200);
  assert.equal(insights.data.days, 30);
  assert.deepEqual(insights.data.funnel.map((s) => s.count), [2, 1, 0, 0]);
  assert.equal(insights.data.response.responded, 1);
  assert.equal(insights.data.response.awaiting, 1);
  assert.ok(insights.data.response.medianMinutes >= 0 && insights.data.response.medianMinutes < 5);
  assert.equal(insights.data.testDrives.upcoming, 1);
  assert.equal(insights.data.testDrives.showRate, null);
  assert.deepEqual(
    insights.data.leadsPerVehicle.map((r) => [r.vehicleName, r.leads, r.testDrives]),
    [["2025 Mazda CX-30", 1, 1]],
  );
  assert.equal(insights.data.generalInquiries, 1);
  assert.equal((await request("/admin/insights?days=7")).data.days, 7);
});
