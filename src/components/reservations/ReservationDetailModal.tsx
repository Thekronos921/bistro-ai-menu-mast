
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { X, Save, User, Mail, Phone, Users, Calendar, MessageSquare, Star, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Reservation, ReservationStatus } from '@/types/reservation';
import { useRestaurantTables } from '@/hooks/useRestaurantTables';
import { useRestaurant } from '@/hooks/useRestaurant';
import TableSelector from './TableSelector';

interface ReservationDetailModalProps {
  reservation: Reservation | null;
  onClose: () => void;
  onReservationUpdated: (reservation: Reservation) => void;
  onUpdateReservation: (id: string, updates: Partial<Reservation>) => Promise<boolean>;
}

const ReservationDetailModal: React.FC<ReservationDetailModalProps> = ({
  reservation,
  onClose,
  onReservationUpdated,
  onUpdateReservation
}) => {
  const { restaurantId } = useRestaurant();
  const { tables, loading: tablesLoading } = useRestaurantTables(restaurantId);
  const [status, setStatus] = useState<ReservationStatus>('nuova');
  const [internalNotes, setInternalNotes] = useState('');
  const [tableId, setTableId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (reservation) {
      setStatus(reservation.status);
      setInternalNotes(reservation.internal_notes || '');
      setTableId(reservation.table_id || null);
    }
  }, [reservation]);

  const handleSave = async () => {
    if (!reservation) return;

    setSaving(true);
    try {
      const success = await onUpdateReservation(reservation.id, {
        status,
        internal_notes: internalNotes,
        table_id: tableId
      });

      if (success) {
        onReservationUpdated({
          ...reservation,
          status,
          internal_notes: internalNotes,
          table_id: tableId
        });
      }
    } finally {
      setSaving(false);
    }
  };

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
    return (
      <Badge 
        variant={config.variant}
        className={
          status === 'approvata' ? 'bg-green-100 text-green-800' :
          status === 'completata' ? 'bg-blue-100 text-blue-800' :
          status === 'nuova' ? 'bg-yellow-100 text-yellow-800' :
          ''
        }
      >
        {config.label}
      </Badge>
    );
  };

  const getAssignedTable = () => {
    if (!tableId || !tables.length) return null;
    return tables.find(table => table.id === tableId);
  };

  const assignedTable = getAssignedTable();

  if (!reservation) return null;

  return (
    <Dialog open={!!reservation} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Dettagli Prenotazione</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Informazioni Cliente</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nome</p>
                  <p className="font-medium">{reservation.customer_name}</p>
                </div>
              </div>

              {reservation.customer_email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{reservation.customer_email}</p>
                  </div>
                </div>
              )}

              {reservation.customer_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Telefono</p>
                    <p className="font-medium">{reservation.customer_phone}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Numero Ospiti</p>
                  <p className="font-medium">{reservation.number_of_guests}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Reservation Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Dettagli Prenotazione</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Data e Ora</p>
                  <p className="font-medium">
                    {format(new Date(reservation.reservation_time), "dd MMMM yyyy 'alle' HH:mm", { locale: it })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Punteggio</p>
                  <p className="font-medium">{reservation.final_score}</p>
                </div>
              </div>

              {assignedTable && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Tavolo Assegnato</p>
                    <p className="font-medium">
                      {assignedTable.name}
                      {assignedTable.room_name && ` (${assignedTable.room_name})`}
                      {assignedTable.seats && ` - ${assignedTable.seats} posti`}
                    </p>
                  </div>
                </div>
              )}

              {reservation.booking_type && (
                <div className="col-span-full">
                  <p className="text-sm text-gray-500">Tipo/Pacchetto</p>
                  <p className="font-medium">{reservation.booking_type}</p>
                </div>
              )}
            </div>

            {reservation.customer_notes && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="h-5 w-5 text-gray-400" />
                  <p className="text-sm text-gray-500">Note del Cliente</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-sm">{reservation.customer_notes}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Table Assignment */}
          {tables.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Assegnazione Tavolo</h3>
              
              <TableSelector
                tables={tables}
                selectedTableId={tableId}
                onTableSelect={setTableId}
                reservationDate={format(new Date(reservation.reservation_time), 'yyyy-MM-dd')}
                reservationTime={format(new Date(reservation.reservation_time), 'HH:mm')}
                numberOfGuests={reservation.number_of_guests}
                restaurantId={restaurantId || ''}
                disabled={tablesLoading}
              />
            </div>
          )}

          <Separator />

          {/* Editable Fields */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Gestione Prenotazione</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Stato Prenotazione</label>
                <Select value={status} onValueChange={(value) => setStatus(value as ReservationStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nuova">Nuova</SelectItem>
                    <SelectItem value="approvata">Approvata</SelectItem>
                    <SelectItem value="in_attesa">In Attesa</SelectItem>
                    <SelectItem value="rifiutata">Rifiutata</SelectItem>
                    <SelectItem value="completata">Completata</SelectItem>
                    <SelectItem value="annullata_cliente">Annullata Cliente</SelectItem>
                    <SelectItem value="annullata_ristorante">Annullata Ristorante</SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-2">
                  <span className="text-sm text-gray-500">Stato attuale: </span>
                  {getStatusBadge(reservation.status)}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Note Interne</label>
                <Textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Aggiungi note per lo staff..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              Chiudi
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvataggio...' : 'Salva Modifiche'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReservationDetailModal;
