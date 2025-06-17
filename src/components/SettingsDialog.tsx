
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface SettingsConfig {
  criticalThreshold: number;
  targetThreshold: number;
  targetPercentage: number;
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const [formData, setFormData] = useState<SettingsConfig>({
    criticalThreshold: 40,
    targetThreshold: 35,
    targetPercentage: 80
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSave = async () => {
    if (formData.criticalThreshold <= 0 || formData.targetThreshold <= 0 || formData.targetPercentage <= 0 || formData.targetPercentage > 100) {
      toast({
        title: "Errore",
        description: "Inserire valori validi per tutte le soglie",
        variant: "destructive"
      });
      return;
    }

    try {
      // Save settings to user profile or a settings table
      const { error } = await supabase
        .from('user_profiles')
        .update({
          settings: formData
        })
        .eq('id', user?.id);

      if (error) throw error;

      onOpenChange(false);
      
      toast({
        title: "Successo",
        description: "Impostazioni salvate con successo"
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Errore",
        description: "Errore nel salvare le impostazioni",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Impostazioni Utente</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Soglia Food Cost Critico (%)
            </label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.criticalThreshold}
              onChange={(e) => setFormData({...formData, criticalThreshold: parseFloat(e.target.value) || 0})}
              placeholder="40"
            />
            <p className="text-xs text-slate-500 mt-1">
              Piatti con FC% superiore a questa soglia sono considerati critici
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Soglia Food Cost Target (%)
            </label>
            <Input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.targetThreshold}
              onChange={(e) => setFormData({...formData, targetThreshold: parseFloat(e.target.value) || 0})}
              placeholder="35"
            />
            <p className="text-xs text-slate-500 mt-1">
              Obiettivo di FC% per i piatti del menu
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Target Percentuale Piatti (%)
            </label>
            <Input
              type="number"
              step="1"
              min="0"
              max="100"
              value={formData.targetPercentage}
              onChange={(e) => setFormData({...formData, targetPercentage: parseFloat(e.target.value) || 0})}
              placeholder="80"
            />
            <p className="text-xs text-slate-500 mt-1">
              Percentuale di piatti che dovrebbero raggiungere il target FC%
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button onClick={handleSave}>
            Salva Impostazioni
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
