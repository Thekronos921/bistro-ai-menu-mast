import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Copy, Settings, Activity, AlertCircle, CheckCircle, Webhook } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  getWebhookConfiguration,
  configureSalesPointMapping,
  getWebhookStats,
  getSalesDataByPeriod,
  checkBillProcessingStatus,
  simulateWebhook,
  type CassaInCloudBill
} from '@/integrations/cassaInCloud/cassaInCloudWebhookService';

interface WebhookConfigurationDialogProps {
  restaurantId: string;
  trigger?: React.ReactNode;
}

interface WebhookStats {
  totalBills: number;
  successfulBills: number;
  lastProcessedAt?: string;
  averageItemsPerBill: number;
  error?: string;
}

interface WebhookConfig {
  salesPointId?: string;
  webhookUrl: string;
  isConfigured: boolean;
  error?: string;
}

export function WebhookConfigurationDialog({ 
  restaurantId, 
  trigger 
}: WebhookConfigurationDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [salesPointId, setSalesPointId] = useState('');
  const [config, setConfig] = useState<WebhookConfig | null>(null);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [testBillId, setTestBillId] = useState('');
  const { toast } = useToast();

  // Carica la configurazione esistente
  useEffect(() => {
    if (open && restaurantId) {
      loadConfiguration();
      loadStats();
    }
  }, [open, restaurantId]);

  const loadConfiguration = async () => {
    try {
      const configuration = await getWebhookConfiguration(restaurantId);
      setConfig(configuration);
      setSalesPointId(configuration.salesPointId || '');
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare la configurazione webhook",
        variant: "destructive"
      });
    }
  };

  const loadStats = async () => {
    try {
      const webhookStats = await getWebhookStats(restaurantId, 30);
      setStats(webhookStats);
    } catch (error) {
      console.error('Errore nel caricamento statistiche:', error);
    }
  };

  const handleSaveConfiguration = async () => {
    if (!salesPointId.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci l'ID del punto vendita",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = await configureSalesPointMapping(restaurantId, salesPointId.trim());
      
      if (result.success) {
        toast({
          title: "Successo",
          description: "Configurazione webhook salvata correttamente"
        });
        await loadConfiguration();
      } else {
        toast({
          title: "Errore",
          description: result.error || "Errore nel salvataggio",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore imprevisto nel salvataggio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyWebhookUrl = () => {
    if (config?.webhookUrl) {
      navigator.clipboard.writeText(config.webhookUrl);
      toast({
        title: "Copiato",
        description: "URL webhook copiato negli appunti"
      });
    }
  };

  const handleTestWebhook = async () => {
    if (!testBillId.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un ID conto per il test",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Crea un conto di test
      const mockBill: CassaInCloudBill = {
        id: testBillId,
        salesPointId: salesPointId,
        closedAt: new Date().toISOString(),
        totalAmount: 25.50,
        items: [
          {
            id: 'item1',
            name: 'Pizza Margherita',
            quantity: 1,
            unitPrice: 12.00,
            totalPrice: 12.00,
            productId: 'prod_123'
          },
          {
            id: 'item2',
            name: 'Coca Cola',
            quantity: 2,
            unitPrice: 3.50,
            totalPrice: 7.00,
            productId: 'prod_456'
          }
        ],
        billNumber: `TEST-${testBillId}`
      };

      const result = await simulateWebhook(restaurantId, mockBill);
      
      if (result.success) {
        toast({
          title: "Test completato",
          description: `Webhook testato con successo per il conto ${result.billId}`
        });
        await loadStats();
      } else {
        toast({
          title: "Test fallito",
          description: result.errors?.[0] || "Errore nel test webhook",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nel test webhook",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckBillStatus = async () => {
    if (!testBillId.trim()) {
      toast({
        title: "Errore",
        description: "Inserisci un ID conto da verificare",
        variant: "destructive"
      });
      return;
    }

    try {
      const status = await checkBillProcessingStatus(testBillId, restaurantId);
      
      toast({
        title: status.processed ? "Conto processato" : "Conto non trovato",
        description: status.processed 
          ? `Ultimo aggiornamento: ${status.lastUpdated}`
          : "Il conto non è stato ancora processato"
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore nella verifica dello stato",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Webhook className="h-4 w-4 mr-2" />
            Configura Webhook
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurazione Webhook CassaInCloud</DialogTitle>
          <DialogDescription>
            Configura l'integrazione automatica per ricevere i dati di vendita da CassaInCloud
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="config" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Configurazione</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoraggio</TabsTrigger>
            <TabsTrigger value="testing">Test</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurazione Base
                </CardTitle>
                <CardDescription>
                  Configura il mapping tra il punto vendita CassaInCloud e il tuo ristorante
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="salesPointId">ID Punto Vendita CassaInCloud</Label>
                  <Input
                    id="salesPointId"
                    value={salesPointId}
                    onChange={(e) => setSalesPointId(e.target.value)}
                    placeholder="es. SP001"
                  />
                  <p className="text-sm text-muted-foreground">
                    Inserisci l'ID del punto vendita configurato in CassaInCloud
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>URL Webhook</Label>
                  <div className="flex gap-2">
                    <Input
                      value={config?.webhookUrl || 'Caricamento...'}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopyWebhookUrl}
                      disabled={!config?.webhookUrl}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Usa questo URL per configurare il webhook in CassaInCloud
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={config?.isConfigured ? "default" : "secondary"}>
                    {config?.isConfigured ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Configurato</>
                    ) : (
                      <><AlertCircle className="h-3 w-3 mr-1" /> Non configurato</>
                    )}
                  </Badge>
                </div>

                <Button 
                  onClick={handleSaveConfiguration} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Salvataggio...' : 'Salva Configurazione'}
                </Button>

                {config?.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{config.error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Istruzioni per CassaInCloud</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <p><strong>1.</strong> Accedi al pannello di amministrazione di CassaInCloud</p>
                  <p><strong>2.</strong> Vai su Impostazioni → Webhook</p>
                  <p><strong>3.</strong> Crea un nuovo webhook per l'entità "Bill"</p>
                  <p><strong>4.</strong> Inserisci l'URL webhook mostrato sopra</p>
                  <p><strong>5.</strong> Configura gli eventi: "Bill Created", "Bill Updated"</p>
                  <p><strong>6.</strong> Imposta il secret token per la firma HMAC</p>
                  <p><strong>7.</strong> Salva e attiva il webhook</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Statistiche Webhook (ultimi 30 giorni)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.totalBills}</div>
                      <div className="text-sm text-muted-foreground">Conti Totali</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.successfulBills}</div>
                      <div className="text-sm text-muted-foreground">Processati</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{stats.averageItemsPerBill}</div>
                      <div className="text-sm text-muted-foreground">Media Items/Conto</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">
                        {stats.lastProcessedAt 
                          ? new Date(stats.lastProcessedAt).toLocaleString('it-IT')
                          : 'Mai'
                        }
                      </div>
                      <div className="text-sm text-muted-foreground">Ultimo Processato</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Caricamento statistiche...</p>
                  </div>
                )}

                {stats?.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{stats.error}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  variant="outline" 
                  onClick={loadStats}
                  className="w-full mt-4"
                >
                  Aggiorna Statistiche
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="testing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Webhook</CardTitle>
                <CardDescription>
                  Testa il funzionamento del webhook con dati simulati
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="testBillId">ID Conto Test</Label>
                  <Input
                    id="testBillId"
                    value={testBillId}
                    onChange={(e) => setTestBillId(e.target.value)}
                    placeholder="es. TEST001"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={handleTestWebhook}
                    disabled={loading || !config?.isConfigured}
                    className="flex-1"
                  >
                    {loading ? 'Testing...' : 'Simula Webhook'}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleCheckBillStatus}
                    disabled={!testBillId.trim()}
                  >
                    Verifica Stato
                  </Button>
                </div>

                {!config?.isConfigured && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Configura prima il punto vendita per abilitare i test
                    </AlertDescription>
                  </Alert>
                )}

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Nota:</strong> Il test webhook è disponibile solo in ambiente di sviluppo.
                    In produzione, i webhook saranno processati automaticamente da CassaInCloud.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}