const config = require('../src/config');
const { getDemoScenario, listDemoScenarios } = require('../src/demoData');
const { buildDemoRunSheet } = require('../src/demoRunSheet');

const scenarioId = process.argv[2] || 'test-drive-booking';
const scenario = getDemoScenario(scenarioId);

if (!scenario) {
  console.error(`Unknown demo scenario: ${scenarioId}`);
  console.error(
    JSON.stringify(
      {
        availableScenarios: listDemoScenarios().map((item) => item.id)
      },
      null,
      2
    )
  );
  process.exit(1);
}

console.log('Demo run sheet');
console.log(
  JSON.stringify(
    buildDemoRunSheet({
      scenario,
      baseUrl: config.baseUrl,
      routes: {
        scenarioRun: `${config.baseUrl}/admin/demo/scenarios/${scenario.id}/run`,
        dashboard: `${config.baseUrl}/dashboard`,
        demoOverview: `${config.baseUrl}/admin/demo-overview`,
        summary: `${config.baseUrl}/admin/summary`
      }
    }),
    null,
    2
  )
);
