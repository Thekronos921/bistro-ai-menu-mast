
import { Package, AlertTriangle, TrendingUp, Users, Calculator } from "lucide-react";
import KPICard from "./KPICard";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  yield_percentage: number;
  effective_cost_per_unit: number;
  supplier: string;
  current_stock: number;
  min_stock_threshold: number;
  category: string;
  external_id: string;
  last_synced_at: string;
}

interface InventoryKPIsProps {
  ingredients: Ingredient[];
}

const InventoryKPIs = ({ ingredients }: InventoryKPIsProps) => {
  // Calcolo valore totale scorte (basato su costo acquisto, non effettivo)
  const totalStockValue = ingredients.reduce((sum, ing) => {
    return sum + (ing.cost_per_unit * (ing.current_stock || 0));
  }, 0);

  // Ingredienti sotto scorta minima
  const lowStockCount = ingredients.filter(ing => 
    ing.current_stock <= ing.min_stock_threshold && ing.min_stock_threshold > 0
  ).length;

  // Costo medio effettivo per unità (quello reale utilizzato nelle ricette)
  const averageEffectiveCost = ingredients.length > 0 
    ? ingredients.reduce((sum, ing) => sum + (ing.effective_cost_per_unit || 0), 0) / ingredients.length 
    : 0;

  // Numero fornitori attivi
  const activeSuppliers = new Set(
    ingredients
      .filter(ing => ing.supplier && ing.supplier.trim() !== '')
      .map(ing => ing.supplier)
  ).size;

  // Ingredienti sincronizzati con gestionale esterno
  const syncedIngredients = ingredients.filter(ing => ing.external_id && ing.last_synced_at).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
      <KPICard
        title="Valore Totale Scorte"
        value={`€${totalStockValue.toFixed(2)}`}
        subtitle="Investimento immobilizzato"
        icon={Package}
        trend="neutral"
      />
      
      <KPICard
        title="Ingredienti Sotto Scorta"
        value={lowStockCount}
        subtitle={`${lowStockCount > 0 ? 'Richiedono riordino' : 'Tutti OK'}`}
        icon={AlertTriangle}
        trend={lowStockCount > 0 ? "down" : "up"}
      />
      
      <KPICard
        title="Costo Medio Effettivo"
        value={`€${averageEffectiveCost.toFixed(2)}`}
        subtitle="Post-scarto (per ricette)"
        icon={Calculator}
        trend="neutral"
      />
      
      <KPICard
        title="Fornitori Attivi"
        value={activeSuppliers}
        subtitle="Diversificazione"
        icon={Users}
        trend="neutral"
      />

      <KPICard
        title="Ingredienti Sincronizzati"
        value={syncedIngredients}
        subtitle={`${syncedIngredients}/${ingredients.length} connessi`}
        icon={TrendingUp}
        trend={syncedIngredients === ingredients.length ? "up" : "neutral"}
      />
    </div>
  );
};

export default InventoryKPIs;
