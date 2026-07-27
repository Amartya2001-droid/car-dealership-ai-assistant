const buildCallerScript = (scenario) => [
  {
    speaker: 'assistant',
    line: 'Thanks for calling after hours. Please tell me your name and how I can help with inventory, pricing, service, or a test drive.'
  },
  {
    speaker: 'caller',
    line: scenario.callerInput
  },
  {
    speaker: 'assistant',
    line: 'Capture the AI reply from the scenario response, then show the saved lead and queued next-business-day follow-up.'
  }
];

const buildScenarioProofPoints = (scenario) => {
  const points = [
    `Lead captures caller name (${scenario.callerName}) and phone (${scenario.phone}).`,
    `Persona is set to ${scenario.persona}.`,
    'Dashboard totals update after the scenario run.',
    'Follow-up queue shows a next-business-day customer response when opt-in is true.'
  ];

  if (/test drive|appointment|book/i.test(scenario.callerInput)) {
    points.push('Appointment list shows a pending test-drive booking.');
  }

  if (/suv|car|vehicle|inventory|hybrid|compact/i.test(scenario.callerInput)) {
    points.push('Lead includes vehicle recommendations and showroom links when inventory matches.');
  }

  return points;
};

const buildDemoRunSheet = ({ scenario, routes, baseUrl }) => {
  if (!scenario) {
    throw new Error('A demo scenario is required to build a run sheet.');
  }

  const scenarioRoute = routes?.scenarioRun || `${baseUrl}/admin/demo/scenarios/${scenario.id}/run`;
  const dashboardRoute = routes?.dashboard || `${baseUrl}/dashboard`;
  const demoOverviewRoute = routes?.demoOverview || `${baseUrl}/admin/demo-overview`;
  const summaryRoute = routes?.summary || `${baseUrl}/admin/summary`;

  return {
    id: `run-sheet-${scenario.id}`,
    title: `Recorded demo run sheet: ${scenario.label}`,
    scenario: {
      id: scenario.id,
      label: scenario.label,
      callerName: scenario.callerName,
      phone: scenario.phone,
      persona: scenario.persona,
      optInFollowUp: Boolean(scenario.consentFollowUp)
    },
    presenterCommands: {
      prepareDemoData: 'npm run demo:prepare',
      listScenarios: 'npm run demo:scenario',
      runScenario: `npm run demo:scenario -- ${scenario.id}`,
      printRunSheet: `npm run demo:run-sheet -- ${scenario.id}`,
      openDashboard: dashboardRoute,
      openDemoOverview: demoOverviewRoute
    },
    apiRoutes: {
      runScenario: scenarioRoute,
      dashboard: dashboardRoute,
      demoOverview: demoOverviewRoute,
      summary: summaryRoute
    },
    callerScript: buildCallerScript(scenario),
    screenRecordingChecklist: [
      'Start on the dashboard before running the scenario.',
      'Run the named scenario and keep the JSON response visible.',
      'Point out the assistant reply, lead id, urgency, topic, and callback window.',
      'Refresh the dashboard and show the new lead, appointment, follow-up queue, and showroom links.',
      'Open demo overview and production readiness to show remaining pilot blockers.'
    ],
    proofPoints: buildScenarioProofPoints(scenario),
    closingNarration: [
      'The after-hours assistant answered the caller, classified the inquiry, and stored the lead.',
      'The system queued staff/customer follow-up for the next business day.',
      'The dealership team can review the same event from the monitoring dashboard.'
    ]
  };
};

module.exports = {
  buildDemoRunSheet
};
