import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Database, Activity, FileText, Users, Calendar, Clock } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:3000';

const QuickLinksPanel = () => {
  const links = [
    {
      label: 'Health Check',
      url: `${BACKEND_URL}/health`,
      icon: <Activity className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      label: 'Runtime Status',
      url: `${BACKEND_URL}/admin/runtime`,
      icon: <Database className="h-4 w-4" />,
      color: 'text-blue-600'
    },
    {
      label: 'Summary JSON',
      url: `${BACKEND_URL}/admin/summary`,
      icon: <FileText className="h-4 w-4" />,
      color: 'text-purple-600'
    },
    {
      label: 'All Leads',
      url: `${BACKEND_URL}/admin/leads`,
      icon: <Users className="h-4 w-4" />,
      color: 'text-amber-600'
    },
    {
      label: 'All Appointments',
      url: `${BACKEND_URL}/admin/appointments`,
      icon: <Calendar className="h-4 w-4" />,
      color: 'text-green-600'
    },
    {
      label: 'All Follow-ups',
      url: `${BACKEND_URL}/admin/followups`,
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
