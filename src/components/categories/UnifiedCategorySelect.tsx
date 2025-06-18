
import { useState } from 'react';
import { Plus, ArrowRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useUnifiedCategories } from '@/hooks/useUnifiedCategories';

interface UnifiedCategorySelectProps {
  restaurantId: string;
  value?: string;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
}

const UnifiedCategorySelect = ({ 
  restaurantId, 
  value, 
  onValueChange, 
  placeholder = "Seleziona categoria" 
}: UnifiedCategorySelectProps) => {
  const { categories, createCategory, migrateLegacyCategory, fetchCategories } = useUnifiedCategories(restaurantId);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    
    const result = await createCategory({
      name: newCategoryName,
      description: newCategoryDescription,
      display_order: categories.length,
    });
    
    if (result) {
      setNewCategoryName('');
      setNewCategoryDescription('');
      setIsCreateDialogOpen(false);
      onValueChange(result.name);
      await fetchCategories();
    }
  };

  const handleMigrateLegacy = async (categoryName: string) => {
    const success = await migrateLegacyCategory(categoryName);
    if (success) {
      await fetchCategories();
    }
  };

  const handleValueChange = (selectedValue: string) => {
    if (selectedValue === 'create-new') {
      setIsCreateDialogOpen(true);
    } else if (selectedValue === 'none') {
      onValueChange(undefined);
    } else {
      onValueChange(selectedValue);
    }
  };

  return (
    <>
      <Select value={value || 'none'} onValueChange={handleValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Nessuna categoria</SelectItem>
          
          {/* Categorie del nuovo sistema */}
          {categories.filter(cat => cat.isFromDishCategories).map((category) => (
            <SelectItem key={category.id} value={category.name}>
              <div className="flex items-center justify-between w-full">
                <span>{category.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {category.dishCount || 0}
                </Badge>
              </div>
            </SelectItem>
          ))}
          
          {/* Separatore se ci sono categorie legacy */}
          {categories.some(cat => !cat.isFromDishCategories) && 
           categories.some(cat => cat.isFromDishCategories) && (
            <div className="px-2 py-1 text-xs text-slate-500 border-t">
              Categorie Legacy (da migrare)
            </div>
          )}
          
          {/* Categorie legacy */}
          {categories.filter(cat => !cat.isFromDishCategories).map((category) => (
            <SelectItem key={category.id} value={category.name}>
              <div className="flex items-center justify-between w-full">
                <span className="text-amber-600">{category.name}</span>
                <div className="flex items-center space-x-1">
                  <Badge variant="outline" className="ml-2">
                    {category.dishCount || 0}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMigrateLegacy(category.name);
                    }}
                    title="Migra al nuovo sistema"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </SelectItem>
          ))}
          
          <SelectItem value="create-new">
            <div className="flex items-center">
              <Plus className="w-4 h-4 mr-2" />
              Crea nuova categoria
            </div>
          </SelectItem>
        </SelectContent>
      </Select>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crea Nuova Categoria</DialogTitle>
            <DialogDescription>
              Aggiungi una nuova categoria per organizzare i tuoi piatti del menu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="category-name">Nome Categoria *</Label>
              <Input
                id="category-name"
                placeholder="es. Antipasti, Primi Piatti, Dessert..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category-description">Descrizione (opzionale)</Label>
              <Textarea
                id="category-description"
                placeholder="Breve descrizione della categoria..."
                value={newCategoryDescription}
                onChange={(e) => setNewCategoryDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
              Crea Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UnifiedCategorySelect;
