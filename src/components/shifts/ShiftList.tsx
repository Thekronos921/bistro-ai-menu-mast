// src/components/shifts/ShiftList.tsx
import React from 'react';
import { RestaurantShift, useRestaurantShifts } from '../../hooks/useRestaurantShifts';
import { Button } from '../ui/button'; // Assumendo che Button sia in ui
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table'; // Assumendo Table sia in ui
import { useToast } from '../../hooks/use-toast';

interface ShiftListProps {
  restaurantId: string | undefined;
  onEditShift: (shift: RestaurantShift) => void;
  // Potremmo aggiungere qui una prop per forzare il refresh se necessario
}

const daysOfWeekMap: { [key: number]: string } = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mer',
  4: 'Gio',
  5: 'Ven',
  6: 'Sab',
};

const formatDaysActive = (days: number[] | null | undefined): string => {
  if (!days || days.length === 0) return 'Nessuno';
  if (days.length === 7 && days.every((val, idx) => val === idx)) return 'Tutti i giorni';
  return days.map(day => daysOfWeekMap[day] || `Giorno ${day}`).join(', ');
};

const ShiftList: React.FC<ShiftListProps> = ({ restaurantId, onEditShift }) => {
  const { shifts, loading, deleteShift, fetchShifts } = useRestaurantShifts(restaurantId);
  const { toast } = useToast();

  const handleDelete = async (shiftId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo turno?')) {
      const success = await deleteShift(shiftId);
      if (success) {
        // Lo stato dei turni viene già aggiornato nell'hook useRestaurantShifts
      } else {
        toast({
          title: 'Errore',
          description: 'Impossibile eliminare il turno. Potrebbe essere associato a dati di disponibilità.',
          variant: 'destructive',
        });
      }
    }
  };

  if (loading && shifts.length === 0) return <p>Caricamento turni...</p>;
  if (!restaurantId) return <p>Seleziona un ristorante per vedere i turni.</p>;
  if (shifts.length === 0 && !loading) return <p>Nessun turno configurato per questo ristorante.</p>;

  return (
    <div className="mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome Turno</TableHead>
            <TableHead>Ora Inizio</TableHead>
            <TableHead>Ora Fine</TableHead>
            <TableHead>Giorni Attivi</TableHead>
            <TableHead>Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shifts.map((shift) => (
            <TableRow key={shift.id}>
              <TableCell>{shift.shift_name}</TableCell>
              <TableCell>{shift.start_time}</TableCell>
              <TableCell>{shift.end_time}</TableCell>
              <TableCell>{formatDaysActive(shift.days_active)}</TableCell>
              <TableCell>
                <Button variant="outline" size="sm" onClick={() => onEditShift(shift)} className="mr-2">
                  Modifica
                </Button>
                <Button variant="destructive" size="sm" onClick={() => shift.id && handleDelete(shift.id)}>
                  Elimina
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ShiftList;