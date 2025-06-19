
import React from 'react';
import { Package, AlertTriangle, TrendingUp, ChefHat, Calendar, BarChart3 } from 'lucide-react';
import MobileKPICard from './MobileKPICard';
import TouchOptimizedCard from './TouchOptimizedCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MobileDashboardProps {
  kpiData: {
    foodCostAvg: number;
    lowStockItems: number;
    criticalDishes: number;
    todayRevenue: number;
  };
  quickActions: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
    onClick: () => void;
    badge?: string;
  }>;
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  }>;
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({
  kpiData,
  quickActions,
  alerts
}) => {
  return (
    <div className="space-y-6 p-4">
      {/* KPI Overview */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Panoramica</h2>
        <div className="grid grid-cols-2 gap-3">
          <MobileKPICard
            title="Food Cost Medio"
            value={`${kpiData.foodCostAvg.toFixed(1)}%`}
            subtitle="Ultimo calcolo"
            icon={BarChart3}
            trend={kpiData.foodCostAvg < 30 ? 'up' : 'down'}
          />
          <MobileKPICard
            title="Scorte Basse"
            value={kpiData.lowStockItems}
            subtitle="Richiedono attenzione"
            icon={Package}
            trend={kpiData.lowStockItems === 0 ? 'up' : 'down'}
          />
          <MobileKPICard
            title="Piatti Critici"
            value={kpiData.criticalDishes}
            subtitle="Food cost alto"
            icon={AlertTriangle}
            trend={kpiData.criticalDishes === 0 ? 'up' : 'down'}
          />
          <MobileKPICard
            title="Ricavi Oggi"
            value={`€${kpiData.todayRevenue.toFixed(0)}`}
            subtitle="Vendite giornaliere"
            icon={TrendingUp}
            trend="up"
          />
        </div>
      </section>

      {/* Alerts */}
      {alerts.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Alert</h2>
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <TouchOptimizedCard key={index} className={`border-l-4 ${
                alert.type === 'error' ? 'border-red-500' :
                alert.type === 'warning' ? 'border-orange-500' :
                'border-blue-500'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-800">{alert.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                  </div>
                  {alert.onAction && (
                    <Button size="sm" variant="outline" onClick={alert.onAction}>
                      {alert.actionLabel || 'Azione'}
                    </Button>
                  )}
                </div>
              </TouchOptimizedCard>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section>
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Azioni Rapide</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <TouchOptimizedCard key={index} onTap={action.onClick} className="relative">
              <div className="text-center">
                <div className="flex justify-center mb-2">
                  {action.icon}
                </div>
                <h3 className="font-medium text-slate-800 text-sm mb-1">{action.title}</h3>
                <p className="text-xs text-slate-600">{action.description}</p>
                {action.badge && (
                  <Badge variant="secondary" className="absolute -top-2 -right-2 text-xs">
                    {action.badge}
                  </Badge>
                )}
              </div>
            </TouchOptimizedCard>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MobileDashboard;
