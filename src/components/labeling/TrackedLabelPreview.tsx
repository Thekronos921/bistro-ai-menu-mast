
import React from 'react';
import QRCode from 'qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package, AlertTriangle, Utensils, Tag, Info, Scale, Truck, Refrigerator } from 'lucide-react';

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
      case 'ingrediente':
        return <Tag className="w-4 h-4" />;
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
      case 'ingrediente':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto bg-white shadow-md border border-gray-100 print:shadow-none" data-label-preview>
      <CardContent className="p-5 space-y-4">
        {/* Header con titolo e tipo */}
        <div className="text-center border-b pb-3 mb-2">
          <h3 className="font-bold text-xl text-gray-900 leading-tight">{title}</h3>
          <Badge className={`mt-2 px-3 py-1 ${getTypeColor(type)}`}>
            {getTypeIcon(type)}
            <span className="ml-1 font-medium">{type}</span>
          </Badge>
        </div>

        {/* QR Code */}
        <div className="flex justify-center py-2">
          {qrCodeUrl && (
            <div className="p-2 bg-white border-2 border-gray-200 rounded-md shadow-sm">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-28 h-28"
              />
              <div className="text-center mt-1 text-xs text-gray-500">Scansiona per tracciare</div>
            </div>
          )}
        </div>

        {/* Informazioni principali - organizzate in sezioni */}
        <div className="space-y-4 text-sm">
          {/* Sezione 1: Informazioni di base */}
          <div className="bg-gray-50 p-3 rounded-md border border-gray-100 shadow-sm">
            <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 border-b pb-1">Informazioni Base</h4>
            <div className="grid grid-cols-2 gap-2">
              {batchNumber && (
                <div className="flex items-center">
                  <Info className="w-4 h-4 mr-2 text-gray-500" />
                  <div>
                    <span className="text-xs text-gray-500">Lotto</span>
                    <p className="font-mono font-medium">{batchNumber}</p>
                  </div>
                </div>
              )}

              {quantity && unit && (
                <div className="flex items-center">
                  <Scale className="w-4 h-4 mr-2 text-gray-500" />
                  <div>
                    <span className="text-xs text-gray-500">Quantità</span>
                    <p className="font-medium">{quantity} {unit}</p>
                  </div>
                </div>
              )}

              {supplier && (
                <div className="flex items-center col-span-2">
                  <Truck className="w-4 h-4 mr-2 text-gray-500" />
                  <div>
                    <span className="text-xs text-gray-500">Fornitore</span>
                    <p className="font-medium truncate">{supplier}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sezione 2: Date importanti */}
          {(productionDate || expiryDate) && (
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 shadow-sm">
              <h4 className="text-xs font-semibold text-blue-500 uppercase mb-2 border-b border-blue-100 pb-1">Date</h4>
              <div className="space-y-2">
                {productionDate && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium flex items-center text-blue-700">
                      <Calendar className="w-4 h-4 mr-1" />
                      Produzione:
                    </span>
                    <span>{new Date(productionDate).toLocaleDateString('it-IT')}</span>
                  </div>
                )}

                {expiryDate && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium flex items-center text-blue-700">
                      <Calendar className="w-4 h-4 mr-1" />
                      Scadenza:
                    </span>
                    <span className="font-bold">{new Date(expiryDate).toLocaleDateString('it-IT')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sezione 3: Informazioni aggiuntive */}
          <div className="space-y-2">
            {allergens && (
              <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 shadow-sm">
                <span className="font-medium text-yellow-800 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Allergeni:
                </span>
                <p className="text-yellow-700 mt-1">{allergens}</p>
              </div>
            )}

            {storageInstructions && (
              <div className="bg-indigo-50 p-3 rounded-md border border-indigo-100 shadow-sm">
                <span className="font-medium text-indigo-800 flex items-center">
                  <Refrigerator className="w-4 h-4 mr-1" />
                  Conservazione:
                </span>
                <p className="text-indigo-700 mt-1">{storageInstructions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer con timestamp */}
        <div className="text-center pt-3 mt-2 border-t border-gray-200 text-xs text-gray-500 flex flex-col items-center">
          <div className="flex items-center">
            <Info className="w-3 h-3 mr-1" />
            <span>Generato il {new Date().toLocaleDateString('it-IT')} alle {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="mt-1 text-[10px] text-gray-400">
            Sistema di tracciabilità Bistro AI
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackedLabelPreview;
