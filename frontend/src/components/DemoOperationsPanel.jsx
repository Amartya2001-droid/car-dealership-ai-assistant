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
        ? 'border-primary/30 bg-primary/10 text-primary'
        : 'border-brand-highlight/30 bg-brand-highlight/10 text-brand-highlight'
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
  const immediateActions = launchChecklist.immediateActions || [];
  const missingEnvKeys = launchChecklist.missingEnvKeys || [];
  const phaseSummary = launchChecklist.phaseSummary || {};
  const areaSummary = launchChecklist.areaSummary || {};
  const gateSummary = launchChecklist.gateSummary || {};
  const narrative = launchChecklist.narrative || {};
  const unlockPlan = launchChecklist.unlockPlan || {};
  const nextActionPlan = launchChecklist.nextActionPlan || {};

  const narrativeToneClass = {
    ready: 'border-primary/30 bg-primary/10 text-foreground',
    pilot: 'border-brand-accent/30 bg-brand-accent/10 text-foreground',
    demo: 'border-brand-highlight/30 bg-brand-highlight/10 text-foreground',
    blocked: 'border-destructive/30 bg-destructive/10 text-foreground'
  }[narrative.statusTone || 'blocked'];

  return (
    <Card className="shadow-none" data-testid="demo-operations-panel">
      <CardHeader>
        <CardTitle className="text-lg font-semibold font-display flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-brand-accent" />
          Demo & Production Operations
        </CardTitle>
        <CardDescription>
          One place to confirm the recording path, scenario controls, and production blockers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {narrative.headline && (
          <div className={`rounded-xl border p-4 ${narrativeToneClass}`}>
            <div className="text-sm font-semibold">{narrative.headline}</div>
            {narrative.nextMilestone && (
              <div className="mt-1 text-sm opacity-90">
                Next milestone: {narrative.nextMilestone}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <PlayCircle className="h-4 w-4 text-brand-accent" />
                Demo readiness
              </div>
              <ReadinessBadge ok={Boolean(readiness.ready)} readyLabel="Ready" blockedLabel="Needs setup" />
            </div>
            <p className="text-xs text-muted-foreground">
              Leads {readiness.counts?.leads || 0} • Appointments {readiness.counts?.appointments || 0} • Follow-ups{' '}
              {readiness.counts?.followups || 0}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Production readiness
              </div>
              <ReadinessBadge
                ok={Boolean(production.productionReady)}
                readyLabel="Ready"
                blockedLabel="Not ready"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Storage {production.storage?.activeProvider || 'local'} • OpenAI {production.integrations?.openai || 'n/a'}{' '}
              • Twilio {production.integrations?.twilio || 'n/a'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Launch blockers</div>
            <div className="mt-2 text-2xl font-bold text-foreground">{launchChecklist.blockerCount || 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">Must be cleared before a real production rollout.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Warnings</div>
            <div className="mt-2 text-2xl font-bold text-foreground">{launchChecklist.warningCount || 0}</div>
            <p className="mt-1 text-xs text-muted-foreground">Non-blocking issues that still affect demos or pilots.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pilot status</div>
            <div className="mt-2">
              <ReadinessBadge
                ok={Boolean(launchChecklist.readyForPilot)}
                readyLabel="Pilot ready"
                blockedLabel="Pilot blocked"
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">Tracks whether next week’s supervised pilot path is realistic.</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-4 sm:col-span-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Completion score</div>
            <div className="mt-2 flex items-end gap-3">
              <div className="text-3xl font-bold text-foreground">{launchChecklist.completionScore || 0}%</div>
              <div className="text-xs text-muted-foreground">Based on dashboard, data, env, AI, and telephony readiness.</div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-accent via-brand-highlight to-primary transition-all"
                style={{ width: `${launchChecklist.completionScore || 0}%` }}
              />
            </div>
          </div>
        </div>

        {Object.keys(phaseSummary).length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['today', 'Today'],
              ['beforeDemo', 'Before Demo'],
              ['thisWeek', 'This Week'],
              ['beforePilot', 'Before Pilot']
            ].map(([key, label]) => (
              <div key={key} className="rounded-xl border border-border bg-muted/40 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
                <div className="mt-2 text-2xl font-bold text-foreground">{phaseSummary[key]?.blocked || 0}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  blocked • {phaseSummary[key]?.warnings || 0} warning{phaseSummary[key]?.warnings === 1 ? '' : 's'}
                </div>
              </div>
            ))}
          </div>
        )}

        {Object.keys(areaSummary).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 text-sm font-semibold text-foreground">Workstream breakdown</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {Object.entries(areaSummary).map(([key, value]) => (
                <div key={key} className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{key}</div>
                  <div className="mt-2 text-2xl font-bold text-foreground">{value.blocked}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    blocked • {value.warnings} warning{value.warnings === 1 ? '' : 's'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(gateSummary).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 text-sm font-semibold text-foreground">Go / no-go gates</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ['demo', 'Demo'],
                ['pilot', 'Pilot'],
                ['production', 'Production']
              ].map(([key, label]) => (
                <div key={key} className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</div>
                  <div className="mt-2 text-2xl font-bold text-foreground">
                    {gateSummary[key]?.passed || 0}/{gateSummary[key]?.total || 0}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">gates currently passing</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {(unlockPlan.steps || []).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-1 text-sm font-semibold text-foreground">Recommended unlock sequence</div>
            {unlockPlan.headline && (
              <div className="mb-4 text-sm text-muted-foreground">{unlockPlan.headline}</div>
            )}
            <div className="space-y-3">
              {unlockPlan.steps.map((item, index) => (
                <div key={item.id} className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium text-foreground">{item.title}</div>
                        <Badge className="border-border bg-card text-foreground">{item.phase}</Badge>
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">{item.action}</div>
                      <div className="mt-2 text-xs text-muted-foreground">Unlocks: {item.unlocks}</div>
                      <div className="mt-1 text-xs text-muted-foreground">Why now: {item.whyNow}</div>
                      {item.command && (
                        <div className="mt-2 rounded-md bg-card px-3 py-2 font-mono text-xs text-muted-foreground">
                          {item.command}
                        </div>
                      )}
                    </div>
                    {item.route && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 border-border text-foreground"
                        onClick={() => openUrl(item.route)}
                      >
                        Open
                        <ExternalLink className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {nextActionPlan.headline && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-1 text-sm font-semibold text-foreground">Action plan by dependency</div>
            <div className="mb-4 text-sm text-muted-foreground">{nextActionPlan.headline}</div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Can do now</div>
                <div className="mt-3 space-y-3">
                  {(nextActionPlan.canDoNow || []).length === 0 && (
                    <div className="text-sm text-muted-foreground">No local blockers remain.</div>
                  )}
                  {(nextActionPlan.canDoNow || []).map((item) => (
                    <div key={item.id} className="rounded-md border border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground">{item.title}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{item.action}</div>
                          {item.command && (
                            <div className="mt-2 rounded-md bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
                              {item.command}
                            </div>
                          )}
                        </div>
                        {item.route && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0 border-border text-foreground"
                            onClick={() => openUrl(item.route)}
                          >
                            Open
                            <ExternalLink className="ml-2 h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Needs credentials</div>
                <div className="mt-3 space-y-3">
                  {(nextActionPlan.needsCredentials || []).length === 0 && (
                    <div className="text-sm text-muted-foreground">No credential blockers remain.</div>
                  )}
                  {(nextActionPlan.needsCredentials || []).map((item) => (
                    <div key={item.id} className="rounded-md border border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground">{item.title}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{item.action}</div>
                          {(item.missingKeys || []).length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.missingKeys.map((key) => (
                                <Badge key={key} variant="outline" className="border-border bg-card text-foreground">
                                  {key}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {item.route && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0 border-border text-foreground"
                            onClick={() => openUrl(item.route)}
                          >
                            Open
                            <ExternalLink className="ml-2 h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Verify next</div>
                <div className="mt-3 space-y-3">
                  {(nextActionPlan.verification || []).length === 0 && (
                    <div className="text-sm text-muted-foreground">All checklist gates are passing.</div>
                  )}
                  {(nextActionPlan.verification || []).map((item) => (
                    <div key={`${item.stage}-${item.label}`} className="rounded-md border border-border bg-card p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-foreground">{item.label}</div>
                          <div className="mt-1 text-sm capitalize text-muted-foreground">{item.stage} gate</div>
                          {item.command && (
                            <div className="mt-2 rounded-md bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
                              {item.command}
                            </div>
                          )}
                        </div>
                        {item.route && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0 border-border text-foreground"
                            onClick={() => openUrl(item.route)}
                          >
                            Open
                            <ExternalLink className="ml-2 h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Flag className="h-4 w-4 text-muted-foreground" />
            Recording flow
          </div>
          <ol className="space-y-2 text-sm text-foreground">
            {recordingFlow.map((step, index) => (
              <li key={step} className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-brand-highlight" />
            Demo scenarios
          </div>
          <div className="flex flex-wrap gap-2">
            {scenarios.map((scenario) => (
              <Badge key={scenario.id} variant="outline" className="border-border bg-card text-foreground">
                {scenario.id}
              </Badge>
            ))}
          </div>
          {commands.scenarioRunExample && (
            <p className="mt-3 text-xs text-muted-foreground">Run example: {commands.scenarioRunExample}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 text-sm font-semibold text-foreground">Recommended commands</div>
            <div className="space-y-2 text-xs text-muted-foreground">
              {Object.entries(commands).map(([key, value]) => (
                <div key={key} className="rounded-md bg-muted/40 px-3 py-2 font-mono">
                  {value}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-2 text-sm font-semibold text-foreground">Next steps</div>
            <ul className="space-y-2 text-sm text-foreground">
              {nextSteps.map((step) => (
                <li key={step} className="flex gap-2">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-brand-highlight" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {immediateActions.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 text-sm font-semibold text-foreground">Top actions for this week</div>
            <div className="space-y-3">
              {immediateActions.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-medium text-foreground">{item.title}</div>
                    <Badge className="border-border bg-card text-foreground">{item.phase}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{item.action}</div>
                  {item.command && (
                    <div className="mt-2 rounded-md bg-card px-3 py-2 font-mono text-xs text-muted-foreground">
                      {item.command}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {missingEnvKeys.length > 0 && (
          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <div className="mb-3 text-sm font-semibold text-foreground">Missing production env keys</div>
            <div className="flex flex-wrap gap-2">
              {missingEnvKeys.map((item) => (
                <Badge key={item} variant="outline" className="border-border bg-card text-foreground">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {(launchChecklist.blockers || []).length > 0 && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-3 text-sm font-semibold text-foreground">Launch checklist</div>
            <div className="space-y-3">
              {launchChecklist.blockers.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-muted/40 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-foreground">{item.title}</div>
                      <div className="mt-1 text-sm text-muted-foreground">{item.detail}</div>
                      <div className="mt-2 text-xs text-muted-foreground">{item.action}</div>
                    </div>
                    <Badge
                      className={
                        item.status === 'blocked'
                          ? 'border-destructive/30 bg-destructive/10 text-destructive'
                          : 'border-brand-highlight/30 bg-brand-highlight/10 text-brand-highlight'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>
                  {item.command && (
                    <div className="mt-2 rounded-md bg-card px-3 py-2 font-mono text-xs text-muted-foreground">
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
            <Button variant="outline" className="border-border" onClick={() => openUrl(routes.opsDashboard)}>
              Open Ops Dashboard
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          )}
          {routes.demoReadiness && (
            <Button variant="outline" className="border-border" onClick={() => openUrl(routes.demoReadiness)}>
              Demo Readiness JSON
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          )}
          {routes.productionReadiness && (
            <Button
              variant="outline"
              className="border-border"
              onClick={() => openUrl(routes.productionReadiness)}
            >
              Production Readiness JSON
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          )}
          {routes.demoScenarios && (
            <Button variant="outline" className="border-border" onClick={() => openUrl(routes.demoScenarios)}>
              Demo Scenarios
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          )}
          {routes.launchChecklist && (
            <Button variant="outline" className="border-border" onClick={() => openUrl(routes.launchChecklist)}>
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
