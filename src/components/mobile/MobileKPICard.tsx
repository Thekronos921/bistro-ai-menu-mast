
import React from 'react';
import { LucideIcon } from 'lucide-react';
import TouchOptimizedCard from './TouchOptimizedCard';
import { cn } from '@/lib/utils';

interface MobileKPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  progress?: number;
  onClick?: () => void;
  className?: string;
}

const MobileKPICard: React.FC<MobileKPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = 'neutral',
  progress,
  onClick,
  className
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-emerald-600';
      case 'down': return 'text-red-600';
      default: return 'text-slate-600';
    }
  };

  const getTrendBgColor = () => {
    switch (trend) {
      case 'up': return 'bg-emerald-50';
      case 'down': return 'bg-red-50';
      default: return 'bg-slate-50';
    }
  };

  return (
    <TouchOptimizedCard onTap={onClick} className={className}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <div className={cn(
              "p-2 rounded-lg",
              getTrendBgColor()
            )}>
              <Icon className={cn("w-4 h-4", getTrendColor())} />
            </div>
          </div>
          
          <h3 className="text-sm font-medium text-slate-600 mb-1 truncate">
            {title}
          </h3>
          
          <div className="space-y-1">
            <p className="text-2xl font-bold text-slate-900 truncate">
              {value}
            </p>
            
            {subtitle && (
              <p className="text-xs text-slate-500 truncate">
                {subtitle}
              </p>
            )}
          </div>
          
          {progress !== undefined && (
            <div className="mt-3">
              <div className="w-full bg-slate-200 rounded-full h-1.5">
                <div 
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    trend === 'up' ? 'bg-emerald-500' : 
                    trend === 'down' ? 'bg-red-500' : 'bg-slate-500'
                  )}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </TouchOptimizedCard>
  );
};

export default MobileKPICard;
