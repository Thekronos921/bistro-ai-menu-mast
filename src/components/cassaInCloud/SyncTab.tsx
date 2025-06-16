
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Download, XCircle } from "lucide-react";
import { SyncOptionsRenderer } from './SyncOptionsRenderer';
import { useSyncOperations } from './useSyncOperations';

interface SyncTabProps {
  savedApiKeyExists: boolean;
  apiKey: string;
  effectiveApiKey: string | null;
  connectionStatus: {
    isConnected: boolean;
    lastChecked?: Date;
    error?: string;
  };
  restaurantId: string | null;
  testConnection: (apiKeyToTest?: string, silentMode?: boolean) => Promise<boolean>;
  isMounted: boolean;
}

interface SyncStatus {
  lastSync?: Date;
  isLoading: boolean;
  recordsImported?: number;
  error?: string;
  message?: string;
}

const syncTypes = [
  { value: "categories", label: "Categorie" },
  { value: "products", label: "Prodotti" },
  { value: "stock", label: "Giacenze" },
  { value: "customers", label: "Clienti" },
  { value: "sales", label: "Vendite" },
  { value: "receipts", label: "Ricevute" },
  { value: "rooms-tables", label: "Sale e Tavoli" },
  { value: "all", label: "Tutti i Dati" }
];

export const SyncTab = ({
  savedApiKeyExists,
  apiKey,
  effectiveApiKey,
  connectionStatus,
  restaurantId,
  testConnection,
  isMounted
}: SyncTabProps) => {
  const [selectedSyncType, setSelectedSyncType] = useState("");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ isLoading: false });
  const [salesPointId, setSalesPointId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [receiptsDateFrom, setReceiptsDateFrom] = useState<string>("");
  const [receiptsDateTo, setReceiptsDateTo] = useState<string>("");
  const [manualSalesPointId, setManualSalesPointId] = useState<string>("");

  const { startSync } = useSyncOperations({
    selectedSyncType,
    apiKey,
    effectiveApiKey,
    connectionStatus,
    restaurantId,
    testConnection,
    isMounted,
    syncStatus,
    setSyncStatus,
    salesPointId,
    dateFrom,
    dateTo,
    receiptsDateFrom,
    receiptsDateTo,
    manualSalesPointId
  });

  const isSyncEnabled = () => {
    return savedApiKeyExists && !syncStatus.isLoading;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5" />
          <span>Sincronizzazione Dati</span>
        </CardTitle>
        <CardDescription>
          Importa e sincronizza i dati tra CassaInCloud e il sistema
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo di Dati da Sincronizzare</Label>
            <Select value={selectedSyncType} onValueChange={setSelectedSyncType}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona tipo dati..." />
              </SelectTrigger>
              <SelectContent>
                {syncTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Azione</Label>
            <Button 
              onClick={startSync} 
              disabled={!isSyncEnabled()}
              className="w-full"
            >
              {syncStatus.isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sincronizzazione in corso...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Avvia Sincronizzazione
                </>
              )}
            </Button>
          </div>
        </div>
        
        {!savedApiKeyExists && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700">
              ⚠️ Configura e salva una chiave API nella sezione "Connessione" per abilitare la sincronizzazione
            </p>
          </div>
        )}
        
        <SyncOptionsRenderer
          selectedSyncType={selectedSyncType}
          salesPointId={salesPointId}
          setSalesPointId={setSalesPointId}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          receiptsDateFrom={receiptsDateFrom}
          setReceiptsDateFrom={setReceiptsDateFrom}
          receiptsDateTo={receiptsDateTo}
          setReceiptsDateTo={setReceiptsDateTo}
          manualSalesPointId={manualSalesPointId}
          setManualSalesPointId={setManualSalesPointId}
        />
        
        <Separator />
        
        <div className="space-y-3">
          <h4 className="font-medium">Stato Sincronizzazione</h4>
          
          {syncStatus.lastSync && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <p className="text-sm font-medium">Ultima sincronizzazione</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(syncStatus.lastSync).toLocaleString()}
                </p>
              </div>
              {typeof syncStatus.recordsImported === 'number' && (
                <Badge variant="outline">
                  {syncStatus.recordsImported} record importati
                </Badge>
              )}
            </div>
          )}
        
        {syncStatus.error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 text-red-700 rounded-lg">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">{syncStatus.error}</span>
          </div>
        )}
        
        {!syncStatus.lastSync && !syncStatus.isLoading && !syncStatus.error && (
          <p className="text-sm text-muted-foreground">
            Nessuna sincronizzazione eseguita o dati non disponibili.
          </p>
        )}
        
        {syncStatus.isLoading && (
          <div className="flex items-center space-x-2 p-3 bg-blue-50 text-blue-700 rounded-lg">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Sincronizzazione in corso...</span>
          </div>
        )}
      </div>
      </CardContent>
    </Card>
  );
};
