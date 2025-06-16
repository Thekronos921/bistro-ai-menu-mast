
import { useToast } from '@/hooks/use-toast';
import { 
  importRestaurantCategoriesFromCassaInCloud,
  importRestaurantProductsFromCassaInCloud,
  importSalesFromCassaInCloud,
  importCustomersFromCassaInCloud,
  importReceiptsFromCassaInCloud,
  importRoomsFromCassaInCloud,
  importTablesFromCassaInCloud
} from '@/integrations/cassaInCloud/cassaInCloudImportService';

interface SyncStatus {
  lastSync?: Date;
  isLoading: boolean;
  recordsImported?: number;
  error?: string;
  message?: string;
}

interface UseSyncOperationsProps {
  selectedSyncType: string;
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
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  salesPointId: string;
  dateFrom: string;
  dateTo: string;
  receiptsDateFrom: string;
  receiptsDateTo: string;
  manualSalesPointId: string;
}

export const useSyncOperations = ({
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
}: UseSyncOperationsProps) => {
  const { toast } = useToast();

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

  return { startSync };
};
