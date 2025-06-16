
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';
import { getSalesPoints as fetchSalesPoints } from '@/integrations/cassaInCloud/cassaInCloudService';

interface ConnectionStatus {
  isConnected: boolean;
  lastChecked?: Date;
  error?: string;
}

export const useCassaInCloudIntegration = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [effectiveApiKey, setEffectiveApiKey] = useState<string | null>(null);
  const [savedApiKeyExists, setSavedApiKeyExists] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({ isConnected: false });
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const { toast, dismiss } = useToast();
  const { restaurantId } = useRestaurant();

  useEffect(() => {
    setIsMounted(true);
    loadSavedSettings();
    return () => {
      setIsMounted(false);
    };
  }, [restaurantId]);

  const loadSavedSettings = async () => {
    if (!restaurantId || !isMounted) return;

    try {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .eq('integration_type', 'cassaincloud')
        .maybeSingle();

      if (data && !error) {
        setAutoSyncEnabled(data.auto_sync_enabled || false);
        if (data.api_key) {
          setEffectiveApiKey(data.api_key);
          setSavedApiKeyExists(true);
          if (isMounted) {
            setConnectionStatus({ 
              isConnected: true, 
              lastChecked: new Date(),
              error: undefined
            });
          }
        } else {
          setSavedApiKeyExists(false);
          setEffectiveApiKey(null);
        }
      } else if (error) {
        console.error('Errore nel caricamento impostazioni:', error);
        setSavedApiKeyExists(false);
        setEffectiveApiKey(null);
        toast({
          title: "Errore Caricamento Impostazioni",
          description: "Impossibile caricare le impostazioni di integrazione.",
          variant: "destructive"
        });
      } else {
        setSavedApiKeyExists(false);
        setEffectiveApiKey(null);
      }
    } catch (error) {
      console.error('Eccezione nel caricamento impostazioni:', error);
      setSavedApiKeyExists(false);
      setEffectiveApiKey(null);
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

    const isConnectionValid = await testConnection(keyToSave);
    if (!isConnectionValid) {
      return;
    }
    
    try {
      const { data: existingRecord } = await supabase
        .from('integration_settings')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('integration_type', 'cassaincloud')
        .maybeSingle();

      let result;
      if (existingRecord) {
        result = await supabase
          .from('integration_settings')
          .update({
            api_key: keyToSave,
            auto_sync_enabled: autoSyncEnabled,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id);
      } else {
        result = await supabase
          .from('integration_settings')
          .insert({
            restaurant_id: restaurantId,
            integration_type: 'cassaincloud',
            api_key: keyToSave,
            auto_sync_enabled: autoSyncEnabled,
            updated_at: new Date().toISOString()
          });
      }

      if (result.error) throw result.error;

      toast({
        title: "Successo",
        description: "Credenziali salvate con successo"
      });

      setEffectiveApiKey(keyToSave);
      setSavedApiKeyExists(true);
      setApiKey("");
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
      const salesPoints = await fetchSalesPoints(keyToEvaluate);

      if (salesPoints && salesPoints.length >= 0) { 
        if (isMounted) {
          setConnectionStatus({ 
            isConnected: true, 
            lastChecked: new Date(),
            error: undefined
          });
          setEffectiveApiKey(keyToEvaluate);
        }
        if (!silentMode) {
          toast({
            title: "Connessione Riuscita",
            description: "La connessione a CassaInCloud è attiva."
          });
        }
        if (loadingToastId) dismiss(loadingToastId);
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
      }
      if (!silentMode) {
        toast({
          title: "Errore di Connessione",
          description: `Impossibile connettersi a CassaInCloud. Dettagli: ${error.message || 'Verifica la chiave API e la console.'}`,
          variant: "destructive"
        });
      }
      if (loadingToastId) dismiss(loadingToastId);
      return false;
    }
  };

  return {
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
    testConnection,
    loadSavedSettings
  };
};
