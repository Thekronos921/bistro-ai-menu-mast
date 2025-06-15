
import { Button } from "@/components/ui/button";
import { Calculator, RefreshCw } from "lucide-react";

interface FoodCostCalculationSectionProps {
  onCalculate: () => void;
  onRecalculate: () => void;
  calculatingFoodCost: boolean;
  foodCostSalesDataCount: number;
  lastCalculationDate: string | null;
}

const FoodCostCalculationSection = ({
  onCalculate,
  onRecalculate,
  calculatingFoodCost,
  foodCostSalesDataCount,
  lastCalculationDate,
}: FoodCostCalculationSectionProps) => {
  return (
    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Calcolo Dati di Vendita</h3>
          <p className="text-sm text-gray-600">
            Calcola i dati di vendita dei piatti basandoti sulle ricevute del periodo selezionato
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onCalculate}
            disabled={calculatingFoodCost}
            className="flex items-center gap-2"
          >
            {calculatingFoodCost ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Calculator className="w-4 h-4" />
            )}
            Calcola Vendite
          </Button>
          <Button
            onClick={onRecalculate}
            disabled={calculatingFoodCost}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Ricalcola
          </Button>
        </div>
      </div>
      {foodCostSalesDataCount > 0 && (
        <div className="mt-3 text-sm text-green-600">
          ✓ Dati disponibili per {foodCostSalesDataCount} prodotti.
          {lastCalculationDate && (
            <span className="text-gray-500 ml-2">
              (Ultimo calcolo: {new Date(lastCalculationDate).toLocaleString('it-IT')})
            </span>
          )}
        </div>
      )}
      {foodCostSalesDataCount === 0 && !calculatingFoodCost && (
        <div className="mt-3 text-sm text-amber-600">
          Dati non ancora calcolati per il periodo selezionato. Clicca su "Calcola Vendite" per generarli.
        </div>
      )}
    </div>
  );
};

export default FoodCostCalculationSection;
