
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';
import QRCode from 'qrcode';

interface LabelQRDialogProps {
  qrData: any;
  title: string;
}

const LabelQRDialog = ({ qrData, title }: LabelQRDialogProps) => {
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('');

  React.useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: 200,
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <QrCode className="w-4 h-4" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Code - {title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          {qrCodeUrl && (
            <div className="p-4 bg-white border rounded-lg">
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            </div>
          )}
          <p className="text-sm text-gray-600 text-center">
            Scansiona questo codice per tracciare l'etichetta
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabelQRDialog;
