import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import { fetchDishes, fetchRecipes } from "./food-cost/dataFetchers";
import { createDishFromRecipe, deleteDish } from "./food-cost/dishOperations";
import { filterSalesDataByDateRange, mergeSalesData } from "./food-cost/salesDataUtils";
import { 
  calculateFoodCostSales, 
  getDetailedSalesData,
  ExternalSaleData
} from "@/integrations/cassaInCloud/foodCostCalculationService";
import type { 
  Dish, 
  FoodCostSalesData, 
  DateRange 
} from "./food-cost/types";
import type { Recipe } from "@/types/recipe";

export const useFoodCostData = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [salesData, setSalesData] = useState<FoodCostSalesData[]>([]); // For manual CSV import
  const [detailedSalesData, setDetailedSalesData] = useState<ExternalSaleData[]>([]);
  const [lastCalculationDate, setLastCalculationDate] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [loading, setLoading] = useState(true);
  const [calculatingFoodCost, setCalculatingFoodCost] = useState(false);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();

  const loadInitialData = useCallback(async () => {
    try {
      if (!restaurantId) {
        console.log("No restaurant ID available");
        setLoading(false);
        return;
      }

      console.log("Fetching initial data for restaurant:", restaurantId);

      const [dishesData, recipesData, salesHistory] = await Promise.all([
        fetchDishes(restaurantId),
        fetchRecipes(restaurantId),
        getDetailedSalesData(restaurantId)
      ]);

      console.log("Fetched dishes:", dishesData);
      console.log("Fetched recipes:", recipesData);
      console.log("Fetched detailed sales:", salesHistory);

      const recipesById = new Map(recipesData.map(r => [r.id, r]));

      const linkedDishes: Dish[] = dishesData.map(dish => ({
        ...dish,
        recipes: dish.recipe_id ? recipesById.get(dish.recipe_id) : undefined
      }));

      setDishes(linkedDishes);
      setRecipes(recipesData);
      setDetailedSalesData(salesHistory);

      if (salesHistory.length > 0) {
        const mostRecentDate = salesHistory.reduce((max, item) => {
          const itemDate = new Date(item.created_at);
          return itemDate > max ? itemDate : max;
        }, new Date(0));
        setLastCalculationDate(mostRecentDate.toISOString());
      } else {
        setLastCalculationDate(null);
      }

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
  }, [restaurantId, toast]);

  const triggerSalesCalculation = useCallback(async (forceRecalculate: boolean = false) => {
    if (!restaurantId) {
      toast({
        title: "Errore",
        description: "ID ristorante non trovato",
        variant: "destructive"
      });
      return;
    }

    setCalculatingFoodCost(true);

    try {
      console.log('Triggering sales calculation, force:', forceRecalculate);
      
      const result = await calculateFoodCostSales({
        restaurantId,
        forceRecalculate
      });

      if (result.success) {
        setDetailedSalesData(result.data);
         if (result.data.length > 0) {
          const mostRecentDate = result.data.reduce((max, item) => {
            const itemDate = new Date(item.created_at);
            return itemDate > max ? itemDate : max;
          }, new Date(0));
          setLastCalculationDate(mostRecentDate.toISOString());
        }
        toast({
          title: "Successo",
          description: result.message,
        });
      } else {
        throw new Error(result.error || 'Errore nel calcolo dei dati di vendita');
      }

    } catch (error) {
      console.error("Calculate food cost error:", error);
      toast({
        title: "Errore",
        description: "Errore nel calcolo dei dati di food cost",
        variant: "destructive"
      });
    } finally {
      setCalculatingFoodCost(false);
    }
  }, [restaurantId, toast]);

  const handleCreateDishFromRecipe = useCallback(async (recipe: Recipe) => {
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

      loadInitialData(); // Reload all data
    } catch (error) {
      console.error("Create dish error:", error);
      toast({
        title: "Errore",
        description: "Errore nella creazione del piatto",
        variant: "destructive"
      });
    }
  }, [restaurantId, toast, loadInitialData]);

  const handleSalesImport = useCallback((importedSales: FoodCostSalesData[]) => {
    setSalesData(prev => mergeSalesData(prev, importedSales));
    
    console.log('Sales data imported:', importedSales);
    toast({
      title: "Successo",
      description: `Importati ${importedSales.length} record di vendita`
    });
  }, [toast]);

  const filteredSalesData = useMemo(() => {
    // This is for manually imported data, logic remains the same.
    return filterSalesDataByDateRange(salesData, dateRange);
  }, [salesData, dateRange]);

  const handleDeleteDish = useCallback(async (dishId: string) => {
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

      loadInitialData(); // Reload all data
    } catch (error) {
      console.error("Delete dish error:", error);
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione del piatto",
        variant: "destructive"
      });
    }
  }, [restaurantId, toast, loadInitialData]);

  useEffect(() => {
    if (restaurantId) {
      loadInitialData();
    }
  }, [restaurantId, loadInitialData]);

  return {
    dishes,
    recipes,
    salesData: filteredSalesData, // Manual import data
    allSalesData: salesData, // Manual import data
    detailedSalesData,
    lastCalculationDate,
    dateRange,
    setDateRange,
    loading,
    calculatingFoodCost,
    fetchData: loadInitialData,
    createDishFromRecipe: handleCreateDishFromRecipe,
    handleSalesImport,
    deleteDish: handleDeleteDish,
    triggerSalesCalculation
  };
};
