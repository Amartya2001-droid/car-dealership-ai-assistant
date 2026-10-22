// Similar-vehicle ranking and side-by-side comparison. Pure functions so they
// run on both the Node server and the Worker.
export const MAX_SIMILAR = 6;
export const MIN_SIMILARITY = 25;
export const MAX_COMPARE = 3;

const closeness = (a, b, range) =>
  Math.max(0, 1 - Math.abs(Number(a) - Number(b)) / range);
const same = (a, b) =>
  String(a || "").toLowerCase() === String(b || "").toLowerCase();

// 0–100: body type 40, fuel 20, price 25 (within ±30%), year 10 (±5 years), make 5.
export function similarity(base, candidate) {
  const reasons = [];
  let score = 0;
  if (same(base.bodyType, candidate.bodyType)) {
    score += 40;
    const article = /^(suv|[aeiou])/i.test(candidate.bodyType) ? "an" : "a";
    reasons.push(`Also ${article} ${candidate.bodyType}`);
  }
  if (same(base.fuelType, candidate.fuelType)) {
    score += 20;
    reasons.push(`${candidate.fuelType} too`);
  }
  const price = closeness(base.price, candidate.price, Math.max(1, base.price * 0.3));
  score += 25 * price;
  if (Math.abs(candidate.price - base.price) <= base.price * 0.1)
    reasons.push("Similar price");
  else if (candidate.price < base.price && price > 0) reasons.push("Lower price");
  score += 10 * closeness(base.year, candidate.year, 5);
  if (same(base.make, candidate.make)) {
    score += 5;
    reasons.push(`Also by ${candidate.make}`);
  }
  return { score: Math.round(score), reasons };
}

export function rankSimilar(base, inventory, limit = 3) {
  return inventory
    .filter((v) => v.id !== base.id && v.inStock)
    .map((vehicle) => ({ vehicle, ...similarity(base, vehicle) }))
    .filter((match) => match.score >= MIN_SIMILARITY)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Math.abs(a.vehicle.price - base.price) - Math.abs(b.vehicle.price - base.price) ||
        String(a.vehicle.id).localeCompare(String(b.vehicle.id)),
    )
    .slice(0, limit);
}

// Ids of the vehicles holding the best value of `key` (ties share the badge).
const best = (vehicles, key, pick) => {
  const target = pick(...vehicles.map((v) => Number(v[key])));
  const winners = vehicles.filter((v) => Number(v[key]) === target).map((v) => v.id);
  return winners.length === vehicles.length ? [] : winners;
};

export function compareVehicles(vehicles) {
  return {
    vehicles,
    highlights: {
      lowestPrice: best(vehicles, "price", Math.min),
      lowestMileage: best(vehicles, "mileage", Math.min),
      newest: best(vehicles, "year", Math.max),
    },
  };
}
