
import { ArrowLeft, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import AddDishDialog from "@/components/AddDishDialog";
import SettingsDialog from "@/components/SettingsDialog";
import PeriodSelector, { TimePeriod } from "@/components/PeriodSelector";

interface SettingsConfig {
  criticalThreshold: number;
  targetThreshold: number;
  targetPercentage: number;
}

interface FoodCostHeaderProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
  settings: SettingsConfig;
  onSaveSettings: (settings: SettingsConfig) => void;
  onAddDish: () => void;
  onEditRecipe: (recipe: any) => void;
}

const FoodCostHeader = ({
  selectedPeriod,
  onPeriodChange,
  settings,
  onSaveSettings,
  onAddDish,
  onEditRecipe
}: FoodCostHeaderProps) => {
  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Food Cost & Menu Engineering</h1>
                <p className="text-sm text-slate-500">Analisi completa di costi e performance</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <PeriodSelector selectedPeriod={selectedPeriod} onPeriodChange={onPeriodChange} />
            <SettingsDialog settings={settings} onSaveSettings={onSaveSettings} />
            <AddDishDialog onAddDish={onAddDish} onEditRecipe={onEditRecipe} />
          </div>
        </div>
      </div>
    </header>
  );
};

export default FoodCostHeader;
