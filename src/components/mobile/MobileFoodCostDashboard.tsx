
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
    return null;
  }

  const quickActions = [
    {
      id: 'add-dish',
      title: 'Nuovo Piatto',
      icon: <Plus className="w-4 h-4" />,
      description: 'Aggiungi',
      color: 'primary' as const,
      onClick: onAddDish || (() => {})
    },
    {
      id: 'filters',
      title: 'Filtri',
      icon: <Filter className="w-4 h-4" />,
      description: 'Applica',
      color: 'default' as const,
      onClick: onOpenFilters || (() => {})
    },
    {
      id: 'critical-dishes',
      title: 'Critici',
      icon: <AlertTriangle className="w-4 h-4" />,
      description: `${data.criticalDishes} piatti`,
      badge: data.criticalDishes > 0 ? data.criticalDishes : undefined,
      color: (data.criticalDishes > 0 ? 'danger' : 'success') as 'danger' | 'success',
      onClick: () => onViewDetails?.('critical')
    }
  ];

  return (
    <div className={className}>
      <div className="space-y-4 p-3">
        {/* KPI compatti */}
        <section>
          <div className="grid grid-cols-2 gap-2">
            <MobileKPICard
              title="Food Cost"
              value={`${data.avgFoodCostPercentage.toFixed(1)}%`}
              subtitle="Medio"
              icon={Calculator}
              trend={data.avgFoodCostPercentage < 30 ? 'up' : 'down'}
            />
            <MobileKPICard
              title="Margine"
              value={`€${data.totalMargin.toFixed(0)}`}
              subtitle={`€${data.totalRevenue.toFixed(0)}`}
              icon={TrendingDown}
              trend="up"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2 mt-2">
            <MobileKPICard
              title="Critici"
              value={data.criticalDishes}
              subtitle="Piatti"
              icon={AlertTriangle}
              trend={data.criticalDishes === 0 ? 'up' : 'down'}
            />
            <MobileKPICard
              title="Target"
              value={`${data.targetReached.toFixed(0)}%`}
              subtitle="Raggiunto"
              icon={Target}
              progress={data.targetReached}
              trend={data.targetReached >= 80 ? 'up' : 'neutral'}
            />
          </div>
        </section>

        {/* Grafico compatto */}
        {data.trends.length > 0 && (
          <section>
            <MobileMetricsChart
              title="Trend Settimanale"
              data={data.trends}
              currentValue={data.avgFoodCostPercentage}
              previousValue={data.trends[data.trends.length - 2]?.value}
              unit="%"
              trend={data.avgFoodCostPercentage < 30 ? 'up' : 'down'}
              height={120}
            />
          </section>
        )}

        {/* Azioni rapide compatte */}
        <section>
          <MobileQuickActions
            actions={quickActions}
            layout="horizontal"
          />
        </section>

        {/* Alert compatti */}
        {data.alerts.length > 0 && (
          <section>
            <MobileAlerts
              alerts={data.alerts}
              maxVisible={2}
            />
          </section>
        )}
      </div>
    </div>
  );
};

export default MobileFoodCostDashboard;
