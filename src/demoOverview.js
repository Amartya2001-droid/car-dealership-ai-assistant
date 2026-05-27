const buildDemoOverview = ({ readiness, production, scenarios, summary, commands, routes }) => ({
  readiness,
  production,
  scenarios,
  summary,
  commands,
  routes,
  recordingFlow: [
    'Run demo preparation and confirm readiness is true.',
    'Open the dashboard and demo overview endpoints.',
    'Run one named scenario to create a fresh lead event.',
    'Show summary, appointments, and follow-ups updating live.',
    'Close with production-readiness status and next steps.'
  ]
});

module.exports = {
  buildDemoOverview
};
