import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import { fetchDishes, fetchRecipes } from "./food-cost/dataFetchers";
import { createDishFromRecipe, deleteDish } from "./food-cost/dishOperations";
import { filterSalesDataByDateRange, mergeSalesData } from "./food-cost/salesDataUtils";
import { calculateFoodCostSales, getFoodCostSalesData, convertTimePeriodToParams } from "@/integrations/cassaInCloud/foodCostCalculationService";
import type { 
  Dish, 
  FoodCostSalesData, 
  DateRange 
} from "./food-cost/types";
import type { Recipe } from "@/types/recipe";
import type { TimePeriod } from "@/components/PeriodSelector";

export const useFoodCostData = () => {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [salesData, setSalesData] = useState<FoodCostSalesData[]>([]);
  const [foodCostSalesData, setFoodCostSalesData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [loading, setLoading] = useState(true);
  const [calculatingFoodCost, setCalculatingFoodCost] = useState(false);
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();

  const fetchData = useCallback(async () => {
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

      const recipesById = new Map(recipesData.map(r => [r.id, r]));

      const linkedDishes: Dish[] = dishesData.map(dish => ({
        ...dish,
        recipes: dish.recipe_id ? recipesById.get(dish.recipe_id) : undefined
      }));

      setDishes(linkedDishes);
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
  }, [restaurantId, toast]);

  const calculateFoodCostForPeriod = useCallback(async (
    period: TimePeriod,
    customDateRange?: DateRange,
    forceRecalculate: boolean = false
  ) => {
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
      // Converti il periodo in parametri per la funzione
      const dateRangeForConversion = customDateRange?.from && customDateRange?.to 
        ? { from: customDateRange.from, to: customDateRange.to }
        : undefined;
      
      const { periodStart, periodEnd, periodType } = convertTimePeriodToParams(period, dateRangeForConversion);

      console.log('Calculating food cost for period:', { period, periodStart, periodEnd, periodType });

      // Chiama la Edge Function per calcolare i dati
      const result = await calculateFoodCostSales({
        restaurantId,
        periodStart,
        periodEnd,
        periodType,
        forceRecalculate
      });

      if (result.success) {
        setFoodCostSalesData(result.data);
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

  const loadFoodCostSalesData = useCallback(async (
    period?: TimePeriod,
    customDateRange?: DateRange
  ) => {
    if (!restaurantId) return;

    try {
      // Special handling for 'allTime'
      if (period === 'allTime') {
        const allData = await getFoodCostSalesData(restaurantId, undefined, undefined, undefined);
        
        if (allData.length > 0) {
          const aggregatedData = Object.values(
            allData.reduce((acc, current) => {
              const key = current.dish_id || current.dish_external_id || current.dish_name;
              if (!acc[key]) {
                acc[key] = { ...current, period_type: 'allTime', total_quantity_sold: Number(current.total_quantity_sold), total_revenue: Number(current.total_revenue) };
              } else {
                acc[key].total_quantity_sold += Number(current.total_quantity_sold);
                acc[key].total_revenue += Number(current.total_revenue);
              }
              return acc;
            }, {} as Record<string, any>)
          );
          setFoodCostSalesData(aggregatedData);
        } else {
          setFoodCostSalesData([]);
        }
        return;
      }

      let periodStart: string | undefined;
      let periodEnd: string | undefined;
      let periodType: string | undefined;

      if (period) {
        const dateRangeForConversion = customDateRange?.from && customDateRange?.to 
          ? { from: customDateRange.from, to: customDateRange.to }
          : undefined;
        
        const params = convertTimePeriodToParams(period, dateRangeForConversion);
        periodStart = params.periodStart;
        periodEnd = params.periodEnd;
        periodType = params.periodType;
      }

      const data = await getFoodCostSalesData(restaurantId, periodStart, periodEnd, periodType);
      setFoodCostSalesData(data);

    } catch (error) {
      console.error("Load food cost sales data error:", error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento dei dati di food cost",
        variant: "destructive"
      });
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

      fetchData();
    } catch (error) {
      console.error("Create dish error:", error);
      toast({
        title: "Errore",
        description: "Errore nella creazione del piatto",
        variant: "destructive"
      });
    }
  }, [restaurantId, toast, fetchData]);

  const handleSalesImport = useCallback((importedSales: FoodCostSalesData[]) => {
    setSalesData(prev => mergeSalesData(prev, importedSales));
    
    console.log('Sales data imported:', importedSales);
    toast({
      title: "Successo",
      description: `Importati ${importedSales.length} record di vendita`
    });
  }, [toast]);

  const filteredSalesData = useMemo(() => {
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

      fetchData();
    } catch (error) {
      console.error("Delete dish error:", error);
      toast({
        title: "Errore",
        description: "Errore nell'eliminazione del piatto",
        variant: "destructive"
      });
    }
  }, [restaurantId, toast, fetchData]);

  useEffect(() => {
    if (restaurantId) {
      fetchData();
    }
  }, [restaurantId, fetchData]);

  return {
    dishes,
    recipes,
    salesData: filteredSalesData,
    allSalesData: salesData,
    foodCostSalesData,
    dateRange,
    setDateRange,
    loading,
    calculatingFoodCost,
    fetchData,
    createDishFromRecipe: handleCreateDishFromRecipe,
    handleSalesImport,
    deleteDish: handleDeleteDish,
    calculateFoodCostForPeriod,
    loadFoodCostSalesData
  };
};
