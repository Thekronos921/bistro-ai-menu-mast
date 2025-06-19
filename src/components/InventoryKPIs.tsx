import { Package, AlertTriangle, TrendingUp, Users, Calculator, Tag } from "lucide-react";
import KPICard from "./KPICard";
import MobileKPICard from "./mobile/MobileKPICard";
import { useMobileDetection } from "@/hooks/useMobileDetection";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  yield_percentage: number;
  effective_cost_per_unit: number;
  supplier: string;
  current_stock: number;
  allocated_stock: number;
  labeled_stock: number;
  min_stock_threshold: number;
  category: string;
  external_id: string;
  last_synced_at: string;
}

interface InventoryKPIsProps {
  ingredients: Ingredient[];
}

const InventoryKPIs = ({ ingredients }: InventoryKPIsProps) => {
  const { isMobile } = useMobileDetection();

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

  // Calcolo totale stock etichettato
  const totalLabeledStock = ingredients.reduce((sum, ing) => {
    return sum + (ing.labeled_stock || 0);
  }, 0);

  // Percentuale di stock etichettato rispetto al totale
  const totalCurrentStock = ingredients.reduce((sum, ing) => sum + (ing.current_stock || 0), 0);
  const labeledPercentage = totalCurrentStock > 0 ? (totalLabeledStock / totalCurrentStock) * 100 : 0;

  const kpiData = [
    {
      title: "Valore Totale Scorte",
      value: `€${totalStockValue.toFixed(2)}`,
      subtitle: "Investimento immobilizzato",
      icon: Package,
      trend: "neutral" as const
    },
    {
      title: "Ingredienti Sotto Scorta",
      value: lowStockCount,
      subtitle: `${lowStockCount > 0 ? 'Richiedono riordino' : 'Tutti OK'}`,
      icon: AlertTriangle,
      trend: lowStockCount > 0 ? "down" : "up" as const
    },
    {
      title: "Costo Medio Effettivo",
      value: `€${averageEffectiveCost.toFixed(2)}`,
      subtitle: "Post-scarto (per ricette)",
      icon: Calculator,
      trend: "neutral" as const
    },
    {
      title: "Fornitori Attivi",
      value: activeSuppliers,
      subtitle: "Diversificazione",
      icon: Users,
      trend: "neutral" as const
    },
    {
      title: "Ingredienti Sincronizzati",
      value: syncedIngredients,
      subtitle: `${syncedIngredients}/${ingredients.length} connessi`,
      icon: TrendingUp,
      trend: syncedIngredients === ingredients.length ? "up" : "neutral" as const
    },
    {
      title: "Stock Etichettato",
      value: `${labeledPercentage.toFixed(1)}%`,
      subtitle: `${totalLabeledStock.toFixed(1)} unità etichettate`,
      icon: Tag,
      trend: "neutral" as const
    }
  ];

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-3 mb-6">
        {kpiData.slice(0, 4).map((kpi, index) => (
          <MobileKPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            subtitle={kpi.subtitle}
            icon={kpi.icon}
            trend={kpi.trend}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-6">
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

      <KPICard
        title="Stock Etichettato"
        value={`${labeledPercentage.toFixed(1)}%`}
        subtitle={`${totalLabeledStock.toFixed(1)} unità etichettate`}
        icon={Tag}
        trend="neutral"
      />
    </div>
  );
};

export default InventoryKPIs;
