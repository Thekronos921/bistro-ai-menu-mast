
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus } from 'lucide-react';
import { useDemandForecast } from '@/hooks/useDemandForecast';

const LocalEventDialog = () => {
  const { createLocalEvent } = useDemandForecast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    event_type: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    expected_impact: '',
    impact_percentage: '',
    radius_km: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData = {
      name: formData.name,
      event_type: formData.event_type,
      date: formData.date,
      start_time: formData.start_time || undefined,
      end_time: formData.end_time || undefined,
      location: formData.location || undefined,
      expected_impact: formData.expected_impact || undefined,
      impact_percentage: formData.impact_percentage ? parseInt(formData.impact_percentage) : undefined,
      radius_km: formData.radius_km ? parseFloat(formData.radius_km) : 1.0
    };

    createLocalEvent.mutate(eventData, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          name: '',
          event_type: '',
          date: '',
          start_time: '',
          end_time: '',
          location: '',
          expected_impact: '',
          impact_percentage: '',
          radius_km: ''
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Aggiungi Evento</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Aggiungi Evento Locale</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome Evento *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="es: Concerto in piazza"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event_type">Tipo Evento *</Label>
              <Select value={formData.event_type} onValueChange={(value) => setFormData({...formData, event_type: value})} required>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concert">Concerto</SelectItem>
                  <SelectItem value="fair">Fiera</SelectItem>
                  <SelectItem value="festival">Festival</SelectItem>
                  <SelectItem value="sports">Evento Sportivo</SelectItem>
                  <SelectItem value="market">Mercato</SelectItem>
                  <SelectItem value="conference">Conferenza</SelectItem>
                  <SelectItem value="exhibition">Mostra</SelectItem>
                  <SelectItem value="other">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_time">Ora Inizio</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="end_time">Ora Fine</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Luogo</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="es: Piazza del Comune"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expected_impact">Impatto Previsto</Label>
              <Select value={formData.expected_impact} onValueChange={(value) => setFormData({...formData, expected_impact: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona impatto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alto (+30%)</SelectItem>
                  <SelectItem value="medium">Medio (+15%)</SelectItem>
                  <SelectItem value="low">Basso (+5%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="impact_percentage">% Impatto Stimato</Label>
              <Input
                id="impact_percentage"
                type="number"
                min="0"
                max="100"
                value={formData.impact_percentage}
                onChange={(e) => setFormData({...formData, impact_percentage: e.target.value})}
                placeholder="15"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="radius_km">Distanza dal Ristorante (km)</Label>
            <Input
              id="radius_km"
              type="number"
              step="0.1"
              min="0"
              value={formData.radius_km}
              onChange={(e) => setFormData({...formData, radius_km: e.target.value})}
              placeholder="1.0"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createLocalEvent.isPending}>
              {createLocalEvent.isPending ? 'Salvando...' : 'Salva'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LocalEventDialog;
