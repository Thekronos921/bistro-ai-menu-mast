
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
          width: 140,
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
    <Card className="w-full max-w-sm mx-auto bg-white shadow-lg border-2 border-gray-200 print:shadow-none print:border-black" data-label-preview>
      <CardContent className="p-6 space-y-4">
        {/* Header con titolo e tipo */}
        <div className="text-center border-b-2 border-gray-200 pb-4">
          <h3 className="font-bold text-xl text-gray-900 leading-tight mb-3">{title}</h3>
          <Badge className={`px-4 py-2 ${getTypeColor(type)} border-2`}>
            {getTypeIcon(type)}
            <span className="ml-2 font-semibold text-sm">{getTypeName(type)}</span>
          </Badge>
        </div>

        {/* QR Code */}
        <div className="flex justify-center py-3">
          {qrCodeUrl && (
            <div className="p-3 bg-white border-2 border-gray-300 rounded-lg shadow-sm">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-32 h-32"
              />
              <div className="text-center mt-2 text-xs font-medium text-gray-600">Scansiona per tracciare</div>
            </div>
          )}
        </div>

        {/* Informazioni principali */}
        <div className="space-y-4 text-sm">
          {/* Sezione 1: Informazioni di base */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-xs font-bold text-gray-600 uppercase mb-3 pb-1 border-b border-gray-300">Informazioni Base</h4>
            <div className="space-y-3">
              {batchNumber && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Info className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600 font-medium">Lotto:</span>
                  </div>
                  <span className="font-mono font-bold text-gray-900">{batchNumber}</span>
                </div>
              )}

              {quantity && unit && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Scale className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600 font-medium">Quantità:</span>
                  </div>
                  <span className="font-bold text-gray-900">{quantity} {unit}</span>
                </div>
              )}

              {supplier && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Truck className="w-4 h-4 mr-2 text-gray-500" />
                    <span className="text-gray-600 font-medium">Fornitore:</span>
                  </div>
                  <span className="font-medium text-gray-900 text-right max-w-[120px] truncate">{supplier}</span>
                </div>
              )}
            </div>
          </div>

          {/* Sezione 2: Date importanti */}
          {(productionDate || expiryDate) && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="text-xs font-bold text-blue-700 uppercase mb-3 pb-1 border-b border-blue-300">Date Importanti</h4>
              <div className="space-y-3">
                {productionDate && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-blue-600" />
                      <span className="text-blue-700 font-medium">Produzione:</span>
                    </div>
                    <span className="font-bold text-blue-900">{new Date(productionDate).toLocaleDateString('it-IT')}</span>
                  </div>
                )}

                {expiryDate && (
                  <div className={`flex items-center justify-between ${isExpiringSoon() ? 'bg-red-100 -m-2 p-2 rounded border border-red-200' : ''}`}>
                    <div className="flex items-center">
                      <Calendar className={`w-4 h-4 mr-2 ${isExpiringSoon() ? 'text-red-600' : 'text-blue-600'}`} />
                      <span className={`font-medium ${isExpiringSoon() ? 'text-red-700' : 'text-blue-700'}`}>Scadenza:</span>
                    </div>
                    <div className="flex items-center">
                      <span className={`font-bold ${isExpiringSoon() ? 'text-red-900' : 'text-blue-900'}`}>
                        {new Date(expiryDate).toLocaleDateString('it-IT')}
                      </span>
                      {isExpiringSoon() && <span className="ml-2 text-red-600">⚠️</span>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sezione 3: Allergeni */}
          {allergens && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 mr-2 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-yellow-800 block mb-1">Allergeni:</span>
                  <p className="text-yellow-700 font-medium">{allergens}</p>
                </div>
              </div>
            </div>
          )}

          {/* Sezione 4: Conservazione */}
          {storageInstructions && (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <div className="flex items-start">
                <Refrigerator className="w-4 h-4 mr-2 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-indigo-800 block mb-1">Conservazione:</span>
                  <p className="text-indigo-700 leading-tight">{storageInstructions}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con timestamp */}
        <div className="text-center pt-4 mt-4 border-t-2 border-gray-200 space-y-2">
          <div className="flex items-center justify-center text-xs text-gray-500">
            <Info className="w-3 h-3 mr-1" />
            <span>Generato il {new Date().toLocaleDateString('it-IT')} alle {new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="text-[10px] text-gray-400 font-medium">
            Sistema di tracciabilità Bistro AI
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrackedLabelPreview;
