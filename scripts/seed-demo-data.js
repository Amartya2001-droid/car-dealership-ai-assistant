const { seedDemoData } = require('../src/demoData');

const reset = process.argv.includes('--reset');

const run = async () => {
  const result = await seedDemoData({ reset });
  console.log(
    `Seeded ${result.seeded} demo scenarios. Totals: ${result.totals.leads} leads, ${result.totals.appointments} appointments, ${result.totals.followups} follow-ups.`
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
