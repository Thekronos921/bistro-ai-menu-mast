
import { useState } from "react";
import { DollarSign } from "lucide-react";
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
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-14 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {/* Mobile Layout */}
          <div className="flex flex-col space-y-3 sm:hidden">
            {/* Title Row */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-slate-800 truncate">Food Cost & Menu Engineering</h1>
                <p className="text-xs text-slate-500">Analisi costi e performance</p>
              </div>
            </div>
            
            {/* Controls Row */}
            <div className="flex items-center justify-between space-x-2">
              <div className="flex-1 min-w-0">
                <PeriodSelector selectedPeriod={selectedPeriod} onPeriodChange={onPeriodChange} />
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <SettingsDialog 
                  open={showSettings} 
                  onOpenChange={setShowSettings} 
                  settings={settings} 
                  onSaveSettings={onSaveSettings} 
                />
                <AddDishDialog onAddDish={onAddDish} onEditRecipe={onEditRecipe} />
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Food Cost & Menu Engineering</h1>
                <p className="text-xs sm:text-sm text-slate-500">Analisi completa di costi e performance</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <PeriodSelector selectedPeriod={selectedPeriod} onPeriodChange={onPeriodChange} />
              <SettingsDialog 
                open={showSettings} 
                onOpenChange={setShowSettings} 
                settings={settings} 
                onSaveSettings={onSaveSettings} 
              />
              <AddDishDialog onAddDish={onAddDish} onEditRecipe={onEditRecipe} />
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default FoodCostHeader;
