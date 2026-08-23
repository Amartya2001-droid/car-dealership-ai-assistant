import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

const colorClasses = {
  forest: {
    text: 'text-primary',
    iconBg: 'bg-primary/10',
    iconText: 'text-primary'
  },
  accent: {
    text: 'text-brand-accent',
    iconBg: 'bg-brand-accent/10',
    iconText: 'text-brand-accent'
  },
  gold: {
    text: 'text-brand-highlight',
    iconBg: 'bg-brand-highlight/10',
    iconText: 'text-brand-highlight'
  },
  slate: {
    text: 'text-foreground',
    iconBg: 'bg-muted',
    iconText: 'text-muted-foreground'
  }
};

const KPICard = ({ title, value, icon, trend, color = 'forest', subtitle, ...props }) => {
  const colors = colorClasses[color] || colorClasses.forest;

  return (
    <Card className="border-border shadow-none" {...props}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${colors.iconBg}`}>
            <div className={colors.iconText}>{icon}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`font-display text-3xl font-semibold ${colors.text}`}>
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-2 flex items-center gap-2">
            {trend && (
              <span className="text-xs text-primary font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard;
