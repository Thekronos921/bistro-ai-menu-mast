
import React from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TouchOptimizedCard from './TouchOptimizedCard';
import { cn } from '@/lib/utils';

interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp?: string;
  actionLabel?: string;
  onAction?: () => void;
  onDismiss?: () => void;
  dismissible?: boolean;
}

interface MobileAlertsProps {
  alerts: Alert[];
  title?: string;
  maxVisible?: number;
  className?: string;
}

const MobileAlerts: React.FC<MobileAlertsProps> = ({
  alerts,
  title = "Notifiche",
  maxVisible = 5,
  className
}) => {
  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-600" />;
    }
  };

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return 'border-l-red-500 bg-red-50/50';
      case 'warning':
        return 'border-l-orange-500 bg-orange-50/50';
      case 'info':
        return 'border-l-blue-500 bg-blue-50/50';
      case 'success':
        return 'border-l-green-500 bg-green-50/50';
      default:
        return 'border-l-slate-500 bg-slate-50/50';
    }
  };

  const visibleAlerts = alerts.slice(0, maxVisible);

  if (visibleAlerts.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <p className="text-slate-600">Nessuna notifica al momento</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
          {alerts.length > maxVisible && (
            <span className="text-sm text-slate-500">
              +{alerts.length - maxVisible} altre
            </span>
          )}
        </div>
      )}
      
      <div className="space-y-3">
        {visibleAlerts.map((alert) => (
          <TouchOptimizedCard
            key={alert.id}
            className={cn(
              "border-l-4 relative",
              getAlertStyles(alert.type)
            )}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getAlertIcon(alert.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-slate-800 mb-1">
                  {alert.title}
                </h4>
                <p className="text-sm text-slate-600 mb-2">
                  {alert.message}
                </p>
                
                <div className="flex items-center justify-between">
                  {alert.timestamp && (
                    <span className="text-xs text-slate-500">
                      {alert.timestamp}
                    </span>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    {alert.onAction && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={alert.onAction}
                        className="text-xs h-7"
                      >
                        {alert.actionLabel || 'Azione'}
                      </Button>
                    )}
                    
                    {alert.dismissible && alert.onDismiss && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={alert.onDismiss}
                        className="h-7 w-7 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </TouchOptimizedCard>
        ))}
      </div>
    </div>
  );
};

export default MobileAlerts;
