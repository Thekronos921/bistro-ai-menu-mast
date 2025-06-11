
import React, { useState } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Users, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useReservations } from '@/hooks/useReservations';
import { Reservation, ReservationStatus, ReservationKPIs } from '@/types/reservation';
import ReservationTable from '@/components/reservations/ReservationTable';
import ReservationDetailModal from '@/components/reservations/ReservationDetailModal';
import Header from '@/components/Header';

const Reservations = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const filterValue = statusFilter === 'all' ? undefined : statusFilter;
  
  const { reservations, loading, updateReservation } = useReservations(dateString, filterValue);

  const calculateKPIs = (): ReservationKPIs => {
    return {
      totalReservations: reservations.length,
      totalGuests: reservations.reduce((sum, r) => sum + r.number_of_guests, 0),
      newReservations: reservations.filter(r => r.status === 'nuova').length,
      approvedReservations: reservations.filter(r => r.status === 'approvata').length,
      averageScore: reservations.length > 0 
        ? Math.round(reservations.reduce((sum, r) => sum + r.final_score, 0) / reservations.length)
        : 0
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestione Prenotazioni</h1>
            <p className="text-gray-600">Visualizza e gestisci le prenotazioni del tuo ristorante</p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4">
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
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

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

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prenotazioni Totali</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.totalReservations}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ospiti Totali</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.totalGuests}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nuove</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.newReservations}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approvate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.approvedReservations}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Punteggio Medio</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.averageScore}</div>
              </CardContent>
            </Card>
          </div>

          {/* Reservations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Prenotazioni del {format(selectedDate, "dd MMMM yyyy", { locale: it })}</CardTitle>
            </CardHeader>
            <CardContent>
              <ReservationTable 
                reservations={reservations}
                loading={loading}
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
