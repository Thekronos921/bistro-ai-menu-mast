
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useFoodCostPage } from '@/hooks/useFoodCostPage';
import MobileHeader from '@/components/mobile/MobileHeader';
import MobileSafeArea from '@/components/mobile/MobileSafeArea';
import BottomNavigation from '@/components/mobile/BottomNavigation';
import MobileFoodCostDashboard from '@/components/mobile/MobileFoodCostDashboard';
import { TimePeriod } from '@/components/PeriodSelector';

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

  // Mock data for alerts and trends - in a real app, this would come from your data layer
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

  const dashboardData = {
    avgFoodCostPercentage,
    totalMargin,
    totalRevenue,
    criticalDishes,
    targetReached,
    trends: mockTrends,
    alerts: mockAlerts
  };

  const handleAddDish = () => {
    navigate('/food-cost'); // Navigate to desktop version for adding dishes
  };

  const handleOpenFilters = () => {
    // This would open a mobile-specific filter modal
    console.log('Open mobile filters');
  };

  const handleOpenSettings = () => {
    // This would open mobile settings
    console.log('Open mobile settings');
  };

  const handleViewDetails = (dishId: string) => {
    // Navigate to dish details or perform specific action
    console.log('View details for:', dishId);
  };

  if (loading) {
    return (
      <MobileSafeArea>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Caricamento analytics...</p>
          </div>
        </div>
      </MobileSafeArea>
    );
  }

  return (
    <MobileSafeArea>
      <div className="flex flex-col h-full bg-gradient-to-br from-emerald-50 to-blue-50">
        <MobileHeader 
          title="Food Cost Analytics" 
          subtitle={`Periodo: ${selectedPeriod}`}
        />
        
        <main className="flex-1 overflow-auto">
          <MobileFoodCostDashboard
            data={dashboardData}
            onAddDish={handleAddDish}
            onOpenFilters={handleOpenFilters}
            onOpenSettings={handleOpenSettings}
            onViewDetails={handleViewDetails}
          />
        </main>

        <BottomNavigation />
      </div>
    </MobileSafeArea>
  );
};

export default MobileFoodCost;
