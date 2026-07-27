const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

const config = require('./config');
const { getKnowledgeBase, parsePreferences, findVehicleMatches } = require('./knowledgeBase');
const { buildShowroomAsset } = require('./showroom');

dayjs.extend(utc);
dayjs.extend(timezone);

const personaStyles = {
  sales_pro: 'Confident Sales Pro',
  concierge: 'Friendly Concierge',
  tech_expert: 'Tech Expert'
};

const moodFromText = (text = '') => {
  const lower = text.toLowerCase();
  if (/(angry|upset|frustrated|terrible|annoyed)/.test(lower)) return 'frustrated';
  if (/(excited|awesome|great|love)/.test(lower)) return 'enthusiastic';
  return 'neutral';
};

const classifyTopic = (text = '') => {
  const lower = text.toLowerCase();
  if (/test drive|appointment|book/.test(lower)) return 'test_drive';
  if (/price|deal|finance|payment|quote/.test(lower)) return 'pricing';
  if (/service|oil|repair|maintenance/.test(lower)) return 'service';
  if (/inventory|available|in stock|have/.test(lower)) return 'inventory';
  return 'general';
};

const inferUrgency = (text = '') => {
  const lower = text.toLowerCase();
  if (/(today|asap|urgent|immediately|right now)/.test(lower)) return 'high';
  if (/(this week|soon|tomorrow)/.test(lower)) return 'medium';
  return 'low';
};

const extractCallbackWindow = (text = '') => {
  const lower = text.toLowerCase();

  if (/morning|before noon|early/.test(lower)) {
    return {
      label: 'morning',
      startHour: 9,
      endHour: 12
    };
  }

  if (/afternoon|after lunch/.test(lower)) {
    return {
      label: 'afternoon',
      startHour: 12,
      endHour: 17
    };
  }

  if (/evening|after work|after 5/.test(lower)) {
    return {
      label: 'evening',
      startHour: 17,
      endHour: 19
    };
  }

  return null;
};

const afterHoursStatus = () => {
  const now = dayjs().tz(config.dealershipTimezone);
  const hour = now.hour();
  const weekday = now.day();
  const isWeekend = weekday === 0 || weekday === 6;
  const isAfterHours = isWeekend || hour < config.businessHoursStart || hour >= config.businessHoursEnd;

  return {
    isAfterHours,
    now: now.format('dddd, MMMM D, YYYY h:mm A z')
  };
};

const buildContext = (callerInput = '') => {
  const kb = getKnowledgeBase();
  const topic = classifyTopic(callerInput);
  const urgency = inferUrgency(callerInput);
  const mood = moodFromText(callerInput);
  const preferences = parsePreferences(callerInput);
  const matches = findVehicleMatches(preferences);
  const callbackWindow = extractCallbackWindow(callerInput);
  const showroomAsset = buildShowroomAsset(matches[0], kb.promotions || []);

  return { kb, topic, urgency, mood, preferences, matches, callbackWindow, showroomAsset };
};

const mockReply = ({ callerName, callerInput, persona, context }) => {
  const status = afterHoursStatus();
  const personaName = personaStyles[persona] || personaStyles[config.defaultPersona] || personaStyles.concierge;

  if (context.topic === 'inventory' || context.matches.length > 0) {
    const vehicle = context.matches[0];
    if (vehicle) {
      return `Hi ${callerName || 'there'}, this is your ${personaName}. We currently have a ${vehicle.year} ${vehicle.make} ${vehicle.model} at $${vehicle.price.toLocaleString()}. I can text you full specs and schedule a test drive when we open.`;
    }
  }

  if (context.topic === 'service') {
    return `Thanks for calling. Service hours are ${context.kb.hours.serviceWeekdays} weekdays, and I can queue your request now so our team calls you first thing next business day.`;
  }

  const hours = context.kb.hours || {};
  return `Thanks for calling ${config.dealershipName}. We are currently ${status.isAfterHours ? 'closed' : 'open'} (${status.now}). Sales hours are ${hours.salesWeekdays || '9:00 AM - 6:00 PM weekdays'}. I can capture your details and have our team follow up next business morning.`;
};

const generateAiReply = async ({ callerName, callerInput, persona, context }) => {
  if (config.useMockAi || !config.openaiApiKey) {
    return mockReply({ callerName, callerInput, persona, context });
  }

  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey: config.openaiApiKey });
  const prompt = `
You are an after-hours AI voice agent for ${config.dealershipName}.
Persona: ${personaStyles[persona] || personaStyles[config.defaultPersona] || personaStyles.concierge}
Caller name: ${callerName || 'Unknown'}
Caller mood: ${context.mood}
Topic: ${context.topic}
Urgency: ${context.urgency}
Inventory snapshot: ${JSON.stringify((context.kb.inventory || []).slice(0, 5))}
Hours: ${JSON.stringify(context.kb.hours || {})}
Promotions: ${(context.kb.promotions || []).join('; ')}
Caller said: ${callerInput}

Respond in 2-3 concise spoken sentences. Mention that follow-up occurs next business day if after-hours.
`;

  const result = await client.responses.create({
    model: config.openAiModel,
    input: prompt
  });

  return result.output_text || mockReply({ callerName, callerInput, persona, context });
};

const buildLeadRecord = ({ phone, callerName, callerInput, persona, consentFollowUp }) => {
  const context = buildContext(callerInput);
  const status = afterHoursStatus();

  return {
    id: `lead-${Date.now()}`,
    phone,
    callerName: callerName || null,
    inquiry: callerInput,
    persona: persona || config.defaultPersona,
    mood: context.mood,
    topic: context.topic,
    urgency: context.urgency,
    recommendedVehicles: context.matches,
    callbackWindow: context.callbackWindow,
    showroomAsset: context.showroomAsset,
    consentFollowUp: Boolean(consentFollowUp),
    status: 'new',
    lifecycle: [
      {
        status: 'new',
        at: new Date().toISOString(),
        note: 'Captured from incoming call'
      }
    ],
    afterHours: status.isAfterHours,
    createdAt: new Date().toISOString()
  };
};

module.exports = {
  personaStyles,
  moodFromText,
  classifyTopic,
  inferUrgency,
  extractCallbackWindow,
  afterHoursStatus,
  buildContext,
  generateAiReply,
  buildLeadRecord
};
