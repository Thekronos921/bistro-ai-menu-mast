
import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Package, AlertTriangle, qrcode } from 'lucide-react';
import QRCode from 'qrcode';

interface LabelPreviewProps {
  title: string;
  type: string;
  productionDate: string;
  expiryDate: string;
  batchNumber: string;
  qrData: string;
  storageInstructions?: string;
  allergens?: string;
  portions?: string;
  quantity?: string;
  unit?: string;
  supplier?: string;
}

const LabelPreview = ({
  title,
  type,
  productionDate,
  expiryDate,
  batchNumber,
  qrData,
  storageInstructions,
  allergens,
  portions,
  quantity,
  unit,
  supplier
}: LabelPreviewProps) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    generateQRCode();
  }, [qrData]);

  const generateQRCode = async () => {
    try {
      const url = await QRCode.toDataURL(qrData, {
        width: 100,
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

  const getTypeColor = () => {
    switch (type) {
      case 'Semilavorato': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Lavorato': return 'bg-green-100 text-green-800 border-green-200';
      case 'Decongelato': return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const isExpiringSoon = () => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilExpiry <= 2;
  };

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-700">Anteprima Etichetta</h4>
      
      {/* Etichetta stampabile */}
      <Card className="p-4 bg-white border-2 border-dashed border-gray-300 print:border-solid print:border-black print:shadow-none" style={{ width: '8cm', minHeight: '6cm' }}>
        <div className="space-y-3 text-sm">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h3 className="font-bold text-lg leading-tight">{title}</h3>
              <Badge className={`text-xs mt-1 ${getTypeColor()}`}>
                {type}
              </Badge>
            </div>
            {qrCodeUrl && (
              <div className="ml-2">
                <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" />
              </div>
            )}
          </div>

          {/* Informazioni principali */}
          <div className="space-y-2 border-t pt-2">
            {batchNumber && (
              <div className="flex items-center space-x-2">
                <Package className="w-3 h-3 text-gray-500" />
                <span className="text-xs">Lotto: <strong>{batchNumber}</strong></span>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Calendar className="w-3 h-3 text-gray-500" />
              <span className="text-xs">
                Preparato: <strong>{formatDate(productionDate)}</strong>
              </span>
            </div>
            
            {expiryDate && (
              <div className={`flex items-center space-x-2 ${isExpiringSoon() ? 'text-red-600' : ''}`}>
                <AlertTriangle className={`w-3 h-3 ${isExpiringSoon() ? 'text-red-500' : 'text-gray-500'}`} />
                <span className="text-xs">
                  Scade: <strong>{formatDate(expiryDate)}</strong>
                  {isExpiringSoon() && <span className="ml-1">⚠️</span>}
                </span>
              </div>
            )}

            {quantity && unit && (
              <div className="text-xs">
                Quantità: <strong>{quantity} {unit}</strong>
              </div>
            )}

            {portions && (
              <div className="text-xs">
                Porzioni: <strong>{portions}</strong>
              </div>
            )}

            {supplier && (
              <div className="text-xs">
                Fornitore: <strong>{supplier}</strong>
              </div>
            )}
          </div>

          {/* Allergeni */}
          {allergens && (
            <div className="border-t pt-2">
              <div className="text-xs">
                <strong>Allergeni:</strong> {allergens}
              </div>
            </div>
          )}

          {/* Istruzioni conservazione */}
          {storageInstructions && (
            <div className="border-t pt-2">
              <div className="text-xs">
                <strong>Conservazione:</strong>
                <div className="mt-1 text-gray-600 leading-tight">
                  {storageInstructions}
                </div>
              </div>
            </div>
          )}

          {/* Footer con QR info */}
          <div className="border-t pt-2 text-center">
            <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
              <qrcode className="w-3 h-3" />
              <span>Scansiona per tracciabilità completa</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Informazioni tecniche */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>• Dimensioni: 8cm x 6cm (formato standard etichetta adesiva)</div>
        <div>• QR Code contiene: tracciabilità completa, lotti ingredienti, fornitori</div>
        <div>• Conforme normative HACCP per identificazione prodotti</div>
      </div>
    </div>
  );
};

export default LabelPreview;
