import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localStore } from "../app-core/local-store.mjs";
import { handleApi } from "../app-core/api.mjs";
import { zonedParts, zonedTimeToUtc } from "../app-core/schedule.mjs";

const env = {
  ADMIN_EMAIL: "owner@example.test",
  ADMIN_PASSWORD: "test-strong-password-for-suite",
};
const zone = "America/Halifax";
// A dealership-local slot on the next `day` at least two days out.
const at = (day, minutes) => {
  let t = Date.now() + 2 * 86400000;
  while (zonedParts(t, zone).day !== day) t += 86400000;
  return new Date(zonedTimeToUtc(zonedParts(t, zone).date, minutes, zone)).toISOString();
};
const localDate = (iso) => zonedParts(iso, zone).date;

async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "northstar-request-changes-"));
  const db = localStore(dir);
  t.after(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  let cookie = "";
  let count = 0;
  const request = async (path, { method = "GET", body, staff = false, store = db } = {}) => {
    const response = await handleApi(
      new Request("https://test.example/api" + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          "cf-connecting-ip": `changes-${count++}`,
          ...(staff && cookie ? { Cookie: cookie } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      }),
      env,
      store,
    );
    if (response.headers.get("set-cookie"))
      cookie = response.headers.get("set-cookie").split(";")[0];
    return { status: response.status, data: await response.json() };
  };
  await request("/auth/login", { method: "POST", body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD } });
  const vehicle = (
    await request("/admin/inventory", {
      method: "POST",
      staff: true,
      body: { make: "Mazda", model: "CX-30", year: 2025, price: 34120, bodyType: "SUV", fuelType: "Gasoline" },
    })
  ).data.vehicle;
  const book = async (scheduledFor, name = "Riley Shopper") => {
    const result = await request("/inquiries", {
      method: "POST",
      body: { name, email: "riley@example.test", message: "Test drive please.", vehicleId: vehicle.id, scheduledFor },
    });
    assert.equal(result.status, 201);
    return { token: result.data.trackingToken, appointment: result.data.appointment };
  };
  const slotOpen = async (iso) =>
    (await request(`/availability?date=${localDate(iso)}`)).data.slots.find((s) => s.start === iso).available;
  return { db, request, book, slotOpen };
}

test("shopper reschedules with their request code and staff must reconfirm", async (t) => {
  const f = await fixture(t);
  const first = at("wed", 600);
  const second = at("thu", 840);
  const { token, appointment } = await f.book(first);
  const staff = await f.request("/admin/appointments/" + appointment.id, {
    method: "PATCH",
    staff: true,
    body: { status: "confirmed" },
  });
  assert.equal(staff.status, 200);
  const moved = await f.request("/request/reschedule", {
    method: "POST",
    body: { token, appointmentId: appointment.id, scheduledFor: second },
  });
  assert.equal(moved.status, 200);
  assert.equal(moved.data.appointment.scheduledFor, second);
  assert.equal(moved.data.appointment.status, "requested");
  assert.equal(moved.data.appointment.previousScheduledFor, first);
  assert.equal(moved.data.appointment.rescheduleCount, 1);
  assert.equal(await f.slotOpen(first), true);
  assert.equal(await f.slotOpen(second), false);
  const status = await f.request("/request/status", { method: "POST", body: { token } });
  assert.equal(status.data.appointments.length, 1);
  assert.equal(status.data.appointments[0].scheduledFor, second);
  assert.equal(status.data.appointments[0].changeable, true);
  const overview = (await f.request("/admin/overview", { staff: true })).data;
  assert.equal(overview.appointments[0].status, "requested");
  assert.ok(overview.appointments[0].rescheduledAt);
});

test("reschedule rejects taken, out-of-hours, unchanged and malformed times", async (t) => {
  const f = await fixture(t);
  const mine = at("tue", 600);
  const theirs = at("tue", 660);
  const { token, appointment } = await f.book(mine);
  await f.book(theirs, "Another Shopper");
  const attempt = (scheduledFor) =>
    f.request("/request/reschedule", {
      method: "POST",
      body: { token, appointmentId: appointment.id, scheduledFor },
    });
  const taken = await attempt(theirs);
  assert.equal(taken.status, 409);
  assert.match(taken.data.error, /just been requested/);
  assert.equal((await attempt(at("sun", 720))).status, 400);
  assert.equal((await attempt(at("tue", 20 * 60))).status, 400);
  assert.equal((await attempt(mine)).status, 400);
  assert.equal((await attempt("2020-01-01T13:00:00.000Z")).status, 400);
  assert.equal((await attempt(12345)).status, 400);
  const status = await f.request("/request/status", { method: "POST", body: { token } });
  assert.equal(status.data.appointments[0].scheduledFor, mine);
});

test("request codes only reach their own appointments", async (t) => {
  const f = await fixture(t);
  const a = await f.book(at("wed", 600));
  const b = await f.book(at("wed", 630), "Second Shopper");
  for (const path of ["/request/reschedule", "/request/cancel"]) {
    const wrongCode = await f.request(path, {
      method: "POST",
      body: { token: "not-a-real-code", appointmentId: a.appointment.id, scheduledFor: at("thu", 600) },
    });
    assert.equal(wrongCode.status, 404);
    const otherLead = await f.request(path, {
      method: "POST",
      body: { token: a.token, appointmentId: b.appointment.id, scheduledFor: at("thu", 600) },
    });
    assert.equal(otherLead.status, 404);
  }
  const status = await f.request("/request/status", { method: "POST", body: { token: b.token } });
  assert.equal(status.data.appointments[0].status, "requested");
});

test("shopper cancellation frees the slot and is final", async (t) => {
  const f = await fixture(t);
  const slot = at("fri", 900);
  const { token, appointment } = await f.book(slot);
  const cancelled = await f.request("/request/cancel", {
    method: "POST",
    body: { token, appointmentId: appointment.id },
  });
  assert.equal(cancelled.status, 200);
  assert.equal(cancelled.data.appointment.status, "cancelled");
  assert.equal(cancelled.data.appointment.cancelledBy, "shopper");
  assert.equal(await f.slotOpen(slot), true);
  const again = await f.request("/request/cancel", { method: "POST", body: { token, appointmentId: appointment.id } });
  assert.equal(again.status, 409);
  const move = await f.request("/request/reschedule", {
    method: "POST",
    body: { token, appointmentId: appointment.id, scheduledFor: at("fri", 960) },
  });
  assert.equal(move.status, 409);
  const status = await f.request("/request/status", { method: "POST", body: { token } });
  assert.equal(status.data.appointments[0].changeable, false);
  assert.equal(status.data.status, "new");
  // Another shopper can now take the freed time.
  await f.book(slot, "Next Shopper");
});

test("completed and past test drives cannot be changed online", async (t) => {
  const f = await fixture(t);
  const { token, appointment } = await f.book(at("mon", 600));
  await f.request("/admin/appointments/" + appointment.id, { method: "PATCH", staff: true, body: { status: "confirmed" } });
  await f.request("/admin/appointments/" + appointment.id, { method: "PATCH", staff: true, body: { status: "completed" } });
  const completed = await f.request("/request/cancel", { method: "POST", body: { token, appointmentId: appointment.id } });
  assert.equal(completed.status, 409);
  const past = await f.book(at("mon", 660), "Past Shopper");
  const pastTime = "2026-01-05T14:00:00.000Z";
  await f.db.run("UPDATE appointments SET scheduled_for=?, payload=json_set(payload,'$.scheduledFor',?) WHERE id=?", [
    pastTime,
    pastTime,
    past.appointment.id,
  ]);
  const late = await f.request("/request/reschedule", {
    method: "POST",
    body: { token: past.token, appointmentId: past.appointment.id, scheduledFor: at("tue", 600) },
  });
  assert.equal(late.status, 409);
  assert.match(late.data.error, /contact the dealership/);
});

test("a staff update between read and write is not overwritten", async (t) => {
  const f = await fixture(t);
  const { token, appointment } = await f.book(at("wed", 720));
  // Simulate staff confirming the appointment just before the shopper's write lands.
  const racing = {
    ...f.db,
    batch: async (queries) => {
      const [sql, params] = queries[0];
      if (/^UPDATE appointments SET (scheduled_for|status)=/.test(sql) && params.includes(appointment.id))
        await f.db.run("UPDATE appointments SET status='confirmed' WHERE id=?", [appointment.id]);
      return f.db.batch(queries);
    },
  };
  for (const [path, extra] of [
    ["/request/reschedule", { scheduledFor: at("thu", 720) }],
    ["/request/cancel", {}],
  ]) {
    await f.db.run("UPDATE appointments SET status='requested' WHERE id=?", [appointment.id]);
    const result = await f.request(path, {
      method: "POST",
      store: racing,
      body: { token, appointmentId: appointment.id, ...extra },
    });
    assert.equal(result.status, 409);
    assert.match(result.data.error, /just updated/);
  }
  const row = (await f.db.all("SELECT status, scheduled_for FROM appointments WHERE id=?", [appointment.id]))[0];
  assert.equal(row.status, "confirmed");
  assert.equal(row.scheduled_for, appointment.scheduledFor);
  // A rejected change leaves no event in the staff timeline.
  const [lead] = (await f.request("/admin/overview", { staff: true })).data.leads;
  assert.deepEqual(lead.activity.map((e) => e.type), ["created", "appointment_requested"]);
});
