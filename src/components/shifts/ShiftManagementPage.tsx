// src/components/shifts/ShiftManagementPage.tsx
import React, { useState, useEffect } from 'react';
import ShiftList from './ShiftList';
import ShiftForm from './ShiftForm';
import ShiftAvailabilitySetup from './ShiftAvailabilitySetup';
import { Button } from '../ui/button';
import { RestaurantShift } from '../../hooks/useRestaurantShifts';
import { useAuth } from '../../contexts/AuthContext'; // Per ottenere userProfile
// Rimuovi l'import di supabase client se non più usato direttamente qui
// import { supabase } from '@/integrations/supabase/client'; 

const ShiftManagementPage: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<RestaurantShift | null>(null);
  // currentRestaurantId ora verrà da userProfile
  const { user, userProfile, loading: authLoading } = useAuth(); 
  const currentRestaurantId = userProfile?.restaurant?.id;

  // L'useEffect per fetchRestaurantId non è più necessario se usiamo userProfile.restaurant.id
  /*
  useEffect(() => {
    const fetchRestaurantId = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('restaurants') 
          .select('id')
          .eq('user_id', user.id) 
          .single();
        
        if (error) {
          console.error('Error fetching restaurant ID:', error);
        } else if (data) {
          setCurrentRestaurantId(data.id);
        }
      }
    };

    fetchRestaurantId();
  }, [user]);
  */

  const handleOpenForm = (shift: RestaurantShift | null = null) => {
    setEditingShift(shift);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingShift(null);
  };

  const handleShiftSaved = (shift: RestaurantShift) => {
    console.log('Shift saved:', shift);
    // Potresti voler ricaricare i turni qui se ShiftList non si aggiorna automaticamente
  };

  if (authLoading) {
    return <p>Caricamento dati utente...</p>;
  }

  if (!user) {
    return <p>Effettua il login per gestire i turni.</p>;
  }

  // Se l'utente è loggato ma non c'è un ID ristorante (es. setup non completato)
  if (user && !currentRestaurantId) {
    // PostRegistrationSetup dovrebbe gestire questo caso a livello di route
    // Ma qui possiamo mostrare un messaggio specifico se si arriva comunque
    return <p>Configurazione del ristorante non completata. Completa il setup del tuo profilo.</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Gestione Turni e Disponibilità</h1>
      
      <section className="mb-10 p-6 bg-white shadow-md rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Definizione Turni</h2>
          <Button onClick={() => handleOpenForm()} disabled={!currentRestaurantId}>
            Aggiungi Turno
          </Button>
        </div>
        <p className="text-sm text-gray-600 mb-4">Aggiungi, modifica o elimina i turni del ristorante (es. Pranzo, Cena).</p>
        {currentRestaurantId ? (
          <ShiftList restaurantId={currentRestaurantId} onEditShift={handleOpenForm} />
        ) : (
          // Questo messaggio ora dovrebbe apparire meno frequentemente se la logica sopra funziona
          <p className="text-gray-500">Caricamento dati ristorante o configurazione mancante...</p>
        )}
      </section>

      {isFormOpen && currentRestaurantId && (
        <ShiftForm 
          restaurantId={currentRestaurantId} 
          isOpen={isFormOpen} 
          onClose={handleCloseForm} 
          onShiftSaved={handleShiftSaved} 
          editingShift={editingShift} 
        />
      )}

      <section className="mt-10 p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Impostazione Capacità per Turno</h2>
        <p className="text-sm text-gray-600 mb-4">Definisci la capacità massima (numero totale di coperti) per ciascun turno in date specifiche o periodi.</p>
        {currentRestaurantId ? (
          <ShiftAvailabilitySetup restaurantId={currentRestaurantId} />
        ) : (
          <p className="text-gray-500">Caricamento dati ristorante o configurazione mancante...</p>
        )}
      </section>
    </div>
  );
};

export default ShiftManagementPage;