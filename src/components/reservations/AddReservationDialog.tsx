
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/use-toast';

interface AddReservationDialogProps {
  onReservationAdded: () => void;
}

const AddReservationDialog: React.FC<AddReservationDialogProps> = ({ onReservationAdded }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    number_of_guests: 2,
    time: '19:00',
    booking_type: '',
    customer_notes: '',
    internal_notes: '',
  });

  const { restaurantId } = useRestaurant();
  const { toast } = useToast();

  const timeSlots = [
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    setLoading(true);
    try {
      const reservationDateTime = new Date(selectedDate);
      const [hours, minutes] = formData.time.split(':');
      reservationDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { error } = await supabase.from('reservations').insert({
        restaurant_id: restaurantId,
        customer_name: formData.customer_name,
        customer_email: formData.customer_email || null,
        customer_phone: formData.customer_phone || null,
        number_of_guests: formData.number_of_guests,
        reservation_time: reservationDateTime.toISOString(),
        booking_type: formData.booking_type || null,
        customer_notes: formData.customer_notes || null,
        internal_notes: formData.internal_notes || null,
        status: 'nuova',
        calculated_score: 0,
        social_score: 0,
      });

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Prenotazione aggiunta con successo"
      });

      // Reset form
      setFormData({
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        number_of_guests: 2,
        time: '19:00',
        booking_type: '',
        customer_notes: '',
        internal_notes: '',
      });
      setSelectedDate(new Date());
      setOpen(false);
      onReservationAdded();
    } catch (err) {
      console.error('Error adding reservation:', err);
      toast({
        title: "Errore",
        description: "Impossibile aggiungere la prenotazione",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Nuova Prenotazione
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aggiungi Nuova Prenotazione</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customer_name">Nome Cliente *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                required
              />
            </div>

            {/* Number of Guests */}
            <div className="space-y-2">
              <Label htmlFor="number_of_guests">Numero Ospiti *</Label>
              <Input
                id="number_of_guests"
                type="number"
                min="1"
                max="20"
                value={formData.number_of_guests}
                onChange={(e) => setFormData({ ...formData, number_of_guests: parseInt(e.target.value) })}
                required
              />
            </div>

            {/* Customer Email */}
            <div className="space-y-2">
              <Label htmlFor="customer_email">Email Cliente</Label>
              <Input
                id="customer_email"
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
              />
            </div>

            {/* Customer Phone */}
            <div className="space-y-2">
              <Label htmlFor="customer_phone">Telefono Cliente</Label>
              <Input
                id="customer_phone"
                type="tel"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Data Prenotazione *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: it }) : <span>Seleziona data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label>Orario *</Label>
              <Select value={formData.time} onValueChange={(value) => setFormData({ ...formData, time: value })}>
                <SelectTrigger>
                  <Clock className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Seleziona orario" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Booking Type */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="booking_type">Tipo Prenotazione</Label>
              <Input
                id="booking_type"
                placeholder="es. Terrazza, Sala Interna, Menu Degustazione..."
                value={formData.booking_type}
                onChange={(e) => setFormData({ ...formData, booking_type: e.target.value })}
              />
            </div>

            {/* Customer Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="customer_notes">Note Cliente</Label>
              <Textarea
                id="customer_notes"
                placeholder="Allergie, richieste speciali..."
                value={formData.customer_notes}
                onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Internal Notes */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="internal_notes">Note Interne</Label>
              <Textarea
                id="internal_notes"
                placeholder="Note per lo staff..."
                value={formData.internal_notes}
                onChange={(e) => setFormData({ ...formData, internal_notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Aggiungendo...' : 'Aggiungi Prenotazione'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddReservationDialog;
