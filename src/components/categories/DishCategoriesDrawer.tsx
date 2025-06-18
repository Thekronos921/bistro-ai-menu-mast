
import { useState } from 'react';
import { Plus, Edit, Trash2, GripVertical, Settings } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { useDishCategories, DishCategory, CreateDishCategoryData, UpdateDishCategoryData } from '@/hooks/useDishCategories';

interface DishCategoriesDrawerProps {
  restaurantId: string;
  onCategoryChange?: () => void;
}

const DishCategoriesDrawer = ({ restaurantId, onCategoryChange }: DishCategoriesDrawerProps) => {
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useDishCategories(restaurantId);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<DishCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<DishCategory | null>(null);
  
  const [formData, setFormData] = useState<CreateDishCategoryData>({
    name: '',
    description: '',
  });

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) return;
    
    const result = await createCategory({
      ...formData,
      display_order: categories.length,
    });
    
    if (result) {
      setFormData({ name: '', description: '' });
      setIsCreateDialogOpen(false);
      onCategoryChange?.();
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !formData.name.trim()) return;
    
    const result = await updateCategory(editingCategory.id, formData);
    
    if (result) {
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      setFormData({ name: '', description: '' });
      onCategoryChange?.();
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    
    const result = await deleteCategory(deletingCategory.id);
    
    if (result) {
      setIsDeleteDialogOpen(false);
      setDeletingCategory(null);
      onCategoryChange?.();
    }
  };

  const openEditDialog = (category: DishCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (category: DishCategory) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Gestisci Categorie
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[600px] sm:w-[700px]">
          <SheetHeader>
            <SheetTitle>Gestione Categorie Piatti</SheetTitle>
            <SheetDescription>
              Crea e gestisci le categorie per organizzare i tuoi piatti del menu.
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Categorie Esistenti</h3>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuova Categoria
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>Nessuna categoria creata.</p>
                <p className="text-sm">Crea la tua prima categoria per iniziare ad organizzare i piatti.</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrizione</TableHead>
                      <TableHead className="w-20">Piatti</TableHead>
                      <TableHead className="w-24">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <GripVertical className="w-4 h-4 text-slate-400" />
                        </TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-slate-600">
                          {category.description || <span className="italic">Nessuna descrizione</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">0</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(category)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(category)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Dialog Creazione Categoria */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuova Categoria</DialogTitle>
            <DialogDescription>
              Crea una nuova categoria per organizzare i tuoi piatti del menu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome Categoria *</Label>
              <Input
                id="name"
                placeholder="es. Antipasti, Primi Piatti, Dessert..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description">Descrizione (opzionale)</Label>
              <Textarea
                id="description"
                placeholder="Breve descrizione della categoria..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleCreateCategory} disabled={!formData.name.trim()}>
              Crea Categoria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Modifica Categoria */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifica Categoria</DialogTitle>
            <DialogDescription>
              Modifica i dettagli della categoria.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome Categoria *</Label>
              <Input
                id="edit-name"
                placeholder="es. Antipasti, Primi Piatti, Dessert..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Descrizione (opzionale)</Label>
              <Textarea
                id="edit-description"
                placeholder="Breve descrizione della categoria..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleEditCategory} disabled={!formData.name.trim()}>
              Salva Modifiche
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Conferma Eliminazione */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare la categoria "{deletingCategory?.name}"?
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCategory}>
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DishCategoriesDrawer;
