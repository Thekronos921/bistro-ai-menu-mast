
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRestaurant } from '@/hooks/useRestaurant';
import { TooltipProvider } from '@/components/ui/tooltip';
import EnhancedIngredientForm from './ingredients/EnhancedIngredientForm';
import type { EnhancedIngredient } from '@/types/ingredient';

interface AddIngredientDialogProps {
  onAddIngredient: () => void;
}

const AddIngredientDialog: React.FC<AddIngredientDialogProps> = ({ onAddIngredient }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { withRestaurantId } = useRestaurant();

  const [formData, setFormData] = useState<Partial<EnhancedIngredient>>({
    name: '',
    primary_unit: 'kg',
    usage_unit: null,
    cost_per_unit: 0,
    yield_percentage: 100,
    category: '',
    supplier: '', // Ensure this is always a string, not undefined
    supplier_product_code: '', // Ensure this is always a string, not undefined
    current_stock: 0,
    min_stock_threshold: 0,
    notes: ''
  });

  const handleFormDataChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateEffectiveCost = () => {
    if (!formData.cost_per_unit || !formData.yield_percentage) return 0;
    return formData.cost_per_unit / (formData.yield_percentage / 100);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      primary_unit: 'kg',
      usage_unit: null,
      cost_per_unit: 0,
      yield_percentage: 100,
      category: '',
      supplier: '', // Ensure this is always a string, not undefined
      supplier_product_code: '', // Ensure this is always a string, not undefined
      current_stock: 0,
      min_stock_threshold: 0,
      notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      toast({
        title: "Errore",
        description: "Il nome dell'ingrediente è obbligatorio",
        variant: "destructive"
      });
      return;
    }

    if (!formData.cost_per_unit || formData.cost_per_unit <= 0) {
      toast({
        title: "Errore",
        description: "Il costo per unità deve essere maggiore di zero",
        variant: "destructive"
      });
      return;
    }

    if (!formData.yield_percentage || formData.yield_percentage < 1 || formData.yield_percentage > 100) {
      toast({
        title: "Errore",
        description: "La percentuale di resa deve essere tra 1 e 100",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const effectiveCost = calculateEffectiveCost();
      
      const ingredientData = withRestaurantId({
        name: formData.name,
        unit: formData.primary_unit, // Manteniamo compatibilità con campo esistente
        primary_unit: formData.primary_unit,
        usage_unit: formData.usage_unit,
        cost_per_unit: formData.cost_per_unit,
        yield_percentage: formData.yield_percentage,
        effective_cost_per_unit: effectiveCost, // Ensure this is always provided
        average_weight_per_piece_g: formData.average_weight_per_piece_g,
        average_pieces_per_kg: formData.average_weight_per_piece_g ? 
          1000 / formData.average_weight_per_piece_g : null,
        supplier: formData.supplier || '', // Ensure this is always a string, never null
        supplier_product_code: formData.supplier_product_code || '', // Ensure this is always a string, never null
        current_stock: formData.current_stock || 0,
        min_stock_threshold: formData.min_stock_threshold || 0,
        category: formData.category || null,
        notes: formData.notes || null,
        allocated_stock: 0, // Inizializza a 0
        labeled_stock: 0 // Inizializza a 0
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
    <TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Aggiungi Ingrediente
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aggiungi Nuovo Ingrediente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <EnhancedIngredientForm 
              formData={formData}
              onFormDataChange={handleFormDataChange}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Aggiunta..." : "Aggiungi Ingrediente"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default AddIngredientDialog;
