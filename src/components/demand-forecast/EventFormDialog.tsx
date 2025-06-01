
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarPlus, Edit } from 'lucide-react';
import { useEventCalendar, CalendarEvent } from '@/hooks/useEventCalendar';

interface EventFormDialogProps {
  event?: CalendarEvent;
  trigger?: React.ReactNode;
}

const EventFormDialog = ({ event, trigger }: EventFormDialogProps) => {
  const { createEvent, updateEvent } = useEventCalendar();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    event_type: '',
    date: '',
    start_time: '',
    end_time: '',
    location: '',
    expected_impact: '',
    impact_percentage: '',
    radius_km: '1.0',
    source: 'Manuale',
    is_recurring: false,
    recurrence_rule: ''
  });

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name || '',
        description: event.description || '',
        event_type: event.event_type || '',
        date: event.date || '',
        start_time: event.start_time || '',
        end_time: event.end_time || '',
        location: event.location || '',
        expected_impact: event.expected_impact || '',
        impact_percentage: event.impact_percentage?.toString() || '',
        radius_km: event.radius_km?.toString() || '1.0',
        source: event.source || 'Manuale',
        is_recurring: event.is_recurring || false,
        recurrence_rule: event.recurrence_rule || ''
      });
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const eventData = {
      name: formData.name,
      description: formData.description || undefined,
      event_type: formData.event_type,
      date: formData.date,
      start_date: formData.date && formData.start_time ? 
        new Date(`${formData.date}T${formData.start_time}`).toISOString() : undefined,
      end_date: formData.date && formData.end_time ? 
        new Date(`${formData.date}T${formData.end_time}`).toISOString() : undefined,
      start_time: formData.start_time || undefined,
      end_time: formData.end_time || undefined,
      location: formData.location || undefined,
      expected_impact: formData.expected_impact || undefined,
      impact_percentage: formData.impact_percentage ? parseInt(formData.impact_percentage) : undefined,
      radius_km: formData.radius_km ? parseFloat(formData.radius_km) : 1.0,
      source: formData.source,
      is_recurring: formData.is_recurring,
      recurrence_rule: formData.is_recurring ? formData.recurrence_rule : undefined
    };

    if (event) {
      updateEvent.mutate({ id: event.id, ...eventData }, {
        onSuccess: () => {
          setOpen(false);
        }
      });
    } else {
      createEvent.mutate(eventData, {
        onSuccess: () => {
          setOpen(false);
          setFormData({
            name: '',
            description: '',
            event_type: '',
            date: '',
            start_time: '',
            end_time: '',
            location: '',
            expected_impact: '',
            impact_percentage: '',
            radius_km: '1.0',
            source: 'Manuale',
            is_recurring: false,
            recurrence_rule: ''
          });
        }
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center space-x-2">
            {event ? <Edit className="w-4 h-4" /> : <CalendarPlus className="w-4 h-4" />}
            <span>{event ? 'Modifica Evento' : 'Nuovo Evento'}</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Modifica Evento' : 'Nuovo Evento'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="name">Nome Evento *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="es: Fiera del Tartufo"
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Maggiori dettagli sull'evento..."
                rows={3}
              />
            </div>

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
                  <SelectItem value="cultural">Culturale</SelectItem>
                  <SelectItem value="holiday">Festività</SelectItem>
                  <SelectItem value="promotion">Promozione Interna</SelectItem>
                  <SelectItem value="private">Evento Privato</SelectItem>
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

            <div>
              <Label htmlFor="location">Luogo</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="es: Piazza del Comune"
              />
            </div>

            <div>
              <Label htmlFor="expected_impact">Impatto Previsto</Label>
              <Select value={formData.expected_impact} onValueChange={(value) => setFormData({...formData, expected_impact: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona impatto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Alto</SelectItem>
                  <SelectItem value="medium">Medio</SelectItem>
                  <SelectItem value="low">Basso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="impact_percentage">% Impatto Stimato</Label>
              <Input
                id="impact_percentage"
                type="number"
                min="0"
                max="200"
                value={formData.impact_percentage}
                onChange={(e) => setFormData({...formData, impact_percentage: e.target.value})}
                placeholder="15"
              />
            </div>

            <div>
              <Label htmlFor="radius_km">Distanza (km)</Label>
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

            <div>
              <Label htmlFor="source">Fonte</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData({...formData, source: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manuale">Manuale</SelectItem>
                  <SelectItem value="API Google">API Google</SelectItem>
                  <SelectItem value="Sito Comune">Sito Comune</SelectItem>
                  <SelectItem value="Social Media">Social Media</SelectItem>
                  <SelectItem value="Altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) => setFormData({...formData, is_recurring: !!checked})}
                />
                <Label htmlFor="is_recurring">Evento Ricorrente</Label>
              </div>

              {formData.is_recurring && (
                <div>
                  <Label htmlFor="recurrence_rule">Regola Ricorrenza</Label>
                  <Select value={formData.recurrence_rule} onValueChange={(value) => setFormData({...formData, recurrence_rule: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona frequenza" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FREQ=WEEKLY">Ogni Settimana</SelectItem>
                      <SelectItem value="FREQ=MONTHLY">Ogni Mese</SelectItem>
                      <SelectItem value="FREQ=YEARLY">Ogni Anno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending}>
              {createEvent.isPending || updateEvent.isPending ? 'Salvando...' : 'Salva'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EventFormDialog;
