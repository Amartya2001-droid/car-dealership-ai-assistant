import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localStore } from "../app-core/local-store.mjs";
import { handleApi, ACTIVITY_LIMIT } from "../app-core/api.mjs";
import { zonedParts, zonedTimeToUtc } from "../app-core/schedule.mjs";

const env = {
  ADMIN_EMAIL: "owner@example.test",
  ADMIN_PASSWORD: "test-strong-password-for-suite",
};
const zone = "America/Halifax";
const at = (day, minutes) => {
  let t = Date.now() + 2 * 86400000;
  while (zonedParts(t, zone).day !== day) t += 86400000;
  return new Date(zonedTimeToUtc(zonedParts(t, zone).date, minutes, zone)).toISOString();
};

async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "northstar-activity-"));
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
          "cf-connecting-ip": `activity-${count++}`,
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
      body: { make: "Toyota", model: "RAV4", year: 2025, price: 39250, bodyType: "SUV", fuelType: "Hybrid" },
    })
  ).data.vehicle;
  const inquire = async (extra = {}) => {
    const result = await request("/inquiries", {
      method: "POST",
      body: { name: "Casey Shopper", email: "casey@example.test", message: "Interested.", vehicleId: vehicle.id, ...extra },
    });
    assert.equal(result.status, 201);
    return result.data;
  };
  const lead = async (id) =>
    (await request("/admin/overview", { staff: true })).data.leads.find((l) => l.id === id);
  return { db, request, inquire, lead };
}

test("new inquiries start their timeline with how they arrived", async (t) => {
  const f = await fixture(t);
  const general = await f.inquire();
  const withDrive = await f.inquire({ scheduledFor: at("wed", 600) });
  const first = await f.lead(general.id);
  assert.deepEqual(first.activity.map((e) => [e.type, e.actor]), [["created", "shopper"]]);
  assert.equal(first.activity[0].source, "web");
  assert.ok(first.activity[0].id && first.activity[0].at);
  const second = await f.lead(withDrive.id);
  assert.deepEqual(second.activity.map((e) => e.type), ["created", "appointment_requested"]);
  assert.equal(second.activity[1].scheduledFor, at("wed", 600));
  assert.equal(second.activity[1].appointmentId, withDrive.appointment.id);
});

test("staff status and note edits are recorded only when something changed", async (t) => {
  const f = await fixture(t);
  const { id } = await f.inquire();
  const longNote = "Called back; ".repeat(40);
  const saved = await f.request("/admin/leads/" + id, {
    method: "PATCH",
    staff: true,
    body: { status: "contacted", notes: longNote },
  });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.lead.status, "contacted");
  assert.equal(saved.data.lead.trackingHash, undefined);
  const [, status, notes] = saved.data.lead.activity;
  assert.deepEqual([status.type, status.actor, status.from, status.to], ["status_changed", "staff", "new", "contacted"]);
  assert.equal(notes.type, "notes_updated");
  assert.equal(notes.preview.length, 200);
  assert.equal(notes.length, longNote.trim().length);
  const unchanged = await f.request("/admin/leads/" + id, {
    method: "PATCH",
    staff: true,
    body: { status: "contacted", notes: longNote },
  });
  assert.equal(unchanged.data.lead.activity.length, 3);
  assert.ok(unchanged.data.lead.updatedAt);
  assert.equal((await f.request("/admin/leads/" + id, { method: "PATCH", staff: true, body: { status: "lost" } })).status, 400);
  assert.equal((await f.lead(id)).activity.length, 3);
});

test("appointment changes by staff and shopper land on the lead timeline", async (t) => {
  const f = await fixture(t);
  const booked = await f.inquire({ scheduledFor: at("tue", 600) });
  const appointmentId = booked.appointment.id;
  assert.equal(
    (await f.request("/admin/appointments/" + appointmentId, { method: "PATCH", staff: true, body: { status: "confirmed" } })).status,
    200,
  );
  await f.request("/request/reschedule", {
    method: "POST",
    body: { token: booked.trackingToken, appointmentId, scheduledFor: at("thu", 660) },
  });
  await f.request("/request/cancel", { method: "POST", body: { token: booked.trackingToken, appointmentId } });
  const events = (await f.lead(booked.id)).activity;
  assert.deepEqual(
    events.map((e) => [e.type, e.actor]),
    [
      ["created", "shopper"],
      ["appointment_requested", "shopper"],
      ["appointment_confirmed", "staff"],
      ["appointment_rescheduled", "shopper"],
      ["appointment_cancelled", "shopper"],
    ],
  );
  const moved = events[3];
  assert.deepEqual([moved.from, moved.scheduledFor, moved.priorStatus], [at("tue", 600), at("thu", 660), "confirmed"]);
  assert.equal(events[4].scheduledFor, at("thu", 660));
  const times = events.map((e) => Date.parse(e.at));
  assert.deepEqual(times, [...times].sort((a, b) => a - b));
  // The shopper's own status view never exposes the staff timeline.
  const shopperView = await f.request("/request/status", { method: "POST", body: { token: booked.trackingToken } });
  assert.equal(JSON.stringify(shopperView.data).includes("activity"), false);
});

test("a stale staff transition is rejected and leaves no event", async (t) => {
  const f = await fixture(t);
  const booked = await f.inquire({ scheduledFor: at("wed", 690) });
  const appointmentId = booked.appointment.id;
  const racing = {
    ...f.db,
    batch: async (queries) => {
      if (/^UPDATE appointments SET status=/.test(queries[0][0]))
        await f.db.run("UPDATE appointments SET status='cancelled' WHERE id=?", [appointmentId]);
      return f.db.batch(queries);
    },
  };
  const result = await f.request("/admin/appointments/" + appointmentId, {
    method: "PATCH",
    staff: true,
    store: racing,
    body: { status: "confirmed" },
  });
  assert.equal(result.status, 409);
  assert.deepEqual((await f.lead(booked.id)).activity.map((e) => e.type), ["created", "appointment_requested"]);
});

test("a staff edit does not erase an event written at the same moment", async (t) => {
  const f = await fixture(t);
  const booked = await f.inquire({ scheduledFor: at("fri", 600) });
  // The shopper cancels between the staff member loading and saving the lead.
  const racing = {
    ...f.db,
    run: async (sql, params) => {
      if (/^UPDATE leads SET payload=json_set\(json_set\(payload,'\$\.updatedAt'/.test(sql) || /^UPDATE leads SET payload=json_set\(payload,'\$\.updatedAt'/.test(sql)) {
        const cancelled = await f.request("/request/cancel", {
          method: "POST",
          body: { token: booked.trackingToken, appointmentId: booked.appointment.id },
        });
        assert.equal(cancelled.status, 200);
      }
      return f.db.run(sql, params);
    },
  };
  const saved = await f.request("/admin/leads/" + booked.id, {
    method: "PATCH",
    staff: true,
    store: racing,
    body: { status: "contacted", notes: "Left a voicemail." },
  });
  assert.equal(saved.status, 200);
  const lead = await f.lead(booked.id);
  assert.equal(lead.status, "contacted");
  assert.equal(lead.notes, "Left a voicemail.");
  assert.deepEqual(
    lead.activity.map((e) => e.type),
    ["created", "appointment_requested", "appointment_cancelled", "status_changed", "notes_updated"],
  );
});

test(`the timeline keeps the newest ${ACTIVITY_LIMIT} events`, async (t) => {
  const f = await fixture(t);
  const { id } = await f.inquire();
  const filler = Array.from({ length: ACTIVITY_LIMIT - 1 }, (_, i) => ({ id: `old-${i}`, at: new Date(i).toISOString(), type: "notes_updated", actor: "staff" }));
  await f.db.run("UPDATE leads SET payload=json_set(payload,'$.activity',json(?)) WHERE id=?", [JSON.stringify(filler), id]);
  await f.request("/admin/leads/" + id, { method: "PATCH", staff: true, body: { status: "qualified", notes: "Two events at once." } });
  let events = (await f.lead(id)).activity;
  assert.equal(events.length, ACTIVITY_LIMIT);
  assert.equal(events[0].id, "old-1");
  assert.deepEqual(events.slice(-2).map((e) => e.type), ["status_changed", "notes_updated"]);
  await f.request("/admin/leads/" + id, { method: "PATCH", staff: true, body: { status: "won" } });
  events = (await f.lead(id)).activity;
  assert.equal(events.length, ACTIVITY_LIMIT);
  assert.equal(events[0].id, "old-2");
  assert.equal(events.at(-1).to, "won");
});
