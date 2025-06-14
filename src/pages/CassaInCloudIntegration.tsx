import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle, CircleX, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as cassaInCloudService from '@/integrations/cassaInCloud/cassaInCloudService';
import * as cassaInCloudImporter from '@/integrations/cassaInCloud/cassaInCloudImportService';

interface DateRange {
  from?: Date;
  to?: Date;
}

const CassaInCloudIntegration = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [cassaSettings, setCassaSettings] = useState({
    apiUrl: '',
    apiKey: '',
    idSalesPoint: ''
  });
  const [isSettingsValid, setIsSettingsValid] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date(),
  });

  useEffect(() => {
    if (userProfile?.restaurant) {
      setCassaSettings({
        apiUrl: userProfile.restaurant.vat_number || '', // Utilizza vat_number come apiUrl temporaneamente
        apiKey: '',
        idSalesPoint: ''
      });
    }
  }, [userProfile]);

  useEffect(() => {
    // Validate settings
    setIsSettingsValid(
      !!cassaSettings.apiUrl && !!cassaSettings.apiKey && !!cassaSettings.idSalesPoint
    );
  }, [cassaSettings]);

  const handleSettingsChange = (field: string, value: string) => {
    setCassaSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImportSalesData = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      toast({
        title: "Errore",
        description: "Seleziona un periodo di date valido",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    try {
      const from = format(dateRange.from, 'yyyy-MM-dd');
      const to = format(dateRange.to, 'yyyy-MM-dd');
      
      // Fix: Add required start and limit parameters
      const receiptsData = await cassaInCloudService.getReceipts(cassaSettings, { 
        datetimeFrom: from,
        datetimeTo: to,
        start: 0,
        limit: 1000 
      });
      
      await cassaInCloudImporter.importSalesData(receiptsData, userProfile.restaurant_id);
      
      toast({
        title: "Successo",
        description: "Dati di vendita importati con successo",
      });
    } catch (error: any) {
      toast({
        title: "Errore",
        description: `Errore durante l'importazione: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Integrazione Cassa in Cloud</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Impostazioni di Integrazione</CardTitle>
          <CardDescription>
            Configura le impostazioni per connettere Bistro AI a Cassa in Cloud.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="api-url">API URL</Label>
            <Input
              id="api-url"
              value={cassaSettings.apiUrl}
              onChange={(e) => handleSettingsChange('apiUrl', e.target.value)}
              placeholder="https://api.cassa-in-cloud.it"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              value={cassaSettings.apiKey}
              onChange={(e) => handleSettingsChange('apiKey', e.target.value)}
              placeholder="Inserisci la tua API Key"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="id-sales-point">ID Sales Point</Label>
            <Input
              id="id-sales-point"
              value={cassaSettings.idSalesPoint}
              onChange={(e) => handleSettingsChange('idSalesPoint', e.target.value)}
              placeholder="Inserisci l'ID del Sales Point"
            />
          </div>
          <div className="flex items-center space-x-2">
            {isSettingsValid ? (
              <>
                <CheckCircle className="text-green-500 h-5 w-5" />
                <span className="text-sm text-green-500">Impostazioni valide</span>
              </>
            ) : (
              <>
                <CircleX className="text-red-500 h-5 w-5" />
                <span className="text-sm text-red-500">Impostazioni non valide</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Importa Dati di Vendita</CardTitle>
          <CardDescription>
            Seleziona un intervallo di date per importare i dati di vendita da Cassa in Cloud.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label>Seleziona Intervallo Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[280px] justify-start text-left font-normal",
                    !dateRange?.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
                    ) : (
                      format(dateRange.from, "dd/MM/yyyy")
                    )
                  ) : (
                    <span>Seleziona un intervallo di date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center" side="bottom">
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button onClick={handleImportSalesData} disabled={!isSettingsValid || isImporting}>
            {isImporting ? (
              <>
                Importazione in corso...
                {/* <Loader2 className="ml-2 h-4 w-4 animate-spin" /> */}
              </>
            ) : (
              <>
                <Settings className="mr-2 h-4 w-4" />
                Importa Dati di Vendita
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CassaInCloudIntegration;
