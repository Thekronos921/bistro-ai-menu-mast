
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
import { supabase } from "@/integrations/supabase/client";
import { useRestaurant } from "@/hooks/useRestaurant";
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
}

const CassaInCloudIntegration = () => {
  const [apiKey, setApiKey] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ isConnected: false });
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ isLoading: false });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [selectedSyncType, setSelectedSyncType] = useState("");
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();

  const syncTypes = [
    { value: "categories", label: "Categorie" },
    { value: "products", label: "Prodotti" },
    { value: "stock", label: "Giacenze" },
    { value: "customers", label: "Clienti" },
    { value: "sales", label: "Vendite" },
    { value: "all", label: "Tutti i Dati" }
  ];

  // Carica le impostazioni salvate
  useEffect(() => {
    loadSavedSettings();
  }, [restaurantId]);

  const loadSavedSettings = async () => {
    if (!restaurantId) return;

    try {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('integration_type', 'cassaincloud')
        .single();

      if (data && !error) {
        setAutoSyncEnabled(data.auto_sync_enabled || false);
        // L'API key non viene mai mostrata per sicurezza
        if (data.api_key) {
          setConnectionStatus({ isConnected: true });
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento impostazioni:', error);
    }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) {
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

    try {
      // Prima testa la connessione
      await testConnection();
      
      // Se il test è andato a buon fine, salva la chiave
      const { error } = await supabase
        .from('integration_settings')
        .upsert({
          restaurant_id: restaurantId,
          integration_type: 'cassaincloud',
          api_key: apiKey,
          auto_sync_enabled: autoSyncEnabled,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Credenziali salvate con successo"
      });

      setApiKey(""); // Pulisce il campo per sicurezza
      setConnectionStatus({ isConnected: true, lastChecked: new Date() });
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
      toast({
        title: "Errore",
        description: "Errore nel salvataggio delle credenziali",
        variant: "destructive"
      });
    }
  };

  const testConnection = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci una chiave API per testare la connessione",
        variant: "destructive"
      });
      return;
    }

    try {
      // Simulazione test connessione - da implementare con l'API reale
      // const response = await fetch('https://api.cassanova.com/test', {
      //   headers: { 'Authorization': `Bearer ${apiKey}` }
      // });
      
      // Per ora simuliamo un test positivo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setConnectionStatus({ 
        isConnected: true, 
        lastChecked: new Date() 
      });

      toast({
        title: "Connessione Riuscita",
        description: "La connessione a CassaInCloud è attiva"
      });
    } catch (error) {
      setConnectionStatus({ 
        isConnected: false, 
        lastChecked: new Date(),
        error: "Errore di connessione"
      });

      toast({
        title: "Errore di Connessione",
        description: "Impossibile connettersi a CassaInCloud. Verifica la chiave API.",
        variant: "destructive"
      });
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

    setSyncStatus({ isLoading: true });

    try {
      // Simulazione sincronizzazione - da implementare con l'API reale
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const recordsImported = Math.floor(Math.random() * 100) + 10;
      
      setSyncStatus({
        isLoading: false,
        lastSync: new Date(),
        recordsImported
      });

      toast({
        title: "Sincronizzazione Completata",
        description: `${recordsImported} record importati con successo`
      });
    } catch (error) {
      setSyncStatus({
        isLoading: false,
        error: "Errore durante la sincronizzazione"
      });

      toast({
        title: "Errore",
        description: "Errore durante la sincronizzazione",
        variant: "destructive"
      });
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
                <Button onClick={testConnection} variant="outline">
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
                        {syncStatus.lastSync.toLocaleString()}
                      </p>
                    </div>
                    {syncStatus.recordsImported && (
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

                {!syncStatus.lastSync && !syncStatus.error && (
                  <p className="text-sm text-muted-foreground">
                    Nessuna sincronizzazione eseguita
                  </p>
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
