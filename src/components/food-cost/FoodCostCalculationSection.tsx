
import { Calculator, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface FoodCostCalculationSectionProps {
  onCalculate: () => void;
  onRecalculate: () => void;
  calculatingFoodCost: boolean;
  foodCostSalesDataCount: number;
  lastCalculationDate?: string;
}

const FoodCostCalculationSection = ({
  onCalculate,
  onRecalculate,
  calculatingFoodCost,
  foodCostSalesDataCount,
  lastCalculationDate
}: FoodCostCalculationSectionProps) => {
  const hasData = foodCostSalesDataCount > 0;

  return (
    <Card className="mb-6 border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-50/50 to-indigo-50/50">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold text-slate-800 mb-1">
                Calcolo Performance Menu
              </h3>
              <p className="text-sm text-slate-600 mb-2">
                Analizza i dati di vendita per calcolare popolarità, classificazione BCG e performance intelligence
              </p>
              {hasData && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    {foodCostSalesDataCount} vendite elaborate
                  </span>
                  {lastCalculationDate && (
                    <span className="hidden sm:block text-slate-300">|</span>
                  )}
                  {lastCalculationDate && (
                    <span>
                      Ultimo aggiornamento: {format(new Date(lastCalculationDate), "dd MMM yyyy 'alle' HH:mm", { locale: it })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
            {hasData ? (
              <Button
                onClick={onRecalculate}
                disabled={calculatingFoodCost}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <RefreshCw className={`w-4 h-4 ${calculatingFoodCost ? "animate-spin" : ""}`} />
                {calculatingFoodCost ? "Ricalcolando..." : "Ricalcola Performance"}
              </Button>
            ) : (
              <Button
                onClick={onCalculate}
                disabled={calculatingFoodCost}
                size="sm"
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800"
              >
                <Calculator className={`w-4 h-4 ${calculatingFoodCost ? "animate-spin" : ""}`} />
                {calculatingFoodCost ? "Calcolando..." : "Calcola Performance"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FoodCostCalculationSection;
