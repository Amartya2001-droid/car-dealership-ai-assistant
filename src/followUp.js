const cron = require('node-cron');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const twilio = require('twilio');

const config = require('./config');
const { readJson, writeJson, files } = require('./storage');

dayjs.extend(utc);
dayjs.extend(timezone);

const canUseTwilio = () =>
  Boolean(config.twilio.accountSid && config.twilio.authToken && config.twilio.phoneNumber);

const twilioClient = canUseTwilio()
  ? twilio(config.twilio.accountSid, config.twilio.authToken)
  : null;

const summarizeLead = (lead) => {
  const vehicle = lead.recommendedVehicles?.[0];
  const vehicleText = vehicle
    ? `${vehicle.year} ${vehicle.make} ${vehicle.model} ($${vehicle.price})`
    : 'No direct match yet';

  return [
    `Lead ${lead.id}`,
    `Name: ${lead.callerName || 'Unknown'}`,
    `Phone: ${lead.phone}`,
    `Topic: ${lead.topic} | Urgency: ${lead.urgency}`,
    `Mood: ${lead.mood}`,
    `Vehicle match: ${vehicleText}`,
    `Inquiry: ${lead.inquiry}`
  ].join(' | ');
};

const sendStaffDigest = async (leads) => {
  if (!leads.length) return { sent: false, reason: 'no_leads' };

  const digest = leads.map(summarizeLead).join('\n');

  if (!twilioClient || !config.staffAlertPhone) {
    return { sent: false, reason: 'twilio_unavailable', digest };
  }

  await twilioClient.messages.create({
    from: config.twilio.phoneNumber,
    to: config.staffAlertPhone,
    body: `Morning lead digest:\n${digest.slice(0, 1200)}`
  });

  return { sent: true, digest };
};

const sendCustomerFollowUps = async (followups) => {
  if (!followups.length) return { sent: 0, skipped: 0 };

  let sent = 0;
  let skipped = 0;

  for (const item of followups) {
    if (item.status !== 'queued') {
      skipped += 1;
      continue;
    }

    if (!twilioClient) {
      item.status = 'ready_without_provider';
      skipped += 1;
      continue;
    }

    await twilioClient.messages.create({
      from: config.twilio.phoneNumber,
      to: item.phone,
      body: item.message
    });

    item.status = 'sent';
    item.sentAt = new Date().toISOString();
    sent += 1;
  }

  writeJson(files.followups, followups);
  return { sent, skipped };
};

const queueFollowUp = (lead, assistantReply) => {
  const followups = readJson(files.followups, []);
  const message = `Hi ${lead.callerName || ''}, thanks for contacting ${config.dealershipName}. Based on your request, our team can help with ${lead.topic}. Reply to this text to continue. Ref: ${lead.id}`.trim();

  const record = {
    id: `followup-${Date.now()}`,
    leadId: lead.id,
    phone: lead.phone,
    message,
    assistantReply,
    status: 'queued',
    createdAt: new Date().toISOString()
  };

  followups.push(record);
  writeJson(files.followups, followups);
  return record;
};

const runMorningDispatch = async () => {
  const leads = readJson(files.leads, []);
  const followups = readJson(files.followups, []);

  const today = dayjs().tz(config.dealershipTimezone).format('YYYY-MM-DD');
  const queuedToday = leads.filter((lead) => lead.createdAt.startsWith(today));

  const digestResult = await sendStaffDigest(queuedToday);
  const followupResult = await sendCustomerFollowUps(followups);

  return {
    digestResult,
    followupResult,
    processedAt: new Date().toISOString()
  };
};

const startFollowUpScheduler = () => {
  const expression = `${config.followUpMinute} ${config.followUpHour} * * 1-5`;
  cron.schedule(
    expression,
    async () => {
      try {
        const result = await runMorningDispatch();
        console.log('Follow-up dispatch completed:', result);
      } catch (error) {
        console.error('Follow-up dispatch failed:', error);
      }
    },
    {
      timezone: config.dealershipTimezone
    }
  );

  return expression;
};

module.exports = {
  queueFollowUp,
  runMorningDispatch,
  startFollowUpScheduler
};
