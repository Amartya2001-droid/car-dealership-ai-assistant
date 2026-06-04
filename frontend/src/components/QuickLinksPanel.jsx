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
const buildApiUrl = (path) => `${API_BASE_URL}${path}`;

const QuickLinksPanel = () => {
  const links = [
    {
      label: 'Built-in Dashboard',
      url: buildApiUrl('/dashboard'),
      icon: <LayoutDashboard className="h-4 w-4" />,
      color: 'text-stone-700'
    },
    {
      label: 'Ops Dashboard',
      url: buildApiUrl('/ops-dashboard/'),
      icon: <LayoutDashboard className="h-4 w-4" />,
      color: 'text-amber-700'
    },
    {
      label: 'Health Check',
      url: buildApiUrl('/health'),
      icon: <Activity className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      label: 'Runtime Status',
      url: buildApiUrl('/admin/runtime'),
      icon: <Database className="h-4 w-4" />,
      color: 'text-blue-600'
    },
    {
      label: 'Summary JSON',
      url: buildApiUrl('/admin/summary'),
      icon: <FileText className="h-4 w-4" />,
      color: 'text-purple-600'
    },
    {
      label: 'Dashboard Links',
      url: buildApiUrl('/admin/dashboard-links'),
      icon: <LinkIcon className="h-4 w-4" />,
      color: 'text-sky-600'
    },
    {
      label: 'Dashboard Status',
      url: buildApiUrl('/admin/dashboard-status'),
      icon: <LayoutDashboard className="h-4 w-4" />,
      color: 'text-stone-600'
    },
    {
      label: 'Dashboard Readiness',
      url: buildApiUrl('/admin/dashboard-readiness'),
      icon: <LayoutDashboard className="h-4 w-4" />,
      color: 'text-stone-600'
    },
    {
      label: 'Dashboard Overview',
      url: buildApiUrl('/admin/dashboard-overview'),
      icon: <FileText className="h-4 w-4" />,
      color: 'text-slate-600'
    },
    {
      label: 'Demo Overview',
      url: buildApiUrl('/admin/demo-overview'),
      icon: <Sparkles className="h-4 w-4" />,
      color: 'text-violet-600'
    },
    {
      label: 'Demo Readiness',
      url: buildApiUrl('/admin/demo-readiness'),
      icon: <PlayCircle className="h-4 w-4" />,
      color: 'text-amber-600'
    },
    {
      label: 'Production Readiness',
      url: buildApiUrl('/admin/production-readiness'),
      icon: <ShieldCheck className="h-4 w-4" />,
      color: 'text-emerald-700'
    },
    {
      label: 'Demo Scenarios',
      url: buildApiUrl('/admin/demo-scenarios'),
      icon: <Flag className="h-4 w-4" />,
      color: 'text-stone-700'
    },
    {
      label: 'Launch Checklist',
      url: buildApiUrl('/admin/launch-checklist'),
      icon: <ShieldCheck className="h-4 w-4" />,
      color: 'text-rose-700'
    },
    {
      label: 'All Leads',
      url: buildApiUrl('/admin/leads'),
      icon: <Users className="h-4 w-4" />,
      color: 'text-amber-600'
    },
    {
      label: 'All Appointments',
      url: buildApiUrl('/admin/appointments'),
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      label: 'All Follow-ups',
      url: buildApiUrl('/admin/followups'),
      icon: <Clock className="h-4 w-4" />,
      color: 'text-orange-600'
    }
  ];

  return (
    <Card className="shadow-lg border-stone-200" data-testid="quick-links-panel">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-stone-800 flex items-center gap-2">
          <Database className="h-5 w-5 text-stone-600" />
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
              className="w-full justify-start text-left hover:bg-stone-50"
              onClick={() => window.open(link.url, '_blank')}
              data-testid={`quick-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <span className={link.color}>{link.icon}</span>
              <span className="ml-2 flex-1 text-stone-700">{link.label}</span>
              <ExternalLink className="h-3 w-3 text-stone-400" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickLinksPanel;
