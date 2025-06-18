import { DollarSign, Edit, Link2, Trash2, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import MenuEngineeringBadge, { MenuCategory } from "@/components/MenuEngineeringBadge";
import AISuggestionTooltip from "@/components/AISuggestionTooltip";
import DeleteConfirmDialog from "@/components/DeleteConfirmDialog";
import type { Recipe } from "@/types/recipe";

interface Dish {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  recipe_id?: string;
  recipes?: Recipe;
}

interface Analysis {
  foodCost: number;
  foodCostPercentage: number;
  margin: number;
  status: string;
  popularity: number;
  assumedPrice?: number;
}

interface FilteredItem {
  type: 'dish' | 'recipe';
  item: Dish | Recipe;
  name: string;
  category: string;
  analysis: Analysis;
  menuCategory: MenuCategory;
  unitsSold?: number;
  revenue?: number;
}

interface SettingsConfig {
  criticalThreshold: number;
  targetThreshold: number;
  targetPercentage: number;
}

interface FoodCostTableProps {
  filteredItems: FilteredItem[];
  totalItems: number;
  getTotalSalesForPeriod: () => number;
  getSalesMixPercentage: (dishName: string) => number;
  settings: SettingsConfig;
  onEditDish: (dish: Dish) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onCreateDishFromRecipe: (recipe: Recipe) => void;
  onAssociateRecipe?: (dish: Dish) => void;
  onDeleteDish: (dishId: string, dishName: string) => void;
}

const FoodCostTable = ({
  filteredItems,
  totalItems,
  getTotalSalesForPeriod,
  getSalesMixPercentage,
  settings,
  onEditDish,
  onEditRecipe,
  onCreateDishFromRecipe,
  onAssociateRecipe,
  onDeleteDish
}: FoodCostTableProps) => {
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    dishId: string;
    dishName: string;
  }>({
    open: false,
    dishId: '',
    dishName: ''
  });

  const handleDeleteClick = (dishId: string, dishName: string) => {
    setDeleteDialog({
      open: true,
      dishId,
      dishName
    });
  };

  const handleDeleteConfirm = () => {
    onDeleteDish(deleteDialog.dishId, deleteDialog.dishName);
    setDeleteDialog({
      open: false,
      dishId: '',
      dishName: ''
    });
  };

  // Helper function to create a complete recipe object with all required fields
  const createCompleteRecipe = (recipe: Recipe): Recipe => {
    return {
      ...recipe,
      preparation_time: recipe.preparation_time || 0,
      difficulty: recipe.difficulty || 'Facile',
      portions: recipe.portions || 1,
      description: recipe.description || '',
      allergens: recipe.allergens || '',
      calories: recipe.calories || 0,
      protein: recipe.protein || 0,
      carbs: recipe.carbs || 0,
      fat: recipe.fat || 0,
      is_semilavorato: recipe.is_semilavorato || false,
      recipe_instructions: recipe.recipe_instructions || []
    };
  };

  if (filteredItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="p-8 sm:p-12 text-center">
          <DollarSign className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-slate-600 mb-2">Nessun elemento trovato</h3>
          <p className="text-sm sm:text-base text-slate-500 mb-6">
            Prova a modificare i filtri di ricerca o inizia aggiungendo ricette e piatti
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-stone-200">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800">
              Menu Intelligence Analysis ({totalItems} elementi)
            </h2>
            {getTotalSalesForPeriod() > 0 && (
              <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">
                Vendite totali periodo: {getTotalSalesForPeriod()} unità
              </p>
            )}
          </div>
        </div>
        
        {/* Mobile Card View */}
        <div className="block sm:hidden">
          <div className="divide-y divide-stone-200">
            {filteredItems.map(({ type, item, analysis, menuCategory, unitsSold, revenue }) => {
              const dish = item as Dish;
              const hasRecipe = type === 'dish' && dish.recipe_id && dish.recipes;
              const salesMixPercentage = type === 'dish' ? getSalesMixPercentage(item.name) : 0;

              return (
                <div key={`${type}-${item.id}`} className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-slate-800 truncate">{item.name}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          type === 'dish' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {type === 'dish' ? 'Piatto' : 'Ricetta'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{item.category}</p>
                      {type === 'dish' && !hasRecipe && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800 mt-1">
                          Senza ricetta
                        </span>
                      )}
                    </div>
                    
                    {/* Actions Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {type === 'dish' ? (
                          <>
                            <DropdownMenuItem onClick={() => onEditDish(item as Dish)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifica Piatto
                            </DropdownMenuItem>
                            
                            {hasRecipe ? (
                              <DropdownMenuItem onClick={() => {
                                const dishWithRecipe = item as Dish;
                                if (dishWithRecipe.recipes) {
                                  const completeRecipe = createCompleteRecipe(dishWithRecipe.recipes);
                                  onEditRecipe(completeRecipe);
                                }
                              }}>
                                <Edit className="w-4 h-4 mr-2" />
                                Modifica Ricetta
                              </DropdownMenuItem>
                            ) : (
                              onAssociateRecipe && (
                                <DropdownMenuItem onClick={() => onAssociateRecipe(item as Dish)}>
                                  <Link2 className="w-4 h-4 mr-2" />
                                  Associa Ricetta
                                </DropdownMenuItem>
                              )
                            )}
                            
                            <DropdownMenuItem 
                              onClick={() => handleDeleteClick(item.id, item.name)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Elimina
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            <DropdownMenuItem onClick={() => {
                              const recipeItem = item as Recipe;
                              const completeRecipe = createCompleteRecipe(recipeItem);
                              onEditRecipe(completeRecipe);
                            }}>
                              <Edit className="w-4 h-4 mr-2" />
                              Modifica Ricetta
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onCreateDishFromRecipe(item as Recipe)}>
                              <DollarSign className="w-4 h-4 mr-2" />
                              Crea Piatto
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-slate-500">Prezzo</span>
                      <p className="font-medium">
                        €{type === 'dish' ? (item as Dish).selling_price : analysis.assumedPrice?.toFixed(2)}
                        {type === 'recipe' && <span className="text-slate-500 text-xs ml-1">(stim.)</span>}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-slate-500">Food Cost</span>
                      <p className={`font-semibold ${
                        analysis.foodCostPercentage > settings.criticalThreshold ? 'text-red-600' : 
                        analysis.foodCostPercentage > 30 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {hasRecipe || type === 'recipe' ? `${analysis.foodCostPercentage.toFixed(1)}%` : 'N/A'}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-slate-500">Margine</span>
                      <p className="font-medium">€{analysis.margin.toFixed(2)}</p>
                    </div>
                    
                    <div>
                      <span className="text-slate-500">Vendite</span>
                      <p className="font-medium">
                        {type === 'dish' ? `${unitsSold || 0} (${salesMixPercentage.toFixed(1)}%)` : 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center justify-between">
                    <MenuEngineeringBadge category={menuCategory} />
                    <AISuggestionTooltip 
                      category={menuCategory}
                      foodCostPercentage={analysis.foodCostPercentage}
                      margin={analysis.margin}
                      salesMix={salesMixPercentage}
                      unitsSold={unitsSold}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Sales Mix %</TableHead>
                <TableHead className="text-right">Unità Vendute</TableHead>
                <TableHead className="text-right">Prezzo Vendita</TableHead>
                <TableHead className="text-right">Costo Ingredienti</TableHead>
                <TableHead className="text-right">Food Cost %</TableHead>
                <TableHead className="text-right">Margine</TableHead>
                <TableHead className="text-center">BCG Category</TableHead>
                <TableHead className="text-center">AI Intelligence</TableHead>
                <TableHead className="text-center">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map(({ type, item, analysis, menuCategory, unitsSold, revenue }) => {
                const dish = item as Dish;
                const hasRecipe = type === 'dish' && dish.recipe_id && dish.recipes;
                
                const salesMixPercentage = type === 'dish' ? getSalesMixPercentage(item.name) : 0;

                return (
                  <TableRow key={`${type}-${item.id}`} className="hover:bg-slate-50/50">
                    <TableCell>
                      <div className="font-medium text-slate-800 flex items-center space-x-2">
                        <span>{item.name}</span>
                        {type === 'dish' && !hasRecipe && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                            Senza ricetta
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        type === 'dish' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {type === 'dish' ? 'Piatto' : 'Ricetta'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600">{item.category}</TableCell>
                    <TableCell className="text-right">
                      {type === 'dish' ? (
                        <span className="font-medium">{salesMixPercentage.toFixed(2)}%</span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {type === 'dish' ? (
                        <span className="font-medium">{unitsSold || 0}</span>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-800">
                      €{type === 'dish' ? (item as Dish).selling_price : analysis.assumedPrice?.toFixed(2)}
                      {type === 'recipe' && <span className="text-slate-500 text-xs ml-1">(stimato)</span>}
                    </TableCell>
                    <TableCell className="text-right text-slate-600">
                      {hasRecipe || type === 'recipe' ? (
                        <>€{analysis.foodCost.toFixed(2)}</>
                      ) : (
                        <span className="text-slate-400 text-xs">Non calcolabile</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {hasRecipe || type === 'recipe' ? (
                        <span className={`font-semibold ${
                          analysis.foodCostPercentage > settings.criticalThreshold ? 'text-red-600' : 
                          analysis.foodCostPercentage > 30 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>
                          {analysis.foodCostPercentage.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium text-slate-800">
                      €{analysis.margin.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-center">
                      <MenuEngineeringBadge category={menuCategory} />
                    </TableCell>
                    <TableCell className="text-center">
                      <AISuggestionTooltip 
                        category={menuCategory}
                        foodCostPercentage={analysis.foodCostPercentage}
                        margin={analysis.margin}
                        salesMix={salesMixPercentage}
                        unitsSold={unitsSold}
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center space-x-1">
                        {type === 'dish' ? (
                          <>
                            <Button
                              onClick={() => onEditDish(item as Dish)}
                              size="sm"
                              variant="outline"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              onClick={() => handleDeleteClick(item.id, item.name)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            
                            {hasRecipe ? (
                              <Button
                                onClick={() => {
                                  const dishWithRecipe = item as Dish;
                                  if (dishWithRecipe.recipes) {
                                    const completeRecipe = createCompleteRecipe(dishWithRecipe.recipes);
                                    onEditRecipe(completeRecipe);
                                  }
                                }}
                                size="sm"
                                variant="outline"
                                className="ml-1"
                              >
                                Modifica Ricetta
                              </Button>
                            ) : (
                              onAssociateRecipe && (
                                <Button
                                  onClick={() => onAssociateRecipe(item as Dish)}
                                  size="sm"
                                  variant="outline"
                                  className="ml-1 border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                                >
                                  <Link2 className="w-4 h-4 mr-1" />
                                  Associa Ricetta
                                </Button>
                              )
                            )}
                          </>
                        ) : (
                          <>
                            <Button
                              onClick={() => {
                                const recipeItem = item as Recipe;
                                const completeRecipe = createCompleteRecipe(recipeItem);
                                onEditRecipe(completeRecipe);
                              }}
                              size="sm"
                              variant="outline"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              onClick={() => onCreateDishFromRecipe(item as Recipe)}
                              size="sm"
                              variant="default"
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              Crea Piatto
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, open }))}
        onConfirm={handleDeleteConfirm}
        title="Elimina Piatto"
        description="Sei sicuro di voler eliminare questo piatto? Questa azione non può essere annullata."
        itemName={deleteDialog.dishName}
      />
    </>
  );
};

export default FoodCostTable;
