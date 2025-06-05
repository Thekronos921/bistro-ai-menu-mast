
import React, { useState } from 'react';
import { Plus, Edit2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useStorageLocations } from '@/hooks/useStorageLocations';
import { useForm } from 'react-hook-form';

interface StorageLocationFormData {
  name: string;
  type: string;
  temperature_min?: number;
  temperature_max?: number;
  capacity_description?: string;
  notes?: string;
}

const StorageLocationManager = () => {
  const { storageLocations, loading, createStorageLocation, updateStorageLocation } = useStorageLocations();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  
  const { register, handleSubmit, reset, setValue, watch } = useForm<StorageLocationFormData>();

  const onSubmit = async (data: StorageLocationFormData) => {
    const locationData = {
      ...data,
      is_active: true,
      temperature_min: data.temperature_min || null,
      temperature_max: data.temperature_max || null
    };

    if (editingLocation) {
      await updateStorageLocation(editingLocation.id, locationData);
    } else {
      await createStorageLocation(locationData);
    }
    
    setIsDialogOpen(false);
    setEditingLocation(null);
    reset();
  };

  const handleEdit = (location: any) => {
    setEditingLocation(location);
    setValue('name', location.name);
    setValue('type', location.type);
    setValue('temperature_min', location.temperature_min);
    setValue('temperature_max', location.temperature_max);
    setValue('capacity_description', location.capacity_description);
    setValue('notes', location.notes);
    setIsDialogOpen(true);
  };

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'refrigerator': 'Frigorifero',
      'freezer': 'Congelatore',
      'pantry': 'Dispensa',
      'wine_cellar': 'Cantina',
      'storage_room': 'Magazzino'
    };
    return types[type] || type;
  };

  const getTemperatureRange = (location: any) => {
    if (location.temperature_min && location.temperature_max) {
      return `${location.temperature_min}°C - ${location.temperature_max}°C`;
    }
    return 'Non specificato';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Posizioni di Storage</h2>
          <p className="text-slate-600">Gestisci frigoriferi, congelatori e altre aree di conservazione</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingLocation(null);
                reset();
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuova Posizione
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingLocation ? 'Modifica Posizione' : 'Nuova Posizione di Storage'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input 
                  id="name"
                  {...register('name', { required: true })}
                  placeholder="es. Frigorifero Principale"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select onValueChange={(value) => setValue('type', value)} defaultValue={watch('type')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="refrigerator">Frigorifero</SelectItem>
                    <SelectItem value="freezer">Congelatore</SelectItem>
                    <SelectItem value="pantry">Dispensa</SelectItem>
                    <SelectItem value="wine_cellar">Cantina</SelectItem>
                    <SelectItem value="storage_room">Magazzino</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature_min">Temp. Min (°C)</Label>
                  <Input 
                    id="temperature_min"
                    type="number"
                    {...register('temperature_min', { valueAsNumber: true })}
                    placeholder="es. 2"
                  />
                </div>
                <div>
                  <Label htmlFor="temperature_max">Temp. Max (°C)</Label>
                  <Input 
                    id="temperature_max"
                    type="number"
                    {...register('temperature_max', { valueAsNumber: true })}
                    placeholder="es. 6"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="capacity_description">Descrizione Capacità</Label>
                <Input 
                  id="capacity_description"
                  {...register('capacity_description')}
                  placeholder="es. 500L, 3 ripiani"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Note</Label>
                <Textarea 
                  id="notes"
                  {...register('notes')}
                  placeholder="Note aggiuntive..."
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annulla
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  {editingLocation ? 'Aggiorna' : 'Crea'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">Caricamento posizioni...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {storageLocations.map((location) => (
            <Card key={location.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{location.name}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(location)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {getTypeLabel(location.type)}
                </Badge>
              </CardHeader>
              
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm text-slate-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  Temperatura: {getTemperatureRange(location)}
                </div>
                
                {location.capacity_description && (
                  <div className="text-sm text-slate-600">
                    <strong>Capacità:</strong> {location.capacity_description}
                  </div>
                )}
                
                {location.notes && (
                  <div className="text-sm text-slate-600">
                    <strong>Note:</strong> {location.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StorageLocationManager;
