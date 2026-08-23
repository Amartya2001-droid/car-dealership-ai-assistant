import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, Clock } from 'lucide-react';

const AppointmentsSection = ({ appointments }) => {
  const statusConfig = {
    confirmed: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: 'bg-primary/10 text-primary border-primary/20',
      label: 'Confirmed'
    },
    scheduled: {
      icon: <Calendar className="h-4 w-4" />,
      color: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
      label: 'Scheduled'
    },
    pending: {
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-brand-highlight/10 text-brand-highlight border-brand-highlight/20',
      label: 'Pending'
    }
  };

  return (
    <Card className="shadow-none" data-testid="appointments-section">
      <CardHeader>
        <CardTitle className="text-lg font-semibold font-display flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Appointments
        </CardTitle>
        <CardDescription>
          {appointments.length === 0 ? 'Test drive scheduling' : `${appointments.length} scheduled or pending test drive${appointments.length === 1 ? '' : 's'}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-10 w-10 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm font-medium">No appointments scheduled</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Test drive requests will appear here after callers book a slot.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {appointments.slice(0, 5).map((appointment, index) => {
              const config = statusConfig[appointment.status] || statusConfig.pending;
              const appointmentDate = appointment.scheduledTime
                ? new Date(appointment.scheduledTime).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })
                : 'TBD';

              return (
                <div
                  key={appointment.id || index}
                  className="p-3 border border-border rounded-lg bg-muted/40 hover:bg-card transition-colors"
                  data-testid={`appointment-${appointment.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`${config.color} border font-medium flex items-center gap-1`}>
                      {config.icon}
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{appointmentDate}</span>
                  </div>
                  {appointment.leadId && (
                    <p className="text-sm font-medium">
                      Lead ID: {appointment.leadId}
                    </p>
                  )}
                  {appointment.vehicle && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {appointment.vehicle}
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

export default AppointmentsSection;
