const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const config = require('./config');
const { appendAppointment } = require('./dataStore');

dayjs.extend(utc);
dayjs.extend(timezone);

const canUseGoogleCalendar = () =>
  Boolean(config.googleCalendar.calendarId && config.googleCalendar.accessToken);

const parsePreferredDateTime = (inquiry = '') => {
  const text = inquiry.toLowerCase();
  const now = dayjs().tz(config.dealershipTimezone);

  let date = now;
  if (text.includes('tomorrow')) {
    date = now.add(1, 'day');
  } else if (text.includes('next week')) {
    date = now.add(7, 'day');
  }

  const timeMatch = text.match(/\b([0-1]?\d)(?::([0-5]\d))?\s*(am|pm)\b/i);
  let hour = 10;
  let minute = 0;

  if (timeMatch) {
    hour = Number(timeMatch[1]);
    minute = Number(timeMatch[2] || 0);
    const meridiem = timeMatch[3].toLowerCase();
    if (meridiem === 'pm' && hour !== 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
  }

  return date.hour(hour).minute(minute).second(0).millisecond(0).toISOString();
};

const scheduleWithGoogle = async ({ lead, startAt }) => {
  const start = dayjs(startAt).tz(config.dealershipTimezone);
  const end = start.add(config.testDriveDurationMins, 'minute');

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(config.googleCalendar.calendarId)}/events`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.googleCalendar.accessToken}`
      },
      body: JSON.stringify({
        summary: `Test Drive - ${lead.callerName || lead.phone}`,
        description: `Lead ${lead.id}\nPhone: ${lead.phone}\nInquiry: ${lead.inquiry}`,
        start: {
          dateTime: start.toISOString(),
          timeZone: config.dealershipTimezone
        },
        end: {
          dateTime: end.toISOString(),
          timeZone: config.dealershipTimezone
        }
      })
    }
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Calendar API error ${response.status}: ${body}`);
  }

  const event = await response.json();

  return {
    provider: 'google_calendar',
    providerEventId: event.id || null,
    providerLink: event.htmlLink || null,
    status: 'scheduled'
  };
};

const scheduleTestDrive = async (lead) => {
  const scheduledFor = parsePreferredDateTime(lead.inquiry);
  const baseRecord = {
    id: `apt-${Date.now()}`,
    leadId: lead.id,
    phone: lead.phone,
    callerName: lead.callerName || null,
    scheduledFor,
    durationMins: config.testDriveDurationMins,
    timezone: config.dealershipTimezone,
    status: 'scheduled',
    source: 'voice_assistant',
    createdAt: new Date().toISOString()
  };

  if (!canUseGoogleCalendar()) {
    return await appendAppointment({
      ...baseRecord,
      provider: 'mock_calendar',
      providerEventId: null,
      providerLink: null
    });
  }

  try {
    const providerDetails = await scheduleWithGoogle({ lead, startAt: scheduledFor });
    return await appendAppointment({
      ...baseRecord,
      ...providerDetails
    });
  } catch (error) {
    return await appendAppointment({
      ...baseRecord,
      provider: 'mock_calendar',
      providerEventId: null,
      providerLink: null,
      status: 'scheduled_fallback',
      providerError: error.message
    });
  }
};

module.exports = {
  scheduleTestDrive,
  parsePreferredDateTime,
  canUseGoogleCalendar
};
