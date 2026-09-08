import { readBody } from './body.mjs';
import { answerQuestion } from "./answers.mjs";
const xmlEscape = (s) =>
  String(s).replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
const twiml = (body, status = 200) =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`,
    {
      status,
      headers: { "Content-Type": "text/xml", "Cache-Control": "no-store" },
    },
  );
export async function validSignature(url, params, signature, token) {
  if (!token || !signature) return false;
  const payload =
    url +
    [...new Set(params.keys())]
      .sort()
      .map((k) =>
        [...new Set(params.getAll(k))]
          .sort()
          .map((v) => k + v)
          .join(""),
      )
      .join("");
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(token),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  const expected = btoa(String.fromCharCode(...new Uint8Array(signed)));
  if (signature.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++)
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return mismatch === 0;
}
export async function voiceResponse(request, env, db, cfg) {
  if (request.method !== "POST") return twiml("", 405);
  if (!env.TWILIO_AUTH_TOKEN) return twiml("", 503);
  const raw = await readBody(request);
  if (raw.length > 16000) return twiml("", 413);
  const params = new URLSearchParams(raw);
  // The trusted, configured public URL must match the URL Twilio signed.
  const url = env.VOICE_WEBHOOK_URL || request.url;
  if (
    !(await validSignature(
      url,
      params,
      request.headers.get("x-twilio-signature"),
      env.TWILIO_AUTH_TOKEN,
    ))
  )
    return twiml("", 403);
  const speech = params.get("SpeechResult");
  if (!speech)
    return twiml(
      `<Gather input="speech" action="${xmlEscape(url)}" method="POST" speechTimeout="auto" timeout="5"><Say>Thank you for calling ${xmlEscape(cfg.name)}. You are speaking with an automated assistant. Your spoken request and phone number will be saved for our team. Please tell me your name and how we can help. For privacy questions, contact the dealership.</Say></Gather><Say>We did not receive a request. Please call again during our sales hours. Goodbye.</Say><Hangup/>`,
    );
  const callSid = params.get("CallSid");
  if (!/^CA[0-9a-fA-F]{32}$/.test(callSid || "")) return twiml("", 400);
  const leadId = "voice-" + callSid;
  const existing = await db.all("SELECT payload FROM leads WHERE id=?", [
    leadId,
  ]);
  if (existing.length) {
    const lead = JSON.parse(existing[0].payload);
    return twiml(
      `<Say>${xmlEscape(lead.assistantReply || "Your request has been recorded for our team.")}</Say><Hangup/>`,
    );
  }
  const inventory = (await db.all("SELECT payload FROM vehicles"))
    .map((r) => JSON.parse(r.payload))
    .filter((v) => v.inStock);
  const message = speech.slice(0, 1500);
  const lead = {
    id: leadId,
    name: (params.get("CallerName") || "Phone caller").slice(0, 100),
    email: "",
    phone: (params.get("From") || "").slice(0, 30),
    message,
    vehicleId: null,
    vehicleName: null,
    status: "new",
    consent: false,
    source: "voice",
    createdAt: new Date().toISOString(),
    notes: "",
  };
  // Save before calling any external AI service so an outage cannot discard the caller's request.
  await db.run(
    "INSERT INTO leads(id,payload,created_at) VALUES(?,?,?) ON CONFLICT(id) DO NOTHING",
    [leadId, JSON.stringify(lead), lead.createdAt],
  );
  const answer = await answerQuestion(message, env, inventory, cfg);
  lead.assistantReply =
    answer.reply +
    " Your request has been saved for our staff to review. A test drive is not confirmed until staff contacts you. Goodbye.";
  // JSON patch preserves any concurrent staff notes/status changes.
  await db.run(
    "UPDATE leads SET payload=json_set(payload,'$.assistantReply',?) WHERE id=?",
    [lead.assistantReply, leadId],
  );
  return twiml(`<Say>${xmlEscape(lead.assistantReply)}</Say><Hangup/>`);
}
