
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, PrinterIcon, SaveIcon, Package, Info } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useLabels } from '@/hooks/useLabels';
import { useStorageLocations } from '@/hooks/useStorageLocations';
import TrackedLabelPreview from './TrackedLabelPreview';
import { useToast } from '@/hooks/use-toast';

interface UnifiedLabelFormProps {
  labelType: 'ingredient' | 'semilavorato' | 'recipe' | 'defrosted' | 'lavorato';
  onClose: () => void;
}

interface FormData {
  title: string;
  ingredient_id?: string;
  recipe_id?: string;
  quantity: number;
  unit: string;
  batch_number: string;
  production_date: Date;
  expiry_date?: Date;
  storage_location_id?: string;
  storage_instructions: string;
  allergens: string;
  supplier: string;
  notes: string;
  portions?: number;
}

const UnifiedLabelForm = ({ labelType, onClose }: UnifiedLabelFormProps) => {
  const { restaurantId } = useRestaurant();
  const { saveLabel, loading } = useLabels();
  const { storageLocations } = useStorageLocations();
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    title: '',
    quantity: 1,
    unit: 'kg',
    batch_number: `${labelType.toUpperCase()}-${Date.now().toString().slice(-6)}`,
    production_date: new Date(),
    storage_instructions: getDefaultStorageInstructions(labelType),
    allergens: '',
    supplier: '',
    notes: ''
  });

  const [ingredients, setIngredients] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  useEffect(() => {
    if (restaurantId) {
      loadIngredients();
      loadRecipes();
    }
  }, [restaurantId]);

  useEffect(() => {
    if (selectedItem) {
      updateFormFromSelection();
    }
  }, [selectedItem]);

  const loadIngredients = async () => {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('id, name, unit, supplier, allergens, storage_instructions')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (error) throw error;
      setIngredients(data || []);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  const loadRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, name, portions, allergens, description')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const updateFormFromSelection = () => {
    if (labelType === 'ingredient' || labelType === 'defrosted') {
      setFormData(prev => ({
        ...prev,
        title: selectedItem.name,
        unit: selectedItem.unit || 'kg',
        supplier: selectedItem.supplier || '',
        allergens: selectedItem.allergens || '',
        storage_instructions: selectedItem.storage_instructions || getDefaultStorageInstructions(labelType)
      }));
    } else if (labelType === 'recipe' || labelType === 'semilavorato') {
      setFormData(prev => ({
        ...prev,
        title: selectedItem.name,
        unit: 'porzione',
        portions: selectedItem.portions || 1,
        allergens: selectedItem.allergens || '',
        notes: selectedItem.description || ''
      }));
    }
  };

  function getDefaultStorageInstructions(type: string): string {
    switch (type) {
      case 'ingredient':
        return 'Conservare secondo indicazioni del fornitore';
      case 'defrosted':
        return 'Conservare in frigorifero a 4°C max. Non ricongelare.';
      case 'recipe':
      case 'semilavorato':
        return 'Conservare in frigorifero a 4°C max';
      case 'lavorato':
        return 'Servire immediatamente o mantenere a temperatura di servizio';
      default:
        return 'Seguire procedure HACCP standard';
    }
  }

  const calculateExpiryDate = () => {
    const days = getDefaultShelfLifeDays(labelType);
    return addDays(formData.production_date, days);
  };

  function getDefaultShelfLifeDays(type: string): number {
    switch (type) {
      case 'ingredient': return 7;
      case 'defrosted': return 2;
      case 'recipe':
      case 'semilavorato': return 3;
      case 'lavorato': return 1;
      default: return 3;
    }
  }

  const handleSubmit = async (shouldPrint = false) => {
    if (!formData.title.trim()) {
      toast({
        title: "Errore",
        description: "Il titolo è obbligatorio",
        variant: "destructive"
      });
      return;
    }

    try {
      const labelData = {
        label_type: labelType,
        title: formData.title,
        quantity: formData.quantity,
        unit: formData.unit,
        batch_number: formData.batch_number,
        production_date: format(formData.production_date, 'yyyy-MM-dd'),
        expiry_date: formData.expiry_date ? format(formData.expiry_date, 'yyyy-MM-dd') : format(calculateExpiryDate(), 'yyyy-MM-dd'),
        storage_location_id: formData.storage_location_id || undefined,
        storage_instructions: formData.storage_instructions,
        allergens: formData.allergens,
        supplier: formData.supplier,
        notes: formData.notes,
        ingredient_id: labelType === 'ingredient' || labelType === 'defrosted' ? formData.ingredient_id : undefined,
        recipe_id: labelType === 'recipe' || labelType === 'semilavorato' ? formData.recipe_id : undefined,
        portions: formData.portions
      };

      const result = await saveLabel(labelData);
      
      if (result && shouldPrint) {
        setTimeout(() => {
          const printContent = document.querySelector('[data-label-preview]');
          if (printContent) {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
              printWindow.document.write(`
                <html>
                  <head>
                    <title>Stampa Etichetta</title>
                    <style>
                      body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
                      @media print { body { margin: 0; padding: 0; } }
                    </style>
                  </head>
                  <body>
                    ${printContent.outerHTML}
                  </body>
                </html>
              `);
              printWindow.document.close();
              printWindow.print();
            }
          }
        }, 500);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving label:', error);
    }
  };

  const qrData = JSON.stringify({
    id: `temp-${Date.now()}`,
    type: labelType,
    title: formData.title,
    batch_number: formData.batch_number,
    production_date: format(formData.production_date, 'yyyy-MM-dd'),
    expiry_date: formData.expiry_date ? format(formData.expiry_date, 'yyyy-MM-dd') : format(calculateExpiryDate(), 'yyyy-MM-dd'),
    restaurant_id: restaurantId,
    timestamp: new Date().toISOString()
  });

  const getTypeConfig = () => {
    const configs = {
      ingredient: { 
        title: 'Etichetta Ingrediente', 
        color: 'purple', 
        items: ingredients, 
        itemField: 'ingredient_id',
        showPortions: false 
      },
      defrosted: { 
        title: 'Etichetta Prodotto Decongelato', 
        color: 'cyan', 
        items: ingredients, 
        itemField: 'ingredient_id',
        showPortions: false 
      },
      recipe: { 
        title: 'Etichetta Ricetta Preparata', 
        color: 'orange', 
        items: recipes, 
        itemField: 'recipe_id',
        showPortions: true 
      },
      semilavorato: { 
        title: 'Etichetta Semilavorato', 
        color: 'blue', 
        items: recipes.filter(r => r.is_semilavorato !== false), 
        itemField: 'recipe_id',
        showPortions: true 
      },
      lavorato: { 
        title: 'Etichetta Prodotto Lavorato', 
        color: 'green', 
        items: recipes, 
        itemField: 'recipe_id',
        showPortions: true 
      }
    };
    return configs[labelType];
  };

  const config = getTypeConfig();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Form Section */}
      <div className="space-y-6 overflow-y-auto pr-2">
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className={`bg-${config.color}-50 text-${config.color}-700 border-${config.color}-200`}>
            {config.title}
          </Badge>
          <Info className="w-4 h-4 text-gray-400" />
        </div>

        {/* Selezione Elemento */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="item-select">
                {labelType === 'ingredient' || labelType === 'defrosted' ? 'Ingrediente' : 'Ricetta'}
              </Label>
              <Select
                value={formData[config.itemField] || ""}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, [config.itemField]: value }));
                  const item = config.items.find(i => i.id === value);
                  setSelectedItem(item);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Seleziona ${labelType === 'ingredient' || labelType === 'defrosted' ? 'ingrediente' : 'ricetta'}...`} />
                </SelectTrigger>
                <SelectContent>
                  {config.items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  {config.showPortions ? 'Numero Porzioni' : 'Quantità'}
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unità</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informazioni Base */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titolo Etichetta</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Nome prodotto..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch">Numero Lotto</Label>
              <Input
                id="batch"
                value={formData.batch_number}
                onChange={(e) => setFormData(prev => ({ ...prev, batch_number: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplier">Fornitore</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                placeholder="Nome fornitore..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Date */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Produzione</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(formData.production_date, 'dd/MM/yyyy', { locale: it })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.production_date}
                      onSelect={(date) => date && setFormData(prev => ({ ...prev, production_date: date }))}
                      locale={it}
                      disabled={(date) => date < new Date('2020-01-01')}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Data Scadenza</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.expiry_date 
                        ? format(formData.expiry_date, 'dd/MM/yyyy', { locale: it })
                        : format(calculateExpiryDate(), 'dd/MM/yyyy', { locale: it })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.expiry_date || calculateExpiryDate()}
                      onSelect={(date) => setFormData(prev => ({ ...prev, expiry_date: date }))}
                      locale={it}
                      disabled={(date) => date < formData.production_date}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posizione e Conservazione */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storage-location">Posizione Storage</Label>
              <Select
                value={formData.storage_location_id || "none"}
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  storage_location_id: value === "none" ? undefined : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona posizione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nessuna posizione</SelectItem>
                  {storageLocations.map((location) => (
                    <SelectItem key={location.id} value={location.id}>
                      {location.name} - {location.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="storage-instructions">Istruzioni Conservazione</Label>
              <Textarea
                id="storage-instructions"
                value={formData.storage_instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, storage_instructions: e.target.value }))}
                placeholder="Temperatura, condizioni particolari..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Allergeni e Note */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="allergens">Allergeni</Label>
              <Input
                id="allergens"
                value={formData.allergens}
                onChange={(e) => setFormData(prev => ({ ...prev, allergens: e.target.value }))}
                placeholder="Glutine, lattosio, uova..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Note Aggiuntive</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Note aggiuntive..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Buttons */}
        <div className="flex space-x-3 pb-4">
          <Button 
            onClick={() => handleSubmit(false)} 
            disabled={loading}
            className="flex-1"
          >
            <SaveIcon className="mr-2 h-4 w-4" />
            Salva Etichetta
          </Button>
          <Button 
            onClick={() => handleSubmit(true)} 
            disabled={loading}
            variant="outline"
            className="flex-1"
          >
            <PrinterIcon className="mr-2 h-4 w-4" />
            Salva e Stampa
          </Button>
        </div>
      </div>

      {/* Preview Section */}
      <div className="space-y-4 overflow-y-auto">
        <TrackedLabelPreview
          title={formData.title || `${config.title} - Anteprima`}
          type={labelType}
          productionDate={format(formData.production_date, 'yyyy-MM-dd')}
          expiryDate={formData.expiry_date ? format(formData.expiry_date, 'yyyy-MM-dd') : format(calculateExpiryDate(), 'yyyy-MM-dd')}
          batchNumber={formData.batch_number}
          qrData={qrData}
          storageInstructions={formData.storage_instructions}
          allergens={formData.allergens}
          quantity={formData.quantity}
          unit={formData.unit}
          supplier={formData.supplier}
        />
      </div>
    </div>
  );
};

export default UnifiedLabelForm;
