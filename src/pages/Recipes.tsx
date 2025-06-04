import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import EditRecipeDialog from "@/components/EditRecipeDialog";
import RecipeHeader from "@/components/recipes/RecipeHeader";
import RecipeFilters from "@/components/recipes/RecipeFilters";
import EmptyRecipeState from "@/components/recipes/EmptyRecipeState";
import RecipeCard from "@/components/recipes/RecipeCard";
import { printRecipe } from "@/components/recipes/RecipesPrintUtility";
import { useRecipeActions } from "@/components/recipes/useRecipeActions";
import type { Recipe } from '@/types/recipe';
import { useCategories } from '@/hooks/useCategories';

const Recipes = () => {
  const { categories } = useCategories();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [deleteRecipeId, setDeleteRecipeId] = useState<string | null>(null);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();

  // const categories = ["all", "Antipasti", "Primi Piatti", "Secondi Piatti", "Dolci", "Contorni", "Semilavorati", "Salse", "Preparazioni Base"];

  const fetchRecipes = async () => {
    try {
      if (!restaurantId) {
        console.log("No restaurant ID available");
        setLoading(false);
        return;
      }

      console.log("Fetching recipes for restaurant:", restaurantId);
      
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            ingredient_id,
            quantity,
            is_semilavorato,
            ingredients (
              id,
              name,
              unit,
              cost_per_unit,
              effective_cost_per_unit,
              current_stock,
              min_stock_threshold
            )
          ),
          recipe_instructions (
            id,
            step_number,
            instruction
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching recipes:", error);
        throw error;
      }
      
      console.log("Fetched recipes:", data);
      
      const recipesWithDefaults = (data || []).map(recipe => ({
        ...recipe,
        recipe_ingredients: recipe.recipe_ingredients || [],
        recipe_instructions: recipe.recipe_instructions || []
      }));
      
      setRecipes(recipesWithDefaults);
    } catch (error) {
      console.error("Fetch recipes error:", error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento delle ricette",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const { duplicateRecipe, deleteRecipe } = useRecipeActions(fetchRecipes);

  useEffect(() => {
    if (restaurantId) {
      fetchRecipes();
      
      const channel = supabase
        .channel('recipes-changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'recipes',
          filter: `restaurant_id=eq.${restaurantId}`
        }, () => {
          fetchRecipes();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [restaurantId]);

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || recipe.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteRecipe = (recipeId: string) => {
    deleteRecipe(recipeId);
    setDeleteRecipeId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Caricamento ricette...</p>
        </div>
      </div>
    );
  }

  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600">Errore: Nessun ristorante associato</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50">
        <RecipeHeader onAddRecipe={fetchRecipes} />

        <main className="max-w-7xl mx-auto px-6 py-8">
          <RecipeFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categories={categories}
          />

          {filteredRecipes.length === 0 ? (
            <EmptyRecipeState
              onAddRecipe={fetchRecipes}
              searchTerm={searchTerm}
              selectedCategory={selectedCategory}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onEdit={setEditingRecipe}
                  onDuplicate={duplicateRecipe}
                  onDelete={setDeleteRecipeId}
                  onPrint={printRecipe}
                />
              ))}
            </div>
          )}
        </main>

        {/* Edit Recipe Dialog */}
        {editingRecipe && (
          <EditRecipeDialog
            recipe={editingRecipe}
            onClose={() => setEditingRecipe(null)}
            onRecipeUpdated={() => {
              fetchRecipes();
              setEditingRecipe(null);
            }}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteRecipeId} onOpenChange={() => setDeleteRecipeId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
              <AlertDialogDescription>
                Sei sicuro di voler eliminare questa ricetta? Questa azione non può essere annullata.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteRecipeId) {
                    handleDeleteRecipe(deleteRecipeId);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Elimina
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};

export default Recipes;
