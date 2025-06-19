
import React, { useState } from 'react';
import { QrCode, Camera, Search, Package } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  current_stock: number;
  supplier_product_code?: string;
}

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredient: Ingredient | null;
}

const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  ingredient
}) => {
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const [barcodeValue, setBarcodeValue] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);

  if (!ingredient) return null;

  const handleCameraScan = () => {
    setIsScanning(true);
    // TODO: Implementare scanning con camera
    // Per ora mostriamo solo l'interfaccia
    setTimeout(() => {
      setIsScanning(false);
      setBarcodeValue('1234567890123'); // Barcode simulato
    }, 2000);
  };

  const handleManualEntry = (value: string) => {
    setBarcodeValue(value);
  };

  const handleSaveBarcode = () => {
    // TODO: Salvare il barcode associato all'ingrediente
    console.log('Saving barcode:', barcodeValue, 'for ingredient:', ingredient.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md mx-4">
        <DialogHeader>
          <DialogTitle className="flex items-center text-lg">
            <QrCode className="w-5 h-5 mr-2 text-blue-600" />
            Scanner Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ingrediente info */}
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-gray-500" />
              <h3 className="font-semibold text-slate-800">{ingredient.name}</h3>
            </div>
            {ingredient.supplier_product_code && (
              <div className="mt-1">
                <Badge variant="outline" className="text-xs">
                  Codice fornitore: {ingredient.supplier_product_code}
                </Badge>
              </div>
            )}
          </div>

          {/* Modalità scanning */}
          <div className="space-y-2">
            <Label>Modalità acquisizione</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={scanMode === 'camera' ? 'default' : 'outline'}
                onClick={() => setScanMode('camera')}
                className="justify-start"
              >
                <Camera className="w-4 h-4 mr-2" />
                Camera
              </Button>
              <Button
                variant={scanMode === 'manual' ? 'default' : 'outline'}
                onClick={() => setScanMode('manual')}
                className="justify-start"
              >
                <Search className="w-4 h-4 mr-2" />
                Manuale
              </Button>
            </div>
          </div>

          {/* Camera scanning */}
          {scanMode === 'camera' && (
            <div className="space-y-3">
              <Alert>
                <Camera className="h-4 w-4" />
                <AlertDescription>
                  La funzionalità di scanning con camera sarà disponibile nella prossima versione.
                  Per ora utilizza l'inserimento manuale.
                </AlertDescription>
              </Alert>
              
              <div className="bg-gray-100 rounded-lg p-8 text-center">
                {isScanning ? (
                  <div className="space-y-2">
                    <div className="animate-pulse">
                      <QrCode className="w-16 h-16 mx-auto text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-600">Scanning in corso...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <QrCode className="w-16 h-16 mx-auto text-gray-400" />
                    <Button onClick={handleCameraScan} disabled>
                      <Camera className="w-4 h-4 mr-2" />
                      Avvia Scanner (Presto disponibile)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Manual entry */}
          {scanMode === 'manual' && (
            <div className="space-y-2">
              <Label htmlFor="barcode">Inserisci codice a barre</Label>
              <Input
                id="barcode"
                type="text"
                placeholder="Codice a barre o QR code"
                value={barcodeValue}
                onChange={(e) => handleManualEntry(e.target.value)}
                className="text-center font-mono"
              />
              <p className="text-xs text-gray-500 text-center">
                Scansiona il codice o inseriscilo manualmente
              </p>
            </div>
          )}

          {/* Barcode trovato */}
          {barcodeValue && (
            <div className="bg-green-50 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-green-600" />
                <span className="text-green-700 font-medium">Codice acquisito:</span>
              </div>
              <p className="font-mono text-lg text-green-800 mt-1">{barcodeValue}</p>
            </div>
          )}

          {/* Azioni */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              onClick={handleSaveBarcode}
              className="flex-1"
              disabled={!barcodeValue}
            >
              Associa Codice
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BarcodeScannerModal;
