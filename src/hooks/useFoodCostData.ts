
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import { fetchDishes, fetchRecipes } from "./food-cost/dataFetchers";
import { createDishFromRecipe, deleteDish } from "./food-cost/dishOperations";
import { filterSalesDataByDateRange, mergeSalesData } from "./food-cost/salesDataUtils";
import type { 
  Dish, 
  FoodCostSalesData, 
  DateRange 
} from "./food-cost/types";
import type { Recipe } from "@/types/recipe";

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

      const [dishesData, recipesData] = await Promise.all([
        fetchDishes(restaurantId),
        fetchRecipes(restaurantId)
      ]);

      console.log("Fetched dishes:", dishesData);
      console.log("Fetched recipes:", recipesData);

      setDishes(dishesData);
      setRecipes(recipesData);
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

  const handleCreateDishFromRecipe = async (recipe: Recipe) => {
    try {
      if (!restaurantId) {
        toast({
          title: "Errore",
          description: "ID ristorante non trovato",
          variant: "destructive"
        });
        return;
      }

      await createDishFromRecipe(recipe, restaurantId);

      const recipeCost = recipe.recipe_ingredients.reduce((total, ri) => {
        const effectiveCost = ri.ingredients.effective_cost_per_unit ?? ri.ingredients.cost_per_unit;
        return total + (effectiveCost * ri.quantity);
      }, 0);
      
      const suggestedPrice = recipeCost * 3; // Margine del 66%

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
    setSalesData(prev => mergeSalesData(prev, importedSales));
    
    console.log('Sales data imported:', importedSales);
    toast({
      title: "Successo",
      description: `Importati ${importedSales.length} record di vendita`
    });
  };

  const getFilteredSalesData = () => {
    return filterSalesDataByDateRange(salesData, dateRange);
  };

  const handleDeleteDish = async (dishId: string) => {
    try {
      if (!restaurantId) {
        toast({
          title: "Errore",
          description: "ID ristorante non trovato",
          variant: "destructive"
        });
        return;
      }

      await deleteDish(dishId, restaurantId);

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
    createDishFromRecipe: handleCreateDishFromRecipe,
    handleSalesImport,
    deleteDish: handleDeleteDish
  };
};
