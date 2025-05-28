
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

interface AddDishDialogProps {
  onAddDish: (dish: any) => void;
}

const AddDishDialog = ({ onAddDish }: AddDishDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    sellingPrice: 0,
    description: "",
    allergens: "",
    preparationTime: 0,
    difficulty: "Media",
    portions: 1
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "", quantity: 0, unit: "g", cost: 0 }
  ]);

  const categories = ["Antipasti", "Primi Piatti", "Secondi Piatti", "Dolci", "Contorni", "Bevande"];
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

  const calculateTotalCost = () => {
    return ingredients.reduce((total, ing) => total + ing.cost, 0);
  };

  const calculateFoodCostPercentage = () => {
    const totalCost = calculateTotalCost();
    return formData.sellingPrice > 0 ? (totalCost / formData.sellingPrice) * 100 : 0;
  };

  const handleSubmit = () => {
    const totalCost = calculateTotalCost();
    const foodCostPercentage = calculateFoodCostPercentage();
    const margin = formData.sellingPrice - totalCost;
    
    let status = "ottimo";
    if (foodCostPercentage > 35) status = "critico";
    else if (foodCostPercentage > 30) status = "buono";

    const newDish = {
      id: Date.now(),
      name: formData.name,
      category: formData.category,
      sellingPrice: formData.sellingPrice,
      foodCost: totalCost,
      foodCostPercentage: foodCostPercentage,
      margin: margin,
      status: status,
      trend: "stable",
      ingredients: ingredients.filter(ing => ing.name),
      description: formData.description,
      allergens: formData.allergens,
      preparationTime: formData.preparationTime,
      difficulty: formData.difficulty,
      portions: formData.portions
    };

    onAddDish(newDish);
    setOpen(false);
    
    // Reset form
    setFormData({
      name: "",
      category: "",
      sellingPrice: 0,
      description: "",
      allergens: "",
      preparationTime: 0,
      difficulty: "Media",
      portions: 1
    });
    setIngredients([{ name: "", quantity: 0, unit: "g", cost: 0 }]);
  };

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
          <DialogTitle>Aggiungi Nuovo Piatto</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informazioni Base */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Informazioni Base</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">Nome Piatto</label>
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

            <div>
              <label className="block text-sm font-medium mb-1">Prezzo di Vendita (€)</label>
              <Input
                type="number"
                step="0.01"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({...formData, sellingPrice: parseFloat(e.target.value) || 0})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descrizione</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Descrizione del piatto..."
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

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-sm font-medium mb-1">Tempo (min)</label>
                <Input
                  type="number"
                  value={formData.preparationTime}
                  onChange={(e) => setFormData({...formData, preparationTime: parseInt(e.target.value) || 0})}
                />
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
                <label className="block text-sm font-medium mb-1">Porzioni</label>
                <Input
                  type="number"
                  value={formData.portions}
                  onChange={(e) => setFormData({...formData, portions: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>
          </div>

          {/* Ingredienti */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-lg">Ingredienti</h3>
              <Button onClick={addIngredient} size="sm" variant="outline">
                <Plus className="w-4 h-4 mr-1" />
                Aggiungi
              </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-4">
                    <Input
                      placeholder="Ingrediente"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qta"
                      value={ingredient.quantity}
                      onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
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
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Costo €"
                      value={ingredient.cost}
                      onChange={(e) => updateIngredient(index, 'cost', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    {ingredients.length > 1 && (
                      <Button onClick={() => removeIngredient(index)} size="sm" variant="outline">
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Calcoli */}
            <div className="bg-slate-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span>Costo Totale Ingredienti:</span>
                <span className="font-semibold">€{calculateTotalCost().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Food Cost %:</span>
                <span className={`font-semibold ${calculateFoodCostPercentage() > 35 ? 'text-red-600' : calculateFoodCostPercentage() > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                  {calculateFoodCostPercentage().toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Margine:</span>
                <span className="font-semibold">€{(formData.sellingPrice - calculateTotalCost()).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.name || !formData.category || formData.sellingPrice <= 0}>
            Aggiungi Piatto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddDishDialog;
