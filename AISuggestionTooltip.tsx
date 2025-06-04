
import { Lightbulb } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MenuCategory } from "./MenuEngineeringBadge";

interface AISuggestionTooltipProps {
  category: MenuCategory;
  foodCostPercentage: number;
  margin: number;
}

const AISuggestionTooltip = ({ category, foodCostPercentage, margin }: AISuggestionTooltipProps) => {
  const getSuggestion = () => {
    switch (category) {
      case "star":
        if (foodCostPercentage < 25) {
          return "Eccellente! Mantieni alta visibilità nel menu e considera un leggero aumento di prezzo.";
        }
        return "Ottimo piatto! Mantieni la qualità e promuovi attivamente.";
      
      case "plowhorse":
        if (foodCostPercentage > 35) {
          return "Popolare ma poco profittevole. Rivedi la ricetta per ridurre i costi o aumenta il prezzo.";
        }
        return "Piatto popolare. Considera di abbinarlo con item ad alto margine.";
      
      case "puzzle":
        if (margin > 10) {
          return "Alta profittabilità ma bassa popolarità. Promuovi questo piatto o rivedi il prezzo per attrarre più clienti.";
        }
        return "Buon margine ma poco venduto. Migliora la presentazione nel menu.";
      
      case "dog":
        if (foodCostPercentage > 40) {
          return "Bassa popolarità e profittabilità. Considera la rimozione dal menu o una riformulazione completa.";
        }
        return "Performance scarsa. Valuta se sostituire questo piatto.";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-1 hover:bg-slate-100 rounded transition-colors">
            <Lightbulb className="w-4 h-4 text-amber-500" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-white border border-slate-200 shadow-lg">
          <p className="text-sm">{getSuggestion()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AISuggestionTooltip;
