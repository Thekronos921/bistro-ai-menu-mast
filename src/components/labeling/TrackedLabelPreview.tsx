
import React from 'react';
import QRCode from 'qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package, AlertTriangle, Utensils } from 'lucide-react';

interface TrackedLabelPreviewProps {
  title: string;
  type: string;
  productionDate?: string;
  expiryDate?: string;
  batchNumber?: string;
  qrData: string;
  storageInstructions?: string;
  allergens?: string;
  quantity?: number;
  unit?: string;
  supplier?: string;
}

const TrackedLabelPreview = ({
  title,
  type,
  productionDate,
  expiryDate,
  batchNumber,
  qrData,
  storageInstructions,
  allergens,
  quantity,
  unit,
  supplier
}: TrackedLabelPreviewProps) => {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('');

  React.useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(qrData, {
          width: 120,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(url);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    if (qrData) {
      generateQR();
    }
  }, [qrData]);

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'semilavorato':
        return <Package className="w-4 h-4" />;
      case 'lavorato':
        return <Utensils className="w-4 h-4" />;
      case 'defrosted':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'semilavorato':
        return 'bg-blue-100 text-blue-800';
      case 'lavorato':
        return 'bg-green-100 text-green-800';
      case 'defrosted':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto bg-white" data-label-preview>
      <CardContent className="p-4 space-y-3">
        {/* Header con titolo e tipo */}
        <div className="text-center border-b pb-2">
          <h3 className="font-bold text-lg text-gray-900 leading-tight">{title}</h3>
          <Badge className={`mt-1 ${getTypeColor(type)}`}>
            {getTypeIcon(type)}
            <span className="ml-1">{type}</span>
          </Badge>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          {qrCodeUrl && (
            <img
              src={qrCodeUrl}
              alt="QR Code"
              className="w-24 h-24 border border-gray-200 rounded"
            />
          )}
        </div>

        {/* Informazioni principali */}
        <div className="space-y-2 text-xs">
          {batchNumber && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Lotto:</span>
              <span className="font-mono">{batchNumber}</span>
            </div>
          )}

          {quantity && unit && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Quantità:</span>
              <span>{quantity} {unit}</span>
            </div>
          )}

          {supplier && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Fornitore:</span>
              <span className="truncate ml-2">{supplier}</span>
            </div>
          )}

          {productionDate && (
            <div className="flex items-center justify-between">
              <span className="font-medium flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                Produzione:
              </span>
              <span>{new Date(productionDate).toLocaleDateString('it-IT')}</span>
            </div>
          )}

          {expiryDate && (
            <div className="flex items-center justify-between">
              <span className="font-medium flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                Scadenza:
              </span>
              <span className="font-bold">{new Date(expiryDate).toLocaleDateString('it-IT')}</span>
            </div>
          )}

          {allergens && (
            <div className="bg-yellow-50 p-2 rounded border">
              <span className="font-medium text-yellow-800 text-xs">Allergeni:</span>
              <p className="text-yellow-700 text-xs mt-1">{allergens}</p>
            </div>
          )}

          {storageInstructions && (
            <div className="bg-blue-50 p-2 rounded border">
              <span className="font-medium text-blue-800 text-xs">Conservazione:</span>
              <p className="text-blue-700 text-xs mt-1">{storageInstructions}</p>
            </div>
          )}
        </div>

        {/* Footer con timestamp */}
        <div className="text-center pt-2 border-t text-xs text-gray-500">
          Generato il {new Date().toLocaleDateString('it-IT')} alle {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackedLabelPreview;
