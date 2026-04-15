const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const config = require('./config');
const {
  listLeads,
  listFollowUps,
  appendFollowUp,
  updateFollowUpById
} = require('./dataStore');

dayjs.extend(utc);
dayjs.extend(timezone);

const canUseTwilio = () =>
  Boolean(config.twilio.accountSid && config.twilio.authToken && config.twilio.phoneNumber);

let twilioClient = null;

const getTwilioClient = () => {
  if (!canUseTwilio()) {
    return null;
  }

  if (!twilioClient) {
    const twilio = require('twilio');
    twilioClient = twilio(config.twilio.accountSid, config.twilio.authToken);
  }

  return twilioClient;
};

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
  const client = getTwilioClient();

  if (!client || !config.staffAlertPhone) {
    return { sent: false, reason: 'twilio_unavailable', digest };
  }

  await client.messages.create({
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

    const client = getTwilioClient();
    if (!client) {
      await updateFollowUpById(item.id, { status: 'ready_without_provider' });
      skipped += 1;
      continue;
    }

    await client.messages.create({
      from: config.twilio.phoneNumber,
      to: item.phone,
      body: item.message
    });

    await updateFollowUpById(item.id, {
      status: 'sent',
      sentAt: new Date().toISOString()
    });
    sent += 1;
  }

  return { sent, skipped };
};

const queueFollowUp = async (lead, assistantReply) => {
  const callbackText = lead.callbackWindow
    ? ` Preferred callback window: ${lead.callbackWindow.label}.`
    : '';
  const showroomText = lead.showroomAsset
    ? ` Virtual showroom: ${lead.showroomAsset.videoUrl}`
    : '';
  const message = `Hi ${lead.callerName || ''}, thanks for contacting ${config.dealershipName}. Based on your request, our team can help with ${lead.topic}.${callbackText} Reply to this text to continue. Ref: ${lead.id}.${showroomText}`.trim();

  const record = {
    id: `followup-${Date.now()}`,
    leadId: lead.id,
    phone: lead.phone,
    message,
    assistantReply,
    callbackWindow: lead.callbackWindow || null,
    showroomAsset: lead.showroomAsset || null,
    status: 'queued',
    createdAt: new Date().toISOString()
  };

  return appendFollowUp(record);
};

const runMorningDispatch = async () => {
  const [leads, followups] = await Promise.all([listLeads(), listFollowUps()]);

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
  if (config.nodeEnv !== 'production') {
    return `${expression} (disabled in ${config.nodeEnv})`;
  }

  const cron = require('node-cron');

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
