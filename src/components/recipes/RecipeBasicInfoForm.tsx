
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Users, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CategorySelect } from '@/components/categories/CategorySelect';
import { useRestaurant } from '@/hooks/useRestaurant';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecipeBasicInfoFormProps {
  formData: {
    name: string;
    category: string;
    preparationTime: number;
    difficulty: string;
    portions: number;
    description: string;
    allergens: string;
    isSemilavorato: boolean;
    notesChef: string;
  };
  onFormDataChange: (data: Partial<RecipeBasicInfoFormProps['formData']>) => void;
}

const RecipeBasicInfoForm = ({ formData, onFormDataChange }: RecipeBasicInfoFormProps) => {
  const { restaurantId } = useRestaurant();
  const difficulties = ["Bassa", "Media", "Alta"];

  const handleCategoryChange = (category: string | undefined) => {
    onFormDataChange({ category: category || '' });
  };

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Informazioni Base</h3>
        
        <div>
          <label className="block text-sm font-medium mb-1">Nome Ricetta</label>
          <Input
            value={formData.name}
            onChange={(e) => onFormDataChange({name: e.target.value})}
            placeholder="Es. Risotto ai Porcini"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Categoria</label>
          {restaurantId && (
            <CategorySelect
              restaurantId={restaurantId}
              value={formData.category}
              onValueChange={handleCategoryChange}
              placeholder="Seleziona o crea categoria"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">
              <Clock className="w-4 h-4 inline mr-1" />
              Tempo (min)
            </label>
            <Input
              type="number"
              value={formData.preparationTime}
              onChange={(e) => onFormDataChange({preparationTime: parseInt(e.target.value) || 0})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              <Users className="w-4 h-4 inline mr-1" />
              Porzioni
            </label>
            <Input
              type="number"
              value={formData.portions}
              onChange={(e) => onFormDataChange({portions: parseInt(e.target.value) || 1})}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Difficoltà</label>
          <Select value={formData.difficulty} onValueChange={(value) => onFormDataChange({difficulty: value})}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {difficulties.map(diff => (
                <SelectItem key={diff} value={diff}>{diff}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descrizione</label>
          <Textarea
            value={formData.description}
            onChange={(e) => onFormDataChange({description: e.target.value})}
            placeholder="Descrizione della ricetta..."
            rows={3}
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="semilavorato"
            checked={formData.isSemilavorato}
            onCheckedChange={(checked) => onFormDataChange({isSemilavorato: !!checked})}
          />
          <label htmlFor="semilavorato" className="text-sm font-medium flex items-center">
            È un semilavorato
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 ml-1 text-slate-400" />
              </TooltipTrigger>
              <TooltipContent>
                Seleziona se questa ricetta è un componente usato in altre preparazioni e non un piatto venduto direttamente.
              </TooltipContent>
            </Tooltip>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Allergeni</label>
          <Input
            value={formData.allergens}
            onChange={(e) => onFormDataChange({allergens: e.target.value})}
            placeholder="Es. Glutine, Latticini, Uova"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Note Addizionali / Consigli dello Chef</label>
          <Textarea
            value={formData.notesChef}
            onChange={(e) => onFormDataChange({notesChef: e.target.value})}
            placeholder="Consigli, varianti, note tecniche..."
            rows={2}
          />
        </div>
      </div>
    </TooltipProvider>
  );
};

export default RecipeBasicInfoForm;
