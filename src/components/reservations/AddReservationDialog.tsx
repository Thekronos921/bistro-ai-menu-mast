
import React, { useState, useEffect, useCallback } from 'react';
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
import { useRestaurantShifts, RestaurantShift } from '@/hooks/useRestaurantShifts';
import { useShiftAvailability, ShiftAvailability } from '@/hooks/useShiftAvailability';
import { getDay } from 'date-fns'; // Removed 'parse' and 'isValid' as they are not used in the new logic

interface AddReservationDialogProps {
  onReservationAdded: () => void;
}

const AddReservationDialog: React.FC<AddReservationDialogProps> = ({ onReservationAdded }) => {
  const { restaurantId } = useRestaurant();
  const { shifts, loading: shiftsLoading, fetchShifts: refetchShifts } = useRestaurantShifts(restaurantId);
  const {
    availability: shiftAvailabilityData,
    loading: availabilityLoading,
    fetchAvailability,
  } = useShiftAvailability(restaurantId);

  const [selectedShiftInternal, setSelectedShiftInternal] = useState<RestaurantShift | null>(null);
  const [currentShiftAvailability, setCurrentShiftAvailability] = useState<ShiftAvailability | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
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

  const { toast } = useToast();

  // Rimosso timeSlots statico, verrà generato dinamicamente

  useEffect(() => {
    if (restaurantId) {
      refetchShifts(); // Carica i turni quando il componente monta o restaurantId cambia
    }
  }, [restaurantId, refetchShifts]);

  const activeShiftsForSelectedDate = useCallback(() => {
    if (!selectedDate || shifts.length === 0) return [];
    const dayOfWeek = getDay(selectedDate);
    return shifts.filter(shift => shift.days_active.includes(dayOfWeek));
  }, [selectedDate, shifts]);

  const generateTimeSlotsForShift = useCallback((shift: RestaurantShift) => {
    if (!selectedDate) return [];
    const slots: { value: string; label: string }[] = [];
    const [startHours, startMinutes] = shift.start_time.split(':').map(Number);
    const [endHours, endMinutes] = shift.end_time.split(':').map(Number);

    let currentTime = new Date(selectedDate);
    currentTime.setHours(startHours, startMinutes, 0, 0);

    let endTimeLimit = new Date(selectedDate);
    endTimeLimit.setHours(endHours, endMinutes, 0, 0);
    // Se l'ora di fine è prima o uguale all'ora di inizio, si assume che il turno finisca il giorno dopo (non gestito qui per semplicità)
    // Per le prenotazioni, di solito i turni sono nello stesso giorno.
    // Questa logica assume che end_time sia sempre maggiore di start_time nello stesso giorno.

    while (currentTime < endTimeLimit) {
      const timeString = format(currentTime, 'HH:mm');
      slots.push({ value: timeString, label: timeString });
      currentTime.setMinutes(currentTime.getMinutes() + 30); // Intervalli di 30 minuti
    }
    return slots;
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate || !formData.time || !selectedShiftInternal || !restaurantId) {
      setCurrentShiftAvailability(null);
      setAvailabilityError(null);
      return;
    }

    setAvailabilityError(null);
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    
    // Usiamo una funzione asincrona interna per gestire il caricamento della disponibilità
    const loadAvailability = async () => {
      await fetchAvailability(selectedShiftInternal.id!, dateString, dateString);
      // Dopo che fetchAvailability ha aggiornato shiftAvailabilityData, cerchiamo il record specifico
      // Nota: shiftAvailabilityData potrebbe non essere immediatamente aggiornato qui a causa della natura asincrona di setState
      // È più sicuro fare affidamento sul prossimo ciclo di rendering o passare i dati direttamente se fetchAvailability li restituisce
    };

    loadAvailability();

  }, [selectedDate, formData.time, selectedShiftInternal, restaurantId, fetchAvailability]);

  // Questo useEffect reagisce all'aggiornamento di shiftAvailabilityData
  useEffect(() => {
    if (!selectedDate || !selectedShiftInternal) {
        setCurrentShiftAvailability(null);
        setAvailabilityError(null);
        return;
    }
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const specificAvailability = shiftAvailabilityData.find(
        (sa) => sa.availability_date === dateString && sa.shift_id === selectedShiftInternal.id
    );

    setCurrentShiftAvailability(specificAvailability || null);
    if (!specificAvailability) {
        setAvailabilityError('Nessuna disponibilità definita per questo turno/data.');
    } else if (specificAvailability.available_seats !== undefined && specificAvailability.available_seats < formData.number_of_guests) {
        setAvailabilityError(`Posti insufficienti. Disponibili: ${specificAvailability.available_seats}`);
    } else {
        setAvailabilityError(null);
    }
  }, [shiftAvailabilityData, selectedDate, selectedShiftInternal, formData.number_of_guests]);


  const handleShiftChange = (shiftId: string) => {
    const newSelectedShift = shifts.find(s => s.id === shiftId) || null;
    setSelectedShiftInternal(newSelectedShift);
    // Resetta l'orario se il turno cambia, o imposta il primo orario disponibile per il nuovo turno
    if (newSelectedShift) {
        const slots = generateTimeSlotsForShift(newSelectedShift);
        if (slots.length > 0) {
            setFormData(prev => ({ ...prev, time: slots[0].value }));
        } else {
            setFormData(prev => ({ ...prev, time: '' })); // Nessun orario disponibile
        }
    } else {
        setFormData(prev => ({ ...prev, time: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) {
      toast({ title: "Errore", description: "ID Ristorante non trovato.", variant: "destructive" });
      return;
    }

    if (!selectedShiftInternal) {
      toast({ title: "Errore", description: "Nessun turno selezionato.", variant: "destructive" });
      return;
    }

    if (availabilityError) {
        toast({ title: "Errore di Disponibilità", description: availabilityError, variant: "destructive" });
        return;
    }

    if (!currentShiftAvailability || currentShiftAvailability.available_seats === undefined || currentShiftAvailability.available_seats < formData.number_of_guests) {
      toast({ 
        title: "Errore di Capacità", 
        description: `Non ci sono abbastanza posti disponibili per ${formData.number_of_guests} ospiti. Disponibili: ${currentShiftAvailability?.available_seats ?? 0}.`, 
        variant: "destructive" 
      });
      return;
    }

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
                    onSelect={(date) => {
                        setSelectedDate(date);
                        // Quando la data cambia, resetta il turno selezionato e l'orario
                        // perché i turni disponibili potrebbero cambiare.
                        setSelectedShiftInternal(null);
                        setFormData(prev => ({...prev, time: ''}));
                        setCurrentShiftAvailability(null);
                        setAvailabilityError(null);
                    }}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Disabilita date passate
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Shift Selection */}
            <div className="space-y-2">
              <Label>Turno *</Label>
              <Select
                onValueChange={handleShiftChange}
                value={selectedShiftInternal ? selectedShiftInternal.id : ''}
                disabled={shiftsLoading || activeShiftsForSelectedDate().length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={shiftsLoading ? "Caricamento turni..." : (activeShiftsForSelectedDate().length === 0 ? "Nessun turno per questa data" : "Seleziona un turno")} />
                </SelectTrigger>
                <SelectContent>
                  {shiftsLoading ? (
                    <SelectItem value="loading" disabled>Caricamento...</SelectItem>
                  ) : (
                    activeShiftsForSelectedDate().map(shift => (
                      <SelectItem key={shift.id} value={shift.id!}>
                        {shift.name} ({shift.start_time} - {shift.end_time})
                      </SelectItem>
                    ))
                  )}
                  {activeShiftsForSelectedDate().length === 0 && !shiftsLoading && (
                     <SelectItem value="no-shifts" disabled>Nessun turno disponibile</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label>Orario *</Label>
              <Select 
                value={formData.time} 
                onValueChange={(value) => setFormData({ ...formData, time: value })}
                disabled={!selectedShiftInternal || availabilityLoading}
              >
                <SelectTrigger>
                  <Clock className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={!selectedShiftInternal ? "Seleziona prima un turno" : (generateTimeSlotsForShift(selectedShiftInternal).length === 0 ? "Nessun orario per questo turno" : "Seleziona orario")} />
                </SelectTrigger>
                <SelectContent>
                  {selectedShiftInternal && generateTimeSlotsForShift(selectedShiftInternal).length > 0 ? (
                    generateTimeSlotsForShift(selectedShiftInternal).map(slot => (
                      <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>
                    ))
                  ) : (
                    <SelectItem value="disabled" disabled>
                      {!selectedShiftInternal ? "Seleziona un turno" : "Nessun orario disponibile"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {availabilityLoading && <p className="text-xs text-gray-500 pt-1">Verifica disponibilità...</p>}
              {availabilityError && <p className="text-xs text-red-500 pt-1">{availabilityError}</p>}
              {currentShiftAvailability && currentShiftAvailability.available_seats !== undefined && !availabilityError && (
                <p className="text-xs text-green-600 pt-1">
                  Posti disponibili per questo orario: {currentShiftAvailability.available_seats}
                </p>
              )}
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
