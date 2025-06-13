
import React from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Eye, Phone, Users, Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Reservation, ReservationStatus } from '@/types/reservation';

interface ReservationTableProps {
  reservations: Reservation[];
  loading: boolean;
  onRowClick: (reservation: Reservation) => void;
}

const ReservationTable: React.FC<ReservationTableProps> = ({ 
  reservations, 
  loading, 
  onRowClick 
}) => {
  const getStatusBadge = (status: ReservationStatus) => {
    const statusConfig = {
      nuova: { label: 'Nuova', variant: 'default' as const },
      approvata: { label: 'Approvata', variant: 'default' as const },
      in_attesa: { label: 'In Attesa', variant: 'secondary' as const },
      rifiutata: { label: 'Rifiutata', variant: 'destructive' as const },
      completata: { label: 'Completata', variant: 'default' as const },
      annullata_cliente: { label: 'Annullata Cliente', variant: 'outline' as const },
      annullata_ristorante: { label: 'Annullata Ristorante', variant: 'outline' as const }
    };

    const config = statusConfig[status];

    if (!config) {
      // Gestisce stati non previsti o null/undefined
      return <Badge variant="outline">{status || 'Sconosciuto'}</Badge>;
    }

    return (
      <Badge 
        variant={config.variant}
        className={
          status === 'approvata' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
          status === 'completata' ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' :
          status === 'nuova' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' :
          ''
        }
      >
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Nessuna prenotazione trovata per la data selezionata</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Orario</TableHead>
            <TableHead>Nome Cliente</TableHead>
            <TableHead>Ospiti</TableHead>
            <TableHead>Tipo/Pacchetto</TableHead>
            <TableHead>Telefono</TableHead>
            <TableHead>Punteggio</TableHead>
            <TableHead>Stato</TableHead>
            <TableHead>Azioni</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservations.map((reservation) => (
            <TableRow key={reservation.id} className="hover:bg-gray-50">
              <TableCell className="font-medium">
                {format(new Date(reservation.reservation_time), 'HH:mm')}
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{reservation.customer_name}</div>
                  {reservation.customer_email && (
                    <div className="text-sm text-gray-500">{reservation.customer_email}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  {reservation.number_of_guests}
                </div>
              </TableCell>
              <TableCell>
                {reservation.booking_type || '-'}
              </TableCell>
              <TableCell>
                {reservation.customer_phone ? (
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {reservation.customer_phone}
                  </div>
                ) : '-'}
              </TableCell>
              <TableCell>
                <div className="font-medium">{reservation.final_score}</div>
              </TableCell>
              <TableCell>
                {getStatusBadge(reservation.status)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRowClick(reservation)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ReservationTable;
