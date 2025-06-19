
import React from 'react';
import { Calculator, TrendingDown, AlertTriangle, Target, Plus, Filter } from 'lucide-react';
import MobileKPICard from './MobileKPICard';
import MobileQuickActions from './MobileQuickActions';
import MobileMetricsChart from './MobileMetricsChart';
import MobileAlerts from './MobileAlerts';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface FoodCostDashboardData {
  avgFoodCostPercentage: number;
  totalMargin: number;
  totalRevenue: number;
  criticalDishes: number;
  targetReached: number;
  trends: Array<{
    label: string;
    value: number;
    date: string;
  }>;
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    timestamp?: string;
    dismissible?: boolean;
  }>;
}

interface MobileFoodCostDashboardProps {
  data: FoodCostDashboardData;
  onAddDish?: () => void;
  onOpenFilters?: () => void;
  onOpenSettings?: () => void;
  onViewDetails?: (dishId: string) => void;
  className?: string;
}

const MobileFoodCostDashboard: React.FC<MobileFoodCostDashboardProps> = ({
  data,
  onAddDish,
  onOpenFilters,
  onOpenSettings,
  onViewDetails,
  className
}) => {
  const { isMobile } = useMobileDetection();

  if (!isMobile) {
    return null; // Componente solo per mobile
  }

  const quickActions = [
    {
      id: 'add-dish',
      title: 'Nuovo Piatto',
      icon: <Plus className="w-5 h-5" />,
      description: 'Aggiungi piatto',
      color: 'primary' as const,
      onClick: onAddDish || (() => {})
    },
    {
      id: 'filters',
      title: 'Filtri',
      icon: <Filter className="w-5 h-5" />,
      description: 'Applica filtri',
      color: 'default' as const,
      onClick: onOpenFilters || (() => {})
    },
    {
      id: 'critical-dishes',
      title: 'Piatti Critici',
      icon: <AlertTriangle className="w-5 h-5" />,
      description: 'Visualizza critici',
      badge: data.criticalDishes > 0 ? data.criticalDishes : undefined,
      color: (data.criticalDishes > 0 ? 'danger' : 'success') as 'danger' | 'success',
      onClick: () => onViewDetails?.('critical')
    },
    {
      id: 'target',
      title: 'Target',
      icon: <Target className="w-5 h-5" />,
      description: `${data.targetReached.toFixed(0)}% raggiunto`,
      color: (data.targetReached >= 80 ? 'success' : 'warning') as 'success' | 'warning',
      onClick: () => onViewDetails?.('target')
    }
  ];

  return (
    <div className={className}>
      <div className="space-y-6 p-4">
        {/* KPI principali */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Food Cost Overview
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <MobileKPICard
              title="Food Cost Medio"
              value={`${data.avgFoodCostPercentage.toFixed(1)}%`}
              subtitle="Tempo reale"
              icon={Calculator}
              trend={data.avgFoodCostPercentage < 30 ? 'up' : 'down'}
            />
            <MobileKPICard
              title="Margine Totale"
              value={`€${data.totalMargin.toFixed(0)}`}
              subtitle={`Su €${data.totalRevenue.toFixed(0)}`}
              icon={TrendingDown}
              trend="up"
            />
            <MobileKPICard
              title="Piatti Critici"
              value={data.criticalDishes}
              subtitle="Richiedono attenzione"
              icon={AlertTriangle}
              trend={data.criticalDishes === 0 ? 'up' : 'down'}
            />
            <MobileKPICard
              title="Target Raggiunto"
              value={`${data.targetReached.toFixed(0)}%`}
              subtitle="Obiettivo mensile"
              icon={Target}
              progress={data.targetReached}
              trend={data.targetReached >= 80 ? 'up' : 'neutral'}
            />
          </div>
        </section>

        {/* Grafico trend */}
        {data.trends.length > 0 && (
          <section>
            <MobileMetricsChart
              title="Trend Food Cost"
              data={data.trends}
              currentValue={data.avgFoodCostPercentage}
              previousValue={data.trends[data.trends.length - 2]?.value}
              unit="%"
              trend={data.avgFoodCostPercentage < 30 ? 'up' : 'down'}
              trendPercentage={
                data.trends.length > 1
                  ? ((data.avgFoodCostPercentage - data.trends[data.trends.length - 2].value) / data.trends[data.trends.length - 2].value) * 100
                  : undefined
              }
            />
          </section>
        )}

        {/* Azioni rapide */}
        <section>
          <MobileQuickActions
            title="Azioni Rapide"
            actions={quickActions}
            layout="grid"
          />
        </section>

        {/* Alert */}
        {data.alerts.length > 0 && (
          <section>
            <MobileAlerts
              title="Alert Food Cost"
              alerts={data.alerts}
              maxVisible={3}
            />
          </section>
        )}
      </div>
    </div>
  );
};

export default MobileFoodCostDashboard;
