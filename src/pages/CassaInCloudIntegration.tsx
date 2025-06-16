import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { getSalesPoints as fetchSalesPoints } from "@/integrations/cassaInCloud/cassaInCloudService";
import { 
  importRestaurantCategoriesFromCassaInCloud,
  importRestaurantProductsFromCassaInCloud,
  importSalesFromCassaInCloud,
  importCustomersFromCassaInCloud,
  importReceiptsFromCassaInCloud,
  importRoomsFromCassaInCloud,
  importTablesFromCassaInCloud
} from '@/integrations/cassaInCloud/cassaInCloudImportService';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from "@/hooks/useRestaurant";
import { 
  Cloud, 
  Key, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Calendar,
  Database
} from "lucide-react";

interface ConnectionStatus {
  isConnected: boolean;
  lastChecked?: Date;
  error?: string;
}

interface SyncStatus {
  lastSync?: Date;
  isLoading: boolean;
  recordsImported?: number;
  error?: string;
  message?: string;
}

const useCassaInCloudApi = () => {
  return {
    getSalesPoints: async (apiKeyOverride?: string) => {
      return fetchSalesPoints(apiKeyOverride);
    },
  };
};

const CassaInCloudIntegration = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [effectiveApiKey, setEffectiveApiKey] = useState<string | null>(null);
  const [savedApiKeyExists, setSavedApiKeyExists] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ isConnected: false });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ isLoading: false });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [selectedSyncType, setSelectedSyncType] = useState("");
  const { toast, dismiss } = useToast();
  const { restaurantId } = useRestaurant();
  const { getSalesPoints } = useCassaInCloudApi();

  const [salesPointId, setSalesPointId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [receiptsDateFrom, setReceiptsDateFrom] = useState<string>("");
  const [receiptsDateTo, setReceiptsDateTo] = useState<string>("");
  const [manualSalesPointId, setManualSalesPointId] = useState<string>("");

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

  useEffect(() => {
    setIsMounted(true);
    loadSavedSettings();
    return () => {
      setIsMounted(false);
    };
  }, [restaurantId]);

  const loadSavedSettings = async () => {
    if (!restaurantId || !isMounted) return;

    try {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('integration_type', 'cassaincloud')
        .maybeSingle();

      if (data && !error) {
        setAutoSyncEnabled(data.auto_sync_enabled || false);
        if (data.api_key) {
          setEffectiveApiKey(data.api_key);
          setSavedApiKeyExists(true);
          if (isMounted) {
            setConnectionStatus({ 
              isConnected: true, 
              lastChecked: new Date(),
              error: undefined
            });
          }
        } else {
          setSavedApiKeyExists(false);
          setEffectiveApiKey(null);
        }
      } else if (error) {
        console.error('Errore nel caricamento impostazioni:', error);
        setSavedApiKeyExists(false);
        setEffectiveApiKey(null);
        toast({
          title: "Errore Caricamento Impostazioni",
          description: "Impossibile caricare le impostazioni di integrazione.",
          variant: "destructive"
        });
      } else {
        setSavedApiKeyExists(false);
        setEffectiveApiKey(null);
      }
    } catch (error) {
      console.error('Eccezione nel caricamento impostazioni:', error);
      setSavedApiKeyExists(false);
      setEffectiveApiKey(null);
      toast({
        title: "Errore Critico",
        description: "Si è verificato un errore imprevisto durante il caricamento delle impostazioni.",
        variant: "destructive"
      });
    }
  };

  const saveApiKey = async () => {
    const keyToSave = apiKey.trim();
    if (!keyToSave) {
      toast({
        title: "Errore",
        description: "Inserisci una chiave API valida",
        variant: "destructive"
      });
      return;
    }

    if (!restaurantId) {
      toast({
        title: "Errore",
        description: "ID ristorante non trovato",
        variant: "destructive"
      });
      return;
    }

    const isConnectionValid = await testConnection(keyToSave);
    if (!isConnectionValid) {
      return;
    }
    
    try {
      const { data: existingRecord } = await supabase
        .from('integration_settings')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('integration_type', 'cassaincloud')
        .maybeSingle();

      let result;
      if (existingRecord) {
        result = await supabase
          .from('integration_settings')
          .update({
            api_key: keyToSave,
            auto_sync_enabled: autoSyncEnabled,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);
      } else {
        result = await supabase
          .from('integration_settings')
          .insert({
            restaurant_id: restaurantId,
            integration_type: 'cassaincloud',
            api_key: keyToSave,
            auto_sync_enabled: autoSyncEnabled,
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) throw result.error;

      toast({
        title: "Successo",
        description: "Credenziali salvate con successo"
      });

      setEffectiveApiKey(keyToSave);
      setSavedApiKeyExists(true);
      setApiKey("");
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      toast({
        title: "Errore",
        description: "Errore nel salvataggio delle credenziali",
        variant: "destructive"
      });
    }
  };

  const testConnection = async (apiKeyToTest?: string, silentMode = false): Promise<boolean> => {
    const keyToEvaluate = apiKeyToTest || apiKey.trim() || effectiveApiKey;
    
    if (!keyToEvaluate) {
      if (!silentMode) {
        toast({
          title: "Errore",
          description: "Nessuna chiave API disponibile per il test. Inseriscine una o assicurati che sia salvata.",
          variant: "destructive"
        });
      }
      if (isMounted) setConnectionStatus({ isConnected: false, error: "Nessuna chiave API fornita." });
      return false;
    }

    let loadingToastId: string | undefined;
    if (!silentMode) {
      const loadingToast = toast({
        title: "Test Connessione",
        description: "Verifica della connessione a CassaInCloud in corso...",
      });
      loadingToastId = loadingToast.id;
    }

    try {
      const salesPoints = await getSalesPoints(keyToEvaluate);

      if (salesPoints && salesPoints.length >= 0) { 
        if (isMounted) {
          setConnectionStatus({ 
            isConnected: true, 
            lastChecked: new Date(),
            error: undefined
          });
          setEffectiveApiKey(keyToEvaluate);
        }
        if (!silentMode) {
          toast({
            title: "Connessione Riuscita",
            description: "La connessione a CassaInCloud è attiva."
          });
        }
        if (loadingToastId) dismiss(loadingToastId);
        return true;
      } else {
        throw new Error("Nessun punto vendita restituito o risposta non valida.");
      }
    } catch (error: any) {
      console.error('Errore durante il test di connessione:', error);
      if (isMounted) {
        setConnectionStatus({ 
          isConnected: false, 
          lastChecked: new Date(),
          error: error.message || "Errore di connessione sconosciuto"
        });
      }
      if (!silentMode) {
        toast({
          title: "Errore di Connessione",
          description: `Impossibile connettersi a CassaInCloud. Dettagli: ${error.message || 'Verifica la chiave API e la console.'}`,
          variant: "destructive"
        });
      }
      if (loadingToastId) dismiss(loadingToastId);
      return false;
    }
  };

  const renderSyncOptions = () => {
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

  const startSync = async () => {
    if (!selectedSyncType) {
      toast({
        title: "Errore",
        description: "Seleziona il tipo di dati da sincronizzare",
        variant: "destructive"
      });
      return;
    }

    if (!isMounted) return;

    const keyForSync = apiKey.trim() || effectiveApiKey;
    if (!keyForSync) {
      toast({ title: 'Errore', description: 'Chiave API CassaInCloud non disponibile. Testare o salvare una chiave API.', variant: 'destructive' });
      setSyncStatus({ isLoading: false, error: 'Chiave API non disponibile.' });
      return;
    }

    if (connectionStatus.error && effectiveApiKey) {
      const connectionValid = await testConnection(effectiveApiKey, true);
      if (!connectionValid) {
        toast({ title: 'Errore Connessione', description: 'La connessione con la chiave API salvata non è più valida. Si prega di verificarla.', variant: 'destructive' });
        setSyncStatus({ isLoading: false, error: 'Connessione API non valida.' });
        return;
      }
    }

    setSyncStatus({ isLoading: true, error: undefined, recordsImported: undefined, lastSync: syncStatus.lastSync });
    
    console.log('Avvio sincronizzazione per:', selectedSyncType, 'con chiave:', keyForSync ? '***' : 'Nessuna');

    if (selectedSyncType === 'categories') {
      if (!restaurantId) { 
        toast({ title: 'Errore', description: 'ID Ristorante non trovato.', variant: 'destructive' });
        if (isMounted) setSyncStatus({ isLoading: false, error: 'ID Ristorante non trovato.' });
        return;
      }

      importRestaurantCategoriesFromCassaInCloud(restaurantId, undefined, keyForSync)
        .then(({ count, error }) => {
          if (!isMounted) return;
          if (error) {
            toast({ title: 'Errore Sincronizzazione Categorie', description: error.message, variant: 'destructive' });
            setSyncStatus({ isLoading: false, error: `Errore sincronizzazione: ${error.message}`, lastSync: syncStatus.lastSync });
          } else {
            toast({ title: 'Sincronizzazione Categorie Completata', description: `${count} categorie importate/aggiornate.` });
            setSyncStatus({ isLoading: false, lastSync: new Date(), recordsImported: count, error: undefined });
          }
        })
        .catch(err => {
          if (!isMounted) return;
          toast({ title: 'Errore Inatteso', description: 'Si è verificato un errore imprevisto durante la sincronizzazione.', variant: 'destructive' });
          setSyncStatus({ isLoading: false, error: 'Errore imprevisto durante la sincronizzazione.', lastSync: syncStatus.lastSync });
          console.error('Errore imprevisto in startSync:', err);
        });

    } else if (selectedSyncType === 'products') {
      if (!restaurantId) {
        toast({ title: 'Errore', description: 'ID Ristorante non trovato.', variant: 'destructive' });
        if (isMounted) setSyncStatus({ isLoading: false, error: 'ID Ristorante non trovato.' });
        return;
      }

      const idSalesPointForPricing = undefined;
      const filterParams = undefined;

      importRestaurantProductsFromCassaInCloud(restaurantId, idSalesPointForPricing, filterParams, keyForSync)
        .then(({ count, error, message }) => {
          if (!isMounted) return;
          if (error) {
            toast({ title: 'Errore Sincronizzazione Prodotti', description: error.message, variant: 'destructive' });
            setSyncStatus({ isLoading: false, error: `Errore sincronizzazione prodotti: ${error.message}`, lastSync: syncStatus.lastSync });
          } else {
            const successMessage = message || `${count} prodotti importati/aggiornati.`;
            toast({ title: 'Sincronizzazione Prodotti Completata', description: successMessage });
            setSyncStatus({ isLoading: false, lastSync: new Date(), recordsImported: count, error: undefined, message: successMessage });
          }
        })
        .catch(err => {
          if (!isMounted) return;
          toast({ title: 'Errore Inatteso Prodotti', description: 'Si è verificato un errore imprevisto durante la sincronizzazione dei prodotti.', variant: 'destructive' });
          setSyncStatus({ isLoading: false, error: 'Errore imprevisto durante la sincronizzazione dei prodotti.', lastSync: syncStatus.lastSync });
          console.error('Errore imprevisto in startSync per prodotti:', err);
        });
    } else if (selectedSyncType === 'customers') {
      if (!restaurantId) {
        toast({ title: 'Errore', description: 'ID Ristorante non trovato.', variant: 'destructive' });
        if (isMounted) setSyncStatus({ isLoading: false, error: 'ID Ristorante non trovato.' });
        return;
      }

      importCustomersFromCassaInCloud(restaurantId, undefined, keyForSync)
        .then(({ count, error, message }) => {
          if (!isMounted) return;
          if (error) {
            toast({ title: 'Errore Sincronizzazione Clienti', description: error.message, variant: 'destructive' });
            setSyncStatus({ isLoading: false, error: `Errore sincronizzazione clienti: ${error.message}`, lastSync: syncStatus.lastSync });
          } else {
            const successMessage = message || `${count} clienti importati/aggiornati.`;
            toast({ title: 'Sincronizzazione Clienti Completata', description: successMessage });
            setSyncStatus({ isLoading: false, lastSync: new Date(), recordsImported: count, error: undefined, message: successMessage });
          }
        })
        .catch(err => {
          if (!isMounted) return;
          toast({ title: 'Errore Inatteso Clienti', description: 'Si è verificato un errore imprevisto durante la sincronizzazione dei clienti.', variant: 'destructive' });
          setSyncStatus({ isLoading: false, error: 'Errore imprevisto durante la sincronizzazione dei clienti.', lastSync: syncStatus.lastSync });
          console.error('Errore imprevisto in startSync per clienti:', err);
        });
    } else if (selectedSyncType === 'sales') {
      if (!restaurantId) {
        toast({ title: 'Errore', description: 'ID Ristorante non trovato.', variant: 'destructive' });
        if (isMounted) setSyncStatus({ isLoading: false, error: 'ID Ristorante non trovato.' });
        return;
      }
      
      if (!dateFrom || !dateTo) {
        toast({ title: 'Errore', description: 'Seleziona un intervallo di date per la sincronizzazione delle vendite.', variant: 'destructive' });
        if (isMounted) setSyncStatus({ isLoading: false, error: 'Date non specificate.' });
        return;
      }
      
      const params = {
        start: 0,
        limit: 100,
        datetimeFrom: dateFrom,
        datetimeTo: dateTo,
        idsSalesPoint: salesPointId ? [salesPointId] : undefined
      };
      
      importSalesFromCassaInCloud(restaurantId, params, keyForSync)
        .then(({ count, error, message }) => {
          if (!isMounted) return;
          if (error) {
            toast({ title: 'Errore Sincronizzazione Vendite', description: error.message, variant: 'destructive' });
            setSyncStatus({ isLoading: false, error: `Errore sincronizzazione vendite: ${error.message}`, lastSync: syncStatus.lastSync });
          } else {
            const successMessage = message || `${count} record di vendita importati.`;
            toast({ title: 'Sincronizzazione Vendite Completata', description: successMessage });
            setSyncStatus({ isLoading: false, lastSync: new Date(), recordsImported: count, error: undefined, message: successMessage });
          }
        })
        .catch(err => {
          if (!isMounted) return;
          toast({ title: 'Errore Inatteso Vendite', description: 'Si è verificato un errore imprevisto durante la sincronizzazione delle vendite.', variant: 'destructive' });
          setSyncStatus({ isLoading: false, error: 'Errore imprevisto durante la sincronizzazione delle vendite.', lastSync: syncStatus.lastSync });
          console.error('Errore imprevisto in startSync per vendite:', err);
        });
    } else if (selectedSyncType === 'receipts') {
      if (!restaurantId) {
        toast({ title: 'Errore', description: 'ID Ristorante non trovato.', variant: 'destructive' });
        if (isMounted) setSyncStatus({ isLoading: false, error: 'ID Ristorante non trovato.' });
        return;
      }

      if (!receiptsDateFrom || !receiptsDateTo) {
        toast({ title: 'Errore', description: 'Seleziona un intervallo di date per la sincronizzazione delle ricevute.', variant: 'destructive' });
        if (isMounted) setSyncStatus({ isLoading: false, error: 'Date non specificate per le ricevute.' });
        return;
      }

      const startDate = new Date(receiptsDateFrom);
      const endDate = new Date(receiptsDateTo);
      let currentStartDate = new Date(startDate);
      let totalImportedCount = 0;
      let hasErrors = false;

      const importNextChunk = async () => {
        if (currentStartDate > endDate || hasErrors) {
          if (isMounted) {
            if (hasErrors) {
              setSyncStatus({ isLoading: false, error: 'Errore durante importazione di un blocco di ricevute. Controllare i log.', lastSync: syncStatus.lastSync });
            } else {
              toast({ title: 'Sincronizzazione Ricevute Completata', description: `${totalImportedCount} ricevute importate in totale.` });
              setSyncStatus({ isLoading: false, lastSync: new Date(), recordsImported: totalImportedCount, error: undefined });
            }
          }
          return;
        }

        let currentEndDate = new Date(currentStartDate);
        currentEndDate.setDate(currentEndDate.getDate() + 2);
        if (currentEndDate > endDate) {
          currentEndDate = new Date(endDate);
        }

        const params = {
          datetimeFrom: currentStartDate.toISOString().split('T')[0] + 'T00:00:00',
          datetimeTo: currentEndDate.toISOString().split('T')[0] + 'T23:59:59',
          start: 0,
          limit: 1000,
        };

        toast({ title: 'Importazione Ricevute', description: `Importazione blocco dal ${params.datetimeFrom.split('T')[0]} al ${params.datetimeTo.split('T')[0]}...` });

        try {
          const { count, error, message } = await importReceiptsFromCassaInCloud(restaurantId, params, keyForSync);
          if (!isMounted) return;

          if (error) {
            toast({ title: 'Errore Sincronizzazione Blocco Ricevute', description: error.message, variant: 'destructive' });
            console.error('Errore importazione blocco ricevute:', error, message);
            hasErrors = true;
            if (isMounted) setSyncStatus({ isLoading: false, error: `Errore importazione blocco: ${error.message}`, lastSync: syncStatus.lastSync });
            return;
          }
          
          totalImportedCount += count;
          const successMessage = message || `${count} ricevute importate in questo blocco.`;
          console.log(successMessage);

          currentStartDate.setDate(currentEndDate.getDate() + 1);
          importNextChunk();

        } catch (err: any) {
          if (!isMounted) return;
          toast({ title: 'Errore Inatteso Blocco Ricevute', description: 'Si è verificato un errore imprevisto durante la sincronizzazione di un blocco di ricevute.', variant: 'destructive' });
          console.error('Errore imprevisto in importNextChunk per ricevute:', err);
          hasErrors = true;
          if (isMounted) setSyncStatus({ isLoading: false, error: `Errore imprevisto blocco: ${err.message || 'Errore sconosciuto'}`, lastSync: syncStatus.lastSync });
        }
      };

      importNextChunk();

    } else if (selectedSyncType === 'rooms-tables') {
      if (!restaurantId) {
        toast({ title: 'Errore', description: 'ID Ristorante non trovato.', variant: 'destructive' });
        if (isMounted) setSyncStatus({ isLoading: false, error: 'ID Ristorante non trovato.' });
        return;
      }

      try {
        const effectiveSalesPointId = manualSalesPointId || salesPointId;
        const roomsParams = {
          start: 0,
          limit: 100,
          idsSalesPoint: effectiveSalesPointId ? [parseInt(effectiveSalesPointId)] : []
        };

        const roomsResult = await importRoomsFromCassaInCloud(restaurantId, roomsParams, keyForSync);
        if (!isMounted) return;

        if (roomsResult.error) {
          toast({ title: 'Errore Sincronizzazione Sale', description: roomsResult.error.message, variant: 'destructive' });
          setSyncStatus({ isLoading: false, error: `Errore sincronizzazione sale: ${roomsResult.error.message}`, lastSync: syncStatus.lastSync });
          return;
        }

        const tablesParams = {
          start: 0,
          limit: 100,
          idsSalesPoint: effectiveSalesPointId ? [parseInt(effectiveSalesPointId)] : []
        };

        const tablesResult = await importTablesFromCassaInCloud(restaurantId, tablesParams, keyForSync);
        if (!isMounted) return;

        if (tablesResult.error) {
          toast({ title: 'Errore Sincronizzazione Tavoli', description: tablesResult.error.message, variant: 'destructive' });
          setSyncStatus({ isLoading: false, error: `Errore sincronizzazione tavoli: ${tablesResult.error.message}`, lastSync: syncStatus.lastSync });
          return;
        }

        const totalCount = roomsResult.count + tablesResult.count;
        const successMessage = `${roomsResult.count} sale e ${tablesResult.count} tavoli importati/aggiornati.`;
        toast({ title: 'Sincronizzazione Sale e Tavoli Completata', description: successMessage });
        setSyncStatus({ isLoading: false, lastSync: new Date(), recordsImported: totalCount, error: undefined, message: successMessage });

      } catch (err: any) {
        if (!isMounted) return;
        toast({ title: 'Errore Inatteso Sale e Tavoli', description: 'Si è verificato un errore imprevisto durante la sincronizzazione di sale e tavoli.', variant: 'destructive' });
        setSyncStatus({ isLoading: false, error: 'Errore imprevisto durante la sincronizzazione di sale e tavoli.', lastSync: syncStatus.lastSync });
        console.error('Errore imprevisto in startSync per sale e tavoli:', err);
      }
    } else {
      setTimeout(() => {
        if (isMounted) setSyncStatus({ isLoading: false, lastSync: new Date(), message: 'Sincronizzazione (simulata) completata.', error: undefined });
        toast({ title: 'Sincronizzazione Simulata', description: `La sincronizzazione per ${selectedSyncType} è stata simulata.`});
      }, 2000);
    }
  };

  const getConnectionStatusBadge = () => {
    if (connectionStatus.isConnected) {
      return <Badge variant="default" className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Connesso</Badge>;
    }
    if (connectionStatus.error) {
      return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Errore</Badge>;
    }
    return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Non Connesso</Badge>;
  };

  const isSyncEnabled = () => {
    return savedApiKeyExists && !syncStatus.isLoading;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Cloud className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Integrazione CassaInCloud</h1>
          <p className="text-muted-foreground">Gestisci la sincronizzazione con il tuo sistema di cassa</p>
        </div>
      </div>

      <Tabs defaultValue="connection" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="connection">Connessione</TabsTrigger>
          <TabsTrigger value="sync">Sincronizzazione</TabsTrigger>
          <TabsTrigger value="settings">Impostazioni</TabsTrigger>
        </TabsList>

        <TabsContent value="connection" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>Connessione CassaInCloud</span>
              </CardTitle>
              <CardDescription>
                Configura la connessione alla tua cassa CassaInCloud inserendo la chiave API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Stato Connessione:</Label>
                {getConnectionStatusBadge()}
              </div>

              {connectionStatus.lastChecked && (
                <p className="text-sm text-muted-foreground">
                  Ultimo controllo: {connectionStatus.lastChecked.toLocaleString()}
                </p>
              )}

              {savedApiKeyExists && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✓ Chiave API configurata e pronta per l'uso
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="apiKey">Chiave API CassaInCloud</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Inserisci la tua chiave API..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  La chiave API è disponibile nel pannello di controllo di CassaInCloud
                </p>
              </div>

              <div className="flex space-x-3">
                <Button onClick={() => testConnection()} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Testa Connessione
                </Button>
                <Button onClick={saveApiKey}>
                  <Database className="w-4 h-4 mr-2" />
                  Salva Credenziali
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
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
              
              {renderSyncOptions()}
              
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
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Impostazioni Automatiche</span>
              </CardTitle>
              <CardDescription>
                Configura la sincronizzazione automatica dei dati
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Sincronizzazione Automatica</Label>
                  <p className="text-sm text-muted-foreground">
                    Abilita la sincronizzazione automatica giornaliera
                  </p>
                </div>
                <Switch
                  checked={autoSyncEnabled}
                  onCheckedChange={setAutoSyncEnabled}
                />
              </div>

              {autoSyncEnabled && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    La sincronizzazione automatica sarà eseguita ogni giorno alle 6:00
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CassaInCloudIntegration;
