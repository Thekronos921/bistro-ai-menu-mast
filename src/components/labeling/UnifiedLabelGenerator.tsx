
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QrCode, Package, ChefHat, Snowflake, BookOpen, Tag } from 'lucide-react';
import UnifiedLabelForm from './UnifiedLabelForm';
import { useIsMobile } from '@/hooks/use-mobile';

interface UnifiedLabelGeneratorProps {
  onClose?: () => void;
  className?: string;
}

const UnifiedLabelGenerator = ({ onClose, className }: UnifiedLabelGeneratorProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ingredient');
  const isMobile = useIsMobile();

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const labelTypes = [
    {
      value: 'ingredient',
      label: 'Ingredienti',
      icon: Tag,
      color: 'text-purple-600',
      description: 'Etichette per ingredienti singoli'
    },
    {
      value: 'semilavorato', 
      label: 'Semilavorati',
      icon: Package,
      color: 'text-blue-600',
      description: 'Preparazioni intermedie'
    },
    {
      value: 'recipe',
      label: 'Ricette',
      icon: BookOpen,
      color: 'text-orange-600', 
      description: 'Ricette complete preparate'
    },
    {
      value: 'defrosted',
      label: 'Decongelati',
      icon: Snowflake,
      color: 'text-cyan-600',
      description: 'Prodotti decongelati'
    },
    {
      value: 'lavorato',
      label: 'Lavorati',
      icon: ChefHat,
      color: 'text-green-600',
      description: 'Prodotti finiti pronti al servizio'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={`bg-blue-50 border-blue-200 hover:bg-blue-100 ${className}`}>
          <QrCode className="mr-2 h-4 w-4" />
          Genera Etichette
        </Button>
      </DialogTrigger>
      <DialogContent className={`${isMobile ? 'max-w-[95vw] h-[95vh]' : 'max-w-4xl max-h-[90vh]'} overflow-hidden flex flex-col`}>
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <QrCode className="w-6 h-6 text-blue-600" />
            <span>Generatore Etichette Unificato</span>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className={`grid grid-cols-5 mb-4 flex-shrink-0 ${isMobile ? 'h-auto' : ''}`}>
            {labelTypes.map(type => {
              const Icon = type.icon;
              return (
                <TabsTrigger 
                  key={type.value}
                  value={type.value} 
                  className={`flex ${isMobile ? 'flex-col' : 'flex-col'} items-center space-y-1 ${isMobile ? 'p-2 text-xs' : 'p-3'} h-auto`}
                  title={type.description}
                >
                  <Icon className={`w-4 h-4 ${type.color}`} />
                  <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-medium`}>{type.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            {labelTypes.map(type => (
              <TabsContent key={type.value} value={type.value} className="h-full overflow-y-auto">
                <UnifiedLabelForm 
                  labelType={type.value as any}
                  onClose={handleClose}
                />
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedLabelGenerator;
