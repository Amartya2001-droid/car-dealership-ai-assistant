import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Send, Inbox } from 'lucide-react';

const FollowupSection = ({ followups }) => {
  const statusConfig = {
    queued: {
      icon: <Inbox className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      label: 'Queued'
    },
    sent: {
      icon: <Send className="h-4 w-4" />,
      color: 'bg-green-100 text-green-700 border-green-300',
      label: 'Sent'
    },
    failed: {
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-red-100 text-red-700 border-red-300',
      label: 'Failed'
    }
  };

  return (
    <Card className="shadow-lg border-stone-200" data-testid="followup-section">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-stone-800 flex items-center gap-2">
          <Clock className="h-5 w-5 text-purple-600" />
          Follow-up Queue
        </CardTitle>
        <CardDescription>
          {followups.length === 0 ? 'Next-day customer outreach' : `${followups.length} queued or processed follow-up message${followups.length === 1 ? '' : 's'}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {followups.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            <Clock className="h-10 w-10 mx-auto mb-2 text-stone-300" />
            <p className="text-sm font-medium">No follow-ups queued</p>
            <p className="text-xs text-stone-400 mt-1">Opted-in callers will show up here for next-business-day outreach.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {followups.slice(0, 5).map((followup, index) => {
              const config = statusConfig[followup.status] || statusConfig.queued;
              const followupDate = followup.scheduledFor 
                ? new Date(followup.scheduledFor).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })
                : 'Pending';

              return (
                <div
                  key={followup.id || index}
                  className="p-3 border border-stone-200 rounded-lg bg-stone-50 hover:bg-white transition-colors"
                  data-testid={`followup-${followup.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`${config.color} border font-medium flex items-center gap-1`}>
                      {config.icon}
                      {config.label}
                    </Badge>
                    <span className="text-xs text-stone-500">{followupDate}</span>
                  </div>
                  {followup.leadId && (
                    <p className="text-sm text-stone-700 font-medium">
                      Lead ID: {followup.leadId}
                    </p>
                  )}
                  {followup.message && (
                    <p className="text-xs text-stone-600 mt-1 line-clamp-2">
                      {followup.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FollowupSection;
