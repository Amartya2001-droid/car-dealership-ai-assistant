const express = require('express');
const cors = require('cors');
const twilio = require('twilio');

const config = require('./config');
const { appendLead, files, readJson } = require('./storage');
const { generateAiReply, buildContext, buildLeadRecord, personaStyles } = require('./assistant');
const { queueFollowUp, runMorningDispatch, startFollowUpScheduler } = require('./followUp');
const { updateKnowledgeBaseFromSnapshot } = require('./knowledgeBase');

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'car-dealership-ai-assistant', time: new Date().toISOString() });
  });

  app.get('/config/personas', (_req, res) => {
    res.json({ personas: personaStyles });
  });

  app.post('/webhooks/twilio/voice', (req, res) => {
    const voiceResponse = new twilio.twiml.VoiceResponse();
    const gather = voiceResponse.gather({
      input: 'speech',
      action: '/webhooks/twilio/voice/collect',
      method: 'POST',
      speechTimeout: 'auto'
    });

    gather.say(
      `Thanks for calling ${config.dealershipName}. Our sales team is currently offline. Please tell me your name and how I can help with inventory, pricing, or service.`
    );

    voiceResponse.redirect('/webhooks/twilio/voice');
    res.type('text/xml').send(voiceResponse.toString());
  });

  app.post('/webhooks/twilio/voice/collect', async (req, res) => {
    const speechResult = req.body.SpeechResult || 'No speech captured.';
    const phone = req.body.From || 'unknown';
    const callerName = req.body.CallerName || null;
    const persona = req.query.persona || 'concierge';
    const followUpOptIn = /yes|text me|follow up|contact me/i.test(speechResult);

    const context = buildContext(speechResult);
    const reply = await generateAiReply({
      callerName,
      callerInput: speechResult,
      persona,
      context
    });

    const lead = buildLeadRecord({
      phone,
      callerName,
      callerInput: speechResult,
      persona,
      consentFollowUp: followUpOptIn
    });

    appendLead(lead);
    if (lead.consentFollowUp) {
      queueFollowUp(lead, reply);
    }

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(reply);
    twiml.say('Thank you. We will follow up next business day. Goodbye.');
    twiml.hangup();

    res.type('text/xml').send(twiml.toString());
  });

  app.post('/simulate/call', async (req, res) => {
    const { phone, callerName, message, persona = 'concierge', optInFollowUp = true } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'phone and message are required' });
    }

    const context = buildContext(message);
    const reply = await generateAiReply({
      callerName,
      callerInput: message,
      persona,
      context
    });

    const lead = buildLeadRecord({
      phone,
      callerName,
      callerInput: message,
      persona,
      consentFollowUp: optInFollowUp
    });

    appendLead(lead);

    let followUp = null;
    if (lead.consentFollowUp) {
      followUp = queueFollowUp(lead, reply);
    }

    return res.json({
      assistantReply: reply,
      lead,
      followUp
    });
  });

  app.post('/admin/knowledge/snapshot', (req, res) => {
    const updated = updateKnowledgeBaseFromSnapshot(req.body || {});
    res.json({ updated });
  });

  app.get('/admin/leads', (_req, res) => {
    res.json({ leads: readJson(files.leads, []) });
  });

  app.get('/admin/followups', (_req, res) => {
    res.json({ followups: readJson(files.followups, []) });
  });

  app.post('/admin/run-followups', async (_req, res) => {
    const result = await runMorningDispatch();
    res.json(result);
  });

  return app;
};

const startServer = () => {
  const app = createApp();
  const server = app.listen(config.port, () => {
    const schedule = startFollowUpScheduler();
    console.log(`Server running on port ${config.port}`);
    console.log(`Morning follow-up schedule: ${schedule} (${config.dealershipTimezone})`);
  });

  return { app, server };
};

module.exports = { createApp, startServer };
