import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const AppointmentsSection = ({ appointments }) => {
  const statusConfig = {
    confirmed: {
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: 'bg-green-100 text-green-700 border-green-300',
      label: 'Confirmed'
    },
    scheduled: {
      icon: <Calendar className="h-4 w-4" />,
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      label: 'Scheduled'
    },
    pending: {
      icon: <Clock className="h-4 w-4" />,
      color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      label: 'Pending'
    }
  };

  return (
    <Card className="shadow-lg border-stone-200" data-testid="appointments-section">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-stone-800 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-green-600" />
          Appointments
        </CardTitle>
        <CardDescription>Test drive scheduling</CardDescription>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            <Calendar className="h-10 w-10 mx-auto mb-2 text-stone-300" />
            <p className="text-sm">No appointments scheduled</p>
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
                  className="p-3 border border-stone-200 rounded-lg bg-stone-50 hover:bg-white transition-colors"
                  data-testid={`appointment-${appointment.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={`${config.color} border font-medium flex items-center gap-1`}>
                      {config.icon}
                      {config.label}
                    </Badge>
                    <span className="text-xs text-stone-500">{appointmentDate}</span>
                  </div>
                  {appointment.leadId && (
                    <p className="text-sm text-stone-700 font-medium">
                      Lead ID: {appointment.leadId}
                    </p>
                  )}
                  {appointment.vehicle && (
                    <p className="text-xs text-stone-600 mt-1">
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
