const { summarizeLeads } = require('../src/storage');
const { listLeads, listAppointments, listFollowUps } = require('../src/dataStore');

const run = async () => {
  const [leads, appointments, followups] = await Promise.all([
    listLeads(),
    listAppointments(),
    listFollowUps()
  ]);

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
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
