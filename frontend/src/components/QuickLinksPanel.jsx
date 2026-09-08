import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ExternalLink,
  Database,
  Activity,
  FileText,
  Users,
  Calendar,
  Clock,
  Link as LinkIcon,
  LayoutDashboard,
  Sparkles,
  PlayCircle,
  ShieldCheck,
  Flag
} from 'lucide-react';

const API_BASE_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
const ADMIN_API_KEY = ''; // Legacy links never carry credentials.
const buildApiUrl = (path) => `${API_BASE_URL}${path}`;
// Plain <a> links can't set a custom header, so gated routes carry the key
// as a query param instead. Only used for the raw-JSON admin links below.
const buildAdminApiUrl = (path) =>
  ADMIN_API_KEY ? `${buildApiUrl(path)}?api_key=${encodeURIComponent(ADMIN_API_KEY)}` : buildApiUrl(path);

// One neutral tone for most links; "nav" marks the two dashboard entry
// points, "data" marks the three PII-gated raw-JSON exports — a restrained
// 3-tone system instead of a different color per row.
const TONE_CLASSES = {
  neutral: 'text-muted-foreground',
  nav: 'text-primary',
  data: 'text-brand-accent'
};

const QuickLinksPanel = () => {
  const links = [
    { label: 'Built-in Dashboard', url: buildApiUrl('/dashboard'), icon: <LayoutDashboard className="h-4 w-4" />, tone: 'nav' },
    { label: 'Ops Dashboard', url: buildApiUrl('/ops-dashboard/'), icon: <LayoutDashboard className="h-4 w-4" />, tone: 'nav' },
    { label: 'Health Check', url: buildApiUrl('/health'), icon: <Activity className="h-4 w-4" />, tone: 'neutral' },
    { label: 'Runtime Status', url: buildApiUrl('/admin/runtime'), icon: <Database className="h-4 w-4" />, tone: 'neutral' },
    { label: 'Summary JSON', url: buildApiUrl('/admin/summary'), icon: <FileText className="h-4 w-4" />, tone: 'neutral' },
    { label: 'Dashboard Links', url: buildApiUrl('/admin/dashboard-links'), icon: <LinkIcon className="h-4 w-4" />, tone: 'neutral' },
    { label: 'Dashboard Status', url: buildApiUrl('/admin/dashboard-status'), icon: <LayoutDashboard className="h-4 w-4" />, tone: 'neutral' },
    { label: 'Dashboard Readiness', url: buildApiUrl('/admin/dashboard-readiness'), icon: <LayoutDashboard className="h-4 w-4" />, tone: 'neutral' },
    { label: 'Dashboard Overview', url: buildApiUrl('/admin/dashboard-overview'), icon: <FileText className="h-4 w-4" />, tone: 'neutral' },
    { label: 'Demo Overview', url: buildApiUrl('/admin/demo-overview'), icon: <Sparkles className="h-4 w-4" />, tone: 'neutral' },
    { label: 'Demo Readiness', url: buildApiUrl('/admin/demo-readiness'), icon: <PlayCircle className="h-4 w-4" />, tone: 'neutral' },
    { label: 'Production Readiness', url: buildApiUrl('/admin/production-readiness'), icon: <ShieldCheck className="h-4 w-4" />, tone: 'neutral' },
    { label: 'Demo Scenarios', url: buildApiUrl('/admin/demo-scenarios'), icon: <Flag className="h-4 w-4" />, tone: 'neutral' },
    { label: 'Launch Checklist', url: buildApiUrl('/admin/launch-checklist'), icon: <ShieldCheck className="h-4 w-4" />, tone: 'neutral' },
    { label: 'All Leads', url: buildAdminApiUrl('/admin/leads'), icon: <Users className="h-4 w-4" />, tone: 'data' },
    { label: 'All Appointments', url: buildAdminApiUrl('/admin/appointments'), icon: <Calendar className="h-4 w-4" />, tone: 'data' },
    { label: 'All Follow-ups', url: buildAdminApiUrl('/admin/followups'), icon: <Clock className="h-4 w-4" />, tone: 'data' }
  ];

  return (
    <Card className="shadow-none" data-testid="quick-links-panel">
      <CardHeader>
        <CardTitle className="text-lg font-semibold font-display flex items-center gap-2">
          <Database className="h-5 w-5 text-muted-foreground" />
          Quick Links
        </CardTitle>
        <CardDescription>Direct access to API endpoints</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {links.map((link, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full justify-start text-left"
              onClick={() => window.open(link.url, '_blank')}
              data-testid={`quick-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className={TONE_CLASSES[link.tone]}>{link.icon}</span>
              <span className="ml-2 flex-1">{link.label}</span>
              <ExternalLink className="h-3 w-3 text-muted-foreground/60" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickLinksPanel;
