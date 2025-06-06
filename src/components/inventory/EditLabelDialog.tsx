
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit } from 'lucide-react';
import { useLabels } from '@/hooks/useLabels';
import { useStorageLocations } from '@/hooks/useStorageLocations';
import { useToast } from '@/hooks/use-toast';

interface EditLabelDialogProps {
  label: any;
  onUpdate: () => void;
}

const EditLabelDialog = ({ label, onUpdate }: EditLabelDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: label.title || '',
    quantity: label.quantity || '',
    unit: label.unit || '',
    expiry_date: label.expiry_date || '',
    storage_instructions: label.storage_instructions || '',
    allergens: label.allergens || '',
    notes: label.notes || '',
    storage_location_id: label.storage_location_id || ''
  });

  const { saveLabel, loading } = useLabels();
  const { storageLocations } = useStorageLocations();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await saveLabel({
        ...label,
        ...formData,
        quantity: formData.quantity ? Number(formData.quantity) : undefined
      });
      
      toast({
        title: "Etichetta aggiornata",
        description: "L'etichetta è stata aggiornata con successo"
      });
      
      setIsOpen(false);
      onUpdate();
    } catch (error) {
      console.error('Error updating label:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Edit className="w-4 h-4" />
          Modifica
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifica Etichetta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Titolo</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="quantity">Quantità</Label>
              <Input
                id="quantity"
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="unit">Unità</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="expiry_date">Data di scadenza</Label>
            <Input
              id="expiry_date"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => handleInputChange('expiry_date', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="storage_location">Posizione Storage</Label>
            <Select 
              value={formData.storage_location_id} 
              onValueChange={(value) => handleInputChange('storage_location_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona posizione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nessuna posizione</SelectItem>
                {storageLocations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="storage_instructions">Istruzioni di conservazione</Label>
            <Textarea
              id="storage_instructions"
              value={formData.storage_instructions}
              onChange={(e) => handleInputChange('storage_instructions', e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="allergens">Allergeni</Label>
            <Input
              id="allergens"
              value={formData.allergens}
              onChange={(e) => handleInputChange('allergens', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salva Modifiche'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditLabelDialog;
