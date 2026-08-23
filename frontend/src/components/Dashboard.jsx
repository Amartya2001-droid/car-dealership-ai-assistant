import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Activity,
  RefreshCw,
  Database,
  Settings,
  Users,
  Phone,
  Calendar,
  Clock,
  Bell,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import KPICard from './KPICard';
import LeadMonitoring from './LeadMonitoring';
import AppointmentsSection from './AppointmentsSection';
import FollowupSection from './FollowupSection';
import QuickLinksPanel from './QuickLinksPanel';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorState from './ErrorState';
import DemoOperationsPanel from './DemoOperationsPanel';

const API_BASE_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
const ADMIN_API_KEY = process.env.REACT_APP_ADMIN_API_KEY || '';
const REFRESH_INTERVAL = 30000; // 30 seconds
const THEME_STORAGE_KEY = 'dealership-dashboard-theme';

const getInitialTheme = () => {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored) return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const apiGet = (path) =>
  axios.get(`${API_BASE_URL}${path}`, ADMIN_API_KEY ? { headers: { 'x-admin-api-key': ADMIN_API_KEY } } : undefined);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((current) => (current === 'dark' ? 'light' : 'dark'));

  // Data state
  const [summary, setSummary] = useState(null);
  const [leads, setLeads] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [runtime, setRuntime] = useState(null);
  const [health, setHealth] = useState(null);
  const [dashboardReadiness, setDashboardReadiness] = useState(null);
  const [demoOverview, setDemoOverview] = useState(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }
    
    try {
      const [summaryRes, leadsRes, appointmentsRes, followupsRes, runtimeRes, healthRes, dashboardReadinessRes, demoOverviewRes] = await Promise.all([
        apiGet('/admin/summary'),
        apiGet('/admin/leads'),
        apiGet('/admin/appointments'),
        apiGet('/admin/followups'),
        apiGet('/admin/runtime'),
        apiGet('/health'),
        apiGet('/admin/dashboard-readiness'),
        apiGet('/admin/demo-overview')
      ]);

      setSummary(summaryRes.data);
      setLeads(leadsRes.data.leads || []);
      setAppointments(appointmentsRes.data.appointments || []);
      setFollowups(followupsRes.data.followups || []);
      setRuntime(runtimeRes.data);
      setHealth(healthRes.data);
      setDashboardReadiness(dashboardReadinessRes.data);
      setDemoOverview(demoOverviewRes.data);
      setLastUpdated(new Date());
      setError(null);
      
      if (isManualRefresh) {
        toast.success('Dashboard refreshed successfully');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      
      if (isManualRefresh) {
        toast.error('Failed to refresh dashboard');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleManualRefresh = () => {
    fetchDashboardData(true);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = !searchQuery || 
      lead.callerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.inquiry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery);
    
    const matchesTopic = topicFilter === 'all' || lead.topic === topicFilter;
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesTopic && matchesStatus;
  });

  const attentionLeads = leads.filter(lead => 
    lead.urgency === 'high' || lead.callbackWindow !== null
  );

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error && !summary) {
    return <ErrorState error={error} onRetry={handleManualRefresh} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster position="top-right" />

      {/* Header */}
      <header className="bg-header text-header-foreground shadow-xl">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-brand-accent/15 rounded-xl border border-brand-accent/30">
                <Activity className="h-8 w-8 text-brand-accent" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold font-display tracking-tight">
                  Operations Dashboard
                </h1>
                <p className="text-header-foreground/70 text-sm mt-1 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-accent"></span>
                  </span>
                  Live monitoring • After-hours AI assistant
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {lastUpdated && (
                <div className="text-right text-sm text-header-foreground/70 mr-2">
                  <div className="text-xs text-header-foreground/50">Last updated</div>
                  <div className="font-medium">{lastUpdated.toLocaleTimeString()}</div>
                </div>
              )}
              <Button
                onClick={toggleTheme}
                variant="outline"
                size="icon"
                className="bg-header-foreground/10 border-header-foreground/20 text-header-foreground hover:bg-header-foreground/20"
                aria-label="Toggle dark mode"
                data-testid="theme-toggle"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button
                onClick={handleManualRefresh}
                disabled={refreshing}
                variant="outline"
                className="bg-header-foreground/10 border-header-foreground/20 text-header-foreground hover:bg-header-foreground/20"
                data-testid="refresh-button"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Runtime Status Badges */}
          {runtime && (
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <Badge variant="outline" className="bg-header-foreground/10 border-header-foreground/20 text-header-foreground">
                <Database className="h-3 w-3 mr-1" />
                {runtime.storage?.provider || 'local_json'}
              </Badge>
              <Badge variant="outline" className="bg-header-foreground/10 border-header-foreground/20 text-header-foreground">
                <Settings className="h-3 w-3 mr-1" />
                {runtime.defaultPersona || 'concierge'}
              </Badge>
              <Badge variant="outline" className="bg-header-foreground/10 border-header-foreground/20 text-header-foreground">
                v{runtime.version || '1.0.0'}
              </Badge>
              {health?.status && (
                <Badge variant="outline" className="bg-brand-highlight/15 border-brand-highlight/30 text-header-foreground">
                  API {health.status}
                </Badge>
              )}
              {dashboardReadiness?.status && (
                <Badge variant="outline" className="bg-header-foreground/10 border-header-foreground/20 text-header-foreground">
                  {dashboardReadiness.status.buildMode === 'react_bundle'
                    ? 'React bundle ready'
                    : dashboardReadiness.status.buildMode === 'fallback_shell'
                      ? 'Fallback shell active'
                      : 'Build missing'}
                </Badge>
              )}
              {dashboardReadiness?.recommendedRoute && (
                <Badge variant="outline" className="bg-header-foreground/10 border-header-foreground/20 text-header-foreground">
                  Route {dashboardReadiness.recommendedRoute.replace(API_BASE_URL, '')}
                </Badge>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
          <KPICard
            title="Total Leads"
            value={summary?.leads?.total || 0}
            icon={<Users className="h-5 w-5" />}
            trend="+12% this week"
            color="forest"
            data-testid="kpi-total-leads"
          />
          <KPICard
            title="Callbacks Requested"
            value={summary?.leads?.callbacksRequested || 0}
            icon={<Phone className="h-5 w-5" />}
            color="accent"
            data-testid="kpi-callbacks"
          />
          <KPICard
            title="Appointments"
            value={summary?.appointments?.total || 0}
            icon={<Calendar className="h-5 w-5" />}
            color="gold"
            subtitle={`${summary?.appointments?.confirmed || 0} confirmed`}
            data-testid="kpi-appointments"
          />
          <KPICard
            title="Follow-ups Queued"
            value={summary?.followups?.queued || 0}
            icon={<Clock className="h-5 w-5" />}
            color="slate"
            subtitle={`${summary?.followups?.sent || 0} sent`}
            data-testid="kpi-followups"
          />
        </div>

        {/* Attention Queue */}
        {attentionLeads.length > 0 && (
          <Alert className="border-brand-accent/40 bg-brand-accent/10 animate-slide-in" data-testid="attention-queue">
            <Bell className="h-5 w-5 text-brand-accent" />
            <AlertDescription className="text-foreground">
              <strong className="font-semibold">{attentionLeads.length} lead{attentionLeads.length !== 1 ? 's' : ''}</strong> require{attentionLeads.length === 1 ? 's' : ''} immediate attention (high urgency or callback requested)
            </AlertDescription>
          </Alert>
        )}

        {error && summary && (
          <Alert className="border-destructive/40 bg-destructive/10" data-testid="dashboard-warning">
            <Bell className="h-5 w-5 text-destructive" />
            <AlertDescription className="text-foreground">
              Some dashboard data may be stale. Latest refresh failed with: {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lead Monitoring - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            <DemoOperationsPanel demoOverview={demoOverview} />
            <LeadMonitoring
              leads={filteredLeads}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              topicFilter={topicFilter}
              setTopicFilter={setTopicFilter}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-6">
            <AppointmentsSection appointments={appointments} />
            <FollowupSection followups={followups} />
            <QuickLinksPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
