
import { useState, useEffect, useMemo } from 'react';
import { useMobileDetection } from './useMobileDetection';

interface DashboardMetrics {
  foodCost: {
    avgPercentage: number;
    totalMargin: number;
    totalRevenue: number;
    criticalDishes: number;
    targetReached: number;
  };
  inventory: {
    totalStockValue: number;
    lowStockCount: number;
    labeledPercentage: number;
    activeSuppliers: number;
  };
  trends: {
    foodCost: Array<{ label: string; value: number; date: string }>;
    inventory: Array<{ label: string; value: number; date: string }>;
  };
  alerts: Array<{
    id: string;
    type: 'error' | 'warning' | 'info' | 'success';
    module: 'foodCost' | 'inventory' | 'general';
    title: string;
    message: string;
    timestamp?: string;
    dismissible?: boolean;
  }>;
}

export const useMobileDashboard = () => {
  const { isMobile } = useMobileDetection();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    foodCost: {
      avgPercentage: 28.5,
      totalMargin: 15240,
      totalRevenue: 52800,
      criticalDishes: 3,
      targetReached: 78.2
    },
    inventory: {
      totalStockValue: 8450,
      lowStockCount: 5,
      labeledPercentage: 65.3,
      activeSuppliers: 12
    },
    trends: {
      foodCost: [
        { label: 'Lun', value: 29.2, date: '2024-01-15' },
        { label: 'Mar', value: 28.8, date: '2024-01-16' },
        { label: 'Mer', value: 27.9, date: '2024-01-17' },
        { label: 'Gio', value: 28.5, date: '2024-01-18' },
        { label: 'Ven', value: 28.1, date: '2024-01-19' },
        { label: 'Sab', value: 29.3, date: '2024-01-20' },
        { label: 'Dom', value: 28.5, date: '2024-01-21' }
      ],
      inventory: [
        { label: 'Lun', value: 8200, date: '2024-01-15' },
        { label: 'Mar', value: 8350, date: '2024-01-16' },
        { label: 'Mer', value: 8180, date: '2024-01-17' },
        { label: 'Gio', value: 8420, date: '2024-01-18' },
        { label: 'Ven', value: 8380, date: '2024-01-19' },
        { label: 'Sab', value: 8520, date: '2024-01-20' },
        { label: 'Dom', value: 8450, date: '2024-01-21' }
      ]
    },
    alerts: [
      {
        id: 'low-stock-1',
        type: 'warning',
        module: 'inventory',
        title: 'Scorte Basilico Basse',
        message: 'Rimangono solo 0.5kg, riordina entro domani',
        timestamp: '2 ore fa',
        dismissible: true
      },
      {
        id: 'high-food-cost-1',
        type: 'error',
        module: 'foodCost',
        title: 'Food Cost Troppo Alto',
        message: 'Risotto ai funghi ha raggiunto il 42% di food cost',
        timestamp: '1 ora fa',
        dismissible: true
      },
      {
        id: 'target-achievement',
        type: 'success',
        module: 'general',
        title: 'Target Quasi Raggiunto',
        message: 'Sei al 78% del target mensile!',
        timestamp: '30 min fa',
        dismissible: true
      }
    ]
  });

  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);

  // Filtra gli alert per modulo
  const getAlertsForModule = (module: DashboardMetrics['alerts'][0]['module']) => {
    return metrics.alerts
      .filter(alert => alert.module === module && !dismissedAlerts.includes(alert.id));
  };

  // Dismissi un alert
  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => [...prev, alertId]);
  };

  // Genera dati mock per demo
  const generateMockTrends = (baseValue: number, variance: number = 0.1) => {
    const days = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
    return days.map((day, index) => ({
      label: day,
      value: baseValue + (Math.random() - 0.5) * variance * baseValue,
      date: new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toISOString()
    }));
  };

  // Dashboard data memoizzati
  const dashboardData = useMemo(() => ({
    foodCost: {
      ...metrics.foodCost,
      trends: metrics.trends.foodCost,
      alerts: getAlertsForModule('foodCost')
    },
    inventory: {
      ...metrics.inventory,
      trends: metrics.trends.inventory,
      alerts: getAlertsForModule('inventory')
    },
    general: {
      alerts: getAlertsForModule('general')
    }
  }), [metrics, dismissedAlerts]);

  // Aggiorna i dati periodicamente (simulazione)
  useEffect(() => {
    if (!isMobile) return;

    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        foodCost: {
          ...prev.foodCost,
          avgPercentage: prev.foodCost.avgPercentage + (Math.random() - 0.5) * 0.2,
          targetReached: Math.min(100, prev.foodCost.targetReached + Math.random() * 0.5)
        },
        inventory: {
          ...prev.inventory,
          totalStockValue: prev.inventory.totalStockValue + (Math.random() - 0.5) * 100,
          labeledPercentage: Math.min(100, prev.inventory.labeledPercentage + Math.random() * 0.3)
        }
      }));
    }, 30000); // Aggiorna ogni 30 secondi

    return () => clearInterval(interval);
  }, [isMobile]);

  return {
    isMobile,
    dashboardData,
    dismissAlert,
    refreshData: () => {
      // Forza il refresh dei dati
      setMetrics(prev => ({ ...prev }));
    }
  };
};
