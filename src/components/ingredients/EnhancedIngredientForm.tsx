
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Info, Package, Calculator } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getUnitsByType, calculateEffectiveCostPerUsageUnit, formatQuantityDisplay } from '@/utils/enhancedUnitConversion';
import type { EnhancedIngredient } from '@/types/ingredient';

interface EnhancedIngredientFormProps {
  formData: Partial<EnhancedIngredient>;
  onFormDataChange: (field: string, value: any) => void;
  isEditing?: boolean;
}

const EnhancedIngredientForm = ({ 
  formData, 
  onFormDataChange, 
  isEditing = false 
}: EnhancedIngredientFormProps) => {
  const [showAdvancedConversions, setShowAdvancedConversions] = useState(false);

  const weightUnits = getUnitsByType('weight');
  const volumeUnits = getUnitsByType('volume');
  const pieceUnits = getUnitsByType('piece');
  const allUnits = [...weightUnits, ...volumeUnits, ...pieceUnits];
  
  const primaryUnit = formData.primary_unit || 'g';
  const usageUnit = formData.usage_unit;
  const effectiveUsageUnit = usageUnit || primaryUnit;

  const calculateEffectiveCost = () => {
    if (!formData.cost_per_unit || !formData.yield_percentage) return 0;
    return formData.cost_per_unit / (formData.yield_percentage / 100);
  };

  const calculateUsageUnitCost = () => {
    if (!formData.cost_per_unit || !formData.yield_percentage) return 0;
    
    try {
      return calculateEffectiveCostPerUsageUnit({
        primary_unit: primaryUnit,
        usage_unit: usageUnit,
        cost_per_unit: formData.cost_per_unit,
        effective_cost_per_unit: formData.effective_cost_per_unit,
        yield_percentage: formData.yield_percentage || 100,
        average_weight_per_piece_g: formData.average_weight_per_piece_g
      });
    } catch (error) {
      console.warn('Errore calcolo costo unità utilizzo:', error);
      return calculateEffectiveCost();
    }
  };

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Informazioni Base */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Package className="w-5 h-5" />
            Informazioni Base
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome Ingrediente *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => onFormDataChange('name', e.target.value)}
                placeholder="Es. Limoni freschi"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                value={formData.category || ''}
                onChange={(e) => onFormDataChange('category', e.target.value)}
                placeholder="Es. Frutta, Verdura, Pesce"
              />
            </div>
          </div>
        </div>

        {/* Gestione Unità di Misura */}
        <div className="bg-blue-50 p-4 rounded-lg space-y-4">
          <h3 className="font-semibold text-blue-800 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Gestione Unità di Misura
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="primary_unit">Unità di Acquisto (UMP) *</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>L'unità con cui acquisti questo ingrediente dal fornitore</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select 
                value={primaryUnit} 
                onValueChange={(value) => onFormDataChange('primary_unit', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allUnits.map(unit => (
                    <SelectItem key={unit.code} value={unit.code}>
                      <div className="flex items-center gap-2">
                        <span>{unit.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {unit.type === 'weight' ? 'Peso' : 
                           unit.type === 'volume' ? 'Volume' : 
                           unit.type === 'piece' ? 'Pezzo' : 'Altro'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Label htmlFor="usage_unit">Unità per Ricette (UUS)</Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-blue-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>L'unità preferita per l'uso nelle ricette. Se non specificata, sarà uguale all'UMP.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select 
                value={usageUnit || ''} 
                onValueChange={(value) => onFormDataChange('usage_unit', value || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Uguale a UMP (${primaryUnit})`} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Uguale a UMP ({primaryUnit})</SelectItem>
                  {allUnits
                    .filter(unit => unit.code !== primaryUnit)
                    .map(unit => (
                    <SelectItem key={unit.code} value={unit.code}>
                      <div className="flex items-center gap-2">
                        <span>{unit.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {unit.type === 'weight' ? 'Peso' : 
                           unit.type === 'volume' ? 'Volume' : 
                           unit.type === 'piece' ? 'Pezzo' : 'Altro'}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Conversioni peso/pezzo */}
          {((primaryUnit === 'kg' && effectiveUsageUnit === 'pz') || 
            (effectiveUsageUnit === 'kg' && primaryUnit === 'pz')) && (
            <div className="border border-blue-200 rounded p-3 space-y-3">
              <h4 className="font-medium text-blue-800">Conversioni Peso ↔ Pezzo</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="average_weight_per_piece_g">Peso medio per pezzo (grammi)</Label>
                  <Input
                    id="average_weight_per_piece_g"
                    type="number"
                    step="0.1"
                    value={formData.average_weight_per_piece_g || ''}
                    onChange={(e) => onFormDataChange('average_weight_per_piece_g', parseFloat(e.target.value) || null)}
                    placeholder="Es. 150 (per un limone)"
                  />
                </div>
                <div>
                  <Label htmlFor="average_pieces_per_kg">Pezzi per kg (calcolato)</Label>
                  <Input
                    value={formData.average_weight_per_piece_g ? 
                      (1000 / formData.average_weight_per_piece_g).toFixed(1) : ''}
                    disabled
                    placeholder="Calcolato automaticamente"
                  />
                </div>
              </div>
              <div className="text-xs text-blue-600">
                <Info className="w-3 h-3 inline mr-1" />
                Questi valori saranno aggiornati automaticamente quando carichi un lotto specificando il numero di pezzi.
              </div>
            </div>
          )}
        </div>

        {/* Costi e Resa */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="cost_per_unit">Costo Acquisto per {primaryUnit} (€) *</Label>
            <Input
              id="cost_per_unit"
              type="number"
              step="0.01"
              value={formData.cost_per_unit || ''}
              onChange={(e) => onFormDataChange('cost_per_unit', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              required
            />
          </div>
          
          <div>
            <div className="flex items-center gap-1 mb-2">
              <Label htmlFor="yield_percentage">Resa (%) *</Label>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Percentuale utilizzabile dopo pulizia/preparazione</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              id="yield_percentage"
              type="number"
              min="1"
              max="100"
              value={formData.yield_percentage || 100}
              onChange={(e) => onFormDataChange('yield_percentage', parseFloat(e.target.value) || 100)}
              required
            />
          </div>

          <div>
            <Label className="text-sm text-gray-600">Costo Effettivo per {primaryUnit}</Label>
            <div className="mt-2 text-lg font-bold text-green-600">
              €{calculateEffectiveCost().toFixed(2)}
            </div>
          </div>
        </div>

        {/* Costo per Unità di Utilizzo */}
        {effectiveUsageUnit !== primaryUnit && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">
              Costo per Unità di Utilizzo ({effectiveUsageUnit})
            </h4>
            <div className="text-xl font-bold text-green-600">
              €{calculateUsageUnitCost().toFixed(4)} per {effectiveUsageUnit}
            </div>
            <p className="text-sm text-green-600 mt-1">
              Questo è il costo che verrà utilizzato nei calcoli delle ricette
            </p>
          </div>
        )}

        {/* Informazioni Aggiuntive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="supplier">Fornitore</Label>
            <Input
              id="supplier"
              value={formData.supplier || ''}
              onChange={(e) => onFormDataChange('supplier', e.target.value)}
              placeholder="Nome fornitore"
            />
          </div>
          
          <div>
            <Label htmlFor="supplier_product_code">Codice Prodotto Fornitore</Label>
            <Input
              id="supplier_product_code"
              value={formData.supplier_product_code || ''}
              onChange={(e) => onFormDataChange('supplier_product_code', e.target.value)}
              placeholder="COD123"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <Label htmlFor="notes">Note</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => onFormDataChange('notes', e.target.value)}
            placeholder="Note aggiuntive sull'ingrediente..."
            rows={3}
          />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default EnhancedIngredientForm;
