import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localStore } from "../app-core/local-store.mjs";
import { handleApi } from "../app-core/api.mjs";
const env = {
  ADMIN_EMAIL: "owner@example.test",
  ADMIN_PASSWORD: "test-strong-password-for-suite",
};
async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "northstar-test-"));
  let db = localStore(dir);
  t.after(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  let cookie = "";
  let count = 0;
  return {
    get db() {
      return db;
    },
    reopen() {
      db.close();
      db = localStore(dir);
    },
    async request(
      path,
      { method = "GET", body, authenticated = true, origin, headers = {} } = {},
    ) {
      const response = await handleApi(
        new Request("https://test.example/api" + path, {
          method,
          headers: {
            "Content-Type": "application/json",
            "cf-connecting-ip": `test-${count++}`,
            ...(cookie && authenticated ? { Cookie: cookie } : {}),
            ...(origin ? { Origin: origin } : {}),
            ...headers,
          },
          ...(body ? { body: JSON.stringify(body) } : {}),
        }),
        env,
        db,
      );
      if (response.headers.get("set-cookie"))
        cookie = response.headers.get("set-cookie").split(";")[0];
      return {
        status: response.status,
        data: await response.json(),
        headers: response.headers,
      };
    },
    async login() {
      return this.request("/auth/login", {
        method: "POST",
        body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
      });
    },
  };
}
const vehicle = {
  make: "Toyota",
  model: "RAV4",
  year: 2025,
  price: 39000,
  mileage: 12000,
  bodyType: "SUV",
  fuelType: "Hybrid",
  inStock: true,
};
const inquiry = {
  name: "Test Customer",
  email: "customer@example.test",
  message: "Please arrange a test drive.",
};
const slot = () => {
  const d = new Date(Date.now() + 86400000);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString();
};
test("staff data is protected; cookie is secure, logout revokes access", async (t) => {
  const f = await fixture(t);
  assert.equal((await f.request("/admin/overview")).status, 401);
  const login = await f.login();
  assert.equal(login.status, 200);
  assert.match(
    login.headers.get("set-cookie"),
    /HttpOnly.*SameSite=Strict.*Secure/,
  );
  assert.equal(login.data.token, undefined);
  assert.equal((await f.request("/admin/overview")).status, 200);
  await f.request("/auth/logout", { method: "POST" });
  assert.equal((await f.request("/admin/overview")).status, 401);
});
test("inventory persists across reopening the database", async (t) => {
  const f = await fixture(t);
  await f.login();
  const added = await f.request("/admin/inventory", {
    method: "POST",
    body: vehicle,
  });
  assert.equal(added.status, 201);
  f.reopen();
  const list = await f.request("/inventory");
  assert.equal(list.data.vehicles[0].model, "RAV4");
  assert.equal(
    (
      await f.request("/admin/inventory/" + added.data.vehicle.id, {
        method: "PATCH",
        body: { price: -1 },
      })
    ).status,
    400,
  );
});
test("shopper request, staff confirmation, private tracking, and erasure work end-to-end", async (t) => {
  const f = await fixture(t);
  await f.login();
  const v = (
    await f.request("/admin/inventory", { method: "POST", body: vehicle })
  ).data.vehicle;
  const result = await f.request("/inquiries", {
    method: "POST",
    authenticated: false,
    body: { ...inquiry, vehicleId: v.id, scheduledFor: slot() },
  });
  assert.equal(result.status, 201);
  assert.equal(result.data.appointment.status, "requested");
  let overview = (await f.request("/admin/overview")).data;
  assert.equal(overview.leads[0].consent, false);
  assert.equal(overview.leads[0].trackingHash, undefined);
  assert.equal(
    (
      await f.request("/admin/appointments/" + result.data.appointment.id, {
        method: "PATCH",
        body: { status: "confirmed" },
      })
    ).status,
    200,
  );
  const tracked = await f.request("/request/status", {
    method: "POST",
    body: { token: result.data.trackingToken },
  });
  assert.equal(tracked.data.appointments[0].status, "confirmed");
  assert.equal(
    (
      await f.request("/request/status", {
        method: "POST",
        body: { token: "wrong" },
      })
    ).status,
    404,
  );
  await f.request("/request/delete", {
    method: "POST",
    body: { token: result.data.trackingToken },
  });
  overview = (await f.request("/admin/overview")).data;
  assert.equal(overview.leads.length, 0);
  assert.equal(overview.appointments.length, 0);
});
test("concurrent requests cannot reserve the same slot and rejected request leaves no orphan lead", async (t) => {
  const f = await fixture(t);
  await f.login();
  const v = (
    await f.request("/admin/inventory", { method: "POST", body: vehicle })
  ).data.vehicle;
  const body = { ...inquiry, vehicleId: v.id, scheduledFor: slot() };
  const results = await Promise.all([
    f.request("/inquiries", { method: "POST", body }),
    f.request("/inquiries", { method: "POST", body }),
  ]);
  assert.deepEqual(results.map((x) => x.status).sort(), [201, 409]);
  assert.equal((await f.request("/admin/overview")).data.leads.length, 1);
});
test("invalid payloads and foreign origins are rejected", async (t) => {
  const f = await fixture(t);
  assert.equal(
    (
      await f.request("/inquiries", {
        method: "POST",
        body: { ...inquiry, email: "bad" },
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await f.request("/inquiries", {
        method: "POST",
        origin: "https://evil.test",
        body: inquiry,
      })
    ).status,
    403,
  );
  await f.login();
  const v = (
    await f.request("/admin/inventory", { method: "POST", body: vehicle })
  ).data.vehicle;
  assert.equal(
    (
      await f.request("/inquiries", {
        method: "POST",
        body: { ...inquiry, vehicleId: v.id, scheduledFor: "2020-01-01" },
      })
    ).status,
    400,
  );
});
test("guided assistant respects hours and inventory filters", async (t) => {
  const f = await fixture(t);
  await f.login();
  await f.request("/admin/inventory", { method: "POST", body: vehicle });
  let r = await f.request("/chat", {
    method: "POST",
    body: { message: "SUV under $40,000" },
  });
  assert.equal(r.data.mode, "guided");
  assert.match(r.data.reply, /RAV4/);
  r = await f.request("/chat", {
    method: "POST",
    body: { message: "SUV under $20,000" },
  });
  assert.match(r.data.reply, /could not find/);
  r = await f.request("/chat", {
    method: "POST",
    body: { message: "What are your hours?" },
  });
  assert.match(r.data.reply, /Monday/);
});
test("failed login is throttled and native session token is revoked", async (t) => {
  const f = await fixture(t);
  for (let i = 0; i < 5; i++)
    assert.equal(
      (
        await f.request("/auth/login", {
          method: "POST",
          headers: { "cf-connecting-ip": "same" },
          body: { email: env.ADMIN_EMAIL, password: "wrong" },
        })
      ).status,
      401,
    );
  assert.equal(
    (
      await f.request("/auth/login", {
        method: "POST",
        headers: { "cf-connecting-ip": "same" },
        body: { email: env.ADMIN_EMAIL, password: "wrong" },
      })
    ).status,
    429,
  );
  const login = await f.request("/auth/login", {
    method: "POST",
    origin: "https://localhost",
    body: { email: env.ADMIN_EMAIL, password: env.ADMIN_PASSWORD },
  });
  assert.ok(login.data.token);
  assert.equal(
    (
      await f.request("/admin/overview", {
        authenticated: false,
        origin: "https://localhost",
        headers: { Authorization: "Bearer " + login.data.token },
      })
    ).status,
    200,
  );
});

test("voice intake rejects forgery, captures a caller in staff leads, and deduplicates retries", async (t) => {
  const f = await fixture(t);
  await f.login();
  const twilio = (await import("twilio")).default;
  const url = "https://test.example/api/webhooks/twilio/voice",
    token = "test-twilio-auth";
  const params = {
    CallSid: "CA" + "a".repeat(32),
    From: "+19025550123",
    SpeechResult: "I want to ask about an SUV",
    CallerName: "QA caller",
  };
  const signature = twilio.getExpectedTwilioSignature(token, url, params);
  const request = (sig) =>
    new Request(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "x-twilio-signature": sig,
      },
      body: new URLSearchParams(params),
    });
  assert.equal(
    (
      await handleApi(
        request("forged"),
        { ...env, TWILIO_AUTH_TOKEN: token },
        f.db,
      )
    ).status,
    403,
  );
  const response = await handleApi(
    request(signature),
    { ...env, TWILIO_AUTH_TOKEN: token },
    f.db,
  );
  assert.equal(response.status, 200);
  assert.match(await response.text(), /saved for our staff/);
  await handleApi(
    request(signature),
    { ...env, TWILIO_AUTH_TOKEN: token },
    f.db,
  );
  const overview = (await f.request("/admin/overview")).data;
  assert.equal(overview.leads.length, 1);
  assert.equal(overview.leads[0].source, "voice");
  assert.equal(overview.leads[0].consent, false);
});

test("AI provider failure returns a labeled guided answer, without losing the inquiry", async (t) => {
  const f = await fixture(t);
  const previous = global.fetch;
  global.fetch = async () => {
    throw new Error("test outage");
  };
  try {
    const response = await handleApi(
      new Request("https://test.example/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "What are your hours?" }),
      }),
      { ...env, OPENAI_API_KEY: "test-only" },
      f.db,
    );
    assert.equal(response.status, 200);
    assert.equal((await response.json()).mode, "guided_fallback");
  } finally {
    global.fetch = previous;
  }
});

test("sub-second appointment times cannot bypass slot uniqueness", async (t) => {
  const f = await fixture(t); await f.login();
  const created = await f.request('/admin/inventory', {method:'POST',body:vehicle});
  const response = await f.request('/inquiries', {method:'POST',body:{...inquiry,vehicleId:created.data.vehicle.id,scheduledFor:slot().replace('.000Z','.001Z')}});
  assert.equal(response.status,400);
  assert.equal((await f.db.all('SELECT id FROM leads')).length,0);
});

test("oversized streaming request is rejected before parsing", async (t) => {
  const f = await fixture(t);
  const response=await handleApi(new Request('https://test.example/api/chat',{method:'POST',body:JSON.stringify({message:'x'.repeat(33000)})}),env,f.db);
  assert.equal(response.status,413);
});
