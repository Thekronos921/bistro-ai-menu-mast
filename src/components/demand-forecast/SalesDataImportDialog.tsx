
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Calendar } from 'lucide-react';
import { useDemandForecast } from '@/hooks/useDemandForecast';

const SalesDataImportDialog = () => {
  const { createSalesData } = useDemandForecast();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    covers_total: '',
    covers_lunch: '',
    covers_dinner: '',
    revenue_total: '',
    revenue_lunch: '',
    revenue_dinner: '',
    weather_condition: '',
    temperature: '',
    is_holiday: false,
    special_events: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const salesData = {
      date: formData.date,
      day_of_week: new Date(formData.date).getDay() + 1, // Convert to 1-7 format
      covers_total: parseInt(formData.covers_total) || 0,
      covers_lunch: formData.covers_lunch ? parseInt(formData.covers_lunch) : undefined,
      covers_dinner: formData.covers_dinner ? parseInt(formData.covers_dinner) : undefined,
      revenue_total: formData.revenue_total ? parseFloat(formData.revenue_total) : undefined,
      revenue_lunch: formData.revenue_lunch ? parseFloat(formData.revenue_lunch) : undefined,
      revenue_dinner: formData.revenue_dinner ? parseFloat(formData.revenue_dinner) : undefined,
      weather_condition: formData.weather_condition || undefined,
      temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
      is_holiday: formData.is_holiday,
      special_events: formData.special_events ? formData.special_events.split(',').map(e => e.trim()) : undefined,
      notes: formData.notes || undefined
    };

    createSalesData.mutate(salesData, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          date: '',
          covers_total: '',
          covers_lunch: '',
          covers_dinner: '',
          revenue_total: '',
          revenue_lunch: '',
          revenue_dinner: '',
          weather_condition: '',
          temperature: '',
          is_holiday: false,
          special_events: '',
          notes: ''
        });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Upload className="w-4 h-4" />
          <span>Importa Dati Vendita</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importa Dati di Vendita</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
              <Label htmlFor="covers_total">Coperti Totali *</Label>
              <Input
                id="covers_total"
                type="number"
                value={formData.covers_total}
                onChange={(e) => setFormData({...formData, covers_total: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="covers_lunch">Coperti Pranzo</Label>
              <Input
                id="covers_lunch"
                type="number"
                value={formData.covers_lunch}
                onChange={(e) => setFormData({...formData, covers_lunch: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="covers_dinner">Coperti Cena</Label>
              <Input
                id="covers_dinner"
                type="number"
                value={formData.covers_dinner}
                onChange={(e) => setFormData({...formData, covers_dinner: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="revenue_total">Ricavo Totale €</Label>
              <Input
                id="revenue_total"
                type="number"
                step="0.01"
                value={formData.revenue_total}
                onChange={(e) => setFormData({...formData, revenue_total: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="revenue_lunch">Ricavo Pranzo €</Label>
              <Input
                id="revenue_lunch"
                type="number"
                step="0.01"
                value={formData.revenue_lunch}
                onChange={(e) => setFormData({...formData, revenue_lunch: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="revenue_dinner">Ricavo Cena €</Label>
              <Input
                id="revenue_dinner"
                type="number"
                step="0.01"
                value={formData.revenue_dinner}
                onChange={(e) => setFormData({...formData, revenue_dinner: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weather_condition">Condizioni Meteo</Label>
              <Select value={formData.weather_condition} onValueChange={(value) => setFormData({...formData, weather_condition: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona condizioni meteo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunny">Soleggiato</SelectItem>
                  <SelectItem value="cloudy">Nuvoloso</SelectItem>
                  <SelectItem value="rainy">Pioggia</SelectItem>
                  <SelectItem value="stormy">Temporale</SelectItem>
                  <SelectItem value="snowy">Neve</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="temperature">Temperatura °C</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => setFormData({...formData, temperature: e.target.value})}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="special_events">Eventi Speciali (separati da virgola)</Label>
            <Input
              id="special_events"
              value={formData.special_events}
              onChange={(e) => setFormData({...formData, special_events: e.target.value})}
              placeholder="es: Concerto, Fiera del libro, Partita di calcio"
            />
          </div>

          <div>
            <Label htmlFor="notes">Note</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Note aggiuntive..."
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_holiday"
              checked={formData.is_holiday}
              onChange={(e) => setFormData({...formData, is_holiday: e.target.checked})}
            />
            <Label htmlFor="is_holiday">Giorno festivo</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={createSalesData.isPending}>
              {createSalesData.isPending ? 'Salvando...' : 'Salva'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SalesDataImportDialog;
