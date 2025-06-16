
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Cloud } from "lucide-react";
import { useCassaInCloudIntegration } from "@/hooks/useCassaInCloudIntegration";
import { ConnectionTab } from "@/components/cassaInCloud/ConnectionTab";
import { SyncTab } from "@/components/cassaInCloud/SyncTab";
import { SettingsTab } from "@/components/cassaInCloud/SettingsTab";

const CassaInCloudIntegration = () => {
  const {
    isMounted,
    apiKey,
    setApiKey,
    effectiveApiKey,
    savedApiKeyExists,
    connectionStatus,
    autoSyncEnabled,
    setAutoSyncEnabled,
    restaurantId,
    saveApiKey,
    testConnection
  } = useCassaInCloudIntegration();

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
          <ConnectionTab
            apiKey={apiKey}
            setApiKey={setApiKey}
            savedApiKeyExists={savedApiKeyExists}
            connectionStatus={connectionStatus}
            testConnection={testConnection}
            saveApiKey={saveApiKey}
          />
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <SyncTab
            savedApiKeyExists={savedApiKeyExists}
            apiKey={apiKey}
            effectiveApiKey={effectiveApiKey}
            connectionStatus={connectionStatus}
            restaurantId={restaurantId}
            testConnection={testConnection}
            isMounted={isMounted}
          />
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <SettingsTab
            autoSyncEnabled={autoSyncEnabled}
            setAutoSyncEnabled={setAutoSyncEnabled}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CassaInCloudIntegration;
