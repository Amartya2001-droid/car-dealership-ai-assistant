import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

const colorClasses = {
  blue: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    iconBg: 'bg-blue-100',
    iconText: 'text-blue-600',
    border: 'border-blue-200'
  },
  amber: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    iconBg: 'bg-amber-100',
    iconText: 'text-amber-600',
    border: 'border-amber-200'
  },
  green: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    iconBg: 'bg-green-100',
    iconText: 'text-green-600',
    border: 'border-green-200'
  },
  purple: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    iconBg: 'bg-purple-100',
    iconText: 'text-purple-600',
    border: 'border-purple-200'
  }
};

const KPICard = ({ title, value, icon, trend, color = 'blue', subtitle }) => {
  const colors = colorClasses[color] || colorClasses.blue;
  
  return (
    <Card className={`border-2 ${colors.border} shadow-sm hover:shadow-md transition-all duration-200 bg-white`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-stone-600">{title}</CardTitle>
          <div className={`p-2 rounded-lg ${colors.iconBg}`}>
            <div className={colors.iconText}>{icon}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${colors.text}`}>
          {value}
        </div>
        {(subtitle || trend) && (
          <div className="mt-2 flex items-center gap-2">
            {trend && (
              <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-stone-500">{subtitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KPICard;
