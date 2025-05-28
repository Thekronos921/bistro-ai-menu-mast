
import { Package, AlertTriangle, TrendingUp, Users } from "lucide-react";
import KPICard from "./KPICard";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  supplier: string;
  current_stock: number;
  min_stock_threshold: number;
  category: string;
}

interface InventoryKPIsProps {
  ingredients: Ingredient[];
}

const InventoryKPIs = ({ ingredients }: InventoryKPIsProps) => {
  // Calcolo valore totale scorte
  const totalStockValue = ingredients.reduce((sum, ing) => {
    return sum + (ing.cost_per_unit * (ing.current_stock || 0));
  }, 0);

  // Ingredienti sotto scorta minima
  const lowStockCount = ingredients.filter(ing => 
    ing.current_stock <= ing.min_stock_threshold && ing.min_stock_threshold > 0
  ).length;

  // Costo medio per unità
  const averageCost = ingredients.length > 0 
    ? ingredients.reduce((sum, ing) => sum + ing.cost_per_unit, 0) / ingredients.length 
    : 0;

  // Numero fornitori attivi
  const activeSuppliers = new Set(
    ingredients
      .filter(ing => ing.supplier && ing.supplier.trim() !== '')
      .map(ing => ing.supplier)
  ).size;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
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
        title="Costo Medio/Unità"
        value={`€${averageCost.toFixed(2)}`}
        subtitle="Media ponderata"
        icon={TrendingUp}
        trend="neutral"
      />
      
      <KPICard
        title="Fornitori Attivi"
        value={activeSuppliers}
        subtitle="Diversificazione"
        icon={Users}
        trend="neutral"
      />
    </div>
  );
};

export default InventoryKPIs;
