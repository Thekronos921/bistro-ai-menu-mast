
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useFoodCostPage } from '@/hooks/useFoodCostPage';
import { ArrowLeft, Calculator, TrendingUp, AlertTriangle, Target, Plus, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BottomNavigation from '@/components/mobile/BottomNavigation';
import MobileKPICard from '@/components/mobile/MobileKPICard';
import MobileMetricsChart from '@/components/mobile/MobileMetricsChart';
import MobileAlerts from '@/components/mobile/MobileAlerts';

const MobileFoodCost: React.FC = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { restaurantId } = useRestaurant();
  
  const {
    avgFoodCostPercentage,
    totalMargin,
    totalRevenue,
    criticalDishes,
    targetReached,
    selectedPeriod,
    setSelectedPeriod,
    loading
  } = useFoodCostPage();

  // Redirect to desktop if not mobile
  useEffect(() => {
    if (!isMobile) {
      navigate('/food-cost');
    }
  }, [isMobile, navigate]);

  // Mock data for trends and alerts
  const mockTrends = [
    { label: 'Lun', value: avgFoodCostPercentage - 2, date: '2024-01-15' },
    { label: 'Mar', value: avgFoodCostPercentage - 1, date: '2024-01-16' },
    { label: 'Mer', value: avgFoodCostPercentage + 1, date: '2024-01-17' },
    { label: 'Gio', value: avgFoodCostPercentage, date: '2024-01-18' },
    { label: 'Ven', value: avgFoodCostPercentage + 0.5, date: '2024-01-19' },
  ];

  const mockAlerts = [
    {
      id: '1',
      type: 'warning' as const,
      title: 'Food Cost Elevato',
      message: 'Alcuni piatti superano la soglia del 40%',
      timestamp: new Date().toISOString(),
      dismissible: true
    },
    {
      id: '2',
      type: 'info' as const,
      title: 'Calcolo Completato',
      message: 'Dati aggiornati 2 ore fa',
      dismissible: true
    }
  ];

  const handleAddDish = () => {
    navigate('/food-cost');
  };

  const handleOpenFilters = () => {
    console.log('Open mobile filters');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Caricamento analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 w-full max-w-full overflow-x-hidden">
      {/* Header compatto e fullscreen */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50 w-full">
        <div className="px-2 py-2">
          <div className="flex items-center space-x-2">
            <Link to="/" className="p-1 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
            <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">📊</span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold text-slate-800 truncate">Food Cost Analytics</h1>
              <p className="text-xs text-slate-500">Periodo: {selectedPeriod}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenFilters}
              className="flex-shrink-0 h-6 px-2 text-xs"
            >
              <Filter className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-16 w-full max-w-full">
        <Tabs defaultValue="overview" className="w-full">
          <div className="px-2 pt-1 pb-1">
            <TabsList className="grid w-full grid-cols-3 h-6">
              <TabsTrigger value="overview" className="text-xs">Overview</TabsTrigger>
              <TabsTrigger value="trends" className="text-xs">Trends</TabsTrigger>
              <TabsTrigger value="alerts" className="text-xs">Alert</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="px-2 mt-0">
            {/* KPI Cards - Molto più compatti */}
            <div className="grid grid-cols-2 gap-1 mb-2">
              <MobileKPICard
                title="Food Cost"
                value={`${avgFoodCostPercentage.toFixed(1)}%`}
                subtitle="Medio"
                icon={Calculator}
                trend={avgFoodCostPercentage < 30 ? 'up' : 'down'}
              />
              <MobileKPICard
                title="Margine"
                value={`€${totalMargin.toFixed(0)}`}
                subtitle={`€${totalRevenue.toFixed(0)} tot`}
                icon={TrendingUp}
                trend="up"
              />
              <MobileKPICard
                title="Critici"
                value={criticalDishes}
                subtitle="Piatti"
                icon={AlertTriangle}
                trend={criticalDishes === 0 ? 'up' : 'down'}
              />
              <MobileKPICard
                title="Target"
                value={`${targetReached.toFixed(0)}%`}
                subtitle="Raggiunto"
                icon={Target}
                progress={targetReached}
                trend={targetReached >= 80 ? 'up' : 'neutral'}
              />
            </div>

            {/* Quick Actions - Compatte */}
            <div className="grid grid-cols-2 gap-1 mb-2">
              <Button
                onClick={handleAddDish}
                className="bg-emerald-600 hover:bg-emerald-700 h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Nuovo Piatto
              </Button>
              
              {criticalDishes > 0 && (
                <Button
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50 h-7 text-xs"
                  onClick={() => console.log('View critical dishes')}
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {criticalDishes} Critici
                </Button>
              )}
            </div>

            {/* Mini Chart - Compatto */}
            {mockTrends.length > 0 && (
              <div className="bg-white rounded-lg p-2 shadow-sm border border-stone-200">
                <h3 className="text-xs font-medium text-slate-800 mb-1">Trend Settimanale</h3>
                <MobileMetricsChart
                  data={mockTrends}
                  currentValue={avgFoodCostPercentage}
                  previousValue={mockTrends[mockTrends.length - 2]?.value}
                  unit="%"
                  trend={avgFoodCostPercentage < 30 ? 'up' : 'down'}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends" className="px-2 mt-0">
            {mockTrends.length > 0 && (
              <MobileMetricsChart
                title="Andamento Food Cost"
                data={mockTrends}
                currentValue={avgFoodCostPercentage}
                previousValue={mockTrends[mockTrends.length - 2]?.value}
                unit="%"
                trend={avgFoodCostPercentage < 30 ? 'up' : 'down'}
                trendPercentage={
                  mockTrends.length > 1
                    ? ((avgFoodCostPercentage - mockTrends[mockTrends.length - 2].value) / mockTrends[mockTrends.length - 2].value) * 100
                    : undefined
                }
              />
            )}

            {/* Detailed Stats - Compatte */}
            <div className="mt-2 grid grid-cols-1 gap-2">
              <div className="bg-white rounded-lg p-2 shadow-sm border border-stone-200">
                <h3 className="text-xs font-medium text-slate-800 mb-1">Statistiche Periodo</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-600">Food Cost Medio:</span>
                    <p className="font-bold text-slate-800">{avgFoodCostPercentage.toFixed(1)}%</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Margine Totale:</span>
                    <p className="font-bold text-slate-800">€{totalMargin.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Ricavi Totali:</span>
                    <p className="font-bold text-slate-800">€{totalRevenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Target:</span>
                    <p className="font-bold text-slate-800">{targetReached.toFixed(0)}%</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="alerts" className="px-2 mt-0">
            {mockAlerts.length > 0 && (
              <MobileAlerts
                alerts={mockAlerts}
                maxVisible={10}
              />
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default MobileFoodCost;
