
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, PrinterIcon, SaveIcon, Info } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();

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
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    if (restaurantId) {
      const loadData = async () => {
        setIsLoadingData(true);
        try {
          await Promise.all([loadIngredients(), loadRecipes()]);
        } finally {
          setIsLoadingData(false);
        }
      };
      loadData();
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
      toast({
        title: "Errore",
        description: "Impossibile caricare gli ingredienti",
        variant: "destructive"
      });
    }
  };

  const loadRecipes = async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('id, name, portions, allergens, description, is_semilavorato')
        .eq('restaurant_id', restaurantId)
        .order('name');

      if (error) throw error;
      setRecipes(data || []);
    } catch (error) {
      console.error('Error loading recipes:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le ricette",
        variant: "destructive"
      });
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
        items: recipes.filter(r => r.is_semilavorato === true), 
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
    return configs[labelType] || {
      title: 'Etichetta Generica',
      color: 'gray',
      items: [],
      itemField: 'id',
      showPortions: false
    };
  };

  const config = getTypeConfig();

  // Verifica di sicurezza per evitare errori se config è undefined
  if (!config || !config.items) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500">Errore nel caricamento della configurazione</p>
          <Button onClick={onClose} variant="outline" className="mt-2">
            Chiudi
          </Button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="space-y-4 h-full">
        {/* Header Mobile */}
        <div className="flex items-center space-x-2 mb-4">
          <Badge variant="outline" className={`bg-${config?.color || 'gray'}-50 text-${config?.color || 'gray'}-700 border-${config?.color || 'gray'}-200 text-xs`}>
            {config.title}
          </Badge>
        </div>

        {/* Form compatto per mobile */}
        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
          {/* Selezione e quantità */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">
                  {labelType === 'ingredient' || labelType === 'defrosted' ? 'Ingrediente' : 'Ricetta'}
                </Label>
                <Select
                  value={formData[config.itemField] || ""}
                  onValueChange={(value) => {
                    if (config.itemField) {
                      setFormData(prev => ({ ...prev, [config.itemField]: value }));
                      const item = config.items.find(i => i.id === value);
                      setSelectedItem(item);
                    }
                  }}
                  disabled={isLoadingData}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue 
                      placeholder={
                        isLoadingData 
                          ? "Caricamento..." 
                          : "Seleziona..."
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {config.items.length === 0 && !isLoadingData ? (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        Nessun elemento disponibile
                      </div>
                    ) : (
                      config.items.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Quantità</Label>
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Unità</Label>
                  <Input
                    value={formData.unit}
                    onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Titolo</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nome prodotto..."
                  className="text-sm"
                />
              </div>
            </CardContent>
          </Card>

          {/* Date */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Produzione</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left text-xs p-2 h-8">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {format(formData.production_date, 'dd/MM', { locale: it })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.production_date}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, production_date: date }))}
                        locale={it}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Scadenza</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left text-xs p-2 h-8">
                        <CalendarIcon className="mr-1 h-3 w-3" />
                        {formData.expiry_date 
                          ? format(formData.expiry_date, 'dd/MM', { locale: it })
                          : format(calculateExpiryDate(), 'dd/MM', { locale: it })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.expiry_date || calculateExpiryDate()}
                        onSelect={(date) => setFormData(prev => ({ ...prev, expiry_date: date }))}
                        locale={it}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Altri campi compatti */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="space-y-2">
                <Label className="text-sm">Conservazione</Label>
                <Textarea
                  value={formData.storage_instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, storage_instructions: e.target.value }))}
                  rows={2}
                  className="text-sm"
                />
              </div>

              {formData.allergens && (
                <div className="space-y-2">
                  <Label className="text-sm">Allergeni</Label>
                  <Input
                    value={formData.allergens}
                    onChange={(e) => setFormData(prev => ({ ...prev, allergens: e.target.value }))}
                    className="text-sm"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview compatto */}
          <div className="mt-4">
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

          {/* Buttons */}
          <div className="flex space-x-2 pt-4 pb-6">
            <Button 
              onClick={() => handleSubmit(false)} 
              disabled={loading}
              className="flex-1 text-sm"
              size="sm"
            >
              <SaveIcon className="mr-1 h-3 w-3" />
              Salva
            </Button>
            <Button 
              onClick={() => handleSubmit(true)} 
              disabled={loading}
              variant="outline"
              className="flex-1 text-sm"
              size="sm"
            >
              <PrinterIcon className="mr-1 h-3 w-3" />
              Stampa
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Layout Desktop - più compatto
  return (
    <div className="grid grid-cols-3 gap-4 h-full">
      {/* Form Section - 2 colonne */}
      <div className="col-span-2 space-y-4 overflow-y-auto pr-2">
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className={`bg-${config?.color || 'gray'}-50 text-${config?.color || 'gray'}-700 border-${config?.color || 'gray'}-200`}>
            {config.title}
          </Badge>
          <Info className="w-4 h-4 text-gray-400" />
        </div>

        {/* Selezione Elemento */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              <Label>
                {labelType === 'ingredient' || labelType === 'defrosted' ? 'Ingrediente' : 'Ricetta'}
              </Label>
              <Select
                value={formData[config.itemField] || ""}
                onValueChange={(value) => {
                  if (config.itemField) {
                    setFormData(prev => ({ ...prev, [config.itemField]: value }));
                    const item = config.items.find(i => i.id === value);
                    setSelectedItem(item);
                  }
                }}
                disabled={isLoadingData}
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder={
                      isLoadingData 
                        ? "Caricamento..." 
                        : `Seleziona ${labelType === 'ingredient' || labelType === 'defrosted' ? 'ingrediente' : 'ricetta'}...`
                    } 
                  />
                </SelectTrigger>
                <SelectContent>
                  {config.items.length === 0 && !isLoadingData ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      Nessun elemento disponibile
                    </div>
                  ) : (
                    config.items.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Titolo</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nome prodotto..."
                />
              </div>
              <div className="space-y-2">
                <Label>Quantità</Label>
                <Input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Unità</Label>
                <Input
                  value={formData.unit}
                  onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date */}
        <Card>
          <CardContent className="p-4 space-y-3">
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
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Altri campi */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              <Label>Istruzioni Conservazione</Label>
              <Textarea
                value={formData.storage_instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, storage_instructions: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Allergeni</Label>
                <Input
                  value={formData.allergens}
                  onChange={(e) => setFormData(prev => ({ ...prev, allergens: e.target.value }))}
                  placeholder="Glutine, lattosio..."
                />
              </div>
              <div className="space-y-2">
                <Label>Fornitore</Label>
                <Input
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="Nome fornitore..."
                />
              </div>
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

      {/* Preview Section - 1 colonna */}
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
