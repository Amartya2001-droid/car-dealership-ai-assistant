const { files, readJson, summarizeLeads } = require('../src/storage');

const leads = readJson(files.leads, []);
const appointments = readJson(files.appointments, []);
const followups = readJson(files.followups, []);

const summary = {
  leads: summarizeLeads(leads),
  appointments: {
    total: appointments.length,
    confirmed: appointments.filter((item) => item.status === 'confirmed').length
  },
  followups: {
    total: followups.length,
    queued: followups.filter((item) => item.status === 'queued').length
  }
};

console.log(JSON.stringify(summary, null, 2));
