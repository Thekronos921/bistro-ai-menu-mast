import { useState, useEffect } from "react";
import { Search, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import AddIngredientDialog from "./AddIngredientDialog";
import EditIngredientDialog from "./EditIngredientDialog";
import InventoryKPIs from "./InventoryKPIs";
import StockStatusBadge, { StockStatus } from "./StockStatusBadge";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  supplier: string;
  current_stock: number;
  min_stock_threshold: number;
  category: string;
  restaurant_id: string;
}

const IngredientsManagement = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const { toast } = useToast();
  const { restaurantId, getRestaurantId } = useRestaurant();

  const fetchIngredients = async () => {
    try {
      if (!restaurantId) {
        console.log("No restaurant ID available");
        setLoading(false);
        return;
      }

      console.log("Fetching ingredients for restaurant:", restaurantId);

      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (error) {
        console.error("Error fetching ingredients:", error);
        throw error;
      }

      console.log("Fetched ingredients:", data);
      setIngredients(data || []);
    } catch (error) {
      console.error("Fetch ingredients error:", error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento degli ingredienti",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateReorderPoint = async (id: string, reorderPoint: number) => {
    try {
      const { error } = await supabase
        .from('ingredients')
        .update({ min_stock_threshold: reorderPoint })
        .eq('id', id)
        .eq('restaurant_id', restaurantId);

      if (error) throw error;
      
      fetchIngredients();
    } catch (error) {
      console.error("Update reorder point error:", error);
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento del punto di riordino",
        variant: "destructive"
      });
    }
  };

  const deleteIngredient = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo ingrediente?")) return;

    try {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id)
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Ingrediente eliminato con successo"
      });
      fetchIngredients();
    } catch (error) {
      console.error("Delete ingredient error:", error);
      toast({
        title: "Errore",
        description: "Errore durante l'eliminazione",
        variant: "destructive"
      });
    }
  };

  const getStockStatus = (currentStock: number, minThreshold: number): StockStatus => {
    if (minThreshold <= 0) return "ok";
    if (currentStock <= 0) return "critical";
    if (currentStock <= minThreshold) return "critical";
    if (currentStock <= minThreshold * 1.5) return "low";
    return "ok";
  };

  useEffect(() => {
    if (restaurantId) {
      fetchIngredients();
    }
  }, [restaurantId]);

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ingredient.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockIngredients = ingredients.filter(ing => 
    ing.current_stock <= ing.min_stock_threshold && ing.min_stock_threshold > 0
  );

  if (loading) {
    return <div className="text-center py-8">Caricamento ingredienti...</div>;
  }

  if (!restaurantId) {
    return <div className="text-center py-8">Errore: Nessun ristorante associato</div>;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <InventoryKPIs ingredients={ingredients} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestione Ingredienti</h2>
        <AddIngredientDialog onAddIngredient={fetchIngredients} />
      </div>

      {/* Alert per scorte basse */}
      {lowStockIngredients.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="font-semibold text-red-800">Allarme Scorte Basse</h3>
          </div>
          <p className="text-red-700 mt-1">
            {lowStockIngredients.length} ingredienti hanno scorte sotto la soglia minima
          </p>
          <div className="mt-2 space-y-1">
            {lowStockIngredients.map(ing => (
              <div key={ing.id} className="text-sm text-red-600">
                {ing.name}: {ing.current_stock} {ing.unit} (min: {ing.min_stock_threshold} {ing.unit})
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
        <Input
          placeholder="Cerca ingredienti..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabella Ingredienti */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Nome</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Categoria</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Costo/Unità</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Unità</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Scorte</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Punto Riordino</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Stato</th>
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Fornitore</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredIngredients.map((ingredient) => {
                const stockStatus = getStockStatus(ingredient.current_stock, ingredient.min_stock_threshold);
                return (
                  <tr key={ingredient.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium text-slate-800">{ingredient.name}</td>
                    <td className="px-6 py-4 text-slate-600">{ingredient.category}</td>
                    <td className="px-6 py-4 text-right font-medium">€{ingredient.cost_per_unit.toFixed(2)}</td>
                    <td className="px-6 py-4 text-slate-600">{ingredient.unit}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={ingredient.current_stock <= ingredient.min_stock_threshold && ingredient.min_stock_threshold > 0 ? 'text-red-600 font-semibold' : 'text-slate-800'}>
                        {ingredient.current_stock} {ingredient.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Input
                        type="number"
                        value={ingredient.min_stock_threshold || 0}
                        onChange={(e) => updateReorderPoint(ingredient.id, parseFloat(e.target.value) || 0)}
                        className="w-20 text-right text-sm"
                        min="0"
                        step="0.1"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StockStatusBadge status={stockStatus} />
                    </td>
                    <td className="px-6 py-4 text-slate-600">{ingredient.supplier || '-'}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingIngredient(ingredient)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteIngredient(ingredient.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editingIngredient && (
        <EditIngredientDialog
          ingredient={editingIngredient}
          onClose={() => setEditingIngredient(null)}
          onIngredientUpdated={fetchIngredients}
        />
      )}
    </div>
  );
};

export default IngredientsManagement;
