
import { TrendingDown, AlertTriangle, Package, DollarSign } from "lucide-react";
import KPICard from "@/components/KPICard";

interface Ingredient {
  id: string;
  name: string;
  current_stock: number;
  allocated_stock: number;
  labeled_stock: number;
  min_stock_threshold: number;
  cost_per_unit: number;
  effective_cost_per_unit: number;
  expiry_date: string;
}

interface InventoryKPIsMobileProps {
  ingredients: Ingredient[];
}

const InventoryKPIsMobile = ({ ingredients }: InventoryKPIsMobileProps) => {
  const totalIngredients = ingredients.length;
  const totalValue = ingredients.reduce((sum, ing) => sum + (ing.current_stock * ing.cost_per_unit), 0);
  const lowStockCount = ingredients.filter(ing => 
    ing.current_stock <= ing.min_stock_threshold && ing.min_stock_threshold > 0
  ).length;
  
  const labeledPercentage = ingredients.length > 0 
    ? (ingredients.reduce((sum, ing) => sum + (ing.labeled_stock || 0), 0) / 
       ingredients.reduce((sum, ing) => sum + ing.current_stock, 0)) * 100 
    : 0;

  return (
    <div className="grid grid-cols-2 gap-3 mb-4 sm:mb-6">
      <KPICard
        title="Ingredienti Totali"
        value={totalIngredients.toString()}
        subtitle="Gestiti"
        icon={Package}
        trend="neutral"
      />
      
      <KPICard
        title="Valore Inventario"
        value={`€${totalValue.toFixed(0)}`}
        subtitle="Totale scorte"
        icon={DollarSign}
        trend="neutral"
      />
      
      <KPICard
        title="Stock Etichettato"
        value={`${labeledPercentage.toFixed(1)}%`}
        subtitle="Tracciabilità"
        icon={TrendingDown}
        trend={labeledPercentage > 50 ? "up" : "down"}
      />
      
      <KPICard
        title="Scorte Basse"
        value={lowStockCount.toString()}
        subtitle="Sotto soglia"
        icon={AlertTriangle}
        trend={lowStockCount === 0 ? "up" : "down"}
      />
    </div>
  );
};

export default InventoryKPIsMobile;
