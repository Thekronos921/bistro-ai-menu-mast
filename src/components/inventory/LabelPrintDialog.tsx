
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import TrackedLabelPreview from '@/components/labeling/TrackedLabelPreview';

interface LabelPrintDialogProps {
  label: any;
}

const LabelPrintDialog = ({ label }: LabelPrintDialogProps) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-1">
          <Printer className="w-4 h-4" />
          Stampa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Anteprima Stampa - {label.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="print:block">
            <TrackedLabelPreview
              title={label.title}
              type={label.label_type}
              productionDate={label.production_date}
              expiryDate={label.expiry_date}
              batchNumber={label.batch_number}
              qrData={JSON.stringify(label.qr_data)}
              storageInstructions={label.storage_instructions}
              allergens={label.allergens}
              quantity={label.quantity}
              unit={label.unit}
              supplier={label.supplier}
            />
          </div>
          <div className="flex justify-end print:hidden">
            <Button onClick={handlePrint} className="flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Stampa Etichetta
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabelPrintDialog;
