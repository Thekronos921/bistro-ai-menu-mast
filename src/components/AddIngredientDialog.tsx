
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRestaurant } from '@/hooks/useRestaurant';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UNIT_CONVERSIONS } from '@/utils/unitConversions';

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
    yieldPercentage: 100,
    supplier: '',
    supplierProductCode: '',
    currentStock: 0,
    minStockThreshold: 0,
    parLevel: 0,
    category: '',
    externalId: '',
    notes: ''
  });

  // Raggruppa le unità per categoria per una migliore UX
  const unitsByCategory = UNIT_CONVERSIONS.reduce((acc, unit) => {
    if (!acc[unit.category]) acc[unit.category] = [];
    acc[unit.category].push(unit);
    return acc;
  }, {} as Record<string, typeof UNIT_CONVERSIONS>);

  const categories = ["Carni", "Pesce", "Verdure", "Frutta", "Cereali", "Latticini", "Spezie", "Condimenti", "Altro"];

  const calculateEffectiveCost = () => {
    if (formData.costPerUnit <= 0 || formData.yieldPercentage <= 0) return 0;
    return formData.costPerUnit / (formData.yieldPercentage / 100);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      unit: 'kg',
      costPerUnit: 0,
      yieldPercentage: 100,
      supplier: '',
      supplierProductCode: '',
      currentStock: 0,
      minStockThreshold: 0,
      parLevel: 0,
      category: '',
      externalId: '',
      notes: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: "Errore",
        description: "Il nome dell'ingrediente è obbligatorio",
        variant: "destructive"
      });
      return;
    }

    if (formData.costPerUnit <= 0) {
      toast({
        title: "Errore",
        description: "Il costo per unità deve essere maggiore di zero",
        variant: "destructive"
      });
      return;
    }

    if (formData.yieldPercentage < 1 || formData.yieldPercentage > 100) {
      toast({
        title: "Errore",
        description: "La percentuale di resa deve essere tra 1 e 100",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const ingredientData = withRestaurantId({
        name: formData.name,
        unit: formData.unit,
        cost_per_unit: formData.costPerUnit,
        yield_percentage: formData.yieldPercentage,
        supplier: formData.supplier || null,
        supplier_product_code: formData.supplierProductCode || null,
        current_stock: formData.currentStock || 0,
        min_stock_threshold: formData.minStockThreshold || 0,
        par_level: formData.parLevel || null,
        category: formData.category || null,
        external_id: formData.externalId || null,
        notes: formData.notes || null
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aggiungi Nuovo Ingrediente</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informazioni Base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Ingrediente *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Es. Ricciola fresca"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
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
            </div>

            {/* Costi e Resa */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="unit">Unità di Misura Base</Label>
                <Select value={formData.unit} onValueChange={(value) => handleChange('unit', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(unitsByCategory).map(([category, units]) => (
                      <div key={category}>
                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                          {category === 'weight' ? 'Peso' : 
                           category === 'volume' ? 'Volume' : 
                           category === 'count' ? 'Conteggio' : 'Altro'}
                        </div>
                        {units.map(unit => (
                          <SelectItem key={unit.unit} value={unit.unit}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Questa sarà l'unità base per costi e scorte
                </p>
              </div>
              <div>
                <Label htmlFor="costPerUnit">Costo Acquisto/Unità (€) *</Label>
                <Input
                  id="costPerUnit"
                  type="number"
                  step="0.01"
                  value={formData.costPerUnit}
                  onChange={(e) => handleChange('costPerUnit', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <div className="flex items-center space-x-1">
                  <Label htmlFor="yieldPercentage">Resa (%) *</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-4 h-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Es. se per 1kg di pesce pagato, ottieni 500g di polpa utilizzabile, la resa è 50%</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="yieldPercentage"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.yieldPercentage}
                  onChange={(e) => handleChange('yieldPercentage', parseFloat(e.target.value) || 100)}
                  required
                />
              </div>
            </div>

            {/* Costo Effettivo Calcolato */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <Label className="text-blue-800 font-semibold">
                Costo Effettivo per Unità: €{calculateEffectiveCost().toFixed(2)}
              </Label>
              <p className="text-sm text-blue-600 mt-1">
                Questo è il costo reale che verrà utilizzato nei calcoli delle ricette. 
                Potrai usare unità diverse nelle ricette (es. ml se l'unità base è L).
              </p>
            </div>

            {/* Fornitore */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="supplier">Fornitore</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleChange('supplier', e.target.value)}
                  placeholder="Nome fornitore"
                />
              </div>
              <div>
                <Label htmlFor="supplierProductCode">Codice Prodotto Fornitore</Label>
                <Input
                  id="supplierProductCode"
                  value={formData.supplierProductCode}
                  onChange={(e) => handleChange('supplierProductCode', e.target.value)}
                  placeholder="COD123"
                />
              </div>
            </div>

            {/* Gestione Scorte */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currentStock">Giacenza Attuale</Label>
                <Input
                  id="currentStock"
                  type="number"
                  step="0.01"
                  value={formData.currentStock}
                  onChange={(e) => handleChange('currentStock', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="minStockThreshold">Soglia Minima</Label>
                <Input
                  id="minStockThreshold"
                  type="number"
                  step="0.01"
                  value={formData.minStockThreshold}
                  onChange={(e) => handleChange('minStockThreshold', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="parLevel">Livello PAR</Label>
                <Input
                  id="parLevel"
                  type="number"
                  step="0.01"
                  value={formData.parLevel}
                  onChange={(e) => handleChange('parLevel', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Integrazione Esterna */}
            <div>
              <Label htmlFor="externalId">ID Esterno (Gestionale)</Label>
              <Input
                id="externalId"
                value={formData.externalId}
                onChange={(e) => handleChange('externalId', e.target.value)}
                placeholder="ID per mappatura con gestionale esterno"
              />
            </div>

            {/* Note */}
            <div>
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Note aggiuntive sull'ingrediente..."
                rows={3}
              />
            </div>

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
