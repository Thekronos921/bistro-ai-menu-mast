
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SyncOptionsRendererProps {
  selectedSyncType: string;
  salesPointId: string;
  setSalesPointId: (value: string) => void;
  dateFrom: string;
  setDateFrom: (value: string) => void;
  dateTo: string;
  setDateTo: (value: string) => void;
  receiptsDateFrom: string;
  setReceiptsDateFrom: (value: string) => void;
  receiptsDateTo: string;
  setReceiptsDateTo: (value: string) => void;
  manualSalesPointId: string;
  setManualSalesPointId: (value: string) => void;
}

export const SyncOptionsRenderer = ({
  selectedSyncType,
  salesPointId,
  setSalesPointId,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  receiptsDateFrom,
  setReceiptsDateFrom,
  receiptsDateTo,
  setReceiptsDateTo,
  manualSalesPointId,
  setManualSalesPointId
}: SyncOptionsRendererProps) => {
  if (selectedSyncType === 'sales') {
    return (
      <div className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>Punto Vendita (Opzionale)</Label>
          <Input 
            type="text" 
            placeholder="ID del punto vendita" 
            value={salesPointId}
            onChange={(e) => setSalesPointId(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data Inizio</Label>
            <Input 
              type="date" 
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Data Fine</Label>
            <Input 
              type="date" 
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>
      </div>
    );
  } else if (selectedSyncType === 'receipts') {
    return (
      <div className="space-y-4 mt-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data Inizio Ricevute</Label>
            <Input 
              type="date" 
              value={receiptsDateFrom}
              onChange={(e) => setReceiptsDateFrom(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Data Fine Ricevute</Label>
            <Input 
              type="date" 
              value={receiptsDateTo}
              onChange={(e) => setReceiptsDateTo(e.target.value)}
            />
          </div>
        </div>
         <p className="text-xs text-muted-foreground">
          L'importazione verrà suddivisa in blocchi di massimo 3 giorni alla volta a causa dei limiti API.
        </p>
      </div>
    );
  } else if (selectedSyncType === 'rooms-tables') {
    return (
      <div className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label>ID Punto Vendita (Obbligatorio)</Label>
          <Input 
            type="text" 
            placeholder="Inserisci l'ID del punto vendita" 
            value={manualSalesPointId}
            onChange={(e) => setManualSalesPointId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            L'ID del punto vendita è obbligatorio per sincronizzare sale e tavoli. Se non specificato, verrà utilizzato il valore di default "1".
          </p>
        </div>
      </div>
    );
  }
  return null;
};
