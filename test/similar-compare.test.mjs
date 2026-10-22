import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { localStore } from "../app-core/local-store.mjs";
import { handleApi } from "../app-core/api.mjs";
import { compareVehicles, rankSimilar, similarity, MIN_SIMILARITY } from "../app-core/similar.mjs";

const env = {
  ADMIN_EMAIL: "owner@example.test",
  ADMIN_PASSWORD: "test-strong-password-for-suite",
};
const car = (id, make, model, bodyType, fuelType, price, year = 2025, mileage = 10000, inStock = true) => ({
  id, make, model, bodyType, fuelType, price, year, mileage, inStock,
});
const rav4 = car("rav4", "Toyota", "RAV4", "SUV", "Hybrid", 39250, 2025, 8200);
const lot = [
  rav4,
  car("crv", "Honda", "CR-V", "SUV", "Hybrid", 40100, 2025, 5000),
  car("cx30", "Mazda", "CX-30", "SUV", "Gasoline", 34120, 2024, 5600),
  car("highlander", "Toyota", "Highlander", "SUV", "Hybrid", 52000, 2023, 30000),
  car("civic", "Honda", "Civic", "Sedan", "Gasoline", 28900, 2025, 14200),
  car("sold-suv", "Kia", "Sportage", "SUV", "Hybrid", 39000, 2025, 9000, false),
  car("truck", "Ford", "F-150", "Truck", "Diesel", 79000, 2019, 90000),
];

test("similarity favours body type, fuel, price, year and make", () => {
  const twin = similarity(rav4, { ...rav4, id: "twin" });
  assert.equal(twin.score, 100);
  assert.deepEqual(twin.reasons, ["Also an SUV", "Hybrid too", "Similar price", "Also by Toyota"]);
  const crv = similarity(rav4, lot[1]);
  const cx30 = similarity(rav4, lot[2]);
  const truck = similarity(rav4, lot[6]);
  assert.ok(crv.score > cx30.score && cx30.score > truck.score);
  assert.ok(truck.score < MIN_SIMILARITY);
  assert.ok(cx30.reasons.includes("Lower price"));
  assert.equal(similarity(lot[4], { ...lot[4], id: "x" }).reasons[0], "Also a Sedan");
});

test("ranking excludes the vehicle itself, sold stock and weak matches", () => {
  const ranked = rankSimilar(rav4, lot, 6);
  const ids = ranked.map((m) => m.vehicle.id);
  assert.equal(ids[0], "crv");
  assert.ok(!ids.includes("rav4"));
  assert.ok(!ids.includes("sold-suv"));
  assert.ok(!ids.includes("truck"));
  assert.ok(ranked.every((m, i) => i === 0 || ranked[i - 1].score >= m.score));
  assert.equal(rankSimilar(rav4, lot, 1).length, 1);
  // A sold vehicle can still be the starting point for alternatives.
  assert.equal(rankSimilar(lot[5], lot)[0].vehicle.id, "rav4");
});

test("compare highlights the best price, mileage and year, sharing ties", () => {
  const { vehicles, highlights } = compareVehicles([rav4, lot[1], lot[2]]);
  assert.deepEqual(vehicles.map((v) => v.id), ["rav4", "crv", "cx30"]);
  assert.deepEqual(highlights.lowestPrice, ["cx30"]);
  assert.deepEqual(highlights.lowestMileage, ["crv"]);
  assert.deepEqual(highlights.newest, ["rav4", "crv"]);
  // When every vehicle ties, no badge is shown.
  assert.deepEqual(compareVehicles([rav4, { ...rav4, id: "copy" }]).highlights.newest, []);
});

async function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "northstar-similar-"));
  const db = localStore(dir);
  t.after(() => {
    db.close();
    rmSync(dir, { recursive: true, force: true });
  });
  for (const v of lot) await db.run("INSERT INTO vehicles(id,payload) VALUES(?,?)", [v.id, JSON.stringify(v)]);
  const get = async (path) => {
    const response = await handleApi(new Request("https://test.example/api" + path), env, db);
    return { status: response.status, data: await response.json() };
  };
  return { get };
}

test("similar-vehicles API returns ranked in-stock alternatives", async (t) => {
  const f = await fixture(t);
  const result = await f.get("/inventory/rav4/similar");
  assert.equal(result.status, 200);
  assert.equal(result.data.vehicleId, "rav4");
  assert.equal(result.data.similar.length, 3);
  assert.equal(result.data.similar[0].vehicle.id, "crv");
  assert.ok(result.data.similar[0].reasons.length > 0);
  assert.ok(result.data.similar.every((m) => m.vehicle.inStock && m.vehicle.id !== "rav4"));
  assert.equal((await f.get("/inventory/rav4/similar?limit=1")).data.similar.length, 1);
  assert.equal((await f.get("/inventory/truck/similar")).data.similar.length, 0);
  for (const bad of ["0", "7", "two", "1.5", ""])
    assert.equal((await f.get(`/inventory/rav4/similar?limit=${bad}`)).status, 400, bad);
  assert.equal((await f.get("/inventory/missing/similar")).status, 404);
  assert.equal((await f.get("/inventory/%E0%A4%A/similar")).status, 404);
});

test("compare API accepts two or three distinct listed vehicles", async (t) => {
  const f = await fixture(t);
  const three = await f.get("/compare?ids=cx30,rav4,crv");
  assert.equal(three.status, 200);
  assert.deepEqual(three.data.vehicles.map((v) => v.id), ["cx30", "rav4", "crv"]);
  assert.deepEqual(three.data.highlights.lowestPrice, ["cx30"]);
  const withSold = await f.get("/compare?ids=rav4,sold-suv");
  assert.equal(withSold.status, 200);
  assert.equal(withSold.data.vehicles[1].inStock, false);
  for (const bad of ["", "rav4", "rav4,rav4", "rav4,crv,cx30,civic", ",,"])
    assert.equal((await f.get(`/compare?ids=${bad}`)).status, 400, bad);
  const missing = await f.get("/compare?ids=rav4,gone");
  assert.equal(missing.status, 404);
  assert.match(missing.data.error, /no longer listed/);
});
