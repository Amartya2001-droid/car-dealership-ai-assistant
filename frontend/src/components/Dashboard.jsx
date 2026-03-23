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
  Bell
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

const API_BASE_URL = (process.env.REACT_APP_BACKEND_URL || '').replace(/\/$/, '');
const REFRESH_INTERVAL = 30000; // 30 seconds

const apiGet = (path) => axios.get(`${API_BASE_URL}${path}`);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Data state
  const [summary, setSummary] = useState(null);
  const [leads, setLeads] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [followups, setFollowups] = useState([]);
  const [runtime, setRuntime] = useState(null);
  const [health, setHealth] = useState(null);
  const [dashboardStatus, setDashboardStatus] = useState(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }
    
    try {
      const [summaryRes, leadsRes, appointmentsRes, followupsRes, runtimeRes, healthRes, dashboardStatusRes] = await Promise.all([
        apiGet('/admin/summary'),
        apiGet('/admin/leads'),
        apiGet('/admin/appointments'),
        apiGet('/admin/followups'),
        apiGet('/admin/runtime'),
        apiGet('/health'),
        apiGet('/admin/dashboard-status')
      ]);

      setSummary(summaryRes.data);
      setLeads(leadsRes.data.leads || []);
      setAppointments(appointmentsRes.data.appointments || []);
      setFollowups(followupsRes.data.followups || []);
      setRuntime(runtimeRes.data);
      setHealth(healthRes.data);
      setDashboardStatus(dashboardStatusRes.data);
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
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-amber-50/20 to-stone-100">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-gradient-to-r from-stone-900 via-stone-800 to-amber-900 text-white shadow-xl">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-amber-600/20 rounded-xl backdrop-blur-sm border border-amber-500/30">
                <Activity className="h-8 w-8 text-amber-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold dashboard-header tracking-tight">
                  Operations Dashboard
                </h1>
                <p className="text-stone-300 text-sm mt-1 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Live monitoring • After-hours AI assistant
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {lastUpdated && (
                <div className="text-right text-sm text-stone-300 mr-2">
                  <div className="text-xs text-stone-400">Last updated</div>
                  <div className="font-medium">{lastUpdated.toLocaleTimeString()}</div>
                </div>
              )}
              <Button
                onClick={handleManualRefresh}
                disabled={refreshing}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm"
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
              <Badge variant="outline" className="bg-white/10 border-white/20 text-white backdrop-blur-sm">
                <Database className="h-3 w-3 mr-1" />
                {runtime.storage?.provider || 'local_json'}
              </Badge>
              <Badge variant="outline" className="bg-white/10 border-white/20 text-white backdrop-blur-sm">
                <Settings className="h-3 w-3 mr-1" />
                {runtime.defaultPersona || 'concierge'}
              </Badge>
              <Badge variant="outline" className="bg-white/10 border-white/20 text-white backdrop-blur-sm">
                v{runtime.version || '1.0.0'}
              </Badge>
              {health?.status && (
                <Badge variant="outline" className="bg-emerald-500/10 border-emerald-400/30 text-emerald-100 backdrop-blur-sm">
                  API {health.status}
                </Badge>
              )}
              {dashboardStatus && (
                <Badge variant="outline" className="bg-white/10 border-white/20 text-white backdrop-blur-sm">
                  {dashboardStatus.buildAvailable ? 'Build ready' : 'Build missing'}
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
            color="blue"
            data-testid="kpi-total-leads"
          />
          <KPICard
            title="Callbacks Requested"
            value={summary?.leads?.callbacksRequested || 0}
            icon={<Phone className="h-5 w-5" />}
            color="amber"
            data-testid="kpi-callbacks"
          />
          <KPICard
            title="Appointments"
            value={summary?.appointments?.total || 0}
            icon={<Calendar className="h-5 w-5" />}
            color="green"
            subtitle={`${summary?.appointments?.confirmed || 0} confirmed`}
            data-testid="kpi-appointments"
          />
          <KPICard
            title="Follow-ups Queued"
            value={summary?.followups?.queued || 0}
            icon={<Clock className="h-5 w-5" />}
            color="purple"
            subtitle={`${summary?.followups?.sent || 0} sent`}
            data-testid="kpi-followups"
          />
        </div>

        {/* Attention Queue */}
        {attentionLeads.length > 0 && (
          <Alert className="border-amber-600 bg-amber-50 animate-slide-in" data-testid="attention-queue">
            <Bell className="h-5 w-5 text-amber-600" />
            <AlertDescription className="text-amber-900">
              <strong className="font-semibold">{attentionLeads.length} lead{attentionLeads.length !== 1 ? 's' : ''}</strong> require{attentionLeads.length === 1 ? 's' : ''} immediate attention (high urgency or callback requested)
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lead Monitoring - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
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
