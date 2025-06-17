
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { ShiftManagementPage } from "@/components/shifts/ShiftManagementPage";

export const RestaurantShiftsConfig = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Configurazione Turni</span>
          </CardTitle>
          <CardDescription>
            Gestisci i turni di lavoro e gli orari di apertura del ristorante
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ShiftManagementPage />
        </CardContent>
      </Card>
    </div>
  );
};
