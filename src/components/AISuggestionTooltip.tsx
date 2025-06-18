
import { Lightbulb, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MenuCategory } from "./MenuEngineeringBadge";

interface AISuggestionTooltipProps {
  category: MenuCategory;
  foodCostPercentage: number;
  margin: number;
  salesMix?: number;
  unitsSold?: number;
}

const AISuggestionTooltip = ({ 
  category, 
  foodCostPercentage, 
  margin, 
  salesMix = 0,
  unitsSold = 0 
}: AISuggestionTooltipProps) => {
  const getAdvancedSuggestion = () => {
    const insights = {
      suggestion: "",
      priority: "medium" as "high" | "medium" | "low",
      icon: Lightbulb,
      actions: [] as string[]
    };

    switch (category) {
      case "star":
        insights.icon = TrendingUp;
        insights.priority = "medium";
        if (foodCostPercentage < 20) {
          insights.suggestion = "🌟 Piatto eccellente! Considera di aumentare leggermente il prezzo (+5-10%) mantenendo alta la qualità degli ingredienti.";
          insights.actions = ["Aumento prezzo strategico", "Promozione premium", "Posizionamento menu privilegiato"];
        } else if (foodCostPercentage < 25) {
          insights.suggestion = "⭐ Ottimo equilibrio costi-popolarità. Mantieni la visibilità nel menu e monitora la concorrenza.";
          insights.actions = ["Mantenimento standard", "Monitoraggio competitor", "Storytelling ingredienti"];
        } else {
          insights.suggestion = "🎯 Star con margini da ottimizzare. Rivedi la ricetta o i fornitori per ridurre i costi del 3-5%.";
          insights.actions = ["Ottimizzazione ricetta", "Negoziazione fornitori", "Ingredienti alternativi"];
        }
        break;
      
      case "plowhorse":
        insights.icon = Target;
        insights.priority = "high";
        if (salesMix > 15) {
          insights.suggestion = `🐎 Piatto molto popolare (${salesMix.toFixed(1)}% delle vendite) ma poco profittevole. PRIORITÀ: ridurre food cost o aumentare prezzo.`;
          insights.actions = ["Revisione ricetta urgente", "Test aumento prezzo", "Bundle con piatti profittevoli"];
        } else {
          insights.suggestion = "🔄 Popolare ma margini bassi. Considera di abbinarlo a contorni/bevande ad alto margine.";
          insights.actions = ["Cross-selling strategico", "Menu bundling", "Upselling camerieri"];
        }
        break;
      
      case "puzzle":
        insights.icon = AlertTriangle;
        insights.priority = "medium";
        if (margin > 12) {
          insights.suggestion = `💡 Alta profittabilità (€${margin.toFixed(2)} margine) ma bassa popolarità. Migliora presentazione e posizionamento nel menu.`;
          insights.actions = ["Redesign piatto", "Riposizionamento menu", "Training staff", "Campagne social"];
        } else {
          insights.suggestion = "🔍 Piatto di nicchia. Valuta se mantenerlo o sostituirlo con alternative più popolari.";
          insights.actions = ["Test eliminazione", "Ricette alternative", "Focus group clienti"];
        }
        break;
      
      case "dog":
        insights.icon = AlertTriangle;
        insights.priority = "high";
        if (unitsSold < 5) {
          insights.suggestion = `❌ Performance critica: bassa popolarità (${unitsSold} vendite) e profittabilità. Raccomando rimozione o completa riformulazione.`;
          insights.actions = ["Rimozione dal menu", "Riformulazione completa", "Sostituzione strategica"];
        } else {
          insights.suggestion = "⚠️ Performance sotto la media. Ultima possibilità: rivedi completamente ricetta e prezzo o procedi con la rimozione.";
          insights.actions = ["Revisione drastica", "Test ultima chance", "Pianificazione sostituzione"];
        }
        break;
    }

    return insights;
  };

  const insights = getAdvancedSuggestion();
  const IconComponent = insights.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className={`p-1 hover:bg-slate-100 rounded transition-colors ${
            insights.priority === 'high' ? 'animate-pulse' : ''
          }`}>
            <IconComponent className={`w-4 h-4 ${
              insights.priority === 'high' ? 'text-red-500' : 
              insights.priority === 'medium' ? 'text-amber-500' : 'text-blue-500'
            }`} />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm bg-white border border-slate-200 shadow-lg p-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-800">{insights.suggestion}</p>
            
            {insights.actions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">Azioni consigliate:</p>
                <ul className="text-xs text-slate-600 space-y-1">
                  {insights.actions.map((action, index) => (
                    <li key={index} className="flex items-center space-x-1">
                      <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className={`text-xs px-2 py-1 rounded-full ${
                insights.priority === 'high' ? 'bg-red-100 text-red-700' : 
                insights.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {insights.priority === 'high' ? 'Alta Priorità' : 
                 insights.priority === 'medium' ? 'Media Priorità' : 'Bassa Priorità'}
              </span>
              <span className="text-xs text-slate-500">AI Intelligence</span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default AISuggestionTooltip;
