
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
            
            <SettingsDialog
              settings={settings}
              onSaveSettings={onSaveSettings}
            />
            
            <AddDishDialog
              onDishAdded={onAddDish}
              onEditRecipe={onEditRecipe}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default FoodCostHeader;
