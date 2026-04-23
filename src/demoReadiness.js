const buildDemoReadiness = ({ summary, dashboard, production, baseUrl = 'http://localhost:3000' }) => {
  const totalLeads = summary?.leads?.total || 0;
  const appointments = summary?.appointments?.total || 0;
  const followups = summary?.followups?.total || 0;
  const hasDemoData = totalLeads > 0;
  const dashboardReady = Boolean(dashboard?.ready);
  const ready = dashboardReady && hasDemoData;

  const nextSteps = [];
  if (!dashboardReady) {
    nextSteps.push('Run npm run dashboard:refresh before recording the dashboard segment.');
  }
  if (!hasDemoData) {
    nextSteps.push('Run npm run demo:prepare or POST /simulate/call to create demo leads.');
  }
  if (!production?.productionReady) {
    nextSteps.push('Frame the recording as a local demo or supervised pilot until production credentials are configured.');
  }
  nextSteps.push('Record one simulated call, then show the captured lead and follow-up queue in the dashboard.');

  return {
    ready,
    checks: {
      dashboardReady,
      hasDemoData,
      productionReady: Boolean(production?.productionReady)
    },
    counts: {
      leads: totalLeads,
      appointments,
      followups
    },
    routes: {
      dashboard: `${baseUrl.replace(/\/$/, '')}/dashboard`,
      opsDashboard: `${baseUrl.replace(/\/$/, '')}/ops-dashboard/`,
      simulateCall: `${baseUrl.replace(/\/$/, '')}/simulate/call`,
      summary: `${baseUrl.replace(/\/$/, '')}/admin/summary`,
      productionReadiness: `${baseUrl.replace(/\/$/, '')}/admin/production-readiness`
    },
    nextSteps,
    generatedAt: new Date().toISOString()
  };
};

module.exports = {
  buildDemoReadiness
};
