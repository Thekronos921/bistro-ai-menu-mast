// src/components/shifts/ShiftForm.tsx
import React, { useState, useEffect } from 'react';
import { RestaurantShift, useRestaurantShifts } from '../../hooks/useRestaurantShifts';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox'; // Assumendo Checkbox sia in ui
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '../ui/dialog'; // Assumendo Dialog sia in ui

interface ShiftFormProps {
  restaurantId: string | undefined;
  isOpen: boolean;
  onClose: () => void;
  onShiftSaved: (shift: RestaurantShift) => void; // Callback per notificare il salvataggio
  editingShift: RestaurantShift | null;
}

const allDays = [
  { id: 1, label: 'Lunedì' },
  { id: 2, label: 'Martedì' },
  { id: 3, label: 'Mercoledì' },
  { id: 4, label: 'Giovedì' },
  { id: 5, label: 'Venerdì' },
  { id: 6, label: 'Sabato' },
  { id: 0, label: 'Domenica' },
];

const ShiftForm: React.FC<ShiftFormProps> = ({ restaurantId, isOpen, onClose, onShiftSaved, editingShift }) => {
  const { addShift, updateShift, loading } = useRestaurantShifts(restaurantId);
  
  const [shiftName, setShiftName] = useState('');
  const [startTime, setStartTime] = useState(''); // HH:MM
  const [endTime, setEndTime] = useState('');   // HH:MM
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (editingShift) {
      setShiftName(editingShift.shift_name);
      setStartTime(editingShift.start_time.substring(0,5)); // Assumendo HH:MM:SS
      setEndTime(editingShift.end_time.substring(0,5));     // Assumendo HH:MM:SS
      setSelectedDays(editingShift.days_active || []);
    } else {
      // Reset form for new shift
      setShiftName('');
      setStartTime('');
      setEndTime('');
      setSelectedDays([]);
    }
    setErrors({}); // Reset errors when form opens or editingShift changes
  }, [editingShift, isOpen]);

  const handleDayChange = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    if (!shiftName.trim()) newErrors.shiftName = 'Il nome del turno è obbligatorio.';
    if (!startTime) newErrors.startTime = 'L\'ora di inizio è obbligatoria.';
    if (!endTime) newErrors.endTime = 'L\'ora di fine è obbligatoria.';
    if (startTime && endTime && startTime >= endTime) {
      newErrors.endTime = 'L\'ora di fine deve essere successiva all\'ora di inizio.';
    }
    // Potremmo aggiungere validazione per il formato dell'ora se necessario
    if (selectedDays.length === 0) newErrors.days = 'Selezionare almeno un giorno attivo.';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId || !validateForm()) return;

    const shiftData = {
      shift_name: shiftName,
      start_time: `${startTime}:00`, // Aggiunge secondi per formato TIME SQL
      end_time: `${endTime}:00`,     // Aggiunge secondi per formato TIME SQL
      days_active: selectedDays.sort((a,b) => a-b), // Ordina per consistenza
    };

    let savedShift: RestaurantShift | null = null;
    if (editingShift && editingShift.id) {
      savedShift = await updateShift(editingShift.id, shiftData);
    } else {
      // Per addShift, restaurant_id è gestito internamente dall'hook
      savedShift = await addShift(shiftData as Omit<RestaurantShift, 'id' | 'created_at' | 'updated_at' | 'restaurant_id'>);
    }

    if (savedShift) {
      onShiftSaved(savedShift);
      onClose(); // Chiude il dialog
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingShift ? 'Modifica Turno' : 'Aggiungi Nuovo Turno'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="shiftName">Nome Turno</Label>
            <Input id="shiftName" value={shiftName} onChange={(e) => setShiftName(e.target.value)} />
            {errors.shiftName && <p className="text-sm text-red-500">{errors.shiftName}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime">Ora Inizio (HH:MM)</Label>
              <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              {errors.startTime && <p className="text-sm text-red-500">{errors.startTime}</p>}
            </div>
            <div>
              <Label htmlFor="endTime">Ora Fine (HH:MM)</Label>
              <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              {errors.endTime && <p className="text-sm text-red-500">{errors.endTime}</p>}
            </div>
          </div>
          <div>
            <Label>Giorni Attivi</Label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">
              {allDays.map(day => (
                <div key={day.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`day-${day.id}`} 
                    checked={selectedDays.includes(day.id)} 
                    onCheckedChange={() => handleDayChange(day.id)}
                  />
                  <Label htmlFor={`day-${day.id}`} className="font-normal">{day.label}</Label>
                </div>
              ))}
            </div>
            {errors.days && <p className="text-sm text-red-500 mt-1">{errors.days}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Annulla</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? (editingShift ? 'Salvataggio...' : 'Aggiunta...') : (editingShift ? 'Salva Modifiche' : 'Aggiungi Turno')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ShiftForm;