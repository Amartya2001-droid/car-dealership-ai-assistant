import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localStore } from "../app-core/local-store.mjs";
import { handleApi, TRADE_IN_CONDITIONS } from "../app-core/api.mjs";
import { isBookableTime } from "../app-core/schedule.mjs";

const env = {
  ADMIN_EMAIL: "owner@example.test",
  ADMIN_PASSWORD: "test-strong-password-for-suite",
};
const tradeIn = {
  year: "2018",
  make: " Honda ",
  model: "Civic",
  mileage: "84000",
  condition: "good",
  vin: "2hgfc2f59jh512345",
  notes: "Small scratch on the rear bumper.",
};
const slot = () => {
  const d = new Date(Date.now() + 2 * 86400000);
  d.setUTCMinutes(0, 0, 0);
  while (!isBookableTime(d, { timezone: "America/Halifax" })) d.setTime(d.getTime() + 30 * 60000);
  return d.toISOString();
};

async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "northstar-trade-in-"));
  const db = localStore(dir);
  t.after(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  let cookie = "";
  let count = 0;
  const request = async (path, { method = "GET", body, staff = false } = {}) => {
    const response = await handleApi(
      new Request("https://test.example/api" + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          "cf-connecting-ip": `trade-${count++}`,
          ...(staff && cookie ? { Cookie: cookie } : {}),
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
      staff: true,
      body: { make: "Toyota", model: "RAV4", year: 2025, price: 39250, bodyType: "SUV", fuelType: "Hybrid" },
    })
  ).data.vehicle;
  const inquire = (extra = {}) =>
    request("/inquiries", {
      method: "POST",
      body: { name: "Morgan Shopper", email: "morgan@example.test", message: "Interested.", vehicleId: vehicle.id, ...extra },
    });
  const leads = async () => (await request("/admin/overview", { staff: true })).data.leads;
  return { db, request, inquire, leads };
}

test("a trade-in is normalized, shown to staff and returned to its shopper", async (t) => {
  const f = await fixture(t);
  const created = await f.inquire({ tradeIn, scheduledFor: slot() });
  assert.equal(created.status, 201);
  const [lead] = await f.leads();
  assert.deepEqual(lead.tradeIn, {
    year: 2018,
    make: "Honda",
    model: "Civic",
    mileage: 84000,
    condition: "good",
    vin: "2HGFC2F59JH512345",
    notes: "Small scratch on the rear bumper.",
  });
  assert.equal(lead.activity[0].hasTradeIn, true);
  const status = await f.request("/request/status", { method: "POST", body: { token: created.data.trackingToken } });
  assert.equal(status.data.tradeIn.model, "Civic");
  assert.equal(status.data.appointments.length, 1);
});

test("inquiries without a trade-in, or with optional fields blank, still work", async (t) => {
  const f = await fixture(t);
  assert.equal((await f.inquire()).status, 201);
  assert.equal((await f.inquire({ tradeIn: null })).status, 201);
  const minimal = await f.inquire({ tradeIn: { year: 2015, make: "Ford", model: "Escape", condition: "fair", mileage: "", vin: "", notes: "" } });
  assert.equal(minimal.status, 201);
  const leads = await f.leads();
  const withTrade = leads.find((l) => l.tradeIn);
  assert.deepEqual(
    [withTrade.tradeIn.mileage, withTrade.tradeIn.vin, withTrade.tradeIn.notes],
    [null, null, ""],
  );
  const without = leads.filter((l) => !l.tradeIn);
  assert.equal(without.length, 2);
  assert.ok(without.every((l) => l.tradeIn === null && l.activity[0].hasTradeIn === false));
});

test("invalid trade-in details are rejected before anything is saved", async (t) => {
  const f = await fixture(t);
  const maxYear = new Date().getFullYear() + 1;
  const cases = [
    ["not-an-object", /invalid/],
    [[tradeIn], /invalid/],
    [{ ...tradeIn, year: 1949 }, /year/],
    [{ ...tradeIn, year: maxYear + 1 }, /year/],
    [{ ...tradeIn, year: "2018.5" }, /year/],
    [{ ...tradeIn, make: "" }, /make/],
    [{ ...tradeIn, model: "x".repeat(61) }, /model/],
    [{ ...tradeIn, mileage: -5 }, /mileage/],
    [{ ...tradeIn, mileage: "lots" }, /mileage/],
    [{ ...tradeIn, condition: "mint" }, /condition/],
    [{ ...tradeIn, condition: undefined }, /condition/],
    [{ ...tradeIn, vin: "2HGFC2F59JH51234" }, /VIN/],
    [{ ...tradeIn, vin: "IHGFC2F59JH512345" }, /VIN/],
    [{ ...tradeIn, notes: "x".repeat(501) }, /notes/],
  ];
  for (const [value, message] of cases) {
    const result = await f.inquire({ tradeIn: value });
    assert.equal(result.status, 400, JSON.stringify(value));
    assert.match(result.data.error, message);
  }
  assert.equal((await f.db.all("SELECT id FROM leads")).length, 0);
  assert.deepEqual(TRADE_IN_CONDITIONS, ["excellent", "good", "fair", "poor"]);
});

test("only known trade-in fields are stored", async (t) => {
  const f = await fixture(t);
  await f.inquire({ tradeIn: { ...tradeIn, payoffAmount: 987654321, lender: "Some Bank" } });
  const [lead] = await f.leads();
  assert.deepEqual(Object.keys(lead.tradeIn).sort(), ["condition", "make", "mileage", "model", "notes", "vin", "year"]);
  const raw = (await f.db.all("SELECT payload FROM leads"))[0].payload;
  assert.equal(raw.includes("Some Bank"), false);
  assert.equal(raw.includes("987654321"), false);
});

test("the guided assistant explains how to add a trade-in", async (t) => {
  const f = await fixture(t);
  for (const message of ["Do you take trade-ins?", "Can I trade in my car?", "what about my old car"]) {
    const result = await f.request("/chat", { method: "POST", body: { message } });
    assert.equal(result.data.mode, "guided");
    assert.match(result.data.reply, /trade-in/i);
    assert.match(result.data.reply, /appraiser/);
  }
});
