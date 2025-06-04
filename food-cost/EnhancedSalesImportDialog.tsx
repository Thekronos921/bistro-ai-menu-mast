
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, FileText, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface SalesData {
  dishName: string;
  unitsSold: number;
  saleDate: string;
  period?: string;
}

interface ParsedCSVData {
  headers: string[];
  rows: string[][];
  valid: boolean;
  errors: string[];
}

interface ColumnMapping {
  dishName: string;
  unitsSold: string;
  saleDate: string;
}

interface EnhancedSalesImportDialogProps {
  onImportSales: (salesData: SalesData[]) => void;
}

const EnhancedSalesImportDialog = ({ onImportSales }: EnhancedSalesImportDialogProps) => {
  const [open, setOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCSVData | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    dishName: '',
    unitsSold: '',
    saleDate: ''
  });
  const [validatedData, setValidatedData] = useState<SalesData[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

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
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        setParsedData({
          headers: [],
          rows: [],
          valid: false,
          errors: ['Il file deve contenere almeno un header e una riga di dati']
        });
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const rows = lines.slice(1).map(line => 
        line.split(',').map(cell => cell.trim().replace(/"/g, ''))
      );

      // Auto-detect column mappings
      const autoMapping: ColumnMapping = {
        dishName: '',
        unitsSold: '',
        saleDate: ''
      };

      headers.forEach((header, index) => {
        const lowerHeader = header.toLowerCase();
        if (lowerHeader.includes('nome') || lowerHeader.includes('dish') || lowerHeader.includes('piatto')) {
          autoMapping.dishName = header;
        } else if (lowerHeader.includes('vendute') || lowerHeader.includes('sold') || lowerHeader.includes('quantity') || lowerHeader.includes('qta')) {
          autoMapping.unitsSold = header;
        } else if (lowerHeader.includes('data') || lowerHeader.includes('date') || lowerHeader.includes('vendita')) {
          autoMapping.saleDate = header;
        }
      });

      setColumnMapping(autoMapping);
      setParsedData({
        headers,
        rows,
        valid: true,
        errors: []
      });

    } catch (error) {
      console.error('Error parsing CSV:', error);
      setParsedData({
        headers: [],
        rows: [],
        valid: false,
        errors: ['Errore nella lettura del file CSV']
      });
    }
  };

  const validateData = () => {
    if (!parsedData || !columnMapping.dishName || !columnMapping.unitsSold || !columnMapping.saleDate) {
      setValidationErrors(['Mappatura delle colonne incompleta']);
      return;
    }

    const dishNameIndex = parsedData.headers.indexOf(columnMapping.dishName);
    const unitsSoldIndex = parsedData.headers.indexOf(columnMapping.unitsSold);
    const saleDateIndex = parsedData.headers.indexOf(columnMapping.saleDate);

    const validated: SalesData[] = [];
    const errors: string[] = [];

    parsedData.rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because index starts from 0 and we skip header
      
      if (row.length <= Math.max(dishNameIndex, unitsSoldIndex, saleDateIndex)) {
        errors.push(`Riga ${rowNumber}: Numero insufficiente di colonne`);
        return;
      }

      const dishName = row[dishNameIndex]?.trim();
      const unitsSoldStr = row[unitsSoldIndex]?.trim();
      const saleDateStr = row[saleDateIndex]?.trim();

      // Validate dish name
      if (!dishName) {
        errors.push(`Riga ${rowNumber}: Nome piatto mancante`);
        return;
      }

      // Validate units sold
      const unitsSold = parseInt(unitsSoldStr);
      if (isNaN(unitsSold) || unitsSold < 0) {
        errors.push(`Riga ${rowNumber}: Unità vendute non valide (${unitsSoldStr})`);
        return;
      }

      // Validate sale date
      const saleDate = new Date(saleDateStr);
      if (isNaN(saleDate.getTime())) {
        errors.push(`Riga ${rowNumber}: Data di vendita non valida (${saleDateStr})`);
        return;
      }

      validated.push({
        dishName,
        unitsSold,
        saleDate: saleDate.toISOString().split('T')[0]
      });
    });

    setValidatedData(validated);
    setValidationErrors(errors);
  };

  const handleImport = () => {
    if (validatedData.length === 0) {
      toast({
        title: "Errore",
        description: "Nessun dato valido da importare",
        variant: "destructive"
      });
      return;
    }

    onImportSales(validatedData);
    setOpen(false);
    resetForm();
    
    toast({
      title: "Successo",
      description: `Importati ${validatedData.length} record di vendita${validationErrors.length > 0 ? ` (${validationErrors.length} errori ignorati)` : ''}`
    });
  };

  const resetForm = () => {
    setCsvFile(null);
    setParsedData(null);
    setColumnMapping({ dishName: '', unitsSold: '', saleDate: '' });
    setValidatedData([]);
    setValidationErrors([]);
  };

  const downloadTemplate = () => {
    const csvContent = "Nome Piatto,Unità Vendute,Data Vendita\nRisotto ai Funghi,45,2024-01-15\nSpaghetti Carbonara,38,2024-01-15\nTiramisù,22,2024-01-16";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_vendite_con_data.csv';
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importa Dati di Vendita Avanzato</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* File Upload Section */}
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
              Il CSV deve contenere: Nome Piatto, Unità Vendute, Data Vendita
            </p>
          </div>

          {/* Column Mapping Section */}
          {parsedData && parsedData.valid && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Mappatura Colonne</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nome Piatto</label>
                  <Select value={columnMapping.dishName} onValueChange={(value) => setColumnMapping(prev => ({ ...prev, dishName: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona colonna..." />
                    </SelectTrigger>
                    <SelectContent>
                      {parsedData.headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Unità Vendute</label>
                  <Select value={columnMapping.unitsSold} onValueChange={(value) => setColumnMapping(prev => ({ ...prev, unitsSold: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona colonna..." />
                    </SelectTrigger>
                    <SelectContent>
                      {parsedData.headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Data Vendita</label>
                  <Select value={columnMapping.saleDate} onValueChange={(value) => setColumnMapping(prev => ({ ...prev, saleDate: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona colonna..." />
                    </SelectTrigger>
                    <SelectContent>
                      {parsedData.headers.map(header => (
                        <SelectItem key={header} value={header}>{header}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={validateData} 
                className="mt-4"
                disabled={!columnMapping.dishName || !columnMapping.unitsSold || !columnMapping.saleDate}
              >
                Valida Dati
              </Button>
            </div>
          )}

          {/* Data Preview Section */}
          {parsedData && parsedData.valid && (
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                Anteprima Dati ({parsedData.rows.length} righe)
              </h4>
              <div className="max-h-40 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {parsedData.headers.map((header, index) => (
                        <th key={index} className="text-left p-2 font-medium">
                          {header}
                          {header === columnMapping.dishName && <Badge className="ml-1" variant="secondary">Nome</Badge>}
                          {header === columnMapping.unitsSold && <Badge className="ml-1" variant="secondary">Vendite</Badge>}
                          {header === columnMapping.saleDate && <Badge className="ml-1" variant="secondary">Data</Badge>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.rows.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex} className="p-2">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {parsedData.rows.length > 5 && (
                  <p className="text-xs text-slate-500 mt-2">
                    ... e altre {parsedData.rows.length - 5} righe
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Validation Results */}
          {validatedData.length > 0 && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {validatedData.length} record validi pronti per l'importazione
              </AlertDescription>
            </Alert>
          )}

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="max-h-32 overflow-y-auto">
                  <p className="font-medium mb-1">{validationErrors.length} errori trovati:</p>
                  <ul className="text-xs space-y-1">
                    {validationErrors.slice(0, 10).map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                    {validationErrors.length > 10 && <li>... e altri {validationErrors.length - 10} errori</li>}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={validatedData.length === 0}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            Importa {validatedData.length} Record
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EnhancedSalesImportDialog;
