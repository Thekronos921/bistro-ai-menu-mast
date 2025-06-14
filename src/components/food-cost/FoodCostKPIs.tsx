import { TrendingDown, DollarSign, AlertTriangle, Target } from "lucide-react";
import KPICard from "@/components/KPICard";
import { TimePeriod } from "@/components/PeriodSelector";

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
        subtitle={`Venduto Totale: €${totalRevenue.toFixed(0)}`}
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
        subtitle={`dei piatti sotto il ${settings.targetThreshold}%`}
        icon={Target}
        progress={targetReached}
      />
    </div>
  );
};

export default FoodCostKPIs;
