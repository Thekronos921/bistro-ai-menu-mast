
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileHeader from '@/components/mobile/MobileHeader';
import MobileSafeArea from '@/components/mobile/MobileSafeArea';
import BottomNavigation from '@/components/mobile/BottomNavigation';
import MobileRecipeList from '@/components/mobile/MobileRecipeList';
import type { Recipe } from '@/types/recipe';

const MobileRecipes: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
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
    <MobileSafeArea>
      <div className="flex flex-col h-full bg-gradient-to-br from-orange-50 to-red-50">
        <MobileHeader 
          title="Ricette" 
          subtitle={`${recipes.length} ricette disponibili`}
        />
        
        <main className="flex-1 overflow-auto px-4 py-6">
          <MobileRecipeList
            recipes={recipes}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAddRecipe={handleAddRecipe}
            categories={categories}
          />
        </main>

        <BottomNavigation />
      </div>
    </MobileSafeArea>
  );
};

export default MobileRecipes;
