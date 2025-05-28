
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddIngredientDialogProps {
  onIngredientAdded: () => void;
}

const AddIngredientDialog = ({ onIngredientAdded }: AddIngredientDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    unit: "g",
    cost_per_unit: 0,
    supplier: "",
    current_stock: 0,
    min_stock_threshold: 0,
    category: ""
  });

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
        .insert([formData]);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Ingrediente aggiunto con successo"
      });

      setOpen(false);
      setFormData({
        name: "",
        unit: "g",
        cost_per_unit: 0,
        supplier: "",
        current_stock: 0,
        min_stock_threshold: 0,
        category: ""
      });
      onIngredientAdded();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante l'aggiunta dell'ingrediente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-600 hover:bg-green-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nuovo Ingrediente
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Aggiungi Nuovo Ingrediente</span>
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
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Salvataggio..." : "Salva Ingrediente"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddIngredientDialog;
