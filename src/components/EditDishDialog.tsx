
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Recipe {
  id: string;
  name: string;
  category: string;
}

interface Dish {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  recipe_id?: string;
  recipes?: Recipe;
}

interface EditDishDialogProps {
  dish: Dish;
  onClose: () => void;
  onDishUpdated: () => void;
}

const EditDishDialog = ({ dish, onClose, onDishUpdated }: EditDishDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: dish.name,
    category: dish.category,
    selling_price: dish.selling_price
  });

  const categories = ["Antipasti", "Primi Piatti", "Secondi Piatti", "Dolci", "Contorni"];

  const handleSubmit = async () => {
    if (!formData.name || !formData.category || formData.selling_price <= 0) {
      toast({
        title: "Errore",
        description: "Nome, categoria e prezzo sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('dishes')
        .update({
          name: formData.name,
          category: formData.category,
          selling_price: formData.selling_price
        })
        .eq('id', dish.id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Piatto aggiornato con successo"
      });

      onClose();
      onDishUpdated();
    } catch (error) {
      console.error('Error updating dish:', error);
      toast({
        title: "Errore",
        description: "Errore durante l'aggiornamento del piatto",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Edit className="w-5 h-5" />
            <span>Modifica Piatto: {dish.name}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
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
            <label className="block text-sm font-medium mb-1">
              <DollarSign className="w-4 h-4 inline mr-1" />
              Prezzo di Vendita (€)
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

          {dish.recipes && (
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-sm text-slate-600">
                <strong>Ricetta associata:</strong> {dish.recipes.name}
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Aggiornamento..." : "Aggiorna Piatto"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditDishDialog;
