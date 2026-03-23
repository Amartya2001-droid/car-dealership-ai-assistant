import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Phone, ExternalLink, FileText, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

const topicColors = {
  test_drive: 'bg-blue-100 text-blue-700 border-blue-300',
  pricing: 'bg-green-100 text-green-700 border-green-300',
  service: 'bg-orange-100 text-orange-700 border-orange-300',
  inventory: 'bg-purple-100 text-purple-700 border-purple-300',
  general: 'bg-stone-100 text-stone-700 border-stone-300'
};

const urgencyColors = {
  high: 'bg-red-100 text-red-700 border-red-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  low: 'bg-gray-100 text-gray-700 border-gray-300'
};

const statusColors = {
  new: 'bg-blue-100 text-blue-700 border-blue-300',
  pending_schedule: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  scheduled: 'bg-green-100 text-green-700 border-green-300',
  contacted: 'bg-purple-100 text-purple-700 border-purple-300'
};

const moodIcons = {
  frustrated: '😤',
  enthusiastic: '🤩',
  neutral: '😊'
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
    <Card className="shadow-lg border-stone-200" data-testid="lead-monitoring-section">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-stone-800 flex items-center gap-2">
          <Phone className="h-5 w-5 text-amber-600" />
          Lead Monitoring
        </CardTitle>
        <CardDescription>Search and filter recent customer inquiries</CardDescription>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400" />
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
            <div className="text-center py-12 text-stone-500">
              <Phone className="h-12 w-12 mx-auto mb-3 text-stone-300" />
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
      className="p-4 border-2 border-stone-200 rounded-lg bg-white hover:border-amber-300 hover:shadow-md transition-all duration-200"
      data-testid={`lead-card-${lead.id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-stone-800">
              {lead.callerName || 'Anonymous Caller'}
            </h3>
            <span className="text-lg">{moodIcons[lead.mood] || '😊'}</span>
          </div>
          <p className="text-sm text-stone-500">{lead.phone}</p>
        </div>
        <div className="text-right">
          <Badge className={`${statusColors[lead.status] || statusColors.new} border font-medium`}>
            {lead.status?.replace('_', ' ')}
          </Badge>
          <p className="text-xs text-stone-500 mt-1">{formattedDate}</p>
        </div>
      </div>

      {/* Inquiry */}
      <p className="text-sm text-stone-700 mb-3 italic">"{lead.inquiry}"</p>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <Badge className={`${topicColors[lead.topic] || topicColors.general} border`}>
          {lead.topic?.replace('_', ' ')}
        </Badge>
        <Badge className={`${urgencyColors[lead.urgency] || urgencyColors.low} border`}>
          {lead.urgency} urgency
        </Badge>
        {lead.consentFollowUp && (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
            ✓ Follow-up consent
          </Badge>
        )}
        {lead.callbackWindow && (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
            <Phone className="h-3 w-3 mr-1" />
            Callback: {lead.callbackWindow.label}
          </Badge>
        )}
      </div>

      {/* Recommended Vehicles */}
      {lead.recommendedVehicles && lead.recommendedVehicles.length > 0 && (
        <div className="mb-3 p-3 bg-stone-50 rounded-md border border-stone-200">
          <p className="text-xs font-semibold text-stone-600 mb-2">RECOMMENDED VEHICLES</p>
          <div className="space-y-2">
            {lead.recommendedVehicles.slice(0, 2).map((vehicle, idx) => (
              <div key={idx} className="text-sm">
                <span className="font-medium text-stone-800">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </span>
                <span className="text-stone-600 ml-2">
                  ${vehicle.price?.toLocaleString()}
                </span>
                {vehicle.inStock && (
                  <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-300">
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
