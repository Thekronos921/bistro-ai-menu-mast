
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Package, ChefHat, Snowflake } from 'lucide-react';
import SemilavoratoLabelForm from './SemilavoratoLabelForm';
import LavoratoLabelForm from './LavoratoLabelForm';
import DefrostedLabelForm from './DefrostedLabelForm';

const LabelGenerator = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="bg-blue-50 border-blue-200 hover:bg-blue-100">
          <QrCode className="mr-2 h-4 w-4" />
          Genera Etichette
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <QrCode className="w-5 h-5" />
            <span>Generatore Etichette Automatiche</span>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="semilavorato" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="semilavorato" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Semilavorati</span>
            </TabsTrigger>
            <TabsTrigger value="lavorato" className="flex items-center space-x-2">
              <ChefHat className="w-4 h-4" />
              <span>Lavorati</span>
            </TabsTrigger>
            <TabsTrigger value="defrosted" className="flex items-center space-x-2">
              <Snowflake className="w-4 h-4" />
              <span>Decongelati</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="semilavorato">
            <SemilavoratoLabelForm onClose={() => setOpen(false)} />
          </TabsContent>
          
          <TabsContent value="lavorato">
            <LavoratoLabelForm onClose={() => setOpen(false)} />
          </TabsContent>
          
          <TabsContent value="defrosted">
            <DefrostedLabelForm onClose={() => setOpen(false)} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LabelGenerator;
