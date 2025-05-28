
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SalesData {
  dishName: string;
  unitsSold: number;
  period: string;
}

interface SalesDataImportDialogProps {
  onImportSales: (salesData: SalesData[]) => void;
}

const SalesDataImportDialog = ({ onImportSales }: SalesDataImportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("last30days");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<SalesData[]>([]);
  const { toast } = useToast();

  const periods = [
    { value: "today", label: "Oggi" },
    { value: "yesterday", label: "Ieri" },
    { value: "last7days", label: "Ultimi 7 giorni" },
    { value: "last30days", label: "Ultimi 30 giorni" },
    { value: "currentMonth", label: "Mese Corrente" },
    { value: "lastMonth", label: "Mese Scorso" }
  ];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      parseCSV(file);
    } else {
      toast({
        title: "Errore",
        description: "Seleziona un file CSV valido",
        variant: "destructive"
      });
    }
  };

  const parseCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Trova gli indici delle colonne necessarie
    const nameIndex = headers.findIndex(h => h.includes('nome') || h.includes('dish') || h.includes('piatto'));
    const unitsIndex = headers.findIndex(h => h.includes('vendute') || h.includes('sold') || h.includes('quantity') || h.includes('qta'));
    
    if (nameIndex === -1 || unitsIndex === -1) {
      toast({
        title: "Errore CSV",
        description: "Il CSV deve contenere colonne per nome piatto e quantità vendute",
        variant: "destructive"
      });
      return;
    }

    const salesData: SalesData[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length >= Math.max(nameIndex, unitsIndex) + 1) {
        const dishName = values[nameIndex]?.trim();
        const unitsSold = parseInt(values[unitsIndex]?.trim()) || 0;
        
        if (dishName && unitsSold > 0) {
          salesData.push({
            dishName,
            unitsSold,
            period: selectedPeriod
          });
        }
      }
    }
    
    setPreviewData(salesData);
    console.log('CSV parsed:', salesData);
  };

  const handleImport = () => {
    if (previewData.length === 0) {
      toast({
        title: "Errore",
        description: "Nessun dato valido trovato nel CSV",
        variant: "destructive"
      });
      return;
    }

    onImportSales(previewData);
    setOpen(false);
    setCsvFile(null);
    setPreviewData([]);
    
    toast({
      title: "Successo",
      description: `Importati dati di vendita per ${previewData.length} piatti`
    });
  };

  const downloadTemplate = () => {
    const csvContent = "Nome Piatto,Quantità Vendute\nRisotto ai Funghi,45\nSpaghetti Carbonara,38\nTiramisù,22";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_vendite.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="w-4 h-4 mr-2" />
          Importa Dati Vendite
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importa Dati di Vendita</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Periodo di Riferimento</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periods.map(period => (
                  <SelectItem key={period.value} value={period.value}>
                    {period.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">File CSV</label>
              <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                <Download className="w-4 h-4 mr-1" />
                Template
              </Button>
            </div>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
            <p className="text-xs text-slate-500 mt-1">
              Il CSV deve contenere colonne: Nome Piatto, Quantità Vendute
            </p>
          </div>

          {previewData.length > 0 && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Anteprima Dati ({previewData.length} piatti)
              </h4>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Nome Piatto</th>
                      <th className="text-right p-2">Vendite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.slice(0, 10).map((item, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="p-2">{item.dishName}</td>
                        <td className="p-2 text-right">{item.unitsSold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previewData.length > 10 && (
                  <p className="text-xs text-slate-500 mt-2">
                    ... e altri {previewData.length - 10} piatti
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button onClick={handleImport} disabled={previewData.length === 0}>
            Importa Dati
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SalesDataImportDialog;
