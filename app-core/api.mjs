import { readBody } from './body.mjs';
import { answerQuestion } from "./answers.mjs";
import { voiceResponse } from "./voice.mjs";
const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
const fail = (status, message) => {
  throw Object.assign(new Error(message), { status });
};
const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const encode = (bytes) =>
  [...new Uint8Array(bytes)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
const digest = async (s) =>
  encode(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
const text = (v, label, max = 200, required = true) => {
  if (typeof v !== "string" || (required && !v.trim()) || v.length > max)
    fail(400, `${label} is required and must be at most ${max} characters.`);
  return v.trim();
};
const decode = (rows) => rows.map((row) => JSON.parse(row.payload));
const defaultSettings = {
  name: "Northstar Auto",
  currency: "CAD",
  timezone: "America/Halifax",
  phone: "",
  address: "",
  supportEmail: "",
  hours: "Monday–Friday, 9 am–6 pm",
  demo: true,
};
async function settings(db) {
  const rows = await db.all("SELECT payload FROM settings WHERE id=?", [
    "dealership",
  ]);
  return {
    ...defaultSettings,
    ...(rows[0] ? JSON.parse(rows[0].payload) : {}),
  };
}
async function limited(db, key, max = 20) {
  const time = Date.now();
  await db.run(
    "INSERT INTO rate_limits(key,count,reset_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at < ? THEN 1 ELSE count+1 END, reset_at=CASE WHEN reset_at < ? THEN excluded.reset_at ELSE reset_at END",
    [key, time + 60000, time, time],
  );
  const rows = await db.all("SELECT count FROM rate_limits WHERE key=?", [key]);
  if (rows[0].count > max)
    fail(429, "Too many requests. Please try again in a minute.");
  await db.run("DELETE FROM rate_limits WHERE reset_at < ?", [time - 60000]);
}
async function staff(request, db) {
  const cookie = request.headers
    .get("cookie")
    ?.match(/(?:^|; )northstar_session=([^;]+)/)?.[1];
  const token =
    request.headers.get("authorization")?.replace(/^Bearer /, "") || cookie;
  if (!token) return false;
  const rows = await db.all(
    "SELECT token FROM sessions WHERE token=? AND expires>?",
    [await digest(token), Date.now()],
  );
  return rows.length > 0;
}
function vehicleInput(body, current = {}) {
  const v = { ...current, id: current.id || id() };
  for (const key of ["make", "model", "bodyType", "fuelType"])
    v[key] = text(body[key], key, 80);
  v.year = Number(body.year);
  v.price = Number(body.price);
  v.mileage = Number(body.mileage || 0);
  if (
    !Number.isInteger(v.year) ||
    v.year < 1900 ||
    v.year > new Date().getFullYear() + 2 ||
    !Number.isFinite(v.price) ||
    v.price <= 0 ||
    v.price > 10000000 ||
    !Number.isFinite(v.mileage) ||
    v.mileage < 0
  )
    fail(400, "Enter a valid year, price, and mileage.");
  v.description = text(body.description || "", "Description", 2000, false);
  v.imageUrl = text(body.imageUrl || "", "Image URL", 1000, false);
  if (v.imageUrl && !/^https:\/\//.test(v.imageUrl))
    fail(400, "Image URLs must use HTTPS.");
  v.inStock = body.inStock !== false;
  v.demo = body.demo === true;
  return v;
}
export async function handleApi(request, env, db) {
  const url = new URL(request.url),
    path = url.pathname,
    method = request.method;
  const origin = request.headers.get("origin");
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").filter(Boolean);
  const native =
    origin === "https://localhost" || origin === "capacitor://localhost";
  const validOrigin =
    !origin || origin === url.origin || allowed.includes(origin) || native;
  const cors =
    origin && validOrigin
      ? {
          "Access-Control-Allow-Origin": origin,
          Vary: "Origin",
          "Access-Control-Allow-Credentials": "true",
        }
      : {};
  const finish = (response) => {
    const h = new Headers(response.headers);
    for (const [k, v] of Object.entries(cors)) h.set(k, v);
    h.set("X-Content-Type-Options", "nosniff");
    h.set("Referrer-Policy", "no-referrer");
    return new Response(response.body, { status: response.status, headers: h });
  };
  try {
    if (path === "/api/webhooks/twilio/voice")
      return finish(await voiceResponse(request, env, db, await settings(db)));
    if (!validOrigin) fail(403, "This origin is not allowed.");
    if (method === "OPTIONS")
      return finish(
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type,Authorization",
          },
        }),
      );
    let body = {};
    if (["POST", "PATCH", "DELETE"].includes(method)) {
      const raw = await readBody(request);
      if (raw.length > 32000) fail(413, "Request is too large.");
      try {
        body = raw ? JSON.parse(raw) : {};
      } catch {
        fail(400, "Invalid JSON.");
      }
      if (!body || Array.isArray(body) || typeof body !== "object")
        fail(400, "Invalid request body.");
    }
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-real-ip") ||
      "local";
    if (method !== "GET") await limited(db, `write:${ip}`, 60);
    if (path === "/api/config" && method === "GET")
      return finish(
        json({
          ...(await settings(db)),
          aiMode: env.OPENAI_API_KEY ? "live" : "guided",
          staffConfigured: Boolean(env.ADMIN_EMAIL && env.ADMIN_PASSWORD),
        }),
      );
    if (path === "/api/auth/login" && method === "POST") {
      await limited(db, `login:${ip}`, 5);
      if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD)
        fail(503, "Staff access has not been configured by the owner.");
      const email = text(body.email, "Email", 200).toLowerCase(),
        password = text(body.password, "Password", 300);
      const a = await digest(password),
        b = await digest(env.ADMIN_PASSWORD);
      let mismatch = 0;
      for (let i = 0; i < a.length; i++)
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
      if (email !== env.ADMIN_EMAIL.toLowerCase() || mismatch)
        fail(401, "Email or password is incorrect.");
      const token = id() + id();
      await db.run("DELETE FROM sessions WHERE expires < ?", [Date.now()]);
      await db.run("INSERT INTO sessions(token,expires) VALUES(?,?)", [
        await digest(token),
        Date.now() + 8 * 3600000,
      ]);
      return finish(
        json({ ok: true, ...(native ? { token } : {}) }, 200, {
          "Set-Cookie": `northstar_session=${token}; Path=/api; HttpOnly; SameSite=Strict; Max-Age=28800${url.protocol === "https:" ? "; Secure" : ""}`,
        }),
      );
    }
    if (path === "/api/auth/session" && method === "GET")
      return finish(json({ authenticated: await staff(request, db) }));
    if (path === "/api/auth/logout" && method === "POST") {
      const token =
        request.headers.get("authorization")?.replace(/^Bearer /, "") ||
        request.headers
          .get("cookie")
          ?.match(/(?:^|; )northstar_session=([^;]+)/)?.[1];
      if (token)
        await db.run("DELETE FROM sessions WHERE token=?", [
          await digest(token),
        ]);
      return finish(
        json({ ok: true }, 200, {
          "Set-Cookie":
            "northstar_session=; Path=/api; HttpOnly; SameSite=Strict; Max-Age=0",
        }),
      );
    }
    if (path.startsWith("/api/admin/") && !(await staff(request, db)))
      fail(401, "Please sign in to continue.");
    if (path === "/api/inventory" && method === "GET")
      return finish(
        json({
          vehicles: decode(
            await db.all("SELECT payload FROM vehicles ORDER BY id"),
          ),
        }),
      );
    if (path === "/api/chat" && method === "POST") {
      await limited(db, `chat:${ip}`, 12);
      const message = text(body.message, "Message", 1500),
        cfg = await settings(db);
      const inventory = decode(
        await db.all("SELECT payload FROM vehicles"),
      ).filter((v) => v.inStock);
      return finish(json(await answerQuestion(message, env, inventory, cfg)));
    }
    if (path === "/api/inquiries" && method === "POST") {
      await limited(db, `inquiry:${ip}`, 8);
      const name = text(body.name, "Name", 100),
        email = text(body.email, "Email", 200),
        phone = text(body.phone || "", "Phone", 30, false),
        message = text(body.message, "Message", 2000);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        fail(400, "Enter a valid email address.");
      if (phone && !/^\+?[\d\s()-]{7,30}$/.test(phone))
        fail(400, "Enter a valid phone number.");
      let vehicle = null;
      if (body.vehicleId) {
        vehicle = decode(
          await db.all("SELECT payload FROM vehicles WHERE id=?", [
            text(body.vehicleId, "Vehicle", 100),
          ]),
        )[0];
        if (!vehicle?.inStock)
          fail(409, "This vehicle is no longer available.");
      }
      const lead = {
        id: id(),
        name,
        email,
        phone,
        message,
        vehicleId: vehicle?.id || null,
        vehicleName: vehicle
          ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
          : null,
        status: "new",
        consent: body.consent === true,
        createdAt: now(),
        notes: "",
      };
      const token = id() + id();
      lead.trackingHash = await digest(token);
      const queries = [
        [
          "INSERT INTO leads(id,payload,created_at) VALUES(?,?,?)",
          [lead.id, JSON.stringify(lead), lead.createdAt],
        ],
      ];
      let appointment = null;
      if (body.scheduledFor) {
        const time = new Date(body.scheduledFor);
        if (!vehicle) fail(400, "Choose a vehicle for your test drive.");
        if (
          Number.isNaN(+time) ||
          time <= new Date() ||
          +time > Date.now() + 90 * 86400000
        )
          fail(400, "Choose a future time within the next 90 days.");
        if (time.getUTCMinutes() % 30 !== 0 || time.getUTCSeconds() !== 0 || time.getUTCMilliseconds() !== 0)
          fail(400, "Choose a time on the hour or half hour.");
        appointment = {
          id: id(),
          leadId: lead.id,
          vehicleId: vehicle.id,
          vehicleName: lead.vehicleName,
          name,
          scheduledFor: time.toISOString(),
          status: "requested",
          createdAt: now(),
        };
        queries.push([
          "INSERT INTO appointments(id,lead_id,scheduled_for,status,payload) VALUES(?,?,?,?,?)",
          [
            appointment.id,
            lead.id,
            appointment.scheduledFor,
            "requested",
            JSON.stringify(appointment),
          ],
        ]);
      }
      try {
        await db.batch(queries);
      } catch (error) {
        if (/UNIQUE|constraint/i.test(error.message))
          fail(
            409,
            "That time has just been requested. Please choose another time.",
          );
        throw error;
      }
      return finish(
        json(
          {
            id: lead.id,
            trackingToken: token,
            appointment,
            message:
              "Your request has been saved. Staff must confirm test-drive requests.",
          },
          201,
        ),
      );
    }
    if (path === "/api/request/status" && method === "POST") {
      const token = text(body.token, "Request code", 100);
      const leads = decode(
        await db.all(
          "SELECT payload FROM leads WHERE json_extract(payload,'$.trackingHash')=?",
          [await digest(token)],
        ),
      );
      if (!leads.length)
        fail(404, "Request not found. Check your request code.");
      const lead = leads[0];
      const appointments = decode(
        await db.all("SELECT payload FROM appointments WHERE lead_id=?", [
          lead.id,
        ]),
      );
      return finish(
        json({
          status: lead.status,
          vehicleName: lead.vehicleName,
          createdAt: lead.createdAt,
          appointments,
        }),
      );
    }
    if (path === "/api/request/delete" && method === "POST") {
      const token = text(body.token, "Request code", 100);
      const rows = await db.all(
        "SELECT id FROM leads WHERE json_extract(payload,'$.trackingHash')=?",
        [await digest(token)],
      );
      if (!rows.length) fail(404, "Request not found.");
      await db.batch([
        ["DELETE FROM appointments WHERE lead_id=?", [rows[0].id]],
        ["DELETE FROM leads WHERE id=?", [rows[0].id]],
      ]);
      return finish(json({ ok: true }));
    }
    if (path === "/api/admin/overview" && method === "GET") {
      const leads = decode(
        await db.all("SELECT payload FROM leads ORDER BY created_at DESC"),
      ).map(({ trackingHash, ...lead }) => lead);
      return finish(
        json({
          leads,
          appointments: decode(
            await db.all(
              "SELECT payload FROM appointments ORDER BY scheduled_for",
            ),
          ),
          vehicles: decode(await db.all("SELECT payload FROM vehicles")),
          settings: await settings(db),
        }),
      );
    }
    if (path === "/api/admin/settings" && method === "PATCH") {
      const cfg = await settings(db);
      for (const k of ["name", "address", "phone", "supportEmail", "hours"])
        if (body[k] !== undefined) cfg[k] = text(body[k], k, 300, k === "name");
      if (body.currency !== undefined) {
        if (!["CAD", "USD", "GBP", "EUR", "INR"].includes(body.currency))
          fail(400, "Unsupported currency.");
        cfg.currency = body.currency;
      }
      if (body.demo !== undefined) cfg.demo = body.demo === true;
      await db.run(
        "INSERT INTO settings(id,payload) VALUES(?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload",
        ["dealership", JSON.stringify(cfg)],
      );
      return finish(json({ settings: cfg }));
    }
    if (path === "/api/admin/inventory" && method === "POST") {
      const v = vehicleInput(body);
      await db.run("INSERT INTO vehicles(id,payload) VALUES(?,?)", [
        v.id,
        JSON.stringify(v),
      ]);
      return finish(json({ vehicle: v }, 201));
    }
    const vehicleMatch = path.match(/^\/api\/admin\/inventory\/([^/]+)$/);
    if (vehicleMatch && method === "PATCH") {
      const current = decode(
        await db.all("SELECT payload FROM vehicles WHERE id=?", [
          vehicleMatch[1],
        ]),
      )[0];
      if (!current) fail(404, "Vehicle not found.");
      const v = vehicleInput({ ...current, ...body }, current);
      await db.run("UPDATE vehicles SET payload=? WHERE id=?", [
        JSON.stringify(v),
        v.id,
      ]);
      return finish(json({ vehicle: v }));
    }
    const leadMatch = path.match(/^\/api\/admin\/leads\/([^/]+)$/);
    if (leadMatch && method === "PATCH") {
      const lead = decode(
        await db.all("SELECT payload FROM leads WHERE id=?", [leadMatch[1]]),
      )[0];
      if (!lead) fail(404, "Lead not found.");
      if (body.status !== undefined) {
        if (
          !["new", "contacted", "qualified", "won", "closed"].includes(
            body.status,
          )
        )
          fail(400, "Invalid status.");
        lead.status = body.status;
      }
      if (body.notes !== undefined)
        lead.notes = text(body.notes, "Notes", 5000, false);
      lead.updatedAt = now();
      await db.run("UPDATE leads SET payload=? WHERE id=?", [
        JSON.stringify(lead),
        lead.id,
      ]);
      const { trackingHash, ...safe } = lead;
      return finish(json({ lead: safe }));
    }
    if (leadMatch && method === "DELETE") {
      await db.batch([
        ["DELETE FROM appointments WHERE lead_id=?", [leadMatch[1]]],
        ["DELETE FROM leads WHERE id=?", [leadMatch[1]]],
      ]);
      return finish(json({ ok: true }));
    }
    const appointmentMatch = path.match(
      /^\/api\/admin\/appointments\/([^/]+)$/,
    );
    if (appointmentMatch && method === "PATCH") {
      const appointment = decode(
        await db.all("SELECT payload FROM appointments WHERE id=?", [
          appointmentMatch[1],
        ]),
      )[0];
      if (!appointment) fail(404, "Appointment not found.");
      const transitions = {
        requested: ["confirmed", "cancelled"],
        confirmed: ["completed", "cancelled"],
        cancelled: [],
        completed: [],
      };
      if (!transitions[appointment.status]?.includes(body.status))
        fail(409, "This appointment cannot move to that status.");
      if (
        body.status === "confirmed" &&
        new Date(appointment.scheduledFor) <= new Date()
      )
        fail(400, "A past appointment cannot be confirmed.");
      const prior = appointment.status;
      appointment.status = body.status;
      await db.run(
        "UPDATE appointments SET status=?,payload=? WHERE id=? AND status=?",
        [
          appointment.status,
          JSON.stringify(appointment),
          appointment.id,
          prior,
        ],
      );
      return finish(json({ appointment }));
    }
    if (path === "/api/admin/seed" && method === "POST") {
      const cfg = await settings(db);
      if (!cfg.demo)
        fail(403, "Sample inventory is disabled outside demo mode.");
      const examples = [
        ["Toyota", "RAV4", "SUV", "Hybrid", 39250, 8200],
        ["Honda", "Civic", "Sedan", "Gasoline", 28900, 14200],
        ["Mazda", "CX-30", "SUV", "Gasoline", 34120, 5600],
        ["Tesla", "Model 3", "Sedan", "Electric", 48990, 3200],
      ];
      await db.batch(
        examples.map((x, i) => {
          const v = {
            id: `sample-${i}`,
            make: x[0],
            model: x[1],
            bodyType: x[2],
            fuelType: x[3],
            price: x[4],
            mileage: x[5],
            year: 2025,
            inStock: true,
            demo: true,
            imageUrl:
              i === 3
                ? "https://upload.wikimedia.org/wikipedia/commons/b/ba/Tesla_Model_3_%282023%29%2C_long_range%2C_Japan%2C_front.jpg"
                : "",
            description:
              "Sample listing for exploring the app. Replace with your dealership’s verified inventory before launch." + (i === 3 ? " Illustrative 2023 model photo: Kazyakuruma / Wikimedia Commons, CC0." : ""),
          };
          return [
            "INSERT INTO vehicles(id,payload) VALUES(?,?) ON CONFLICT(id) DO NOTHING",
            [v.id, JSON.stringify(v)],
          ];
        }),
      );
      return finish(json({ ok: true }));
    }
    fail(404, "Endpoint not found.");
  } catch (error) {
    if (!error.status) console.error("API failure:", error.message);
    return finish(
      json(
        {
          error: error.status
            ? error.message
            : "The request could not be completed. Please try again.",
        },
        error.status || 500,
      ),
    );
  }
}
