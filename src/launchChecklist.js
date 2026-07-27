const { REQUIRED_BASE, REQUIRED_SUPABASE, REQUIRED_TWILIO } = require('./productionReadiness');

const hasAny = (values = [], required = []) => required.some((item) => values.includes(item));
const unique = (values = []) => [...new Set(values)];

const sortByPriority = (items = []) =>
  [...items].sort((left, right) => {
    const leftPriority = left.priority || 999;
    const rightPriority = right.priority || 999;
    return leftPriority - rightPriority;
  });

const buildPhaseSummary = (items = []) => ({
  total: items.length,
  blocked: items.filter((item) => item.status === 'blocked').length,
  warnings: items.filter((item) => item.status === 'warning').length,
  complete: items.length === 0
});

const buildAreaSummary = (items = []) => {
  const summary = {};

  for (const item of items) {
    const key = item.area || 'other';
    if (!summary[key]) {
      summary[key] = {
        total: 0,
        blocked: 0,
        warnings: 0,
        ids: []
      };
    }

    summary[key].total += 1;
    summary[key].ids.push(item.id);

    if (item.status === 'blocked') {
      summary[key].blocked += 1;
    }

    if (item.status === 'warning') {
      summary[key].warnings += 1;
    }
  }

  return summary;
};

const buildLaunchNarrative = ({
  readyForDemo,
  readyForPilot,
  readyForProduction,
  completionScore,
  phaseSummary
}) => {
  if (readyForProduction) {
    return {
      headline: 'Production rollout checklist is complete.',
      nextMilestone: 'Deploy and run a final live verification pass.',
      statusTone: 'ready'
    };
  }

  if (readyForPilot) {
    return {
      headline: 'Supervised pilot is close, but production hardening still needs to be finished.',
      nextMilestone: 'Complete hosted verification and close the remaining production blockers.',
      statusTone: 'pilot'
    };
  }

  if (readyForDemo) {
    return {
      headline: 'The demo path is viable, but pilot blockers still need to be cleared.',
      nextMilestone: phaseSummary.thisWeek?.blocked > 0
        ? 'Finish the this-week blockers before moving into pilot checks.'
        : 'Move from demo validation into telephony and hosted verification.',
      statusTone: 'demo'
    };
  }

  return {
    headline: completionScore >= 30
      ? 'Core foundations are in place, but the operator path still needs setup before the next walkthrough.'
      : 'The rollout path is still in early setup and needs more groundwork before the next walkthrough.',
    nextMilestone: phaseSummary.today?.blocked > 0
      ? 'Clear today’s blockers first so the base environment and dashboard route are stable.'
      : 'Prepare the demo route and data before the next walkthrough.',
    statusTone: 'blocked'
  };
};

const buildGate = ({ label, passed, description, command, route }) => ({
  label,
  passed,
  description,
  command,
  route
});

const buildUnlockPlan = ({ blockers = [], readyForDemo, readyForPilot, readyForProduction, routes = {} }) => {
  const blockerMap = new Map(blockers.map((item) => [item.id, item]));
  const steps = [];

  const pushStep = (id, unlocks, whyNow, route) => {
    const blocker = blockerMap.get(id);
    if (!blocker) {
      return;
    }

    steps.push({
      id: blocker.id,
      title: blocker.title,
      phase: blocker.phase,
      action: blocker.action,
      command: blocker.command,
      unlocks,
      whyNow,
      route
    });
  };

  pushStep(
    'base-env',
    'Stabilizes the production config baseline and unblocks the rest of the rollout checks.',
    'This is the first dependency for every other production verification command.',
    routes.productionReadiness
  );
  pushStep(
    'supabase',
    'Moves lead capture and follow-up logs onto cloud persistence for hosted rollout.',
    'Cloud data needs to be in place before a public pilot or production launch can be trusted.',
    routes.productionReadiness
  );
  pushStep(
    'openai',
    'Turns mock replies into real assistant responses for customer-facing flows.',
    'There is limited value in pilot or production verification while the AI layer is still mocked.',
    routes.productionReadiness
  );
  pushStep(
    'twilio',
    'Enables real inbound calls and next-morning follow-up triggers.',
    'Telephony is the last mile for a supervised pilot once config, storage, and AI are stable.',
    routes.productionReadiness
  );
  pushStep(
    'demo-dashboard',
    'Restores the recorded walkthrough route for stakeholder review.',
    'This needs attention before any fresh demo capture if the served dashboard route regresses.',
    routes.opsDashboard || routes.dashboard
  );
  pushStep(
    'dashboard',
    'Restores the served operator view if the built route is stale.',
    'A healthy dashboard route keeps operations reviews and demo prep moving.',
    routes.opsDashboard || routes.dashboard
  );

  return {
    headline: readyForProduction
      ? 'Production path is clear.'
      : readyForPilot
        ? 'Finish the production stack in this order.'
        : readyForDemo
          ? 'Demo is up; use this order to reach pilot and production.'
          : 'Follow this order to unlock the next walkthrough.',
    steps
  };
};

const resolveBlockerRoute = (item, routes = {}) => {
  if (item.id === 'dashboard' || item.id === 'demo-dashboard') {
    return routes.opsDashboard || routes.dashboard;
  }

  if (item.id === 'demo-data') {
    return routes.demoReadiness;
  }

  return routes.productionReadiness;
};

const actionFromBlocker = (item, routes = {}) => ({
  id: item.id,
  title: item.title,
  phase: item.phase,
  action: item.action,
  command: item.command,
  route: item.route || resolveBlockerRoute(item, routes)
});

const buildNextActionPlan = ({
  blockers = [],
  gates = {},
  readyForDemo,
  readyForPilot,
  readyForProduction,
  routes = {}
}) => {
  const credentialIds = new Set(['supabase', 'openai', 'twilio']);
  const localIds = new Set(['dashboard', 'demo-dashboard', 'demo-data', 'base-env']);
  const failedGates = Object.entries(gates).flatMap(([stage, items]) =>
    items
      .filter((item) => !item.passed)
      .map((item) => ({
        stage,
        label: item.label,
        command: item.command,
        route: item.route
      }))
  );
  const verificationPriority = {
    production: 1,
    pilot: 2,
    demo: 3
  };
  const canDoNow = blockers
    .filter((item) => localIds.has(item.id))
    .slice(0, 4)
    .map((item) => actionFromBlocker(item, routes));
  const needsCredentials = blockers
    .filter((item) => credentialIds.has(item.id))
    .map((item) => ({
      ...actionFromBlocker(item, routes),
      missingKeys: item.missingKeys || []
    }));
  const verification = [...failedGates]
    .sort((left, right) => {
      const leftPriority = verificationPriority[left.stage] || 999;
      const rightPriority = verificationPriority[right.stage] || 999;
      return leftPriority - rightPriority;
    })
    .slice(0, 4);

  return {
    headline: readyForProduction
      ? 'All launch gates are passing; run hosted verification before handoff.'
      : readyForPilot
        ? 'Pilot is viable; finish credential-backed production checks next.'
        : readyForDemo
          ? 'Demo is viable; clear credential and telephony blockers before pilot.'
          : 'Clear local demo blockers first, then finish credential-backed rollout setup.',
    canDoNow,
    needsCredentials,
    verification
  };
};

const buildLaunchChecklist = ({
  production = {},
  readiness = {},
  routes = {},
  commands = {}
}) => {
  const blockers = [];
  const missingProduction = production.missingProduction || [];
  const warnings = production.warnings || [];
  const checks = readiness.checks || {};
  const missingBase = missingProduction.filter((item) => REQUIRED_BASE.includes(item));
  const missingSupabase = missingProduction.filter((item) => REQUIRED_SUPABASE.includes(item));
  const missingTwilio = missingProduction.filter((item) => REQUIRED_TWILIO.includes(item));

  if (hasAny(missingProduction, REQUIRED_BASE)) {
    blockers.push({
      id: 'base-env',
      area: 'configuration',
      status: 'blocked',
      phase: 'today',
      priority: 1,
      title: 'Base production environment is incomplete',
      detail: 'Set dealership identity, persona, storage provider, and public base URL.',
      action: 'Populate .env.production.example and reload the service.',
      command: 'npm run check:production',
      missingKeys: missingBase
    });
  }

  if (hasAny(missingProduction, REQUIRED_SUPABASE) || production.storage?.activeProvider !== 'supabase') {
    blockers.push({
      id: 'supabase',
      area: 'data',
      status: 'blocked',
      phase: 'this-week',
      priority: 2,
      title: 'Cloud persistence is not active',
      detail: 'Production still points at local fallback storage instead of Supabase.',
      action: 'Configure Supabase credentials and switch STORAGE_PROVIDER to supabase.',
      command: 'npm run check:production',
      missingKeys: missingSupabase
    });
  }

  if (production.integrations?.openai !== 'configured') {
    blockers.push({
      id: 'openai',
      area: 'ai',
      status: 'blocked',
      phase: 'this-week',
      priority: 3,
      title: 'Live OpenAI replies are not enabled',
      detail: production.integrations?.openai === 'mock'
        ? 'USE_MOCK_AI is still enabled.'
        : 'OPENAI_API_KEY is still missing.',
      action: 'Disable mock mode and provide a real OPENAI_API_KEY.',
      command: 'npm run check:production',
      missingKeys: production.integrations?.openai === 'missing' ? ['OPENAI_API_KEY'] : []
    });
  }

  if (production.integrations?.twilio !== 'configured') {
    blockers.push({
      id: 'twilio',
      area: 'telephony',
      status: 'blocked',
      phase: 'before-pilot',
      priority: 4,
      title: 'Inbound phone routing is not configured',
      detail: 'Twilio credentials or phone number settings are still missing.',
      action: 'Configure Twilio and point the number webhook to /webhooks/twilio/voice.',
      command: 'npm run verify:production-url',
      missingKeys: missingTwilio
    });
  }

  if (!production.dashboard?.ready) {
    blockers.push({
      id: 'dashboard',
      area: 'dashboard',
      status: 'blocked',
      phase: 'today',
      priority: 2,
      title: 'Operator dashboard is not ready on the served route',
      detail: 'The backend-served /ops-dashboard/ route is not marked ready.',
      action: 'Refresh or rebuild the dashboard bundle before recording or launch.',
      command: 'npm run dashboard:refresh'
    });
  }

  if (!checks.hasDemoData) {
    blockers.push({
      id: 'demo-data',
      area: 'demo',
      status: 'warning',
      phase: 'before-demo',
      priority: 5,
      title: 'Demo seed data is missing',
      detail: 'The dashboard can run, but the walkthrough will look empty.',
      action: 'Seed demo data before recording or stakeholder review.',
      command: 'npm run demo:prepare'
    });
  }

  if (!checks.dashboardReady) {
    blockers.push({
      id: 'demo-dashboard',
      area: 'demo',
      status: 'blocked',
      phase: 'before-demo',
      priority: 3,
      title: 'Demo dashboard route is not ready',
      detail: 'The recorded walkthrough still needs a working dashboard route.',
      action: 'Refresh the dashboard and confirm /ops-dashboard/ is available.',
      command: 'npm run dashboard:refresh'
    });
  }

  const sortedBlockers = sortByPriority(blockers);
  const immediateActions = sortedBlockers
    .filter((item) => item.status === 'blocked')
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      title: item.title,
      action: item.action,
      command: item.command,
      phase: item.phase,
      priority: item.priority
    }));

  const timeline = {
    today: sortedBlockers.filter((item) => item.phase === 'today'),
    beforeDemo: sortedBlockers.filter((item) => item.phase === 'before-demo'),
    thisWeek: sortedBlockers.filter((item) => item.phase === 'this-week'),
    beforePilot: sortedBlockers.filter((item) => item.phase === 'before-pilot')
  };

  const completedSignals = [
    Boolean(production.localRunnable),
    Boolean(production.dashboard?.ready),
    Boolean(checks.hasDemoData),
    Boolean(production.storage?.activeProvider === 'supabase'),
    Boolean(production.integrations?.openai === 'configured'),
    Boolean(production.integrations?.twilio === 'configured')
  ];
  const completedCount = completedSignals.filter(Boolean).length;
  const completionScore = Math.round((completedCount / completedSignals.length) * 100);
  const phaseSummary = {
    today: buildPhaseSummary(timeline.today),
    beforeDemo: buildPhaseSummary(timeline.beforeDemo),
    thisWeek: buildPhaseSummary(timeline.thisWeek),
    beforePilot: buildPhaseSummary(timeline.beforePilot)
  };
  const areaSummary = buildAreaSummary(sortedBlockers);
  const readyForDemo = Boolean(readiness.ready);
  const readyForPilot = readyForDemo && Boolean(production.localRunnable) && Boolean(production.dashboard?.ready);
  const readyForProduction = Boolean(production.productionReady);
  const gates = {
    demo: [
      buildGate({
        label: 'Dashboard route ready',
        passed: Boolean(checks.dashboardReady),
        description: 'The served dashboard route is available for the walkthrough.',
        command: 'npm run dashboard:refresh',
        route: routes.opsDashboard || routes.dashboard
      }),
      buildGate({
        label: 'Demo data present',
        passed: Boolean(checks.hasDemoData),
        description: 'Leads, appointments, or follow-ups exist for the walkthrough.',
        command: 'npm run demo:prepare',
        route: routes.demoReadiness
      })
    ],
    pilot: [
      buildGate({
        label: 'Local runtime configured',
        passed: Boolean(production.localRunnable),
        description: 'Base dealership env values are set so the app can run in a supervised pilot.',
        command: 'npm run check:production',
        route: routes.productionReadiness
      }),
      buildGate({
        label: 'Dashboard ready for operators',
        passed: Boolean(production.dashboard?.ready),
        description: 'Operators can use the dashboard route during the pilot.',
        command: 'npm run dashboard:refresh',
        route: routes.opsDashboard || routes.dashboard
      }),
      buildGate({
        label: 'Twilio credentials configured',
        passed: Boolean(production.integrations?.twilio === 'configured'),
        description: 'The phone number and webhook can support real inbound pilot calls.',
        command: 'npm run verify:production-url',
        route: routes.productionReadiness
      })
    ],
    production: [
      buildGate({
        label: 'Supabase persistence active',
        passed: Boolean(production.storage?.activeProvider === 'supabase'),
        description: 'Production data is stored in cloud persistence rather than local fallback.',
        command: 'npm run check:production',
        route: routes.productionReadiness
      }),
      buildGate({
        label: 'Live OpenAI replies configured',
        passed: Boolean(production.integrations?.openai === 'configured'),
        description: 'Customer-facing replies use a real OpenAI API key rather than mock mode.',
        command: 'npm run check:production',
        route: routes.productionReadiness
      }),
      buildGate({
        label: 'Public verification path ready',
        passed: Boolean(production.productionReady),
        description: 'Hosted deployment checks can pass against the public URL.',
        command: 'npm run verify:production-url',
        route: routes.productionReadiness
      })
    ]
  };
  const gateSummary = {
    demo: {
      passed: gates.demo.filter((item) => item.passed).length,
      total: gates.demo.length
    },
    pilot: {
      passed: gates.pilot.filter((item) => item.passed).length,
      total: gates.pilot.length
    },
    production: {
      passed: gates.production.filter((item) => item.passed).length,
      total: gates.production.length
    }
  };
  const narrative = buildLaunchNarrative({
    readyForDemo,
    readyForPilot,
    readyForProduction,
    completionScore,
    phaseSummary
  });
  const unlockPlan = buildUnlockPlan({
    blockers: sortedBlockers,
    readyForDemo,
    readyForPilot,
    readyForProduction,
    routes
  });
  const nextActionPlan = buildNextActionPlan({
    blockers: sortedBlockers,
    gates,
    readyForDemo,
    readyForPilot,
    readyForProduction,
    routes
  });

  return {
    readyForDemo,
    readyForPilot,
    readyForProduction,
    blockerCount: blockers.filter((item) => item.status === 'blocked').length,
    warningCount: blockers.filter((item) => item.status === 'warning').length + warnings.length,
    missingEnvKeys: unique(missingProduction),
    immediateActions,
    timeline,
    phaseSummary,
    areaSummary,
    completionScore,
    gates,
    gateSummary,
    narrative,
    unlockPlan,
    nextActionPlan,
    blockers: sortedBlockers,
    warnings,
    commands,
    routes,
    generatedAt: new Date().toISOString()
  };
};

module.exports = {
  buildLaunchChecklist
};
