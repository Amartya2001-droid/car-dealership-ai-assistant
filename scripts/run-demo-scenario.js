const { listDemoScenarios, runDemoScenario } = require('../src/demoData');

const scenarioId = process.argv[2];

if (!scenarioId) {
  console.log('Available demo scenarios:');
  console.log(JSON.stringify({ scenarios: listDemoScenarios() }, null, 2));
  process.exit(0);
}

runDemoScenario(scenarioId)
  .then((result) => {
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
