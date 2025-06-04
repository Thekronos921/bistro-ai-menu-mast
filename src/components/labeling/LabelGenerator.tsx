
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Package, ChefHat, Snowflake, BookOpen, BarChart3 } from 'lucide-react';
import SemilavoratoLabelForm from './SemilavoratoLabelForm';
import LavoratoLabelForm from './LavoratoLabelForm';
import DefrostedLabelForm from './DefrostedLabelForm';
import RecipeLabelForm from './RecipeLabelForm';
import LabelTrackingDashboard from './LabelTrackingDashboard';

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <QrCode className="w-5 h-5" />
            <span>Sistema Etichette e Tracciabilità</span>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="semilavorato" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="semilavorato" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span>Semilavorati</span>
            </TabsTrigger>
            <TabsTrigger value="lavorato" className="flex items-center space-x-2">
              <ChefHat className="w-4 h-4" />
              <span>Lavorati</span>
            </TabsTrigger>
            <TabsTrigger value="recipe" className="flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Ricette</span>
            </TabsTrigger>
            <TabsTrigger value="defrosted" className="flex items-center space-x-2">
              <Snowflake className="w-4 h-4" />
              <span>Decongelati</span>
            </TabsTrigger>
            <TabsTrigger value="tracking" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Inventario</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="semilavorato">
            <SemilavoratoLabelForm onClose={() => setOpen(false)} />
          </TabsContent>
          
          <TabsContent value="lavorato">
            <LavoratoLabelForm />
          </TabsContent>
          
          <TabsContent value="recipe">
            <RecipeLabelForm />
          </TabsContent>
          
          <TabsContent value="defrosted">
            <DefrostedLabelForm onClose={() => setOpen(false)} />
          </TabsContent>

          <TabsContent value="tracking">
            <LabelTrackingDashboard />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LabelGenerator;
