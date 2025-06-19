
import React from 'react';
import { Plus, Filter, Download, Settings, Zap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import TouchOptimizedCard from './TouchOptimizedCard';
import { cn } from '@/lib/utils';

interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  description?: string;
  badge?: string | number;
  color?: 'default' | 'primary' | 'warning' | 'success' | 'danger';
  onClick: () => void;
}

interface MobileQuickActionsProps {
  actions: QuickAction[];
  title?: string;
  layout?: 'grid' | 'list';
  className?: string;
}

const MobileQuickActions: React.FC<MobileQuickActionsProps> = ({
  actions,
  title = "Azioni Rapide",
  layout = 'grid',
  className
}) => {
  const getColorClasses = (color: QuickAction['color']) => {
    switch (color) {
      case 'primary':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'warning':
        return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'danger':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  if (layout === 'list') {
    return (
      <div className={cn("space-y-3", className)}>
        {title && (
          <h3 className="text-lg font-semibold text-slate-800 px-1">{title}</h3>
        )}
        <div className="space-y-2">
          {actions.map((action) => (
            <TouchOptimizedCard
              key={action.id}
              onTap={action.onClick}
              className="relative"
            >
              <div className="flex items-center space-x-3">
                <div className={cn(
                  "p-2 rounded-lg flex-shrink-0",
                  getColorClasses(action.color)
                )}>
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-slate-800 truncate">
                    {action.title}
                  </h4>
                  {action.description && (
                    <p className="text-sm text-slate-600 truncate">
                      {action.description}
                    </p>
                  )}
                </div>
                {action.badge && (
                  <Badge variant="secondary" className="flex-shrink-0">
                    {action.badge}
                  </Badge>
                )}
              </div>
            </TouchOptimizedCard>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <h3 className="text-lg font-semibold text-slate-800 px-1">{title}</h3>
      )}
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => (
          <TouchOptimizedCard
            key={action.id}
            onTap={action.onClick}
            className="relative text-center"
          >
            <div className="space-y-2">
              <div className={cn(
                "p-3 rounded-xl mx-auto w-fit",
                getColorClasses(action.color)
              )}>
                {action.icon}
              </div>
              <div>
                <h4 className="font-medium text-slate-800 text-sm truncate">
                  {action.title}
                </h4>
                {action.description && (
                  <p className="text-xs text-slate-600 truncate mt-1">
                    {action.description}
                  </p>
                )}
              </div>
              {action.badge && (
                <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                  {action.badge}
                </Badge>
              )}
            </div>
          </TouchOptimizedCard>
        ))}
      </div>
    </div>
  );
};

export default MobileQuickActions;
