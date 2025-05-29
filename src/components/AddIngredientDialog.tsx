import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRestaurant } from '@/hooks/useRestaurant';

interface AddIngredientDialogProps {
  onAddIngredient: () => void;
}

const AddIngredientDialog: React.FC<AddIngredientDialogProps> = ({ onAddIngredient }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { withRestaurantId } = useRestaurant();

  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    costPerUnit: 0,
    supplier: '',
    currentStock: 0,
    minStockThreshold: 0,
    category: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      unit: 'kg',
      costPerUnit: 0,
      supplier: '',
      currentStock: 0,
      minStockThreshold: 0,
      category: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      const ingredientData = withRestaurantId({
        name: formData.name,
        unit: formData.unit,
        cost_per_unit: parseFloat(formData.costPerUnit.toString()),
        supplier: formData.supplier || null,
        current_stock: parseFloat(formData.currentStock.toString()) || 0,
        min_stock_threshold: parseFloat(formData.minStockThreshold.toString()) || 0,
        category: formData.category || null
      });

      const { error } = await supabase
        .from('ingredients')
        .insert([ingredientData]);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Ingrediente aggiunto con successo"
      });

      onAddIngredient();
      setOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error adding ingredient:', error);
      toast({
        title: "Errore",
        description: error.message || "Errore durante l'aggiunta dell'ingrediente",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="mr-2 h-4 w-4" />
          Aggiungi Ingrediente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Aggiungi Nuovo Ingrediente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right">
              Unità
            </Label>
            <Select value={formData.unit} onValueChange={(value) => setFormData(prevData => ({ ...prevData, unit: value }))} >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleziona unità" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="g">g</SelectItem>
                <SelectItem value="l">l</SelectItem>
                <SelectItem value="ml">ml</SelectItem>
                <SelectItem value="pz">pz</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="costPerUnit" className="text-right">
              Costo per Unità
            </Label>
            <Input
              type="number"
              id="costPerUnit"
              name="costPerUnit"
              value={formData.costPerUnit}
              onChange={handleChange}
              className="col-span-3"
              step="0.01"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplier" className="text-right">
              Fornitore
            </Label>
            <Input
              type="text"
              id="supplier"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="currentStock" className="text-right">
              Giacenza Attuale
            </Label>
            <Input
              type="number"
              id="currentStock"
              name="currentStock"
              value={formData.currentStock}
              onChange={handleChange}
              className="col-span-3"
              step="0.01"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="minStockThreshold" className="text-right">
              Soglia Minima
            </Label>
            <Input
              type="number"
              id="minStockThreshold"
              name="minStockThreshold"
              value={formData.minStockThreshold}
              onChange={handleChange}
              className="col-span-3"
              step="0.01"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Categoria
            </Label>
            <Input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="col-span-3"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Aggiunta..." : "Aggiungi"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddIngredientDialog;
