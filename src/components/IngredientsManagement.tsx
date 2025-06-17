import { useState, useEffect } from "react";
import { Search, Edit, Trash2, AlertTriangle, ExternalLink, Calendar, Package2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useIsMobile } from "@/hooks/use-mobile";
import AddIngredientDialog from "./AddIngredientDialog";
import EditIngredientDialog from "./EditIngredientDialog";
import InventoryKPIs from "./InventoryKPIs";
import InventoryKPIsMobile from "./inventory/InventoryKPIsMobile";
import IngredientsTableMobile from "./inventory/IngredientsTableMobile";
import StockStatusBadge, { StockStatus } from "./StockStatusBadge";
import LabelGenerator from "./labeling/LabelGenerator";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  yield_percentage: number;
  effective_cost_per_unit: number;
  supplier: string;
  supplier_product_code: string;
  current_stock: number;
  allocated_stock: number;
  labeled_stock: number;
  min_stock_threshold: number;
  par_level: number;
  category: string;
  external_id: string;
  notes: string;
  last_synced_at: string;
  restaurant_id: string;
  batch_number: string;
  expiry_date: string;
  storage_instructions: string;
  origin_certification: string;
}

const IngredientsManagement = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();
  const isMobile = useIsMobile();

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

  const getExpiryStatus = (expiryDate: string) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 3) return 'expiring';
    if (daysUntilExpiry <= 7) return 'warning';
    return 'ok';
  };

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingIngredient(null);
  };

  useEffect(() => {
    if (restaurantId) {
      fetchIngredients();
    }
  }, [restaurantId]);

  const filteredIngredients = ingredients.filter(ingredient =>
    ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ingredient.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ingredient.supplier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockIngredients = ingredients.filter(ing => 
    ing.current_stock <= ing.min_stock_threshold && ing.min_stock_threshold > 0
  );

  const expiringIngredients = ingredients.filter(ing => {
    const status = getExpiryStatus(ing.expiry_date);
    return status === 'expired' || status === 'expiring';
  });

  if (loading) {
    return <div className="text-center py-8">Caricamento ingredienti...</div>;
  }

  if (!restaurantId) {
    return <div className="text-center py-8">Errore: Nessun ristorante associato</div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* KPIs */}
      {isMobile ? (
        <InventoryKPIsMobile ingredients={ingredients} />
      ) : (
        <InventoryKPIs ingredients={ingredients} />
      )}

      {/* Header */}
      <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Gestione Ingredienti</h2>
        <div className="flex space-x-2">
          {!isMobile && <LabelGenerator />}
          <AddIngredientDialog onAddIngredient={fetchIngredients} />
        </div>
      </div>

      {/* Alert per scadenze */}
      {expiringIngredients.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 mr-2" />
            <h3 className="font-semibold text-orange-800 text-sm sm:text-base">Allarme Scadenze</h3>
          </div>
          <p className="text-orange-700 mt-1 text-sm">
            {expiringIngredients.length} ingredienti sono scaduti o in scadenza
          </p>
          <div className="mt-2 space-y-1">
            {expiringIngredients.slice(0, isMobile ? 2 : 3).map(ing => (
              <div key={ing.id} className="text-xs sm:text-sm text-orange-600">
                {ing.name}: {ing.expiry_date ? new Date(ing.expiry_date).toLocaleDateString('it-IT') : 'N/A'}
                {getExpiryStatus(ing.expiry_date) === 'expired' && (
                  <span className="ml-2 text-red-600 font-semibold">SCADUTO</span>
                )}
              </div>
            ))}
            {expiringIngredients.length > (isMobile ? 2 : 3) && (
              <div className="text-xs sm:text-sm text-orange-600">
                ...e altri {expiringIngredients.length - (isMobile ? 2 : 3)} ingredienti
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alert per scorte basse */}
      {lowStockIngredients.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mr-2" />
            <h3 className="font-semibold text-red-800 text-sm sm:text-base">Allarme Scorte Basse</h3>
          </div>
          <p className="text-red-700 mt-1 text-sm">
            {lowStockIngredients.length} ingredienti hanno scorte sotto la soglia minima
          </p>
          <div className="mt-2 space-y-1">
            {lowStockIngredients.slice(0, isMobile ? 2 : 5).map(ing => (
              <div key={ing.id} className="text-xs sm:text-sm text-red-600">
                {ing.name}: {ing.current_stock} {ing.unit} (min: {ing.min_stock_threshold} {ing.unit})
              </div>
            ))}
            {lowStockIngredients.length > (isMobile ? 2 : 5) && (
              <div className="text-xs sm:text-sm text-red-600">
                ...e altri {lowStockIngredients.length - (isMobile ? 2 : 5)} ingredienti
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 absolute left-3 top-3" />
        <Input
          placeholder="Cerca ingredienti..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 sm:pl-10"
        />
      </div>

      {/* Tabella/Cards Ingredienti */}
      {isMobile ? (
        <IngredientsTableMobile
          ingredients={filteredIngredients}
          onEdit={handleEditIngredient}
          onDelete={deleteIngredient}
          getStockStatus={getStockStatus}
          getExpiryStatus={getExpiryStatus}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Nome</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Categoria</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Lotto/Scadenza</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Costo Acquisto</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Resa %</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Costo Effettivo</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Unità</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Scorte</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Etichettato</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Stato</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Fornitore</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Sinc.</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Azioni</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredIngredients.map((ingredient) => {
                  const stockStatus = getStockStatus(ingredient.current_stock, ingredient.min_stock_threshold);
                  const expiryStatus = getExpiryStatus(ingredient.expiry_date);
                  return (
                    <tr key={ingredient.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-medium text-slate-800">
                        <div>
                          <div className="flex items-center">
                            {ingredient.origin_certification && (
                              <Badge variant="outline" className="mr-2 text-xs">
                                {ingredient.origin_certification}
                              </Badge>
                            )}
                            <span>{ingredient.name}</span>
                          </div>
                          {ingredient.external_id && (
                            <div className="flex items-center mt-1">
                              <ExternalLink className="w-3 h-3 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-500">{ingredient.external_id}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{ingredient.category || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="space-y-1">
                          {ingredient.batch_number && (
                            <div className="flex items-center justify-center">
                              <Package2 className="w-3 h-3 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-600">{ingredient.batch_number}</span>
                            </div>
                          )}
                          {ingredient.expiry_date && (
                            <div className="flex items-center justify-center">
                              <Calendar className="w-3 h-3 text-gray-400 mr-1" />
                              <span className={`text-xs ${
                                expiryStatus === 'expired' ? 'text-red-600 font-semibold' :
                                expiryStatus === 'expiring' ? 'text-orange-600 font-semibold' :
                                expiryStatus === 'warning' ? 'text-yellow-600' : 'text-gray-600'
                              }`}>
                                {new Date(ingredient.expiry_date).toLocaleDateString('it-IT')}
                                {expiryStatus === 'expired' && <span className="ml-1">⚠️</span>}
                                {expiryStatus === 'expiring' && <span className="ml-1">🔔</span>}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">€{ingredient.cost_per_unit.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        <Badge variant={ingredient.yield_percentage < 80 ? "destructive" : ingredient.yield_percentage < 90 ? "secondary" : "default"}>
                          {ingredient.yield_percentage}%
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600">
                        €{(ingredient.effective_cost_per_unit || 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{ingredient.unit}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={ingredient.current_stock <= ingredient.min_stock_threshold && ingredient.min_stock_threshold > 0 ? 'text-red-600 font-semibold' : 'text-slate-800'}>
                          {ingredient.current_stock} {ingredient.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-slate-800">
                          {ingredient.labeled_stock || 0} {ingredient.unit}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="space-y-1">
                          <StockStatusBadge status={stockStatus} />
                          {expiryStatus && expiryStatus !== 'ok' && (
                            <Badge variant={expiryStatus === 'expired' ? "destructive" : "secondary"} className="text-xs">
                              {expiryStatus === 'expired' ? 'Scaduto' : 'Scade presto'}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        <div>
                          <div>{ingredient.supplier || '-'}</div>
                          {ingredient.supplier_product_code && (
                            <div className="text-xs text-gray-500">{ingredient.supplier_product_code}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {ingredient.last_synced_at ? (
                          <div className="text-xs text-green-600">
                            {new Date(ingredient.last_synced_at).toLocaleDateString('it-IT')}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">Mai</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditIngredient(ingredient)}
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
      )}

      {editingIngredient && (
        <EditIngredientDialog
          ingredient={editingIngredient}
          open={editDialogOpen}
          onOpenChange={handleCloseEditDialog}
          onIngredientUpdated={fetchIngredients}
        />
      )}
    </div>
  );
};

export default IngredientsManagement;
