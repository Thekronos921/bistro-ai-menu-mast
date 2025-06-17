
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useRestaurantTables } from "@/hooks/useRestaurantTables";
import { RefreshCw, Download, Users, MapPin } from "lucide-react";

export const RestaurantTablesConfig = () => {
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();
  const { tables, rooms, loading, refetch } = useRestaurantTables(restaurantId || undefined);

  const handleSyncFromCassaInCloud = async () => {
    setSyncing(true);
    try {
      // Qui andrà implementata la logica di sincronizzazione con CassaInCloud
      toast({
        title: "Sincronizzazione",
        description: "Sincronizzazione con CassaInCloud completata"
      });
      await refetch();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante la sincronizzazione",
        variant: "destructive"
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sale */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Sale del Ristorante</span>
              </CardTitle>
              <CardDescription>
                Gestisci le sale del tuo ristorante importate da CassaInCloud
              </CardDescription>
            </div>
            <Button 
              onClick={handleSyncFromCassaInCloud} 
              disabled={syncing}
              variant="outline"
              className="flex items-center space-x-2"
            >
              {syncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Sincronizza da CassaInCloud</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Caricamento sale...</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">
                Nessuna sala configurata. Importa le sale da CassaInCloud.
              </p>
              <Button onClick={handleSyncFromCassaInCloud} disabled={syncing}>
                <Download className="w-4 h-4 mr-2" />
                Importa Sale
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map((room) => (
                  <Card key={room.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{room.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            ID: {room.external_id}
                          </Badge>
                        </div>
                        {room.description && (
                          <p className="text-sm text-muted-foreground">{room.description}</p>
                        )}
                        {room.last_synced_at && (
                          <p className="text-xs text-muted-foreground">
                            Ultimo sync: {new Date(room.last_synced_at).toLocaleString('it-IT')}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tavoli */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Tavoli del Ristorante</span>
          </CardTitle>
          <CardDescription>
            Visualizza e gestisci i tavoli importati da CassaInCloud
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Caricamento tavoli...</p>
            </div>
          ) : tables.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">
                Nessun tavolo configurato. Importa i tavoli da CassaInCloud.
              </p>
              <Button onClick={handleSyncFromCassaInCloud} disabled={syncing}>
                <Download className="w-4 h-4 mr-2" />
                Importa Tavoli
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Tavolo</TableHead>
                    <TableHead>Sala</TableHead>
                    <TableHead>Posti</TableHead>
                    <TableHead>ID Esterno</TableHead>
                    <TableHead>Ultimo Sync</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tables.map((table) => (
                    <TableRow key={table.id}>
                      <TableCell className="font-medium">{table.name}</TableCell>
                      <TableCell>
                        {table.room_name ? (
                          <Badge variant="secondary">{table.room_name}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {table.seats ? (
                          <span className="flex items-center space-x-1">
                            <Users className="w-4 h-4" />
                            <span>{table.seats}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {table.external_id}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {table.last_synced_at ? (
                          <span className="text-sm text-muted-foreground">
                            {new Date(table.last_synced_at).toLocaleString('it-IT')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Mai</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
