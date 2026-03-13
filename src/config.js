const path = require('path');
require('dotenv').config();

const resolveBoolean = (value, fallback = false) => {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

module.exports = {
  port: Number(process.env.PORT || 3000),
  baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  showroomAssetBaseUrl: process.env.SHOWROOM_ASSET_BASE_URL || process.env.BASE_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  openAiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  dealershipName: process.env.DEALERSHIP_NAME || 'Northstar Auto Group',
  defaultPersona: process.env.DEFAULT_PERSONA || 'concierge',
  dealershipTimezone: process.env.DEALERSHIP_TIMEZONE || 'America/Halifax',
  businessHoursStart: Number(process.env.BUSINESS_HOURS_START || 9),
  businessHoursEnd: Number(process.env.BUSINESS_HOURS_END || 18),
  dealershipPhone: process.env.DEALERSHIP_PHONE || '+19025550100',
  staffAlertPhone: process.env.STAFF_ALERT_PHONE || '+19025550101',
  followUpHour: Number(process.env.FOLLOW_UP_HOUR || 9),
  followUpMinute: Number(process.env.FOLLOW_UP_MINUTE || 15),
  testDriveDurationMins: Number(process.env.TEST_DRIVE_DURATION_MINS || 45),
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
  },
  googleCalendar: {
    calendarId: process.env.GOOGLE_CALENDAR_ID || '',
    accessToken: process.env.GOOGLE_ACCESS_TOKEN || ''
  },
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  useMockAi: resolveBoolean(process.env.USE_MOCK_AI, true),
  dataDir: process.env.DATA_DIR || path.join(process.cwd(), 'data')
};
