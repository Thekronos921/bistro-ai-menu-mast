
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

interface EditIngredientDialogProps {
  ingredient: Ingredient;
  onClose: () => void;
  onIngredientUpdated: () => void;
}

const EditIngredientDialog = ({ ingredient, onClose, onIngredientUpdated }: EditIngredientDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState(ingredient);

  const units = ["g", "kg", "ml", "l", "pz", "cucchiai", "cucchiaini", "tazze"];
  const categories = ["Carni", "Pesce", "Verdure", "Frutta", "Cereali", "Latticini", "Spezie", "Condimenti", "Altro"];

  const handleSubmit = async () => {
    if (!formData.name || formData.cost_per_unit <= 0) {
      toast({
        title: "Errore",
        description: "Nome e costo per unità sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('ingredients')
        .update({
          name: formData.name,
          unit: formData.unit,
          cost_per_unit: formData.cost_per_unit,
          supplier: formData.supplier,
          current_stock: formData.current_stock,
          min_stock_threshold: formData.min_stock_threshold,
          category: formData.category
        })
        .eq('id', ingredient.id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Ingrediente aggiornato con successo"
      });

      onClose();
      onIngredientUpdated();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento dell'ingrediente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Modifica Ingrediente</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome Ingrediente *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Es. Pomodori San Marzano"
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
            <label className="block text-sm font-medium mb-1">Unità di Misura</label>
            <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
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

          <div>
            <label className="block text-sm font-medium mb-1">Costo per Unità (€) *</label>
            <Input
              type="number"
              step="0.01"
              value={formData.cost_per_unit}
              onChange={(e) => setFormData({...formData, cost_per_unit: parseFloat(e.target.value) || 0})}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Fornitore</label>
            <Input
              value={formData.supplier}
              onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              placeholder="Nome fornitore"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Scorte Attuali</label>
            <Input
              type="number"
              step="0.1"
              value={formData.current_stock}
              onChange={(e) => setFormData({...formData, current_stock: parseFloat(e.target.value) || 0})}
              placeholder="0"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Soglia Allarme Scorte</label>
            <Input
              type="number"
              step="0.1"
              value={formData.min_stock_threshold}
              onChange={(e) => setFormData({...formData, min_stock_threshold: parseFloat(e.target.value) || 0})}
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Aggiornamento..." : "Aggiorna Ingrediente"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditIngredientDialog;
