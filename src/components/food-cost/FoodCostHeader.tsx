
import { useState, useRef } from "react";
import { Plus, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import PeriodSelector, { TimePeriod } from "@/components/PeriodSelector";
import SettingsDialog from "@/components/SettingsDialog";
import AddDishDialog from "@/components/AddDishDialog";
import Header from "@/components/Header";

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
  onTriggerDateRangeOpen?: () => void;
}

const FoodCostHeader = ({
  selectedPeriod,
  onPeriodChange,
  settings,
  onSaveSettings,
  onAddDish,
  onEditRecipe,
  onTriggerDateRangeOpen
}: FoodCostHeaderProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showAddDish, setShowAddDish] = useState(false);

  const handleCustomPeriodSelect = () => {
    if (onTriggerDateRangeOpen) {
      onTriggerDateRangeOpen();
    }
  };

  return (
    <>
      <Header />
      
      <div className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Analisi Food Cost</h1>
            <p className="text-slate-600">Monitora costi, margini e performance dei tuoi piatti</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <PeriodSelector
              selectedPeriod={selectedPeriod}
              onPeriodChange={onPeriodChange}
              onCustomPeriodSelect={handleCustomPeriodSelect}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="flex items-center"
            >
              <Settings className="w-4 h-4 mr-2" />
              Impostazioni
            </Button>
            
            <Button
              size="sm"
              onClick={() => setShowAddDish(true)}
              className="flex items-center bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Piatto
            </Button>
          </div>
        </div>
      </div>

      <SettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={onSaveSettings}
      />

      <AddDishDialog
        isOpen={showAddDish}
        onClose={() => setShowAddDish(false)}
        onDishAdded={onAddDish}
        onEditRecipe={onEditRecipe}
      />
    </>
  );
};

export default FoodCostHeader;
