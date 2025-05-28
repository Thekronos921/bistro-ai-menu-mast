
import { useState, useEffect } from "react";
import { Search, Edit, Trash2, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AddIngredientDialog from "./AddIngredientDialog";
import EditIngredientDialog from "./EditIngredientDialog";

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

const IngredientsManagement = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const { toast } = useToast();

  const fetchIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nel caricamento degli ingredienti",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteIngredient = async (id: string) => {
    if (!confirm("Sei sicuro di voler eliminare questo ingrediente?")) return;

    try {
      const { error } = await supabase
        .from('ingredients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Ingrediente eliminato con successo"
      });
      fetchIngredients();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante l'eliminazione",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchIngredients();
  }, []);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Gestione Ingredienti</h2>
        <AddIngredientDialog onIngredientAdded={fetchIngredients} />
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
                <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Fornitore</th>
                <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredIngredients.map((ingredient) => (
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
              ))}
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
