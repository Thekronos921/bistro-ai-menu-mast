import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import type { Recipe } from "@/types/recipe";

interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost_per_unit: number;
  effective_cost_per_unit?: number;
  yield_percentage?: number;
}

interface RecipeIngredient {
  id: string;
  ingredient_id: string;
  quantity: number;
  ingredients: Ingredient;
}

interface CategoryInfo {
  name: string;
}

interface Dish {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  recipe_id?: string;
  recipes?: Recipe;
}

interface FoodCostSalesData {
  dishName: string;
  unitsSold: number;
  saleDate: string;
  period: string;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export const useFoodCostData = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [salesData, setSalesData] = useState<FoodCostSalesData[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();

  const fetchData = async () => {
    try {
      if (!restaurantId) {
        console.log("No restaurant ID available");
        setLoading(false);
        return;
      }

      console.log("Fetching data for restaurant:", restaurantId);

      // Fetch dishes con ricette e nomi delle categorie per il ristorante corrente
      const { data: dishesData, error: dishesError } = await supabase
        .from('dishes')
        .select(`
          id,
          name,
          selling_price,
          recipe_id,
          restaurant_id,
          external_id,
          external_category_id,
          is_enabled_for_restaurant,
          is_visible_on_ecommerce,
          is_visible_on_pos,
          availability_status,
          cic_notes,
          image_url,
          last_synced_at,
          sync_status,
          cic_price_includes_vat,
          cic_vat_percentage,
          cic_department_id,
          cic_department_name,
          cic_variants_count,
          cic_has_variants,
          created_at,
          updated_at,
          restaurant_category_id,
          category:restaurant_categories ( name ),
          recipes (
            id,
            name,
            category,
            preparation_time,
            difficulty,
            portions,
            description,
            allergens,
            calories,
            protein,
            carbs,
            fat,
            restaurant_id,
            selling_price,
            is_semilavorato,
            notes_chef,
            created_at,
            updated_at,
            recipe_ingredients (
              id,
              ingredient_id,
              quantity,
              unit,
              is_semilavorato,
              ingredients (
                id,
                name,
                unit,
                cost_per_unit,
                effective_cost_per_unit,
                yield_percentage
              )
            ),
            recipe_instructions (
              id,
              step_number,
              instruction
            )
          )
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (dishesError) throw dishesError;

      // Trasforma i dati dei piatti per appiattire la categoria
      const transformedDishesData: Dish[] = dishesData?.map(dish => ({
        id: dish.id,
        name: dish.name,
        selling_price: dish.selling_price,
        recipe_id: dish.recipe_id,
        // Accedi al nome della categoria tramite l'oggetto 'category' restituito dalla query
        category: (dish.category as CategoryInfo)?.name || 'Senza categoria',
        // Transform nested recipes array to single recipe if it exists
        recipes: dish.recipes && Array.isArray(dish.recipes) && dish.recipes.length > 0 
          ? {
              id: dish.recipes[0].id,
              name: dish.recipes[0].name,
              category: dish.recipes[0].category,
              preparation_time: dish.recipes[0].preparation_time,
              difficulty: dish.recipes[0].difficulty,
              portions: dish.recipes[0].portions,
              description: dish.recipes[0].description,
              allergens: dish.recipes[0].allergens,
              calories: dish.recipes[0].calories,
              protein: dish.recipes[0].protein,
              carbs: dish.recipes[0].carbs,
              fat: dish.recipes[0].fat,
              restaurant_id: dish.recipes[0].restaurant_id,
              selling_price: dish.recipes[0].selling_price,
              is_semilavorato: dish.recipes[0].is_semilavorato,
              notes_chef: dish.recipes[0].notes_chef,
              created_at: dish.recipes[0].created_at,
              updated_at: dish.recipes[0].updated_at,
              recipe_ingredients: dish.recipes[0].recipe_ingredients || [],
              recipe_instructions: dish.recipes[0].recipe_instructions || []
            } as Recipe
          : undefined
      })) || [];

      // Fetch ricette standalone per il ristorante corrente (non ancora associate a piatti)
      const { data: recipesData, error: recipesError } = await supabase
        .from('recipes')
        .select(`
          *,
          recipe_ingredients (
            id,
            ingredient_id,
            quantity,
            unit,
            is_semilavorato,
            ingredients (
              id,
              name,
              unit,
              cost_per_unit,
              effective_cost_per_unit,
              yield_percentage
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

      if (recipesError) throw recipesError;

      console.log("Fetched dishes:", transformedDishesData);
      console.log("Fetched recipes:", recipesData);

      setDishes(transformedDishesData);
      setRecipes(recipesData || []);
    } catch (error) {
      console.error("Fetch data error:", error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento dei dati",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createDishFromRecipe = async (recipe: Recipe) => {
    try {
      if (!restaurantId) {
        toast({
          title: "Errore",
          description: "ID ristorante non trovato",
          variant: "destructive"
        });
        return;
      }

      const recipeCost = recipe.recipe_ingredients.reduce((total, ri) => {
        const effectiveCost = ri.ingredients.effective_cost_per_unit ?? ri.ingredients.cost_per_unit;
        return total + (effectiveCost * ri.quantity);
      }, 0);
      
      const suggestedPrice = recipeCost * 3; // Margine del 66%

      const { error } = await supabase
        .from('dishes')
        .insert([{
          name: recipe.name,
          category: recipe.category,
          selling_price: suggestedPrice,
          recipe_id: recipe.id,
          restaurant_id: restaurantId
        }]);

      if (error) throw error;

      toast({
        title: "Successo",
        description: `Piatto "${recipe.name}" creato con prezzo suggerito €${suggestedPrice.toFixed(2)}`,
      });

      fetchData();
    } catch (error) {
      console.error("Create dish error:", error);
      toast({
        title: "Errore",
        description: "Errore nella creazione del piatto",
        variant: "destructive"
      });
    }
  };

  const handleSalesImport = (importedSales: FoodCostSalesData[]) => {
    setSalesData(prev => {
      // Rimuovi dati esistenti per le stesse date e aggiungi nuovi dati
      const existingDates = new Set(importedSales.map(s => s.saleDate));
      const otherDates = prev.filter(s => !existingDates.has(s.saleDate));
      return [...otherDates, ...importedSales];
    });
    
    console.log('Sales data imported:', importedSales);
    toast({
      title: "Successo",
      description: `Importati ${importedSales.length} record di vendita`
    });
  };

  const getFilteredSalesData = () => {
    if (!dateRange.from && !dateRange.to) {
      return salesData;
    }

    return salesData.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      
      if (dateRange.from && saleDate < dateRange.from) {
        return false;
      }
      
      if (dateRange.to && saleDate > dateRange.to) {
        return false;
      }
      
      return true;
    });
  };

  const deleteDish = async (dishId: string) => {
    try {
      if (!restaurantId) {
        toast({
          title: "Errore",
          description: "ID ristorante non trovato",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('dishes')
        .delete()
        .eq('id', dishId)
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Piatto eliminato con successo"
      });

      fetchData();
    } catch (error) {
      console.error("Delete dish error:", error);
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione del piatto",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchData();
    }
  }, [restaurantId]);

  return {
    dishes,
    recipes,
    salesData: getFilteredSalesData(),
    allSalesData: salesData,
    dateRange,
    setDateRange,
    loading,
    fetchData,
    createDishFromRecipe,
    handleSalesImport,
    deleteDish
  };
};
