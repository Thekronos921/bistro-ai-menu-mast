
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "lucide-react";

interface SettingsTabProps {
  autoSyncEnabled: boolean;
  setAutoSyncEnabled: (enabled: boolean) => void;
}

export const SettingsTab = ({ autoSyncEnabled, setAutoSyncEnabled }: SettingsTabProps) => {
  return (
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
  );
};
