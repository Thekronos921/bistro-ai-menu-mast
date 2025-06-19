
import { TrendingDown, DollarSign, AlertTriangle, Target } from "lucide-react";
import KPICard from "@/components/KPICard";
import MobileKPICard from "@/components/mobile/MobileKPICard";
import { TimePeriod } from "@/components/PeriodSelector";
import { useMobileDetection } from "@/hooks/useMobileDetection";

interface SettingsConfig {
  criticalThreshold: number;
  targetThreshold: number;
  targetPercentage: number;
}

interface FoodCostKPIsProps {
  avgFoodCostPercentage: number;
  totalMargin: number;
  totalRevenue: number;
  criticalDishes: number;
  targetReached: number;
  selectedPeriod: TimePeriod;
  settings: SettingsConfig;
}

const FoodCostKPIs = ({
  avgFoodCostPercentage,
  totalMargin,
  totalRevenue,
  criticalDishes,
  targetReached,
  selectedPeriod,
  settings
}: FoodCostKPIsProps) => {
  const { isMobile } = useMobileDetection();

  const kpiData = [
    {
      title: "Food Cost Medio",
      value: `${avgFoodCostPercentage.toFixed(1)}%`,
      subtitle: "Aggiornato in tempo reale",
      icon: TrendingDown,
      trend: (avgFoodCostPercentage < 30 ? "up" : avgFoodCostPercentage > settings.criticalThreshold ? "down" : "neutral") as const
    },
    {
      title: `Margine Totale (${selectedPeriod})`,
      value: `€${totalMargin.toFixed(0)}`,
      subtitle: `Venduto: €${totalRevenue.toFixed(0)}`,
      icon: DollarSign,
      trend: "up" as const
    },
    {
      title: "Piatti Critici",
      value: criticalDishes,
      subtitle: `Food cost > ${settings.criticalThreshold}%`,
      icon: AlertTriangle,
      trend: (criticalDishes === 0 ? "up" : "down") as const
    },
    {
      title: "Target Raggiunto",
      value: `${targetReached.toFixed(0)}%`,
      subtitle: `piatti sotto il ${settings.targetThreshold}%`,
      icon: Target,
      progress: targetReached
    }
  ];

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-3 mb-6">
        {kpiData.map((kpi, index) => (
          <MobileKPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            subtitle={kpi.subtitle}
            icon={kpi.icon}
            trend={kpi.trend}
            progress={kpi.progress}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
      <KPICard
        title="Food Cost Medio"
        value={`${avgFoodCostPercentage.toFixed(1)}%`}
        subtitle="Aggiornato in tempo reale"
        icon={TrendingDown}
        trend={avgFoodCostPercentage < 30 ? "up" : avgFoodCostPercentage > settings.criticalThreshold ? "down" : "neutral"}
      />
      
      <KPICard
        title={`Margine Totale (${selectedPeriod})`}
        value={`€${totalMargin.toFixed(0)}`}
        subtitle={`Venduto: €${totalRevenue.toFixed(0)}`}
        icon={DollarSign}
        trend="up"
      />
      
      <KPICard
        title="Piatti Critici"
        value={criticalDishes}
        subtitle={`Food cost > ${settings.criticalThreshold}%`}
        icon={AlertTriangle}
        trend={criticalDishes === 0 ? "up" : "down"}
      />
      
      <KPICard
        title="Target Raggiunto"
        value={`${targetReached.toFixed(0)}%`}
        subtitle={`piatti sotto il ${settings.targetThreshold}%`}
        icon={Target}
        progress={targetReached}
      />
    </div>
  );
};

export default FoodCostKPIs;
