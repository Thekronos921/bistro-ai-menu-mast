// src/hooks/useShiftAvailability.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client'; // Assicurati che il percorso sia corretto
import { useToast } from './use-toast'; // O il tuo sistema di notifiche preferito

export interface ShiftAvailability {
  id?: string;
  restaurant_id: string;
  shift_id: string;
  availability_date: string; // Formato YYYY-MM-DD
  total_seats: number;
  available_seats?: number; // Questo è gestito dal trigger, ma può essere utile leggerlo
  created_at?: string;
  updated_at?: string;
}

export const useShiftAvailability = (restaurantId: string | undefined) => {
  const [availability, setAvailability] = useState<ShiftAvailability[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Funzione per caricare la disponibilità per un dato turno (opzionale) e range di date
  const fetchAvailability = useCallback(async (shiftId: string | undefined, startDate: string, endDate: string) => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      let query = supabase
        .from('restaurant_shift_availability')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .gte('availability_date', startDate)
        .lte('availability_date', endDate)
        .order('availability_date', { ascending: true });

      if (shiftId) {
        query = query.eq('shift_id', shiftId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAvailability(data || []);
    } catch (error: any) {
      toast({
        title: 'Errore nel caricamento della disponibilità',
        description: error.message,
        variant: 'destructive',
      });
      setAvailability([]);
    }
    setLoading(false);
  }, [restaurantId, toast]);

  // Funzione per impostare/aggiornare total_seats per un turno in una data specifica
  // Questa funzione farà un UPSERT: aggiorna se esiste, altrimenti inserisce.
  const setTotalSeats = async (shiftId: string, availability_date: string, totalSeats: number) => {
    if (!restaurantId) {
      toast({
        title: 'Errore',
        description: 'ID Ristorante non specificato.',
        variant: 'destructive',
      });
      return null;
    }
    setLoading(true);
    try {
      // Prima controlla se esiste un record per restaurant_id, shift_id, date
      // Nota: available_seats viene inizializzato uguale a total_seats o gestito da trigger
      // Per semplicità, qui lo impostiamo uguale a total_seats, assumendo che il trigger
      // lo correggerà se ci sono già prenotazioni per quella data/turno.
      // Una logica più robusta potrebbe ricalcolare available_seats qui o fare affidamento
      // esclusivamente sul trigger per l'inizializzazione e gli aggiornamenti di available_seats.
      const availabilityRecord = {
        restaurant_id: restaurantId,
        shift_id: shiftId,
        availability_date: availability_date,
        total_seats: totalSeats,
        available_seats: totalSeats, // Inizializzazione base, il trigger potrebbe sovrascrivere
      };

      const { data, error } = await supabase
        .from('restaurant_shift_availability')
        .upsert(availabilityRecord, {
          onConflict: 'restaurant_id, shift_id, availability_date',
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Aggiorna lo stato locale o rifai il fetch per semplicità
        // Per ora, non aggiorniamo lo stato locale per evitare complessità,
        // si potrebbe voler rifare fetchAvailability se necessario dopo l'operazione.
        toast({
          title: 'Successo',
          description: `Capacità per il ${availability_date} aggiornata a ${totalSeats} posti.`,
      });
        return data;
      }
      return null;
    } catch (error: any) {
      toast({
        title: 'Errore nell\'impostazione della capacità',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Potrebbe essere utile una funzione per impostare total_seats per un periodo
  const setTotalSeatsForPeriod = async (shiftId: string, startDate: string, endDate: string, totalSeats: number, daysOfWeek: number[]) => {
    if (!restaurantId) {
      toast({ title: 'Errore', description: 'ID Ristorante non specificato.', variant: 'destructive' });
      return false;
    }
    setLoading(true);
    const recordsToUpsert: Omit<ShiftAvailability, 'id' | 'created_at' | 'updated_at' | 'available_seats'>[] = [];
    let currentDate = new Date(startDate);
    const lastDate = new Date(endDate);

    while(currentDate <= lastDate) {
      if (daysOfWeek.includes(currentDate.getDay())) {
        recordsToUpsert.push({
          restaurant_id: restaurantId,
          shift_id: shiftId,
          availability_date: currentDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
          total_seats: totalSeats,
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (recordsToUpsert.length === 0) {
      toast({ title: 'Info', description: 'Nessuna data corrispondente ai criteri per aggiornare la capacità.' });
      setLoading(false);
      return true; // Nessun errore, ma nessuna operazione eseguita
    }

    try {
      const { error } = await supabase
        .from('restaurant_shift_availability')
        .upsert(recordsToUpsert.map(r => ({...r, available_seats: r.total_seats})), { // available_seats inizializzato
          onConflict: 'restaurant_id, shift_id, availability_date',
        });

      if (error) throw error;

      toast({
        title: 'Successo',
        description: `Capacità aggiornata per il periodo selezionato.`,
      });
      // Potrebbe essere necessario un re-fetch dei dati di disponibilità
      return true;
    } catch (error: any) {
      toast({
        title: 'Errore nell\'impostazione della capacità per il periodo',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };


  return { availability, loading, fetchAvailability, setTotalSeats, setTotalSeatsForPeriod };
};