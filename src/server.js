const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const pkg = require('../package.json');

const config = require('./config');
const { appendLead, files, readJson, updateLeadById, updateAppointmentById, summarizeLeads } = require('./storage');
const { generateAiReply, buildContext, buildLeadRecord, personaStyles } = require('./assistant');
const { queueFollowUp, runMorningDispatch, startFollowUpScheduler } = require('./followUp');
const { updateKnowledgeBaseFromSnapshot } = require('./knowledgeBase');
const { scheduleTestDrive } = require('./testDriveScheduler');

const pushLifecycleEvent = (lead, status, note) => {
  const lifecycle = Array.isArray(lead.lifecycle) ? lead.lifecycle : [];
  return [...lifecycle, { status, at: new Date().toISOString(), note }];
};

const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'car-dealership-ai-assistant',
      version: pkg.version,
      time: new Date().toISOString()
    });
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

    let appointment = null;
    if (lead.topic === 'test_drive') {
      appointment = await scheduleTestDrive(lead);
      const leadStatus = appointment.status === 'scheduled' ? 'scheduled' : 'pending_schedule';
      updateLeadById(lead.id, {
        status: leadStatus,
        appointmentId: appointment.id,
        lifecycle: pushLifecycleEvent(lead, leadStatus, 'Test drive scheduling requested')
      });
    }

    if (lead.consentFollowUp) {
      queueFollowUp(lead, reply);
    }

    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say(reply);
    if (appointment) {
      twiml.say('I have queued your test drive request and our team will confirm it next business day.');
    }
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
    let responseLead = lead;

    let appointment = null;
    if (lead.topic === 'test_drive') {
      appointment = await scheduleTestDrive(lead);
      const leadStatus = appointment.status === 'scheduled' ? 'scheduled' : 'pending_schedule';
      responseLead = updateLeadById(lead.id, {
        status: leadStatus,
        appointmentId: appointment.id,
        lifecycle: pushLifecycleEvent(lead, leadStatus, 'Test drive scheduling requested')
      }) || lead;
    }

    let followUp = null;
    if (lead.consentFollowUp) {
      followUp = queueFollowUp(lead, reply);
    }

    return res.json({
      assistantReply: reply,
      lead: responseLead,
      followUp,
      appointment
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

  app.get('/admin/appointments', (_req, res) => {
    res.json({ appointments: readJson(files.appointments, []) });
  });

  app.get('/admin/summary', (_req, res) => {
    const leads = readJson(files.leads, []);
    const appointments = readJson(files.appointments, []);
    const followups = readJson(files.followups, []);

    return res.json({
      leads: summarizeLeads(leads),
      appointments: {
        total: appointments.length,
        confirmed: appointments.filter((item) => item.status === 'confirmed').length,
        pending: appointments.filter((item) => item.status !== 'confirmed').length
      },
      followups: {
        total: followups.length,
        queued: followups.filter((item) => item.status === 'queued').length,
        sent: followups.filter((item) => item.status === 'sent').length
      }
    });
  });

  app.post('/admin/test-drives/schedule', async (req, res) => {
    const { leadId } = req.body;
    if (!leadId) {
      return res.status(400).json({ error: 'leadId is required' });
    }

    const leads = readJson(files.leads, []);
    const lead = leads.find((item) => item.id === leadId);
    if (!lead) {
      return res.status(404).json({ error: 'lead not found' });
    }

    const appointment = await scheduleTestDrive(lead);
    const leadStatus = appointment.status === 'scheduled' ? 'scheduled' : 'pending_schedule';

    const updatedLead = updateLeadById(lead.id, {
      status: leadStatus,
      appointmentId: appointment.id,
      lifecycle: pushLifecycleEvent(lead, leadStatus, 'Scheduled via admin endpoint')
    });

    return res.json({ appointment, lead: updatedLead });
  });

  app.post('/admin/test-drives/:appointmentId/confirm', (req, res) => {
    const { appointmentId } = req.params;
    const { leadId } = req.body;

    const appointment = updateAppointmentById(appointmentId, {
      status: 'confirmed',
      confirmedAt: new Date().toISOString()
    });

    if (!appointment) {
      return res.status(404).json({ error: 'appointment not found' });
    }

    let lead = null;
    if (leadId) {
      const current = readJson(files.leads, []).find((item) => item.id === leadId);
      if (current) {
        lead = updateLeadById(leadId, {
          status: 'contacted',
          lifecycle: pushLifecycleEvent(current, 'contacted', 'Appointment confirmed by staff')
        });
      }
    }

    return res.json({ appointment, lead });
  });

  app.post('/admin/leads/:leadId/callback-window', (req, res) => {
    const { leadId } = req.params;
    const { label, startHour, endHour } = req.body;

    if (!label || startHour === undefined || endHour === undefined) {
      return res.status(400).json({ error: 'label, startHour, and endHour are required' });
    }

    const current = readJson(files.leads, []).find((item) => item.id === leadId);
    if (!current) {
      return res.status(404).json({ error: 'lead not found' });
    }

    const callbackWindow = {
      label,
      startHour: Number(startHour),
      endHour: Number(endHour)
    };

    const lead = updateLeadById(leadId, {
      callbackWindow,
      lifecycle: pushLifecycleEvent(current, current.status, `Callback window updated to ${label}`)
    });

    return res.json({ lead });
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
