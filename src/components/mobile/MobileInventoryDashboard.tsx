
import React from 'react';
import { Package, AlertTriangle, TrendingUp, Users, Plus, Scan } from 'lucide-react';
import MobileKPICard from './MobileKPICard';
import MobileQuickActions from './MobileQuickActions';
import MobileMetricsChart from './MobileMetricsChart';
import MobileAlerts from './MobileAlerts';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface InventoryDashboardData {
  totalStockValue: number;
  lowStockCount: number;
  labeledPercentage: number;
  activeSuppliers: number;
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

interface MobileInventoryDashboardProps {
  data: InventoryDashboardData;
  onAddIngredient?: () => void;
  onScanLabel?: () => void;
  onViewLowStock?: () => void;
  onManageSuppliers?: () => void;
  className?: string;
}

const MobileInventoryDashboard: React.FC<MobileInventoryDashboardProps> = ({
  data,
  onAddIngredient,
  onScanLabel,
  onViewLowStock,
  onManageSuppliers,
  className
}) => {
  const { isMobile } = useMobileDetection();

  if (!isMobile) {
    return null; // Componente solo per mobile
  }

  const quickActions = [
    {
      id: 'add-ingredient',
      title: 'Nuovo Ingrediente',
      icon: <Plus className="w-5 h-5" />,
      description: 'Aggiungi ingrediente',
      color: 'primary' as const,
      onClick: onAddIngredient || (() => {})
    },
    {
      id: 'scan-label',
      title: 'Scansiona Etichetta',
      icon: <Scan className="w-5 h-5" />,
      description: 'QR/Barcode',
      color: 'success' as const,
      onClick: onScanLabel || (() => {})
    },
    {
      id: 'low-stock',
      title: 'Scorte Basse',
      icon: <AlertTriangle className="w-5 h-5" />,
      description: 'Riordina ora',
      badge: data.lowStockCount > 0 ? data.lowStockCount : undefined,
      color: (data.lowStockCount > 0 ? 'danger' : 'success') as 'danger' | 'success',
      onClick: onViewLowStock || (() => {})
    },
    {
      id: 'suppliers',
      title: 'Fornitori',
      icon: <Users className="w-5 h-5" />,
      description: `${data.activeSuppliers} attivi`,
      color: 'default' as const,
      onClick: onManageSuppliers || (() => {})
    }
  ];

  return (
    <div className={className}>
      <div className="space-y-6 p-4">
        {/* KPI principali */}
        <section>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Inventario Overview
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <MobileKPICard
              title="Valore Scorte"
              value={`€${data.totalStockValue.toFixed(0)}`}
              subtitle="Investimento totale"
              icon={Package}
              trend="neutral"
            />
            <MobileKPICard
              title="Scorte Basse"
              value={data.lowStockCount}
              subtitle="Richiedono riordino"
              icon={AlertTriangle}
              trend={data.lowStockCount === 0 ? 'up' : 'down'}
            />
            <MobileKPICard
              title="Stock Etichettato"
              value={`${data.labeledPercentage.toFixed(1)}%`}
              subtitle="Tracciabilità"
              icon={TrendingUp}
              progress={data.labeledPercentage}
              trend={data.labeledPercentage > 70 ? 'up' : 'neutral'}
            />
            <MobileKPICard
              title="Fornitori Attivi"
              value={data.activeSuppliers}
              subtitle="Diversificazione"
              icon={Users}
              trend="neutral"
            />
          </div>
        </section>

        {/* Grafico trend valore scorte */}
        {data.trends.length > 0 && (
          <section>
            <MobileMetricsChart
              title="Trend Valore Scorte"
              data={data.trends}
              currentValue={data.totalStockValue}
              previousValue={data.trends[data.trends.length - 2]?.value}
              unit="€"
              trend="neutral"
              trendPercentage={
                data.trends.length > 1
                  ? ((data.totalStockValue - data.trends[data.trends.length - 2].value) / data.trends[data.trends.length - 2].value) * 100
                  : undefined
              }
            />
          </section>
        )}

        {/* Azioni rapide */}
        <section>
          <MobileQuickActions
            title="Gestione Inventario"
            actions={quickActions}
            layout="grid"
          />
        </section>

        {/* Alert */}
        {data.alerts.length > 0 && (
          <section>
            <MobileAlerts
              title="Alert Inventario"
              alerts={data.alerts}
              maxVisible={3}
            />
          </section>
        )}
      </div>
    </div>
  );
};

export default MobileInventoryDashboard;
