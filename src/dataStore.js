const config = require('./config');
const {
  files,
  readJson,
  appendLead: appendLeadLocal,
  appendFollowUp: appendFollowUpLocal,
  appendAppointment: appendAppointmentLocal,
  updateLeadById: updateLeadByIdLocal,
  updateFollowUpById: updateFollowUpByIdLocal,
  updateAppointmentById: updateAppointmentByIdLocal
} = require('./storage');

const DEFAULT_TABLES = {
  leads: process.env.SUPABASE_LEADS_TABLE || 'assistant_leads',
  followups: process.env.SUPABASE_FOLLOWUPS_TABLE || 'assistant_followups',
  appointments: process.env.SUPABASE_APPOINTMENTS_TABLE || 'assistant_appointments'
};

const payloadColumn = process.env.SUPABASE_PAYLOAD_COLUMN || 'payload';
const createdAtColumn = process.env.SUPABASE_CREATED_AT_COLUMN || 'created_at';
const updatedAtColumn = process.env.SUPABASE_UPDATED_AT_COLUMN || 'updated_at';

const canUseSupabase = () =>
  config.storageProvider === 'supabase' &&
  Boolean(config.supabase.url && config.supabase.anonKey);

const buildHeaders = () => ({
  'Content-Type': 'application/json',
  apikey: config.supabase.anonKey,
  Authorization: `Bearer ${config.supabase.anonKey}`
});

const encodeEq = (value) => encodeURIComponent(String(value));

const mapFromSupabaseRow = (row) => {
  if (!row) return null;
  const payload = row[payloadColumn] || {};

  return {
    ...payload,
    id: payload.id || row.id,
    createdAt: payload.createdAt || row[createdAtColumn] || new Date().toISOString(),
    updatedAt: payload.updatedAt || row[updatedAtColumn] || payload.createdAt || row[createdAtColumn] || null
  };
};

const supabaseRequest = async ({ table, method = 'GET', query = '', body }) => {
  const base = config.supabase.url.replace(/\/$/, '');
  const url = `${base}/rest/v1/${table}${query}`;

  const response = await fetch(url, {
    method,
    headers: buildHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Supabase ${method} ${table} failed (${response.status}): ${errorBody.slice(0, 200)}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const buildSupabaseRecord = (record) => ({
  id: record.id,
  [payloadColumn]: record,
  [createdAtColumn]: record.createdAt || new Date().toISOString(),
  [updatedAtColumn]: record.updatedAt || record.createdAt || new Date().toISOString()
});

const listFromSupabase = async (table) => {
  const rows = await supabaseRequest({
    table,
    query: `?select=id,${payloadColumn},${createdAtColumn},${updatedAtColumn}&order=${createdAtColumn}.desc`
  });

  return rows.map(mapFromSupabaseRow);
};

const insertToSupabase = async (table, record) => {
  const rows = await supabaseRequest({
    table,
    method: 'POST',
    query: `?select=id,${payloadColumn},${createdAtColumn},${updatedAtColumn}`,
    body: buildSupabaseRecord(record)
  });

  return mapFromSupabaseRow(rows[0]) || record;
};

const updateInSupabase = async (table, id, updates = {}) => {
  const existingRows = await supabaseRequest({
    table,
    query: `?id=eq.${encodeEq(id)}&select=id,${payloadColumn},${createdAtColumn},${updatedAtColumn}&limit=1`
  });

  if (!existingRows.length) {
    return null;
  }

  const current = mapFromSupabaseRow(existingRows[0]);
  const next = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  const rows = await supabaseRequest({
    table,
    method: 'PATCH',
    query: `?id=eq.${encodeEq(id)}&select=id,${payloadColumn},${createdAtColumn},${updatedAtColumn}`,
    body: {
      [payloadColumn]: next,
      [updatedAtColumn]: next.updatedAt
    }
  });

  return mapFromSupabaseRow(rows[0]) || next;
};

const withFallback = async (remoteFn, localFn) => {
  if (!canUseSupabase()) {
    return localFn();
  }

  try {
    return await remoteFn();
  } catch (_error) {
    return localFn();
  }
};

const listLeads = async () => withFallback(() => listFromSupabase(DEFAULT_TABLES.leads), () => readJson(files.leads, []));

const listFollowUps = async () =>
  withFallback(() => listFromSupabase(DEFAULT_TABLES.followups), () => readJson(files.followups, []));

const listAppointments = async () =>
  withFallback(() => listFromSupabase(DEFAULT_TABLES.appointments), () => readJson(files.appointments, []));

const appendLead = async (lead) =>
  withFallback(() => insertToSupabase(DEFAULT_TABLES.leads, lead), () => appendLeadLocal(lead));

const appendFollowUp = async (followup) =>
  withFallback(() => insertToSupabase(DEFAULT_TABLES.followups, followup), () => appendFollowUpLocal(followup));

const appendAppointment = async (appointment) =>
  withFallback(() => insertToSupabase(DEFAULT_TABLES.appointments, appointment), () => appendAppointmentLocal(appointment));

const updateLeadById = async (id, updates = {}) =>
  withFallback(() => updateInSupabase(DEFAULT_TABLES.leads, id, updates), () => updateLeadByIdLocal(id, updates));

const updateFollowUpById = async (id, updates = {}) =>
  withFallback(
    () => updateInSupabase(DEFAULT_TABLES.followups, id, updates),
    () => updateFollowUpByIdLocal(id, updates)
  );

const updateAppointmentById = async (id, updates = {}) =>
  withFallback(
    () => updateInSupabase(DEFAULT_TABLES.appointments, id, updates),
    () => updateAppointmentByIdLocal(id, updates)
  );

module.exports = {
  listLeads,
  listFollowUps,
  listAppointments,
  appendLead,
  appendFollowUp,
  appendAppointment,
  updateLeadById,
  updateFollowUpById,
  updateAppointmentById,
  canUseSupabase
};
