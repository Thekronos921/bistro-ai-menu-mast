
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SettingsConfig {
  criticalThreshold: number;
  targetThreshold: number;
  targetPercentage: number;
}

interface SettingsDialogProps {
  settings: SettingsConfig;
  onSaveSettings: (settings: SettingsConfig) => void;
}

const SettingsDialog = ({ settings, onSaveSettings }: SettingsDialogProps) => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(settings);
  const { toast } = useToast();

  const handleSave = () => {
    if (formData.criticalThreshold <= 0 || formData.targetThreshold <= 0 || formData.targetPercentage <= 0 || formData.targetPercentage > 100) {
      toast({
        title: "Errore",
        description: "Inserire valori validi per tutte le soglie",
        variant: "destructive"
      });
      return;
    }

    onSaveSettings(formData);
    setOpen(false);
    
    toast({
      title: "Successo",
      description: "Impostazioni salvate con successo"
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-2" />
          Impostazioni
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Impostazioni Food Cost</DialogTitle>
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
          <Button variant="outline" onClick={() => setOpen(false)}>
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
