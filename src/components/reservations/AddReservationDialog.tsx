
import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Plus, Calendar, User, Users, Phone, Mail, MessageSquare, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useRestaurantTables } from '@/hooks/useRestaurantTables';
import { useTableAvailability } from '@/hooks/useTableAvailability';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import TableSelector from './TableSelector';

interface AddReservationDialogProps {
  onReservationAdded: () => void;
}

const AddReservationDialog: React.FC<AddReservationDialogProps> = ({ onReservationAdded }) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [numberOfGuests, setNumberOfGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('19:30');
  const [customerNotes, setCustomerNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [assignedTableId, setAssignedTableId] = useState<string | undefined>();

  // Hooks for tables and availability
  const { tables, rooms, loading: tablesLoading } = useRestaurantTables(restaurantId || '');
  const { availability, loading: availabilityLoading } = useTableAvailability(
    restaurantId || '', 
    format(selectedDate, 'yyyy-MM-dd'),
    selectedTime
  );

  const resetForm = () => {
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setNumberOfGuests(2);
    setSelectedDate(new Date());
    setSelectedTime('19:30');
    setCustomerNotes('');
    setInternalNotes('');
    setAssignedTableId(undefined);
  };

  const handleSave = async () => {
    if (!restaurantId) {
      toast({
        title: "Errore",
        description: "ID ristorante non trovato",
        variant: "destructive"
      });
      return;
    }

    if (!customerName.trim()) {
      toast({
        title: "Errore",
        description: "Il nome del cliente è obbligatorio",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const reservationDateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      reservationDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const newReservation = {
        restaurant_id: restaurantId,
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim() || null,
        customer_phone: customerPhone.trim() || null,
        number_of_guests: numberOfGuests,
        reservation_time: reservationDateTime.toISOString(),
        customer_notes: customerNotes.trim() || null,
        internal_notes: internalNotes.trim() || null,
        assigned_table_id: assignedTableId || null,
        status: 'nuova' as const,
        calculated_score: 0,
        social_score: 0
      };

      const { error } = await supabase
        .from('reservations')
        .insert([newReservation]);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Prenotazione creata con successo"
      });

      resetForm();
      setOpen(false);
      onReservationAdded();
    } catch (error) {
      console.error('Error creating reservation:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare la prenotazione",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const timeSlots = [
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuova Prenotazione
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aggiungi Nuova Prenotazione</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informazioni Cliente</h3>
            
            <div className="space-y-2">
              <Label htmlFor="customerName">Nome Cliente *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="customerName"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome completo"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerEmail">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="email@esempio.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerPhone">Telefono</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="customerPhone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+39 123 456 7890"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numberOfGuests">Numero Ospiti</Label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="numberOfGuests"
                  type="number"
                  min="1"
                  max="20"
                  value={numberOfGuests}
                  onChange={(e) => setNumberOfGuests(parseInt(e.target.value) || 1)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Reservation Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dettagli Prenotazione</h3>
            
            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: it }) : <span>Seleziona data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    disabled={(date) => date < new Date().setHours(0, 0, 0, 0)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Orario</Label>
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue />
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

            {/* Table Selection */}
            {!tablesLoading && !availabilityLoading && (
              <TableSelector
                availability={availability}
                rooms={rooms}
                selectedTableId={assignedTableId}
                onTableSelect={setAssignedTableId}
                guestCount={numberOfGuests}
              />
            )}
          </div>
        </div>

        {/* Notes Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerNotes">Note del Cliente</Label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Textarea
                id="customerNotes"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Note o richieste speciali del cliente..."
                className="pl-10 min-h-[80px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="internalNotes">Note Interne</Label>
            <Textarea
              id="internalNotes"
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              placeholder="Note per lo staff..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvataggio...' : 'Salva Prenotazione'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddReservationDialog;
