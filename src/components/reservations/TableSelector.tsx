
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, CheckCircle, AlertCircle, Lightbulb } from 'lucide-react';
import { RestaurantTable } from '@/types/reservation';
import { useTableAvailability } from '@/hooks/useTableAvailability';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface TableSelectorProps {
  tables: RestaurantTable[];
  selectedTableId?: string;
  onTableSelect: (tableId: string | null) => void;
  reservationDate: string;
  reservationTime: string;
  numberOfGuests: number;
  restaurantId: string;
  disabled?: boolean;
}

const TableSelector: React.FC<TableSelectorProps> = ({
  tables,
  selectedTableId,
  onTableSelect,
  reservationDate,
  reservationTime,
  numberOfGuests,
  restaurantId,
  disabled = false
}) => {
  const { 
    availability, 
    loading, 
    fetchTableAvailability, 
    isTableAvailable,
    suggestBestTable 
  } = useTableAvailability(restaurantId);

  useEffect(() => {
    if (tables.length > 0 && reservationDate) {
      const tableIds = tables.map(t => t.id);
      fetchTableAvailability(tableIds, reservationDate);
    }
  }, [tables, reservationDate, fetchTableAvailability]);

  const getTableStatus = (table: RestaurantTable) => {
    if (!reservationTime) return 'unknown';
    
    const available = isTableAvailable(table.id, reservationTime, reservationDate);
    const hasCapacity = !table.seats || table.seats >= numberOfGuests;
    
    if (available && hasCapacity) return 'available';
    if (!available) return 'occupied';
    if (!hasCapacity) return 'too_small';
    return 'unknown';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Disponibile
        </Badge>;
      case 'occupied':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
          <AlertCircle className="w-3 h-3 mr-1" />
          Occupato
        </Badge>;
      case 'too_small':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Users className="w-3 h-3 mr-1" />
          Troppo piccolo
        </Badge>;
      default:
        return <Badge variant="outline">Verifica...</Badge>;
    }
  };

  const handleSuggestTable = () => {
    if (!reservationTime || loading) return;
    
    const suggestion = suggestBestTable(tables, numberOfGuests, reservationTime, reservationDate);
    if (suggestion) {
      onTableSelect(suggestion.id);
    }
  };

  const availableTables = tables.filter(table => getTableStatus(table) === 'available');
  const selectedTable = tables.find(t => t.id === selectedTableId);

  const getTableDisplayText = (table: RestaurantTable) => {
    let text = table.name;
    if (table.room_name) {
      text += ` (${table.room_name})`;
    }
    if (table.seats) {
      text += ` - ${table.seats} posti`;
    }
    
    const status = getTableStatus(table);
    if (status === 'occupied') {
      text += ' - Occupato';
    } else if (status === 'too_small') {
      text += ' - Troppo piccolo';
    }
    
    return text;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Tavolo</Label>
        {reservationTime && !loading && availableTables.length > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSuggestTable}
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <Lightbulb className="w-4 h-4 mr-1" />
            Suggerisci
          </Button>
        )}
      </div>

      <Select 
        value={selectedTableId || 'unassigned'} 
        onValueChange={(value) => onTableSelect(value === 'unassigned' ? null : value)}
        disabled={disabled || loading}
      >
        <SelectTrigger>
          <SelectValue placeholder={
            loading ? "Caricamento tavoli..." : 
            !reservationTime ? "Seleziona prima orario" :
            availableTables.length === 0 ? "Nessun tavolo disponibile" :
            "Seleziona un tavolo"
          } />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unassigned">Nessun tavolo assegnato</SelectItem>
          {tables.map(table => {
            const status = getTableStatus(table);
            return (
              <SelectItem 
                key={table.id} 
                value={table.id}
                disabled={status !== 'available'}
              >
                {getTableDisplayText(table)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>

      {/* Mostra i dettagli del tavolo selezionato sotto il select */}
      {selectedTable && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800">
              Tavolo Selezionato
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{selectedTable.name}</span>
                {getStatusBadge(getTableStatus(selectedTable))}
              </div>
              {selectedTable.room_name && (
                <div className="text-gray-600">
                  Sala: {selectedTable.room_name}
                </div>
              )}
              {selectedTable.seats && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Users className="w-4 h-4" />
                  Capienza: {selectedTable.seats} posti
                </div>
              )}
              {reservationTime && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Clock className="w-4 h-4" />
                  {format(new Date(`${reservationDate} ${reservationTime}`), "EEEE dd MMMM yyyy 'alle' HH:mm", { locale: it })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {reservationTime && !loading && availableTables.length === 0 && (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200">
          <AlertCircle className="w-4 h-4 inline mr-1" />
          Nessun tavolo disponibile per l'orario selezionato. Considera di cambiare orario o gestire manualmente.
        </div>
      )}
    </div>
  );
};

export default TableSelector;
