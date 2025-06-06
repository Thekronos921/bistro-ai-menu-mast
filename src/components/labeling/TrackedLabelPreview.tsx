
import React from 'react';
import QRCode from 'qrcode';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package, AlertTriangle, Utensils, Tag, Info, Scale, Truck, Refrigerator, Clock } from 'lucide-react';

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
      case 'ingredient':
        return <Tag className="w-4 h-4" />;
      case 'recipe':
        return <Utensils className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'semilavorato':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'lavorato':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'defrosted':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ingredient':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'recipe':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeName = (type: string) => {
    switch (type.toLowerCase()) {
      case 'semilavorato': return 'Semilavorato';
      case 'lavorato': return 'Lavorato';
      case 'defrosted': return 'Decongelato';
      case 'ingredient': return 'Ingrediente';
      case 'recipe': return 'Ricetta';
      default: return type;
    }
  };

  const isExpiringSoon = () => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 2;
  };

  return (
    <Card className="w-full max-w-xs mx-auto bg-white shadow-lg border-2 border-gray-200 print:shadow-none print:border-black" data-label-preview>
      <CardContent className="p-4 space-y-3">
        {/* Header compatto */}
        <div className="text-center border-b border-gray-200 pb-3">
          <h3 className="font-bold text-lg text-gray-900 leading-tight mb-2">{title}</h3>
          <Badge className={`px-3 py-1 ${getTypeColor(type)} border`}>
            {getTypeIcon(type)}
            <span className="ml-2 font-semibold text-xs">{getTypeName(type)}</span>
          </Badge>
        </div>

        {/* QR Code compatto */}
        <div className="flex justify-center py-2">
          {qrCodeUrl && (
            <div className="p-2 bg-white border border-gray-300 rounded shadow-sm">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-24 h-24"
              />
              <div className="text-center mt-1 text-[10px] font-medium text-gray-600">Scansiona</div>
            </div>
          )}
        </div>

        {/* Informazioni compatte */}
        <div className="space-y-2 text-xs">
          {/* Info base */}
          <div className="bg-gray-50 p-2 rounded border">
            <div className="space-y-1">
              {batchNumber && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Lotto:</span>
                  <span className="font-mono font-bold text-gray-900 text-[10px]">{batchNumber}</span>
                </div>
              )}

              {quantity && unit && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Quantità:</span>
                  <span className="font-bold text-gray-900">{quantity} {unit}</span>
                </div>
              )}
            </div>
          </div>

          {/* Date */}
          {(productionDate || expiryDate) && (
            <div className="bg-blue-50 p-2 rounded border border-blue-200">
              <div className="space-y-1">
                {productionDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700 font-medium">Produzione:</span>
                    <span className="font-bold text-blue-900">{new Date(productionDate).toLocaleDateString('it-IT')}</span>
                  </div>
                )}

                {expiryDate && (
                  <div className={`flex items-center justify-between ${isExpiringSoon() ? 'bg-red-100 -m-1 p-1 rounded border border-red-200' : ''}`}>
                    <span className={`font-medium ${isExpiringSoon() ? 'text-red-700' : 'text-blue-700'}`}>Scadenza:</span>
                    <div className="flex items-center">
                      <span className={`font-bold ${isExpiringSoon() ? 'text-red-900' : 'text-blue-900'}`}>
                        {new Date(expiryDate).toLocaleDateString('it-IT')}
                      </span>
                      {isExpiringSoon() && <span className="ml-1 text-red-600 text-xs">⚠️</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Allergeni */}
          {allergens && (
            <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
              <div className="flex items-start">
                <AlertTriangle className="w-3 h-3 mr-1 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-yellow-800 block mb-1">Allergeni:</span>
                  <p className="text-yellow-700 font-medium">{allergens}</p>
                </div>
              </div>
            </div>
          )}

          {/* Conservazione */}
          {storageInstructions && (
            <div className="bg-indigo-50 p-2 rounded border border-indigo-200">
              <div className="flex items-start">
                <Refrigerator className="w-3 h-3 mr-1 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-indigo-800 block mb-1">Conservazione:</span>
                  <p className="text-indigo-700 leading-tight">{storageInstructions}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer compatto */}
        <div className="text-center pt-2 mt-2 border-t border-gray-200 space-y-1">
          <div className="text-[9px] text-gray-500">
            Generato il {new Date().toLocaleDateString('it-IT')} alle {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-[8px] text-gray-400 font-medium">
            Sistema di tracciabilità Bistro AI
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackedLabelPreview;
