import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  Flag,
  PlayCircle,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

const openUrl = (url) => window.open(url, '_blank', 'noopener,noreferrer');

const ReadinessBadge = ({ ok, readyLabel, blockedLabel }) => (
  <Badge
    className={
      ok
        ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
        : 'border-amber-300 bg-amber-50 text-amber-700'
    }
  >
    {ok ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <CircleAlert className="mr-1 h-3 w-3" />}
    {ok ? readyLabel : blockedLabel}
  </Badge>
);

const DemoOperationsPanel = ({ demoOverview }) => {
  const readiness = demoOverview?.readiness || {};
  const production = demoOverview?.production || {};
  const scenarios = demoOverview?.scenarios || [];
  const recordingFlow = demoOverview?.recordingFlow || [];
  const commands = demoOverview?.commands || {};
  const routes = demoOverview?.routes || {};
  const launchChecklist = demoOverview?.launchChecklist || {};
  const nextSteps = readiness?.nextSteps || production?.nextSteps || [];

  return (
    <Card className="shadow-lg border-stone-200" data-testid="demo-operations-panel">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-stone-800 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-600" />
          Demo & Production Operations
        </CardTitle>
        <CardDescription>
          One place to confirm the recording path, scenario controls, and production blockers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-stone-800">
                <PlayCircle className="h-4 w-4 text-amber-600" />
                Demo readiness
              </div>
              <ReadinessBadge ok={Boolean(readiness.ready)} readyLabel="Ready" blockedLabel="Needs setup" />
            </div>
            <p className="text-xs text-stone-500">
              Leads {readiness.counts?.leads || 0} • Appointments {readiness.counts?.appointments || 0} • Follow-ups{' '}
              {readiness.counts?.followups || 0}
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-stone-800">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Production readiness
              </div>
              <ReadinessBadge
                ok={Boolean(production.productionReady)}
                readyLabel="Ready"
                blockedLabel="Not ready"
              />
            </div>
            <p className="text-xs text-stone-500">
              Storage {production.storage?.activeProvider || 'local'} • OpenAI {production.integrations?.openai || 'n/a'}{' '}
              • Twilio {production.integrations?.twilio || 'n/a'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Launch blockers</div>
            <div className="mt-2 text-2xl font-bold text-stone-900">{launchChecklist.blockerCount || 0}</div>
            <p className="mt-1 text-xs text-stone-500">Must be cleared before a real production rollout.</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Warnings</div>
            <div className="mt-2 text-2xl font-bold text-stone-900">{launchChecklist.warningCount || 0}</div>
            <p className="mt-1 text-xs text-stone-500">Non-blocking issues that still affect demos or pilots.</p>
          </div>
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-stone-500">Pilot status</div>
            <div className="mt-2">
              <ReadinessBadge
                ok={Boolean(launchChecklist.readyForPilot)}
                readyLabel="Pilot ready"
                blockedLabel="Pilot blocked"
              />
            </div>
            <p className="mt-2 text-xs text-stone-500">Tracks whether next week’s supervised pilot path is realistic.</p>
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
            <Flag className="h-4 w-4 text-stone-600" />
            Recording flow
          </div>
          <ol className="space-y-2 text-sm text-stone-700">
            {recordingFlow.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-stone-800">
            <Sparkles className="h-4 w-4 text-violet-600" />
            Demo scenarios
          </div>
          <div className="flex flex-wrap gap-2">
            {scenarios.map((scenario) => (
              <Badge key={scenario.id} variant="outline" className="border-stone-300 bg-white text-stone-700">
                {scenario.id}
              </Badge>
            ))}
          </div>
          {commands.scenarioRunExample && (
            <p className="mt-3 text-xs text-stone-500">Run example: {commands.scenarioRunExample}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="mb-2 text-sm font-semibold text-stone-800">Recommended commands</div>
            <div className="space-y-2 text-xs text-stone-600">
              {Object.entries(commands).map(([key, value]) => (
                <div key={key} className="rounded-md bg-stone-50 px-3 py-2 font-mono">
                  {value}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="mb-2 text-sm font-semibold text-stone-800">Next steps</div>
            <ul className="space-y-2 text-sm text-stone-700">
              {nextSteps.map((step) => (
                <li key={step} className="flex gap-2">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {(launchChecklist.blockers || []).length > 0 && (
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <div className="mb-3 text-sm font-semibold text-stone-800">Launch checklist</div>
            <div className="space-y-3">
              {launchChecklist.blockers.map((item) => (
                <div key={item.id} className="rounded-lg border border-stone-200 bg-stone-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-stone-900">{item.title}</div>
                      <div className="mt-1 text-sm text-stone-600">{item.detail}</div>
                      <div className="mt-2 text-xs text-stone-500">{item.action}</div>
                    </div>
                    <Badge
                      className={
                        item.status === 'blocked'
                          ? 'border-red-300 bg-red-50 text-red-700'
                          : 'border-amber-300 bg-amber-50 text-amber-700'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  {item.command && (
                    <div className="mt-2 rounded-md bg-white px-3 py-2 font-mono text-xs text-stone-600">
                      {item.command}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {routes.opsDashboard && (
            <Button variant="outline" className="border-stone-300" onClick={() => openUrl(routes.opsDashboard)}>
              Open Ops Dashboard
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          )}
          {routes.demoReadiness && (
            <Button variant="outline" className="border-stone-300" onClick={() => openUrl(routes.demoReadiness)}>
              Demo Readiness JSON
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          )}
          {routes.productionReadiness && (
            <Button
              variant="outline"
              className="border-stone-300"
              onClick={() => openUrl(routes.productionReadiness)}
            >
              Production Readiness JSON
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          )}
          {routes.demoScenarios && (
            <Button variant="outline" className="border-stone-300" onClick={() => openUrl(routes.demoScenarios)}>
              Demo Scenarios
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          )}
          {routes.launchChecklist && (
            <Button variant="outline" className="border-stone-300" onClick={() => openUrl(routes.launchChecklist)}>
              Launch Checklist JSON
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DemoOperationsPanel;
