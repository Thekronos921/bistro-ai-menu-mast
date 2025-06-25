
import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface MobileKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  progress?: number;
  className?: string;
}

const MobileKPICard: React.FC<MobileKPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = 'neutral',
  progress,
  className
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-3 h-3 text-red-600" />;
      default:
        return <Minus className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <Card className={cn("border-0 shadow-sm w-full", className)}>
      <CardContent className="p-2">
        <div className="space-y-1">
          {/* Header ultra compatto */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 flex-1 min-w-0">
              {Icon && <Icon className="w-3 h-3 text-slate-600 flex-shrink-0" />}
              <span className="text-xs font-medium text-slate-600 truncate">{title}</span>
            </div>
            <div className="flex-shrink-0">
              {getTrendIcon()}
            </div>
          </div>

          {/* Valore principale ultra compatto */}
          <div className="space-y-0.5">
            <div className="text-base font-bold text-slate-800 leading-none">
              {value}
            </div>
            {subtitle && (
              <div className="text-xs text-slate-500 truncate leading-none">
                {subtitle}
              </div>
            )}
          </div>

          {/* Progress bar ultra compatta */}
          {progress !== undefined && (
            <div className="w-full">
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-300 rounded-full",
                    trend === 'up' ? 'bg-green-500' :
                    trend === 'down' ? 'bg-red-500' :
                    'bg-slate-400'
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileKPICard;
