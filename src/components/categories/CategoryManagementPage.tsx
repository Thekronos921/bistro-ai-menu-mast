
import { useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, GripVertical, Database, AlertTriangle } from 'lucide-react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useUnifiedCategories } from '@/hooks/useUnifiedCategories';

interface CategoryManagementPageProps {
  restaurantId: string;
  onBack: () => void;
}

const CategoryManagementPage = ({ restaurantId, onBack }: CategoryManagementPageProps) => {
  const { categories, loading, createCategory } = useUnifiedCategories(restaurantId);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');

  const legacyCategories = categories.filter(cat => !cat.isFromDishCategories);
  const modernCategories = categories.filter(cat => cat.isFromDishCategories);

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
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Indietro
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Gestione Categorie</h1>
            <p className="text-slate-600">Organizza e gestisci le categorie del tuo menu</p>
          </div>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Nuova Categoria
        </Button>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorie Moderne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{modernCategories.length}</div>
            <p className="text-xs text-slate-600">Nel nuovo sistema</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Categorie Legacy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{legacyCategories.length}</div>
            <p className="text-xs text-slate-600">Da migrare</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Piatti Totali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {categories.reduce((sum, cat) => sum + (cat.dishCount || 0), 0)}
            </div>
            <p className="text-xs text-slate-600">In tutte le categorie</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert per categorie legacy */}
      {legacyCategories.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <CardTitle className="text-amber-800">Categorie Legacy Rilevate</CardTitle>
            </div>
            <CardDescription className="text-amber-700">
              Hai {legacyCategories.length} categorie nel vecchio sistema che potrebbero essere migrate 
              per migliorare le prestazioni e la gestione.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Categorie Moderne */}
          {modernCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <span>Categorie Moderne ({modernCategories.length})</span>
                </CardTitle>
                <CardDescription>
                  Categorie gestite dal nuovo sistema con funzionalità avanzate
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                    {modernCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>
                          <GripVertical className="w-4 h-4 text-slate-400" />
                        </TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="text-slate-600">
                          {category.description || <span className="italic">Nessuna descrizione</span>}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {category.dishCount || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button variant="ghost" size="sm">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Categorie Legacy */}
          {legacyCategories.length > 0 && (
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <span>Categorie Legacy ({legacyCategories.length})</span>
                </CardTitle>
                <CardDescription>
                  Categorie dal vecchio sistema - considera la migrazione per funzionalità migliori
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-20">Piatti</TableHead>
                      <TableHead className="w-32">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {legacyCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium text-amber-700">
                          {category.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-amber-300">
                            {category.dishCount || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" className="text-amber-700 border-amber-300">
                            Migra
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {categories.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <Database className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-medium text-slate-600 mb-2">Nessuna categoria trovata</h3>
                <p className="text-slate-500 mb-4">
                  Inizia creando la tua prima categoria per organizzare i piatti del menu.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Crea Prima Categoria
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

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
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Descrizione (opzionale)</Label>
              <Textarea
                id="description"
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
    </div>
  );
};

export default CategoryManagementPage;
