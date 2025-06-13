
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Users, CheckCircle, Clock, TrendingUp, Filter, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReservations } from '@/hooks/useReservations';
import { useShiftAvailability, ShiftAvailability } from '@/hooks/useShiftAvailability';
import { useRestaurant } from '@/hooks/useRestaurant'; // Aggiunto per restaurantId
import { Reservation, ReservationStatus, ReservationKPIs } from '@/types/reservation';
import ReservationTable from '@/components/reservations/ReservationTable';
import ReservationDetailModal from '@/components/reservations/ReservationDetailModal';
import AddReservationDialog from '@/components/reservations/AddReservationDialog';
import Header from '@/components/Header';

const Reservations = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const { restaurantId } = useRestaurant(); // Ottieni restaurantId

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const filterValue = statusFilter === 'all' ? undefined : statusFilter;
  
  const { reservations, loading: reservationsLoading, updateReservation, refetch: refetchReservations } = useReservations(dateString, filterValue);
  // Integra useShiftAvailability per tutti i turni della data selezionata
  // Nota: useShiftAvailability attualmente richiede shiftId. Modificheremo l'hook o la logica qui.
  // Per ora, assumiamo di voler caricare la disponibilità per tutti i turni attivi in quella data.
  // Questo richiederà prima di caricare i turni e poi la loro disponibilità.
  // Semplifichiamo per ora e assumiamo che l'hook possa essere adattato o che abbiamo un modo per ottenere tutti gli shiftId rilevanti.
  const { availability: allShiftsAvailability, loading: availabilityLoading, fetchAvailability } = useShiftAvailability(restaurantId);

  useEffect(() => {
    if (restaurantId && selectedDate) {
      // Idealmente, fetchAvailability dovrebbe poter prendere solo la data
      // e restituire la disponibilità di tutti i turni per quella data.
      // Oppure, dovremmo prima caricare i turni (useRestaurantShifts) e poi iterare.
      // Per questa implementazione, simuliamo il fetch per una data specifica.
      // Dovrai adattare fetchAvailability o la logica qui per caricare per tutti i turni.
      // Ad esempio, se fetchAvailability potesse prendere solo (startDate, endDate) senza shiftId:
      fetchAvailability(undefined, dateString, dateString); 
    }
  }, [restaurantId, selectedDate, fetchAvailability, dateString]);

  const calculateKPIs = (): ReservationKPIs & { totalCapacity?: number; availableCapacity?: number } => {
    const approvedGuests = reservations
      .filter(r => r.status === 'approvata')
      .reduce((sum, r) => sum + r.number_of_guests, 0);

    // Calcola la capacità totale e disponibile dalla disponibilità dei turni
    let totalCapacityToday = 0;
    let availableCapacityToday = 0;

    if (allShiftsAvailability && allShiftsAvailability.length > 0) {
      // Filtra la disponibilità per la data selezionata (se fetchAvailability restituisce più date)
      const todayAvailability = allShiftsAvailability.filter(sa => sa.availability_date === dateString);
      totalCapacityToday = todayAvailability.reduce((sum, sa) => sum + (sa.total_seats || 0), 0);
      // available_seats è già il numero di posti rimanenti
      availableCapacityToday = todayAvailability.reduce((sum, sa) => sum + (sa.available_seats || 0), 0);
    }

    return {
      totalReservations: reservations.length,
      totalGuests: reservations.reduce((sum, r) => sum + r.number_of_guests, 0),
      newReservations: reservations.filter(r => r.status === 'nuova').length,
      approvedReservations: reservations.filter(r => r.status === 'approvata').length,
      averageScore: reservations.length > 0 
        ? Math.round(reservations.reduce((sum, r) => sum + r.final_score, 0) / reservations.length)
        : 0,
      totalCapacity: totalCapacityToday,
      // availableCapacity calcolato sopra è già al netto delle prenotazioni approvate, grazie al trigger.
      // Se volessimo mostrare i posti disponibili *prima* delle prenotazioni del giorno, sarebbe totalCapacityToday.
      // Ma l'utente vuole vedere i posti *rimanenti*.
      availableCapacity: availableCapacityToday 
    };
  };

  const kpis = calculateKPIs();

  const handleReservationClick = (reservation: Reservation) => {
    setSelectedReservation(reservation);
  };

  const handleModalClose = () => {
    setSelectedReservation(null);
  };

  const handleReservationUpdated = (updatedReservation: Reservation) => {
    setSelectedReservation(null);
    refetchReservations(); // Aggiunto per aggiornare i dati dopo la modifica
    // Potrebbe essere necessario anche un refetch della disponibilità se l'aggiornamento impatta i posti
    if (restaurantId) fetchAvailability(undefined, dateString, dateString);
  };

  const handleReservationAdded = () => {
    refetchReservations();
    if (restaurantId) fetchAvailability(undefined, dateString, dateString);
  };
  
  const isLoading = reservationsLoading || availabilityLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header with Actions */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestione Prenotazioni</h1>
              <p className="text-gray-600 mt-1">Visualizza e gestisci le prenotazioni del tuo ristorante</p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  refetchReservations();
                  if (restaurantId) fetchAvailability(undefined, dateString, dateString);
                }}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                Aggiorna
              </Button>
              <AddReservationDialog onReservationAdded={handleReservationAdded} />
            </div>
          </div>

          {/* Filters Section */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Filter className="h-4 w-4" />
                  Filtri:
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full sm:w-[280px] justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP", { locale: it }) : <span>Seleziona data</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => date && setSelectedDate(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stato
                    </label>
                    <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as ReservationStatus | 'all')}>
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Filtra per stato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti gli stati</SelectItem>
                        <SelectItem value="nuova">Nuova</SelectItem>
                        <SelectItem value="approvata">Approvata</SelectItem>
                        <SelectItem value="in_attesa">In Attesa</SelectItem>
                        <SelectItem value="rifiutata">Rifiutata</SelectItem>
                        <SelectItem value="completata">Completata</SelectItem>
                        <SelectItem value="annullata_cliente">Annullata Cliente</SelectItem>
                        <SelectItem value="annullata_ristorante">Annullata Ristorante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Prenotazioni Totali</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{kpis.totalReservations}</div>
                <p className="text-xs text-blue-600 mt-1">
                  per {format(selectedDate, "dd MMM", { locale: it })}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-green-700">Ospiti Totali</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{kpis.totalGuests}</div>
                <p className="text-xs text-green-600 mt-1">
                  {kpis.totalReservations > 0 ? Math.round(kpis.totalGuests / kpis.totalReservations * 10) / 10 : 0} media per prenotazione
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-700">Nuove</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900">{kpis.newReservations}</div>
                <p className="text-xs text-yellow-600 mt-1">
                  Da gestire
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">Approvate</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900">{kpis.approvedReservations}</div>
                <p className="text-xs text-emerald-600 mt-1">
                  Confermate
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Punteggio Medio</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">{kpis.averageScore}%</div>
                <p className="text-xs text-purple-600 mt-1">
                  Feedback clienti
                </p>
              </CardContent>
            </Card>

            {/* Nuova Card per Capienza Totale */}
            <Card className="bg-gradient-to-br from-teal-50 to-teal-100 border-teal-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-teal-700">Capienza Totale Oggi</CardTitle>
                <Users className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-900">{isLoading ? '-' : kpis.totalCapacity ?? 0}</div>
                <p className="text-xs text-teal-600 mt-1">
                  Posti totali per il {format(selectedDate, "dd MMM", { locale: it })}
                </p>
              </CardContent>
            </Card>

            {/* Nuova Card per Capienza Disponibile */}
            <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-cyan-700">Posti Disponibili Oggi</CardTitle>
                <CheckCircle className="h-4 w-4 text-cyan-600" /> {/* Icona esempio, puoi cambiarla */}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-900">{isLoading ? '-' : kpis.availableCapacity ?? 0}</div>
                <p className="text-xs text-cyan-600 mt-1">
                  Posti rimanenti per il {format(selectedDate, "dd MMM", { locale: it })}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Reservation Table */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-xl">
                  Prenotazioni del {format(selectedDate, "dd MMMM yyyy", { locale: it })}
                </CardTitle>
                {statusFilter !== 'all' && (
                  <div className="text-sm text-gray-500">
                    Filtrate per: <span className="font-medium">{statusFilter}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ReservationTable 
                reservations={reservations}
                loading={isLoading} // Corretto da loading a isLoading
                onRowClick={handleReservationClick}
              />
            </CardContent>
          </Card>
        </div>

        {/* Detail Modal */}
        <ReservationDetailModal
          reservation={selectedReservation}
          onClose={handleModalClose}
          onReservationUpdated={handleReservationUpdated}
          onUpdateReservation={updateReservation}
        />
      </div>
    </div>
  );
};

export default Reservations;
