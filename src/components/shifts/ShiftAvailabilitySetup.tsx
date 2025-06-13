// src/components/shifts/ShiftAvailabilitySetup.tsx
import React, { useState, useEffect } from 'react';
import { useRestaurantShifts, RestaurantShift } from '../../hooks/useRestaurantShifts';
import { useShiftAvailability } from '../../hooks/useShiftAvailability';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'; // Assumendo Select sia in ui
import { Calendar } from '../ui/calendar'; // Assumendo Calendar sia in ui
import { useToast } from '../../hooks/use-toast';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { it } from 'date-fns/locale'; // Per la localizzazione italiana del calendario

interface ShiftAvailabilitySetupProps {
  restaurantId: string | undefined;
}

const ShiftAvailabilitySetup: React.FC<ShiftAvailabilitySetupProps> = ({ restaurantId }) => {
  const { shifts, loading: shiftsLoading } = useRestaurantShifts(restaurantId);
  const { 
    availability, 
    loading: availabilityLoading, 
    fetchAvailability, 
    setTotalSeatsForPeriod 
  } = useShiftAvailability(restaurantId);
  const { toast } = useToast();

  const [selectedShiftId, setSelectedShiftId] = useState<string | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [totalSeatsInput, setTotalSeatsInput] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(startOfWeek(new Date(), { locale: it, weekStartsOn: 1 }));
  const [endDate, setEndDate] = useState<Date>(endOfWeek(new Date(), { locale: it, weekStartsOn: 1 }));
  const [daysOfWeekToApply, setDaysOfWeekToApply] = useState<number[]>([]); // 0=Dom, 1=Lun ...

  const selectedShiftDetails = shifts.find(s => s.id === selectedShiftId);

  useEffect(() => {
    if (selectedShiftId && selectedDate) {
        // Potremmo voler caricare la disponibilità esistente quando si seleziona un turno/data
        // fetchAvailability(selectedShiftId, format(selectedDate, 'yyyy-MM-dd'), format(selectedDate, 'yyyy-MM-dd'));
        // Per ora, ci concentriamo sull'impostazione.
    }
  }, [selectedShiftId, selectedDate, fetchAvailability]);
  
  useEffect(() => {
    if (selectedShiftDetails) {
        setDaysOfWeekToApply(selectedShiftDetails.days_active || []);
    } else {
        setDaysOfWeekToApply([]);
    }
  }, [selectedShiftDetails]);

  const handleSetCapacityForPeriod = async () => {
    if (!restaurantId || !selectedShiftId || !totalSeatsInput || daysOfWeekToApply.length === 0) {
      toast({
        title: 'Dati mancanti',
        description: 'Seleziona un turno, inserisci il numero di posti e i giorni della settimana.',
        variant: 'destructive',
      });
      return;
    }
    const seats = parseInt(totalSeatsInput, 10);
    if (isNaN(seats) || seats < 0) {
      toast({ title: 'Errore', description: 'Numero di posti non valido.', variant: 'destructive' });
      return;
    }

    const success = await setTotalSeatsForPeriod(
        selectedShiftId,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd'),
        seats,
        daysOfWeekToApply
    );

    if (success) {
      setTotalSeatsInput('');
      // Opzionale: ricaricare la disponibilità per vedere i cambiamenti
      // fetchAvailability(selectedShiftId, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'));
    }
  };
  
  const handleDayOfWeekToggle = (day: number) => {
    setDaysOfWeekToApply(prev => 
        prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const weekDays = [
    { label: 'Lun', value: 1 }, { label: 'Mar', value: 2 }, { label: 'Mer', value: 3 }, 
    { label: 'Gio', value: 4 }, { label: 'Ven', value: 5 }, { label: 'Sab', value: 6 }, 
    { label: 'Dom', value: 0 }
  ];

  if (shiftsLoading) return <p>Caricamento turni...</p>;

  return (
    <div className="space-y-6 p-4 border rounded-md mt-6">
      <h3 className="text-lg font-medium">Imposta Capacità per Periodo</h3>
      
      <div>
        <Label htmlFor="shift-select">Seleziona Turno</Label>
        <Select onValueChange={setSelectedShiftId} value={selectedShiftId}>
          <SelectTrigger id="shift-select">
            <SelectValue placeholder="Scegli un turno..." />
          </SelectTrigger>
          <SelectContent>
            {shifts.map(shift => (
              <SelectItem key={shift.id} value={shift.id!}>
                {shift.shift_name} ({shift.start_time.substring(0,5)} - {shift.end_time.substring(0,5)})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedShiftId && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
                <Label>Periodo di Applicazione</Label>
                <div className="flex items-center gap-2 mt-1">
                    <Input 
                        type="date" 
                        value={format(startDate, 'yyyy-MM-dd')} 
                        onChange={e => setStartDate(new Date(e.target.value))} 
                    />
                    <span>-</span>
                    <Input 
                        type="date" 
                        value={format(endDate, 'yyyy-MM-dd')} 
                        onChange={e => setEndDate(new Date(e.target.value))} 
                    />
                </div>
            </div>
            <div>
                <Label htmlFor="total-seats-period">Numero Totale Posti per Turno nel Periodo</Label>
                <Input 
                    id="total-seats-period" 
                    type="number" 
                    min="0" 
                    value={totalSeatsInput} 
                    onChange={(e) => setTotalSeatsInput(e.target.value)} 
                    placeholder="Es. 50"
                    className="mt-1"
                />
            </div>
          </div>
          
          <div>
            <Label>Applica ai seguenti giorni della settimana (del turno selezionato):</Label>
            <div className="flex flex-wrap gap-2 mt-1">
                {weekDays.map(day => (
                    <Button 
                        key={day.value} 
                        variant={daysOfWeekToApply.includes(day.value) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleDayOfWeekToggle(day.value)}
                        disabled={selectedShiftDetails && !selectedShiftDetails.days_active.includes(day.value)}
                    >
                        {day.label}
                    </Button>
                ))}
            </div>
            {selectedShiftDetails && <p className="text-xs text-gray-500 mt-1">I giorni disabilitati non sono attivi per il turno '{selectedShiftDetails.shift_name}'.</p>}
          </div>

          <Button onClick={handleSetCapacityForPeriod} disabled={availabilityLoading || !selectedShiftId || !totalSeatsInput || daysOfWeekToApply.length === 0}>
            {availabilityLoading ? 'Impostazione...' : 'Imposta Capacità per Periodo Selezionato'}
          </Button>
        </>
      )}

      {/* TODO: Visualizzazione della disponibilità esistente, magari con un calendario più interattivo */}
    </div>
  );
};

export default ShiftAvailabilitySetup;