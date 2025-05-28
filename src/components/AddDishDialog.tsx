
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, DollarSign, Calculator } from "lucide-react";
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
}

const AddDishDialog = ({ onAddDish }: AddDishDialogProps) => {
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
      setRecipes(data || []);
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

  const getFoodCostColor = () => {
    const fcPercentage = getFoodCostPercentage();
    if (fcPercentage > 40) return "text-red-600";
    if (fcPercentage > 30) return "text-amber-600";
    return "text-emerald-600";
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Piatto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aggiungi Nuovo Piatto</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informazioni Base */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Informazioni Base</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Nome Piatto *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Es. Risotto ai Porcini"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Categoria *</label>
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
              <label className="block text-sm font-medium mb-1">
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
              <label className="block text-sm font-medium mb-1">Ricetta Associata *</label>
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
              <label className="block text-sm font-medium mb-1">Descrizione Piatto</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrizione per il menu cliente..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({...formData, is_active: checked})}
              />
              <label className="text-sm font-medium">Attivo nel Menu</label>
            </div>
          </div>

          {/* Calcoli e Preview */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center">
              <Calculator className="w-5 h-5 mr-2" />
              Analisi Costi
            </h3>

            {selectedRecipe && (
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Ricetta Selezionata:</span>
                  <span className="text-sm text-slate-600">{selectedRecipe.name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Costo Ricetta:</span>
                  <span className="font-semibold">€{calculateRecipeCost(selectedRecipe).toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Food Cost %:</span>
                  <span className={`font-semibold ${getFoodCostColor()}`}>
                    {getFoodCostPercentage().toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">Margine:</span>
                  <span className="font-semibold">€{getMargin().toFixed(2)}</span>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="text-xs text-slate-600">
                    {getFoodCostPercentage() > 40 && (
                      <p className="text-red-600 font-medium">⚠️ Food Cost elevato - considerare ottimizzazione</p>
                    )}
                    {getFoodCostPercentage() <= 30 && (
                      <p className="text-emerald-600 font-medium">✓ Food Cost ottimale</p>
                    )}
                    {getFoodCostPercentage() > 30 && getFoodCostPercentage() <= 40 && (
                      <p className="text-amber-600 font-medium">⚡ Food Cost accettabile</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!selectedRecipe && (
              <div className="bg-slate-100 p-4 rounded-lg text-center text-slate-500">
                <Calculator className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Seleziona una ricetta per vedere l'analisi dei costi</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
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
