import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Package, Info, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCategories } from '@/hooks/useCategories';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  yield_percentage: number;
  effective_cost_per_unit: number;
  supplier: string;
  supplier_product_code: string;
  current_stock: number;
  allocated_stock: number;
  labeled_stock: number;
  min_stock_threshold: number;
  par_level: number;
  category: string;
  external_id: string;
  notes: string;
  last_synced_at: string;
  batch_number: string;
  expiry_date: string;
  storage_instructions: string;
  origin_certification: string;
}

interface EditIngredientDialogProps {
  ingredient: Ingredient;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIngredientUpdated: () => void;
}

const EditIngredientDialog = ({ ingredient, open, onOpenChange, onIngredientUpdated }: EditIngredientDialogProps) => {
  const { categories } = useCategories();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: ingredient.name || '',
    unit: ingredient.unit || 'kg',
    cost_per_unit: ingredient.cost_per_unit || 0,
    yield_percentage: ingredient.yield_percentage || 100,
    supplier: ingredient.supplier || '',
    supplier_product_code: ingredient.supplier_product_code || '',
    current_stock: ingredient.current_stock || 0,
    allocated_stock: ingredient.allocated_stock || 0,
    labeled_stock: ingredient.labeled_stock || 0,
    min_stock_threshold: ingredient.min_stock_threshold || 0,
    par_level: ingredient.par_level || 0,
    category: ingredient.category || '',
    external_id: ingredient.external_id || '',
    notes: ingredient.notes || '',
    batch_number: ingredient.batch_number || '',
    expiry_date: ingredient.expiry_date || '',
    storage_instructions: ingredient.storage_instructions || '',
    origin_certification: ingredient.origin_certification || ''
  });

  const units = ["g", "kg", "ml", "l", "pz", "cucchiai", "cucchiaini", "tazze"];

  const calculateEffectiveCost = () => {
    if (formData.cost_per_unit <= 0 || formData.yield_percentage <= 0) return 0;
    return formData.cost_per_unit / (formData.yield_percentage / 100);
  };

  const isExpiringSoon = () => {
    if (!formData.expiry_date) return false;
    const expiryDate = new Date(formData.expiry_date);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
  };

  const isExpired = () => {
    if (!formData.expiry_date) return false;
    const expiryDate = new Date(formData.expiry_date);
    const today = new Date();
    return expiryDate < today;
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.cost_per_unit <= 0) {
      toast({
        title: "Errore",
        description: "Nome e costo per unità sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    if (formData.yield_percentage < 1 || formData.yield_percentage > 100) {
      toast({
        title: "Errore",
        description: "La percentuale di resa deve essere tra 1 e 100",
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
          yield_percentage: formData.yield_percentage,
          supplier: formData.supplier || null,
          supplier_product_code: formData.supplier_product_code || null,
          current_stock: formData.current_stock,
          allocated_stock: formData.allocated_stock,
          labeled_stock: formData.labeled_stock,
          min_stock_threshold: formData.min_stock_threshold,
          par_level: formData.par_level || null,
          category: formData.category || null,
          external_id: formData.external_id || null,
          notes: formData.notes || null,
          batch_number: formData.batch_number || null,
          expiry_date: formData.expiry_date || null,
          storage_instructions: formData.storage_instructions || null,
          origin_certification: formData.origin_certification || null
        })
        .eq('id', ingredient.id);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Ingrediente aggiornato con successo"
      });

      onOpenChange(false);
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
    <TooltipProvider>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Modifica Ingrediente</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Allarme Scadenza */}
            {(isExpired() || isExpiringSoon()) && (
              <div className={`p-4 rounded-lg border ${isExpired() ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center">
                  <Calendar className={`w-5 h-5 mr-2 ${isExpired() ? 'text-red-600' : 'text-yellow-600'}`} />
                  <h3 className={`font-semibold ${isExpired() ? 'text-red-800' : 'text-yellow-800'}`}>
                    {isExpired() ? 'Prodotto Scaduto' : 'Prodotto in Scadenza'}
                  </h3>
                </div>
                <p className={`mt-1 ${isExpired() ? 'text-red-700' : 'text-yellow-700'}`}>
                  {isExpired() 
                    ? 'Questo ingrediente è scaduto e non dovrebbe essere utilizzato.' 
                    : 'Questo ingrediente scadrà entro 7 giorni. Utilizzare con priorità.'}
                </p>
              </div>
            )}

            {/* Informazioni Base */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-1">Nome Ingrediente *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Es. Ricciola fresca"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">Categoria</Label>
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
            </div>

            {/* Gestione Lotti e Scadenze */}
            <div className="bg-blue-50 p-4 rounded-lg space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Package className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-blue-800">Gestione Lotti e Scadenze</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium mb-1">Numero Lotto</Label>
                  <Input
                    value={formData.batch_number}
                    onChange={(e) => setFormData({...formData, batch_number: e.target.value})}
                    placeholder="Es. LOT240131"
                  />
                </div>
                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    <Label className="block text-sm font-medium">Data di Scadenza</Label>
                    <Calendar className="w-4 h-4 text-gray-400" />
                  </div>
                  <Input
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="block text-sm font-medium mb-1">Istruzioni di Conservazione</Label>
                  <Input
                    value={formData.storage_instructions}
                    onChange={(e) => setFormData({...formData, storage_instructions: e.target.value})}
                    placeholder="Es. Conservare in frigorifero a 4°C"
                  />
                </div>
                <div>
                  <Label className="block text-sm font-medium mb-1">Certificazione Origine</Label>
                  <Input
                    value={formData.origin_certification}
                    onChange={(e) => setFormData({...formData, origin_certification: e.target.value})}
                    placeholder="Es. DOP, IGP, Biologico"
                  />
                </div>
              </div>
            </div>

            {/* Costi e Resa */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-1">Unità di Misura</Label>
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
                <Label className="block text-sm font-medium mb-1">Costo Acquisto/Unità (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({...formData, cost_per_unit: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <Label className="block text-sm font-medium">Resa (%) *</Label>
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
                  type="number"
                  min="1"
                  max="100"
                  value={formData.yield_percentage}
                  onChange={(e) => setFormData({...formData, yield_percentage: parseFloat(e.target.value) || 100})}
                />
              </div>
            </div>

            {/* Costo Effettivo Calcolato */}
            <div className="bg-green-50 p-4 rounded-lg">
              <Label className="text-green-800 font-semibold">
                Costo Effettivo per Unità: €{calculateEffectiveCost().toFixed(2)}
              </Label>
              <p className="text-sm text-green-600 mt-1">
                Questo è il costo reale che verrà utilizzato nei calcoli delle ricette
              </p>
            </div>

            {/* Fornitore */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-1">Fornitore</Label>
                <Input
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  placeholder="Nome fornitore"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">Codice Prodotto Fornitore</Label>
                <Input
                  value={formData.supplier_product_code}
                  onChange={(e) => setFormData({...formData, supplier_product_code: e.target.value})}
                  placeholder="COD123"
                />
              </div>
            </div>

            {/* Gestione Scorte */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-1">Giacenza Attuale</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({...formData, current_stock: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">Stock Allocato</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.allocated_stock}
                  onChange={(e) => setFormData({...formData, allocated_stock: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Quantità allocata per ricette e semilavorati</p>
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">Stock Etichettato</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.labeled_stock}
                  onChange={(e) => setFormData({...formData, labeled_stock: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">Quantità etichettata per tracciabilità</p>
              </div>
            </div>

            {/* Soglie di Scorta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium mb-1">Soglia Minima</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.min_stock_threshold}
                  onChange={(e) => setFormData({...formData, min_stock_threshold: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="block text-sm font-medium mb-1">Livello PAR</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={formData.par_level}
                  onChange={(e) => setFormData({...formData, par_level: parseFloat(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Integrazione Esterna */}
            <div>
              <Label className="block text-sm font-medium mb-1">ID Esterno (Gestionale)</Label>
              <Input
                value={formData.external_id}
                onChange={(e) => setFormData({...formData, external_id: e.target.value})}
                placeholder="ID per mappatura con gestionale esterno"
              />
              {ingredient.last_synced_at && (
                <p className="text-sm text-gray-500 mt-1">
                  Ultima sincronizzazione: {new Date(ingredient.last_synced_at).toLocaleDateString('it-IT')}
                </p>
              )}
            </div>

            {/* Note */}
            <div>
              <Label className="block text-sm font-medium mb-1">Note</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Note aggiuntive sull'ingrediente..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annulla
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Aggiornamento..." : "Aggiorna Ingrediente"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default EditIngredientDialog;
