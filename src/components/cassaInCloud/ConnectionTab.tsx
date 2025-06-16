
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Key, RefreshCw, CheckCircle, XCircle, AlertCircle, Database } from "lucide-react";

interface ConnectionTabProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  savedApiKeyExists: boolean;
  connectionStatus: {
    isConnected: boolean;
    lastChecked?: Date;
    error?: string;
  };
  testConnection: () => Promise<boolean>;
  saveApiKey: () => Promise<void>;
}

export const ConnectionTab = ({
  apiKey,
  setApiKey,
  savedApiKeyExists,
  connectionStatus,
  testConnection,
  saveApiKey
}: ConnectionTabProps) => {
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
  );
};
