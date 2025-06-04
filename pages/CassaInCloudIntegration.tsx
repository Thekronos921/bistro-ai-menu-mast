
import { useState, useEffect, useRef } from "react";
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
import { getSalesPoints } from '@/integrations/cassaInCloud/cassaInCloudService';
import { 
  importRestaurantCategoriesFromCassaInCloud,
  importRestaurantProductsFromCassaInCloud // <-- NUOVO IMPORT
} from '@/integrations/cassaInCloud/cassaInCloudImportService';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from "@/hooks/useRestaurant";
import { getSalesPoints as fetchSalesPoints } from "@/integrations/cassaInCloud/cassaInCloudService";

const useCassaInCloudApi = () => {
  return {
    getSalesPoints: async (apiKeyOverride?: string) => {
      return fetchSalesPoints(apiKeyOverride);
    },
  };
};
import { 
  Cloud, 
  Key, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Download,
  Upload,
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
  message?: string; // Aggiunto per coerenza con l'uso in startSync (simulazione)
}

const CassaInCloudIntegration = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [effectiveApiKey, setEffectiveApiKey] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ isConnected: false });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ isLoading: false });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [selectedSyncType, setSelectedSyncType] = useState("");
  const { toast, dismiss } = useToast(); // Estrarre dismiss qui
  const { restaurantId } = useRestaurant();
  const { getSalesPoints } = useCassaInCloudApi(); // Hook per le API CassaInCloud

  const syncTypes = [
    { value: "categories", label: "Categorie" },
    { value: "products", label: "Prodotti" },
    { value: "stock", label: "Giacenze" },
    { value: "customers", label: "Clienti" },
    { value: "sales", label: "Vendite" },
    { value: "all", label: "Tutti i Dati" }
  ];

  // Carica le impostazioni salvate e imposta isMounted
  useEffect(() => {
    setIsMounted(true);
    loadSavedSettings();
    return () => {
      setIsMounted(false);
    };
  }, [restaurantId]); // restaurantId incluso nelle dipendenze

  const loadSavedSettings = async () => {
    if (!restaurantId || !isMounted) return;

    try {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('integration_type', 'cassaincloud')
        .single();

      if (data && !error) {
        setAutoSyncEnabled(data.auto_sync_enabled || false);
        if (data.api_key) {
          // Testa la chiave caricata in modalità silenziosa
          const isValid = await testConnection(data.api_key, true);
          if (isValid) {
            setEffectiveApiKey(data.api_key);
            // testConnection imposterà connectionStatus se ha successo
          } else {
            // Se la chiave salvata non è valida, imposta lo stato di connessione a non connesso
            // ma non mostrare un errore aggressivo, l'utente può reinserirla.
            if (isMounted) setConnectionStatus({ isConnected: false, error: "Chiave API salvata non valida." });
          }
        }
      } else if (error && error.code !== 'PGRST116') { // PGRST116: single row not found (nessuna impostazione salvata)
        console.error('Errore nel caricamento impostazioni:', error);
        toast({
          title: "Errore Caricamento Impostazioni",
          description: "Impossibile caricare le impostazioni di integrazione.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Eccezione nel caricamento impostazioni:', error);
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

    // Testa la connessione con la chiave API fornita prima di salvare
    const isConnectionValid = await testConnection(keyToSave);
    if (!isConnectionValid) {
      // testConnection mostrerà già un toast di errore
      return;
    }
    
    try {
      const { error } = await supabase
        .from('integration_settings')
        .upsert({
          restaurant_id: restaurantId,
          integration_type: 'cassaincloud',
          api_key: keyToSave, // Salva la chiave testata e valida
          auto_sync_enabled: autoSyncEnabled,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Credenziali salvate con successo"
      });

      setEffectiveApiKey(keyToSave); // La chiave salvata è ora quella effettiva
      setApiKey(""); // Pulisce il campo input per sicurezza
      // connectionStatus è già stato aggiornato da testConnection se ha avuto successo
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
          setEffectiveApiKey(keyToEvaluate); // Chiave testata con successo diventa effettiva
        }
        if (!silentMode) {
          toast({
            title: "Connessione Riuscita",
            description: "La connessione a CassaInCloud è attiva."
          });
        }
        if (loadingToastId) dismiss(loadingToastId); // Usare dismiss direttamente
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
        // Non resettare effectiveApiKey qui, potrebbe esserci una precedente valida
      }
      if (!silentMode) {
        toast({
          title: "Errore di Connessione",
          description: `Impossibile connettersi a CassaInCloud. Dettagli: ${error.message || 'Verifica la chiave API e la console.'}`,
          variant: "destructive"
        });
      }
      if (loadingToastId) dismiss(loadingToastId); // Usare dismiss direttamente
      return false;
    }
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

    // Verifica la connessione prima di avviare la sincronizzazione se non si usa la chiave dall'input
    // Se apiKey (input) è usata, si presume che l'utente voglia usarla direttamente (magari per un test rapido)
    if (!apiKey.trim() && effectiveApiKey) { 
      const connectionStillValid = await testConnection(effectiveApiKey, true); // Test silenzioso
      if (!connectionStillValid) {
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

    } else if (selectedSyncType === 'products') { // <-- NUOVA LOGICA PER PRODOTTI
      if (!restaurantId) {
        toast({ title: 'Errore', description: 'ID Ristorante non trovato.', variant: 'destructive' });
        if (isMounted) setSyncStatus({ isLoading: false, error: 'ID Ristorante non trovato.' });
        return;
      }

      // TODO: Recuperare idSalesPointForPricing e filterParams, ad esempio da un selettore nell'UI o da impostazioni
      const idSalesPointForPricing = undefined; // Esempio, da sostituire con valore reale
      const filterParams = undefined; // Esempio, da sostituire con valore reale

      importRestaurantProductsFromCassaInCloud(restaurantId, idSalesPointForPricing, filterParams, keyForSync)
        .then(({ count, error, message }) => { // Aggiunto 'message' per feedback più dettagliato
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
    } else {
      // Simula un ritardo per la sincronizzazione per altri tipi
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
          {/* Sezione Connessione */}
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
          {/* Sezione Sincronizzazione */}
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
                    disabled={syncStatus.isLoading || !connectionStatus.isConnected}
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

              <Separator />

              {/* Stato ultima sincronizzazione */}
              <div className="space-y-3">
                <h4 className="font-medium">Stato Sincronizzazione</h4>
                
                {syncStatus.lastSync && (
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Ultima sincronizzazione</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(syncStatus.lastSync).toLocaleString()} {/* Assicura che sia un oggetto Date */}
                      </p>
                    </div>
                    {typeof syncStatus.recordsImported === 'number' && ( // Verifica che sia un numero
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
          {/* Sezione Impostazioni */}
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
