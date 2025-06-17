
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Cloud, Settings, Webhook } from "lucide-react";
import { Link } from "react-router-dom";
import { WebhookConfigurationDialog } from "@/components/WebhookConfigurationDialog";
import { useRestaurant } from "@/hooks/useRestaurant";

export const RestaurantIntegrations = () => {
  const { restaurantId } = useRestaurant();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Cloud className="w-5 h-5" />
            <span>Integrazioni Esterne</span>
          </CardTitle>
          <CardDescription>
            Configura le integrazioni con sistemi esterni
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* CassaInCloud Integration */}
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Cloud className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-medium">CassaInCloud</h3>
                  <p className="text-sm text-muted-foreground">
                    Sincronizzazione con il sistema di cassa
                  </p>
                </div>
              </div>
              <Badge variant="outline">Attivo</Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link to="/cassa-in-cloud">
                  <Settings className="w-4 h-4 mr-2" />
                  Gestisci Integrazione
                </Link>
              </Button>
              
              {restaurantId && (
                <WebhookConfigurationDialog 
                  restaurantId={restaurantId}
                  trigger={
                    <Button variant="outline" className="flex-1">
                      <Webhook className="w-4 h-4 mr-2" />
                      Configura Webhook
                    </Button>
                  }
                />
              )}
            </div>
            
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded">
              <p><strong>Funzioni disponibili:</strong></p>
              <ul className="mt-1 space-y-1">
                <li>• Sincronizzazione categorie e prodotti</li>
                <li>• Importazione dati di vendita</li>
                <li>• Gestione clienti</li>
                <li>• Importazione tavoli e sale</li>
                <li>• Webhook automatici per dati in tempo reale</li>
              </ul>
            </div>
          </div>

          {/* Placeholder per future integrazioni */}
          <div className="border rounded-lg p-4 space-y-4 opacity-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-medium">Altre Integrazioni</h3>
                  <p className="text-sm text-muted-foreground">
                    Prossimamente disponibili
                  </p>
                </div>
              </div>
              <Badge variant="secondary">Presto Disponibile</Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Stiamo lavorando per aggiungere altre integrazioni con sistemi di gestione ristorante, 
              piattaforme di delivery e servizi di analisi.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
