
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TableAvailability, TimeSlotAvailability } from '@/types/reservation';
import { format, addMinutes, startOfDay, endOfDay } from 'date-fns';

export const useTableAvailability = (restaurantId?: string) => {
  const [availability, setAvailability] = useState<TableAvailability[]>([]);
  const [loading, setLoading] = useState(false);

  const checkTableAvailability = useCallback(async (tableId: string, date: string, duration = 120) => {
    if (!restaurantId) return [];

    try {
      const selectedDate = new Date(date);
      const startTime = startOfDay(selectedDate);
      const endTime = endOfDay(selectedDate);

      // Recupera tutte le prenotazioni approvate per quel tavolo in quella data
      const { data: reservations, error } = await supabase
        .from('reservations')
        .select('id, customer_name, reservation_time, number_of_guests')
        .eq('restaurant_id', restaurantId)
        .eq('table_id', tableId)
        .gte('reservation_time', startTime.toISOString())
        .lte('reservation_time', endTime.toISOString())
        .in('status', ['approvata', 'approvata_manualmente', 'approvata_automaticamente'])
        .order('reservation_time');

      if (error) throw error;

      // Genera slot temporali ogni 30 minuti dalle 12:00 alle 23:30
      const timeSlots: TimeSlotAvailability[] = [];
      let currentTime = new Date(selectedDate);
      currentTime.setHours(12, 0, 0, 0);
      
      const endOfService = new Date(selectedDate);
      endOfService.setHours(23, 30, 0, 0);

      while (currentTime <= endOfService) {
        const timeString = format(currentTime, 'HH:mm');
        
        // Controlla se questo slot è occupato
        const conflictingReservation = reservations?.find(reservation => {
          const reservationTime = new Date(reservation.reservation_time);
          const reservationEnd = addMinutes(reservationTime, duration);
          const slotEnd = addMinutes(currentTime, duration);
          
          // Verifica sovrapposizione
          return (
            (currentTime >= reservationTime && currentTime < reservationEnd) ||
            (slotEnd > reservationTime && slotEnd <= reservationEnd) ||
            (currentTime <= reservationTime && slotEnd >= reservationEnd)
          );
        });

        timeSlots.push({
          time: timeString,
          is_available: !conflictingReservation,
          reservation_id: conflictingReservation?.id,
          customer_name: conflictingReservation?.customer_name
        });

        currentTime = addMinutes(currentTime, 30);
      }

      return timeSlots;
    } catch (err) {
      console.error('Error checking table availability:', err);
      return [];
    }
  }, [restaurantId]);

  const fetchTableAvailability = useCallback(async (tableIds: string[], date: string) => {
    if (!restaurantId || tableIds.length === 0) return;

    setLoading(true);
    try {
      const availabilityPromises = tableIds.map(async (tableId) => {
        const timeSlots = await checkTableAvailability(tableId, date);
        return {
          table_id: tableId,
          date,
          time_slots: timeSlots
        };
      });

      const results = await Promise.all(availabilityPromises);
      setAvailability(results);
    } catch (err) {
      console.error('Error fetching table availability:', err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId, checkTableAvailability]);

  const isTableAvailable = (tableId: string, time: string, date: string, duration = 120) => {
    const tableAvailability = availability.find(a => a.table_id === tableId && a.date === date);
    if (!tableAvailability) return false;

    const timeSlot = tableAvailability.time_slots.find(slot => slot.time === time);
    return timeSlot?.is_available || false;
  };

  const suggestBestTable = (tables: any[], guests: number, time: string, date: string) => {
    // Filtra tavoli disponibili con capienza adeguata
    const availableTables = tables.filter(table => {
      const isAvailable = isTableAvailable(table.id, time, date);
      const hasAdequateCapacity = !table.seats || table.seats >= guests;
      return isAvailable && hasAdequateCapacity;
    });

    if (availableTables.length === 0) return null;

    // Ordina per capienza ottimale (il più piccolo che può ospitare tutti)
    return availableTables.sort((a, b) => {
      const seatsA = a.seats || 999;
      const seatsB = b.seats || 999;
      return seatsA - seatsB;
    })[0];
  };

  return {
    availability,
    loading,
    checkTableAvailability,
    fetchTableAvailability,
    isTableAvailable,
    suggestBestTable
  };
};
