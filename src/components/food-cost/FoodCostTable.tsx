
import { DollarSign, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import MenuEngineeringBadge, { MenuCategory } from "@/components/MenuEngineeringBadge";
import AISuggestionTooltip from "@/components/AISuggestionTooltip";
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
}

interface SettingsConfig {
  criticalThreshold: number;
  targetThreshold: number;
  targetPercentage: number;
}

interface FoodCostTableProps {
  filteredItems: FilteredItem[];
  getDishSalesData: (dishName: string) => any;
  getSalesMixPercentage: (dishName: string) => number;
  getTotalSalesForPeriod: () => number;
  settings: SettingsConfig;
  onEditDish: (dish: Dish) => void;
  onEditRecipe: (recipe: Recipe) => void;
  onCreateDishFromRecipe: (recipe: Recipe) => void;
}

const FoodCostTable = ({
  filteredItems,
  getDishSalesData,
  getSalesMixPercentage,
  getTotalSalesForPeriod,
  settings,
  onEditDish,
  onEditRecipe,
  onCreateDishFromRecipe
}: FoodCostTableProps) => {
  if (filteredItems.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="p-12 text-center">
          <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">Nessun elemento trovato</h3>
          <p className="text-slate-500 mb-6">
            Prova a modificare i filtri di ricerca o inizia aggiungendo ricette e piatti
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-stone-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            Analisi Menu Engineering ({filteredItems.length} elementi)
          </h2>
          {getTotalSalesForPeriod() > 0 && (
            <p className="text-sm text-slate-500">
              Vendite totali periodo: {getTotalSalesForPeriod()} unità
            </p>
          )}
        </div>
      </div>
      
      <div className="overflow-x-auto">
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
              <TableHead className="text-center">Menu Engineering</TableHead>
              <TableHead className="text-center">AI Suggerimenti</TableHead>
              <TableHead className="text-center">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map(({ type, item, analysis, menuCategory }) => {
              const dishSales = type === 'dish' ? getDishSalesData(item.name) : null;
              const salesMix = type === 'dish' ? getSalesMixPercentage(item.name) : 0;
              
              return (
                <TableRow key={`${type}-${item.id}`}>
                  <TableCell>
                    <div className="font-medium text-slate-800">{item.name}</div>
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
                      <span className="font-medium">{salesMix.toFixed(2)}%</span>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {type === 'dish' ? (
                      <span className="font-medium">{dishSales?.unitsSold || 0}</span>
                    ) : (
                      <span className="text-slate-400">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-800">
                    €{type === 'dish' ? (item as Dish).selling_price : analysis.assumedPrice?.toFixed(2)}
                    {type === 'recipe' && <span className="text-slate-500 text-xs ml-1">(stimato)</span>}
                  </TableCell>
                  <TableCell className="text-right text-slate-600">€{analysis.foodCost.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold ${
                      analysis.foodCostPercentage > settings.criticalThreshold ? 'text-red-600' : 
                      analysis.foodCostPercentage > 30 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {analysis.foodCostPercentage.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-medium text-slate-800">€{analysis.margin.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <MenuEngineeringBadge category={menuCategory} />
                  </TableCell>
                  <TableCell className="text-center">
                    <AISuggestionTooltip 
                      category={menuCategory}
                      foodCostPercentage={analysis.foodCostPercentage}
                      margin={analysis.margin}
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
                          {(item as Dish).recipes && (
                            <Button
                              onClick={() => {
                                const recipe = (item as Dish).recipes!;
                                const completeRecipe: Recipe = {
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
                                onEditRecipe(completeRecipe);
                              }}
                              size="sm"
                              variant="outline"
                              className="ml-1"
                            >
                              Modifica Ricetta
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button
                            onClick={() => {
                              const recipe = item as Recipe;
                              const completeRecipe: Recipe = {
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
  );
};

export default FoodCostTable;
