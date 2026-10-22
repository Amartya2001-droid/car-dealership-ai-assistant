// Staff insights computed from saved leads, appointments and lead activity.
// Pure functions so they run on both the Node server and the Worker.
export const INSIGHT_PERIODS = [7, 30, 90];
const DAY = 86400000;
const STAGES = ["contacted", "qualified", "won"];
const stageRank = { new: 0, contacted: 1, qualified: 2, won: 3 };

export function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
const rate = (part, whole) => (whole ? Math.round((part / whole) * 1000) / 10 : null);

// Furthest funnel stage a lead has ever reached, using its status history so
// a lead later marked "closed" still counts as contacted or qualified.
export function furthestStage(lead) {
  let rank = stageRank[lead.status] ?? 0;
  for (const event of lead.activity || [])
    if (event.type === "status_changed") rank = Math.max(rank, stageRank[event.to] ?? 0);
  return rank;
}

// Minutes from inquiry to the first staff action, or null if none yet.
export function firstResponseMinutes(lead) {
  const first = (lead.activity || []).find((event) => event.actor === "staff");
  if (!first) return null;
  return Math.max(0, (Date.parse(first.at) - Date.parse(lead.createdAt)) / 60000);
}

export function buildInsights({ leads, appointments, vehicles, days = 30, now = Date.now() }) {
  const since = now - days * DAY;
  const inPeriod = leads.filter((l) => {
    const created = Date.parse(l.createdAt);
    return created >= since && created <= now;
  });

  const received = inPeriod.length;
  const funnel = [
    { stage: "received", count: received, percent: received ? 100 : null },
    ...STAGES.map((stage, i) => {
      const count = inPeriod.filter((l) => furthestStage(l) >= i + 1).length;
      return { stage, count, percent: rate(count, received) };
    }),
  ];

  // Leads saved before the activity timeline existed have no response data.
  const tracked = inPeriod.filter((l) => Array.isArray(l.activity) && l.activity.length);
  const responses = tracked.map(firstResponseMinutes).filter((m) => m !== null);
  const response = {
    medianMinutes: median(responses) === null ? null : Math.round(median(responses)),
    responded: responses.length,
    awaiting: tracked.length - responses.length,
    untracked: inPeriod.length - tracked.length,
  };

  const due = appointments.filter((a) => {
    const at = Date.parse(a.scheduledFor);
    return at >= since && at <= now;
  });
  const completed = due.filter((a) => a.status === "completed").length;
  const noShow = due.filter((a) => a.status === "confirmed").length;
  const testDrives = {
    completed,
    notCompleted: noShow,
    cancelled: due.filter((a) => a.status === "cancelled").length,
    unconfirmed: due.filter((a) => a.status === "requested").length,
    showRate: rate(completed, completed + noShow),
    upcoming: appointments.filter(
      (a) => Date.parse(a.scheduledFor) > now && ["requested", "confirmed"].includes(a.status),
    ).length,
  };

  const leadIds = new Set(inPeriod.map((l) => l.id));
  const names = new Map(vehicles.map((v) => [v.id, `${v.year} ${v.make} ${v.model}`]));
  const perVehicle = new Map();
  for (const lead of inPeriod) {
    if (!lead.vehicleId) continue;
    const row = perVehicle.get(lead.vehicleId) || {
      vehicleId: lead.vehicleId,
      vehicleName: names.get(lead.vehicleId) || lead.vehicleName || "Removed vehicle",
      listed: names.has(lead.vehicleId),
      leads: 0,
      testDrives: 0,
      won: 0,
    };
    row.leads += 1;
    if (lead.status === "won") row.won += 1;
    perVehicle.set(lead.vehicleId, row);
  }
  for (const a of appointments) {
    const row = leadIds.has(a.leadId) && perVehicle.get(a.vehicleId);
    if (row) row.testDrives += 1;
  }
  const leadsPerVehicle = [...perVehicle.values()].sort(
    (a, b) => b.leads - a.leads || b.testDrives - a.testDrives || a.vehicleName.localeCompare(b.vehicleName),
  );

  return {
    days,
    since: new Date(since).toISOString(),
    generatedAt: new Date(now).toISOString(),
    funnel,
    response,
    testDrives,
    leadsPerVehicle,
    generalInquiries: inPeriod.filter((l) => !l.vehicleId).length,
    sources: {
      web: inPeriod.filter((l) => l.source !== "voice").length,
      voice: inPeriod.filter((l) => l.source === "voice").length,
    },
  };
}
