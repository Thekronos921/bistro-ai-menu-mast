
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft, Search, Filter, Plus, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MobileSafeArea from '@/components/mobile/MobileSafeArea';
import BottomNavigation from '@/components/mobile/BottomNavigation';
import MobileRecipeCard from '@/components/mobile/MobileRecipeCard';
import RecipeScalingWidget from '@/components/mobile/RecipeScalingWidget';
import KitchenModeModal from '@/components/mobile/KitchenModeModal';
import type { Recipe } from '@/types/recipe';

const MobileRecipes: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedRecipeForScaling, setSelectedRecipeForScaling] = useState<Recipe | null>(null);
  const [selectedRecipeForKitchen, setSelectedRecipeForKitchen] = useState<Recipe | null>(null);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  // Redirect to desktop if not mobile
  useEffect(() => {
    if (!isMobile) {
      navigate('/recipes');
    }
  }, [isMobile, navigate]);

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
            unit,
            is_semilavorato,
            recipe_yield_percentage,
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

  const handleAddRecipe = () => {
    navigate('/recipes'); // Navigate to desktop version for adding recipes
  };

  // Extract unique categories
  const categories = Array.from(new Set(recipes.map(recipe => recipe.category).filter(Boolean)));

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.category?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCategory !== 'all' && recipe.category !== selectedCategory) {
      return false;
    }

    return true;
  });

  // Statistics
  const totalRecipes = recipes.length;
  const semilavoratiCount = recipes.filter(r => r.is_semilavorato).length;
  const avgPreparationTime = recipes.length > 0 
    ? Math.round(recipes.reduce((sum, r) => sum + r.preparation_time, 0) / recipes.length)
    : 0;

  if (loading) {
    return (
      <MobileSafeArea>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Caricamento ricette...</p>
          </div>
        </div>
      </MobileSafeArea>
    );
  }

  if (!restaurantId) {
    return (
      <MobileSafeArea>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-slate-600">Errore: Nessun ristorante associato</p>
          </div>
        </div>
      </MobileSafeArea>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50">
        <div className="px-3 py-3">
          {/* Mobile Layout */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">👨‍🍳</span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-slate-800 truncate">Ricette</h1>
              <p className="text-xs text-slate-500">{recipes.length} ricette disponibili</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-20">
        <Tabs defaultValue="all" className="w-full">
          {/* Stats Cards */}
          <div className="px-3 pt-4 pb-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-purple-50 rounded-lg p-2 text-center">
                <div className="text-base font-bold text-purple-800">{totalRecipes}</div>
                <div className="text-xs text-purple-600">Totali</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <div className="text-base font-bold text-blue-800">{semilavoratiCount}</div>
                <div className="text-xs text-blue-600">Semilavorati</div>
              </div>
              <div className="bg-green-50 rounded-lg p-2 text-center">
                <div className="text-base font-bold text-green-800">{avgPreparationTime}m</div>
                <div className="text-xs text-green-600">Tempo Medio</div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="px-3 pb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                placeholder="Cerca ricette..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="px-3 pb-3">
            <TabsList className="grid w-full grid-cols-2 h-8">
              <TabsTrigger 
                value="all" 
                className="text-xs"
                onClick={() => setSelectedCategory('all')}
              >
                Tutte ({totalRecipes})
              </TabsTrigger>
              <TabsTrigger 
                value="categories" 
                className="text-xs"
              >
                Per Categoria
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="px-3 mt-0">
            {/* Add Recipe Button */}
            <Button
              onClick={handleAddRecipe}
              className="w-full bg-orange-600 hover:bg-orange-700 mb-3 h-10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Nuova Ricetta
            </Button>

            {/* Recipe List */}
            <div className="space-y-3">
              {filteredRecipes.length > 0 ? (
                filteredRecipes.map((recipe) => (
                  <MobileRecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onViewKitchenMode={(recipe) => setSelectedRecipeForKitchen(recipe)}
                    onScale={(recipe) => setSelectedRecipeForScaling(recipe)}
                  />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-base font-medium">Nessuna ricetta trovata</p>
                  {searchTerm ? (
                    <div className="mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchTerm('')}
                      >
                        Rimuovi filtri
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <Button
                        onClick={handleAddRecipe}
                        className="bg-orange-600 hover:bg-orange-700"
                        size="sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Crea Prima Ricetta
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="px-3 mt-0">
            <div className="space-y-2">
              {categories.map(category => {
                const categoryRecipes = recipes.filter(r => r.category === category);
                return (
                  <Button
                    key={category}
                    variant="outline"
                    className="w-full justify-between h-10"
                    onClick={() => {
                      setSelectedCategory(category);
                      // Switch back to all tab to show filtered results
                      const allTab = document.querySelector('[value="all"]') as HTMLButtonElement;
                      allTab?.click();
                    }}
                  >
                    <span className="capitalize">{category}</span>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                      {categoryRecipes.length}
                    </span>
                  </Button>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      <RecipeScalingWidget
        isOpen={!!selectedRecipeForScaling}
        onClose={() => setSelectedRecipeForScaling(null)}
        recipe={selectedRecipeForScaling}
      />

      <KitchenModeModal
        isOpen={!!selectedRecipeForKitchen}
        onClose={() => setSelectedRecipeForKitchen(null)}
        recipe={selectedRecipeForKitchen}
      />

      <BottomNavigation />
    </div>
  );
};

export default MobileRecipes;
