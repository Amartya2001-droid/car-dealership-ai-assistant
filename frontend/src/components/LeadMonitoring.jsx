import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Phone, ExternalLink, FileText, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

const topicColors = {
  test_drive: 'bg-primary/10 text-primary border-primary/20',
  pricing: 'bg-brand-highlight/10 text-brand-highlight border-brand-highlight/20',
  service: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
  inventory: 'bg-muted text-foreground border-border',
  general: 'bg-muted text-muted-foreground border-border'
};

const urgencyColors = {
  high: 'bg-brand-accent/15 text-brand-accent border-brand-accent/30',
  medium: 'bg-brand-highlight/15 text-brand-highlight border-brand-highlight/30',
  low: 'bg-muted text-muted-foreground border-border'
};

const statusColors = {
  new: 'bg-muted text-muted-foreground border-border',
  pending_schedule: 'bg-brand-highlight/15 text-brand-highlight border-brand-highlight/30',
  scheduled: 'bg-primary/10 text-primary border-primary/20',
  contacted: 'bg-foreground/5 text-foreground border-border'
};

const moodDotColors = {
  frustrated: 'bg-brand-accent',
  enthusiastic: 'bg-primary',
  neutral: 'bg-muted-foreground'
};

const LeadMonitoring = ({
  leads,
  searchQuery,
  setSearchQuery,
  topicFilter,
  setTopicFilter,
  statusFilter,
  setStatusFilter
}) => {
  const hasActiveFilters = Boolean(searchQuery) || topicFilter !== 'all' || statusFilter !== 'all';

  return (
    <Card className="shadow-none" data-testid="lead-monitoring-section">
      <CardHeader>
        <CardTitle className="text-xl font-semibold font-display flex items-center gap-2">
          <Phone className="h-5 w-5 text-brand-accent" />
          Lead Monitoring
        </CardTitle>
        <CardDescription>Search and filter recent customer inquiries</CardDescription>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or inquiry..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="lead-search-input"
            />
          </div>
          
          <Select value={topicFilter} onValueChange={setTopicFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="topic-filter">
              <SelectValue placeholder="Topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              <SelectItem value="test_drive">Test Drive</SelectItem>
              <SelectItem value="pricing">Pricing</SelectItem>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="inventory">Inventory</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="pending_schedule">Pending Schedule</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {leads.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p className="font-medium">{hasActiveFilters ? 'No leads match the current filters' : 'No leads found'}</p>
              <p className="text-sm">
                {hasActiveFilters ? 'Try clearing a search or filter to see more results' : 'Leads will appear here as calls come in'}
              </p>
            </div>
          ) : (
            leads.map((lead, index) => (
              <LeadCard key={lead.id || index} lead={lead} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const LeadCard = ({ lead }) => {
  const formattedDate = new Date(lead.createdAt).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <div
      className="p-4 border border-border rounded-lg bg-card hover:border-brand-accent/40 transition-colors duration-200"
      data-testid={`lead-card-${lead.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">
              {lead.callerName || 'Anonymous Caller'}
            </h3>
            <span
              className={`inline-block h-2 w-2 rounded-full ${moodDotColors[lead.mood] || moodDotColors.neutral}`}
              title={lead.mood || 'neutral'}
            />
          </div>
          <p className="text-sm text-muted-foreground">{lead.phone}</p>
        </div>
        <div className="text-right">
          <Badge className={`${statusColors[lead.status] || statusColors.new} border font-medium`}>
            {lead.status?.replace('_', ' ')}
          </Badge>
          <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
        </div>
      </div>

      {/* Inquiry */}
      <p className="text-sm text-foreground/80 mb-3 italic">"{lead.inquiry}"</p>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge className={`${topicColors[lead.topic] || topicColors.general} border`}>
          {lead.topic?.replace('_', ' ')}
        </Badge>
        <Badge className={`${urgencyColors[lead.urgency] || urgencyColors.low} border`}>
          {lead.urgency} urgency
        </Badge>
        {lead.consentFollowUp && (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            Follow-up consent
          </Badge>
        )}
        {lead.callbackWindow && (
          <Badge variant="outline" className="bg-brand-highlight/10 text-brand-highlight border-brand-highlight/20">
            <Phone className="h-3 w-3 mr-1" />
            Callback: {lead.callbackWindow.label}
          </Badge>
        )}
      </div>

      {/* Recommended Vehicles */}
      {lead.recommendedVehicles && lead.recommendedVehicles.length > 0 && (
        <div className="mb-3 p-3 bg-muted/50 rounded-md border border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">RECOMMENDED VEHICLES</p>
          <div className="space-y-2">
            {lead.recommendedVehicles.slice(0, 2).map((vehicle, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </span>
                <span className="text-muted-foreground ml-2">
                  ${vehicle.price?.toLocaleString()}
                </span>
                {vehicle.inStock && (
                  <Badge variant="outline" className="ml-2 text-xs bg-primary/10 text-primary border-primary/20">
                    In Stock
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Showroom Assets */}
      {lead.showroomAsset && (lead.showroomAsset.brochureUrl || lead.showroomAsset.walkaroundUrl) && (
        <div className="flex gap-2">
          {lead.showroomAsset.brochureUrl && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => window.open(lead.showroomAsset.brochureUrl, '_blank')}
            >
              <FileText className="h-3 w-3 mr-1" />
              Brochure
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          )}
          {lead.showroomAsset.walkaroundUrl && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => window.open(lead.showroomAsset.walkaroundUrl, '_blank')}
            >
              <Video className="h-3 w-3 mr-1" />
              Walkaround
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadMonitoring;
