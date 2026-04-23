const { spawnSync } = require('child_process');

const run = (command, args) => {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
};

run(process.execPath, ['scripts/seed-demo-data.js', '--reset']);
run(process.execPath, ['scripts/print-demo-readiness.js']);
