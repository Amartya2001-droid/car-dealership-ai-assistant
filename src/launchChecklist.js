const { REQUIRED_BASE, REQUIRED_SUPABASE, REQUIRED_TWILIO } = require('./productionReadiness');

const hasAny = (values = [], required = []) => required.some((item) => values.includes(item));

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

  if (hasAny(missingProduction, REQUIRED_BASE)) {
    blockers.push({
      id: 'base-env',
      area: 'configuration',
      status: 'blocked',
      title: 'Base production environment is incomplete',
      detail: 'Set dealership identity, persona, storage provider, and public base URL.',
      action: 'Populate .env.production.example and reload the service.',
      command: 'npm run check:production'
    });
  }

  if (hasAny(missingProduction, REQUIRED_SUPABASE) || production.storage?.activeProvider !== 'supabase') {
    blockers.push({
      id: 'supabase',
      area: 'data',
      status: 'blocked',
      title: 'Cloud persistence is not active',
      detail: 'Production still points at local fallback storage instead of Supabase.',
      action: 'Configure Supabase credentials and switch STORAGE_PROVIDER to supabase.',
      command: 'npm run check:production'
    });
  }

  if (production.integrations?.openai !== 'configured') {
    blockers.push({
      id: 'openai',
      area: 'ai',
      status: 'blocked',
      title: 'Live OpenAI replies are not enabled',
      detail: production.integrations?.openai === 'mock'
        ? 'USE_MOCK_AI is still enabled.'
        : 'OPENAI_API_KEY is still missing.',
      action: 'Disable mock mode and provide a real OPENAI_API_KEY.',
      command: 'npm run check:production'
    });
  }

  if (production.integrations?.twilio !== 'configured') {
    blockers.push({
      id: 'twilio',
      area: 'telephony',
      status: 'blocked',
      title: 'Inbound phone routing is not configured',
      detail: 'Twilio credentials or phone number settings are still missing.',
      action: 'Configure Twilio and point the number webhook to /webhooks/twilio/voice.',
      command: 'npm run verify:production-url'
    });
  }

  if (!production.dashboard?.ready) {
    blockers.push({
      id: 'dashboard',
      area: 'dashboard',
      status: 'blocked',
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
      title: 'Demo dashboard route is not ready',
      detail: 'The recorded walkthrough still needs a working dashboard route.',
      action: 'Refresh the dashboard and confirm /ops-dashboard/ is available.',
      command: 'npm run dashboard:refresh'
    });
  }

  return {
    readyForDemo: Boolean(readiness.ready),
    readyForPilot: Boolean(readiness.ready) && Boolean(production.localRunnable) && Boolean(production.dashboard?.ready),
    readyForProduction: Boolean(production.productionReady),
    blockerCount: blockers.filter((item) => item.status === 'blocked').length,
    warningCount: blockers.filter((item) => item.status === 'warning').length + warnings.length,
    blockers,
    warnings,
    commands,
    routes,
    generatedAt: new Date().toISOString()
  };
};

module.exports = {
  buildLaunchChecklist
};
