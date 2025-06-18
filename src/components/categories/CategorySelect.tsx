
import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
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
import { useDishCategories } from '@/hooks/useDishCategories';

interface CategorySelectProps {
  restaurantId: string;
  value?: string;
  onValueChange: (value: string | undefined) => void;
  placeholder?: string;
}

const CategorySelect = ({ restaurantId, value, onValueChange, placeholder = "Seleziona categoria" }: CategorySelectProps) => {
  const { categories, createCategory, fetchCategories } = useDishCategories(restaurantId);
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
      onValueChange(result.id);
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
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
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

export default CategorySelect;
