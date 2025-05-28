
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, DollarSign, Calculator, ExternalLink, AlertTriangle, CheckCircle, Zap, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Recipe {
  id: string;
  name: string;
  category: string;
  is_semilavorato: boolean;
  recipe_ingredients: {
    ingredients: {
      cost_per_unit: number;
    };
    quantity: number;
  }[];
}

interface AddDishDialogProps {
  onAddDish: () => void;
  onEditRecipe?: (recipe: Recipe) => void;
}

const AddDishDialog = ({ onAddDish, onEditRecipe }: AddDishDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    selling_price: 0,
    description: "",
    recipe_id: "",
    is_active: true
  });

  const categories = ["Antipasti", "Primi Piatti", "Secondi Piatti", "Dolci", "Contorni", "Bevande"];

  useEffect(() => {
    if (open) {
      fetchRecipes();
    }
  }, [open]);

  const fetchRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          id,
          name,
          category,
          is_semilavorato,
          recipe_ingredients (
            quantity,
            ingredients (
              cost_per_unit
            )
          )
        `)
        .eq('is_semilavorato', false)
        .order('name');

      if (error) throw error;
      
      // Transform the data to match our Recipe interface
      const transformedData = (data || []).map(recipe => ({
        ...recipe,
        recipe_ingredients: recipe.recipe_ingredients.map((ri: any) => ({
          quantity: ri.quantity,
          ingredients: {
            cost_per_unit: ri.ingredients.cost_per_unit
          }
        }))
      }));
      
      setRecipes(transformedData);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento delle ricette",
        variant: "destructive"
      });
    }
  };

  const calculateRecipeCost = (recipe: Recipe) => {
    if (!recipe.recipe_ingredients) return 0;
    return recipe.recipe_ingredients.reduce((total, ri) => {
      return total + (ri.ingredients.cost_per_unit * ri.quantity);
    }, 0);
  };

  const handleRecipeChange = (recipeId: string) => {
    const recipe = recipes.find(r => r.id === recipeId);
    setSelectedRecipe(recipe || null);
    setFormData({...formData, recipe_id: recipeId});
  };

  const getFoodCostPercentage = () => {
    if (!selectedRecipe || formData.selling_price <= 0) return 0;
    const recipeCost = calculateRecipeCost(selectedRecipe);
    return (recipeCost / formData.selling_price) * 100;
  };

  const getMargin = () => {
    if (!selectedRecipe) return 0;
    const recipeCost = calculateRecipeCost(selectedRecipe);
    return formData.selling_price - recipeCost;
  };

  const getFoodCostAlert = () => {
    const fcPercentage = getFoodCostPercentage();
    if (fcPercentage > 40) {
      return {
        type: "critical",
        message: "Food Cost elevato - considerare ottimizzazione",
        icon: AlertTriangle,
        color: "text-red-600"
      };
    }
    if (fcPercentage <= 30) {
      return {
        type: "optimal",
        message: "Food Cost ottimale",
        icon: CheckCircle,
        color: "text-emerald-600"
      };
    }
    return {
      type: "acceptable",
      message: "Food Cost accettabile",
      icon: Zap,
      color: "text-amber-600"
    };
  };

  const handleEditRecipe = () => {
    if (selectedRecipe && onEditRecipe) {
      onEditRecipe(selectedRecipe);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || !formData.recipe_id || formData.selling_price <= 0) {
      toast({
        title: "Errore",
        description: "Nome, categoria, ricetta e prezzo sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('dishes')
        .insert([{
          name: formData.name,
          category: formData.category,
          selling_price: formData.selling_price,
          recipe_id: formData.recipe_id
        }]);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Piatto aggiunto con successo"
      });

      setOpen(false);
      onAddDish();
      
      // Reset form
      setFormData({
        name: "",
        category: "",
        selling_price: 0,
        description: "",
        recipe_id: "",
        is_active: true
      });
      setSelectedRecipe(null);
    } catch (error) {
      console.error('Error adding dish:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'aggiunta del piatto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const alert = getFoodCostAlert();
  const AlertIcon = alert.icon;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Piatto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Aggiungi Nuovo Piatto</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonna Sinistra - Informazioni Base */}
          <div className="space-y-6">
            <h3 className="font-semibold text-lg border-b pb-2">Informazioni Base</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Nome Piatto *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Es. Risotto ai Porcini"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Categoria Piatto *</label>
                <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Prezzo di Vendita (€) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.selling_price}
                  onChange={(e) => setFormData({...formData, selling_price: parseFloat(e.target.value) || 0})}
                  placeholder="25.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Ricetta Associata *</label>
                <Select value={formData.recipe_id} onValueChange={handleRecipeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona ricetta" />
                  </SelectTrigger>
                  <SelectContent>
                    {recipes.map(recipe => {
                      const cost = calculateRecipeCost(recipe);
                      return (
                        <SelectItem key={recipe.id} value={recipe.id}>
                          {recipe.name} (€{cost.toFixed(2)})
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500 mt-1">
                  Solo ricette non marcate come semilavorato
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrizione Piatto (per menu cliente)</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descrizione per il menu cliente..."
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
                />
                <label className="text-sm font-medium">Attivo nel Menu</label>
              </div>
            </div>
          </div>

          {/* Colonna Destra - Analisi Costi */}
          <div className="space-y-6">
            <h3 className="font-semibold text-lg border-b pb-2 flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Analisi Costi
            </h3>

            {selectedRecipe ? (
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <span className="text-sm font-medium text-slate-600">Ricetta Corrente:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-slate-800">{selectedRecipe.name}</span>
                      {onEditRecipe && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleEditRecipe}
                          className="p-1 h-6 w-6"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Costo Ricetta:</span>
                      <span className="font-semibold text-lg">€{calculateRecipeCost(selectedRecipe).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Food Cost %:</span>
                      <span className={`font-bold text-lg ${
                        getFoodCostPercentage() > 40 ? 'text-red-600' : 
                        getFoodCostPercentage() > 30 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {getFoodCostPercentage().toFixed(1)}%
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-600">Margine:</span>
                      <span className="font-semibold text-lg">€{getMargin().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <div className={`flex items-center space-x-2 p-3 rounded-lg ${
                      alert.type === 'critical' ? 'bg-red-50 border border-red-200' :
                      alert.type === 'optimal' ? 'bg-emerald-50 border border-emerald-200' :
                      'bg-amber-50 border border-amber-200'
                    }`}>
                      <AlertIcon className={`w-4 h-4 ${alert.color}`} />
                      <p className={`text-sm font-medium ${alert.color}`}>
                        {alert.message}
                      </p>
                    </div>
                  </div>
                </div>

                {onEditRecipe && (
                  <Button
                    variant="outline"
                    onClick={handleEditRecipe}
                    className="w-full flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Modifica Ricetta Selezionata</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ) : (
              <div className="bg-slate-100 p-8 rounded-lg text-center text-slate-500">
                <Calculator className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Seleziona una ricetta per vedere l'analisi dei costi</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || !formData.name || !formData.category || !formData.recipe_id || formData.selling_price <= 0}
          >
            {loading ? "Aggiunta..." : "Aggiungi Piatto"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddDishDialog;
