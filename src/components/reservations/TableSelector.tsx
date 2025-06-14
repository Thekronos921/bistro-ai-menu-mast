
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { TableAvailability, RestaurantRoom } from '@/types/reservation';
import { Users, MapPin } from 'lucide-react';

interface TableSelectorProps {
  availability: TableAvailability[];
  rooms: RestaurantRoom[];
  selectedTableId?: string;
  onTableSelect: (tableId: string | undefined) => void;
  disabled?: boolean;
  guestCount?: number;
}

const TableSelector: React.FC<TableSelectorProps> = ({
  availability,
  rooms,
  selectedTableId,
  onTableSelect,
  disabled = false,
  guestCount
}) => {
  // Group tables by room
  const tablesByRoom = availability.reduce((acc, table) => {
    const roomName = table.room_name || 'Senza Sala';
    if (!acc[roomName]) {
      acc[roomName] = [];
    }
    acc[roomName].push(table);
    return acc;
  }, {} as Record<string, TableAvailability[]>);

  const getTableDisplay = (table: TableAvailability) => {
    const isSmallForGuests = guestCount && table.seats < guestCount;
    const isSuitable = !guestCount || table.seats >= guestCount;
    
    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${!table.is_available ? 'text-gray-500' : ''}`}>
            {table.table_name}
          </span>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users className="h-3 w-3" />
            <span>{table.seats}</span>
          </div>
          {table.room_name && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <MapPin className="h-3 w-3" />
              <span>{table.room_name}</span>
            </div>
          )}
        </div>
        <div className="flex gap-1">
          {!table.is_available && (
            <Badge variant="destructive" className="text-xs">
              Occupato
            </Badge>
          )}
          {isSmallForGuests && (
            <Badge variant="outline" className="text-xs">
              Piccolo
            </Badge>
          )}
          {isSuitable && table.is_available && (
            <Badge variant="default" className="text-xs bg-green-100 text-green-800">
              Adatto
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Tavolo Assegnato</label>
      <Select 
        value={selectedTableId || ''} 
        onValueChange={(value) => onTableSelect(value || undefined)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder="Seleziona un tavolo (opzionale)" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Nessun tavolo assegnato</SelectItem>
          {Object.entries(tablesByRoom).map(([roomName, tables]) => (
            <div key={roomName}>
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">
                {roomName}
              </div>
              {tables.map((table) => (
                <SelectItem 
                  key={table.table_id} 
                  value={table.table_id}
                  disabled={!table.is_available}
                >
                  {getTableDisplay(table)}
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
      
      {guestCount && (
        <p className="text-xs text-gray-600">
          Suggerimento: Seleziona un tavolo con almeno {guestCount} posti
        </p>
      )}
    </div>
  );
};

export default TableSelector;
