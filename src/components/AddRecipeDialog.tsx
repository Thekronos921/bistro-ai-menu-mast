
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Clock, Users, ChefHat } from "lucide-react";

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface AddRecipeDialogProps {
  onAddRecipe: (recipe: any) => void;
}

const AddRecipeDialog = ({ onAddRecipe }: AddRecipeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    preparationTime: 0,
    difficulty: "Media",
    portions: 1,
    description: "",
    allergens: ""
  });
  
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", quantity: 0, unit: "g", cost: 0 }
  ]);
  
  const [instructions, setInstructions] = useState<string[]>([""]);
  
  const [nutritionalInfo, setNutritionalInfo] = useState<NutritionalInfo>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0
  });

  const categories = ["Antipasti", "Primi Piatti", "Secondi Piatti", "Dolci", "Contorni"];
  const units = ["g", "kg", "ml", "l", "pz", "cucchiai", "cucchiaini"];
  const difficulties = ["Bassa", "Media", "Alta"];

  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", quantity: 0, unit: "g", cost: 0 }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string | number) => {
    const updated = ingredients.map((ing, i) => 
      i === index ? { ...ing, [field]: value } : ing
    );
    setIngredients(updated);
  };

  const addInstruction = () => {
    setInstructions([...instructions, ""]);
  };

  const removeInstruction = (index: number) => {
    setInstructions(instructions.filter((_, i) => i !== index));
  };

  const updateInstruction = (index: number, value: string) => {
    const updated = instructions.map((inst, i) => i === index ? value : inst);
    setInstructions(updated);
  };

  const calculateTotalCost = () => {
    return ingredients.reduce((total, ing) => total + ing.cost, 0);
  };

  const handleSubmit = () => {
    const totalCost = calculateTotalCost();
    
    const newRecipe = {
      id: Date.now(),
      name: formData.name,
      category: formData.category,
      preparationTime: formData.preparationTime,
      difficulty: formData.difficulty,
      portions: formData.portions,
      ingredients: ingredients.filter(ing => ing.name),
      totalCost: totalCost,
      instructions: instructions.filter(inst => inst.trim()),
      nutritionalInfo: nutritionalInfo,
      description: formData.description,
      allergens: formData.allergens
    };

    onAddRecipe(newRecipe);
    setOpen(false);
    
    // Reset form
    setFormData({
      name: "",
      category: "",
      preparationTime: 0,
      difficulty: "Media",
      portions: 1,
      description: "",
      allergens: ""
    });
    setIngredients([{ name: "", quantity: 0, unit: "g", cost: 0 }]);
    setInstructions([""]);
    setNutritionalInfo({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nuova Ricetta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ChefHat className="w-5 h-5" />
            <span>Aggiungi Nuova Ricetta</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonna 1: Informazioni Base */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Informazioni Base</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Nome Ricetta</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Es. Risotto ai Porcini"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
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

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Tempo (min)
                </label>
                <Input
                  type="number"
                  value={formData.preparationTime}
                  onChange={(e) => setFormData({...formData, preparationTime: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  <Users className="w-4 h-4 inline mr-1" />
                  Porzioni
                </label>
                <Input
                  type="number"
                  value={formData.portions}
                  onChange={(e) => setFormData({...formData, portions: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Difficoltà</label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData({...formData, difficulty: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {difficulties.map(diff => (
                    <SelectItem key={diff} value={diff}>{diff}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrizione</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrizione della ricetta..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Allergeni</label>
              <Input
                value={formData.allergens}
                onChange={(e) => setFormData({...formData, allergens: e.target.value})}
                placeholder="Es. Glutine, Latticini, Uova"
              />
            </div>

            {/* Valori Nutrizionali */}
            <div className="space-y-3">
              <h4 className="font-medium">Valori Nutrizionali (per porzione)</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Calorie</label>
                  <Input
                    type="number"
                    value={nutritionalInfo.calories}
                    onChange={(e) => setNutritionalInfo({...nutritionalInfo, calories: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Proteine (g)</label>
                  <Input
                    type="number"
                    value={nutritionalInfo.protein}
                    onChange={(e) => setNutritionalInfo({...nutritionalInfo, protein: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Carboidrati (g)</label>
                  <Input
                    type="number"
                    value={nutritionalInfo.carbs}
                    onChange={(e) => setNutritionalInfo({...nutritionalInfo, carbs: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Grassi (g)</label>
                  <Input
                    type="number"
                    value={nutritionalInfo.fat}
                    onChange={(e) => setNutritionalInfo({...nutritionalInfo, fat: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Colonna 2: Ingredienti */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Ingredienti</h3>
              <Button onClick={addIngredient} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Aggiungi
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Ingrediente {index + 1}</span>
                    {ingredients.length > 1 && (
                      <Button onClick={() => removeIngredient(index)} size="sm" variant="outline">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Nome ingrediente"
                    value={ingredient.name}
                    onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  />
                  <div className="grid grid-cols-3 gap-1">
                    <Input
                      type="number"
                      placeholder="Qta"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                    <Select value={ingredient.unit} onValueChange={(value) => updateIngredient(index, 'unit', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="€"
                      value={ingredient.cost}
                      onChange={(e) => updateIngredient(index, 'cost', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-3 rounded-lg">
              <div className="flex justify-between">
                <span className="font-medium">Costo Totale:</span>
                <span className="font-bold text-purple-600">€{calculateTotalCost().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Colonna 3: Preparazione */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Preparazione</h3>
              <Button onClick={addInstruction} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Step
              </Button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {instructions.map((instruction, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium flex items-center">
                      <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-medium mr-2">
                        {index + 1}
                      </span>
                      Step {index + 1}
                    </span>
                    {instructions.length > 1 && (
                      <Button onClick={() => removeInstruction(index)} size="sm" variant="outline">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Textarea
                    placeholder="Descrivi questo passaggio..."
                    value={instruction}
                    onChange={(e) => updateInstruction(index, e.target.value)}
                    rows={3}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name || !formData.category}>
            Salva Ricetta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddRecipeDialog;
