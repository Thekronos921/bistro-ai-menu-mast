
import { useMemo, useCallback } from "react";
import { calculateTotalCost, calculateCostPerPortion } from "@/utils/recipeCalculations";
import { MenuCategory } from "@/components/MenuEngineeringBadge";
import type { Recipe } from "@/types/recipe";
import { TimePeriod } from "@/components/PeriodSelector";
import { convertTimePeriodToParams } from "@/integrations/cassaInCloud/foodCostCalculationService";

interface Dish {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  recipe_id?: string;
  recipes?: Recipe;
}

interface SalesData {
  dishName: string;
  unitsSold: number;
  period: string;
  revenue: number;
}

interface SettingsConfig {
  criticalThreshold: number;
  targetThreshold: number;
  targetPercentage: number;
}

interface ExternalSaleData {
  id: string;
  restaurant_id: string;
  dish_id: string | null;
  external_product_id: string | null;
  unmapped_product_description: string | null;
  quantity_sold: number;
  total_amount_sold_for_row: number;
  sale_timestamp: string;
  sale_date_local: string;
  created_at: string;
}

export const useFoodCostAnalysis = (
  dishes: Dish[],
  recipes: Recipe[],
  salesData: SalesData[],
  selectedPeriod: TimePeriod,
  settings: SettingsConfig,
  detailedSalesData?: ExternalSaleData[],
  dateRange?: { from: Date | undefined; to: Date | undefined }
) => {
  const getDishSalesData = useCallback((dishName: string) => {
    return salesData.find(s => s.dishName.toLowerCase() === dishName.toLowerCase() && s.period === selectedPeriod);
  }, [salesData, selectedPeriod]);

  const getTotalSalesForPeriod = useCallback(() => {
    return salesData
      .filter(s => s.period === selectedPeriod)
      .reduce((total, s) => total + s.unitsSold, 0);
  }, [salesData, selectedPeriod]);

  const totalSalesForPeriod = useMemo(() => getTotalSalesForPeriod(), [getTotalSalesForPeriod]);

  const getSalesMixPercentage = useCallback((dishName: string) => {
    const dishSales = getDishSalesData(dishName);
    if (!dishSales || totalSalesForPeriod === 0) return 0;
    return (dishSales.unitsSold / totalSalesForPeriod) * 100;
  }, [getDishSalesData, totalSalesForPeriod]);

  const getPopularityScore = useCallback((dishName: string) => {
    const salesMix = getSalesMixPercentage(dishName);
    // Normalizza in scala 1-100 per la visualizzazione
    return Math.min(100, Math.max(1, salesMix * 10));
  }, [getSalesMixPercentage]);

  const dishAnalysisMap = useMemo(() => {
    const map = new Map<string, any>();
    dishes.forEach(dish => {
      let costPerPortion = 0;
      if (dish.recipes && dish.recipes.recipe_ingredients && dish.recipes.recipe_ingredients.length > 0) {
        costPerPortion = calculateCostPerPortion(dish.recipes.recipe_ingredients, dish.recipes.portions);
      }
      
      const foodCostPercentage = dish.selling_price > 0 ? (costPerPortion / dish.selling_price) * 100 : 0;
      const margin = dish.selling_price - costPerPortion;
      
      let status = "ottimo";
      if (foodCostPercentage > settings.criticalThreshold) status = "critico";
      else if (foodCostPercentage > 30) status = "buono";

      const popularity = getPopularityScore(dish.name);

      map.set(dish.id, {
        foodCost: costPerPortion,
        foodCostPercentage,
        margin,
        status,
        popularity
      });
    });
    return map;
  }, [dishes, recipes, settings, getPopularityScore]);

  const getDishAnalysis = useCallback((dish: Dish) => {
    return dishAnalysisMap.get(dish.id) || { foodCost: 0, foodCostPercentage: 0, margin: dish.selling_price || 0, status: 'N/A', popularity: 0 };
  }, [dishAnalysisMap]);

  const getRecipeAnalysis = (recipe: Recipe, assumedPrice: number = 25) => {
    const totalCost = calculateTotalCost(recipe.recipe_ingredients);
    const costPerPortion = calculateCostPerPortion(recipe.recipe_ingredients, recipe.portions);
    const foodCostPercentage = assumedPrice > 0 ? (costPerPortion / assumedPrice) * 100 : 0;
    const margin = assumedPrice - costPerPortion;
    
    let status = "ottimo";
    if (foodCostPercentage > settings.criticalThreshold) status = "critico";
    else if (foodCostPercentage > 30) status = "buono";

    return {
      foodCost: costPerPortion,
      foodCostPercentage,
      margin,
      status,
      assumedPrice,
      popularity: Math.floor(Math.random() * 50) + 1 // Simulato per ricette
    };
  };

  const getMenuEngineeringCategory = (dish: Dish): MenuCategory => {
    const analysis = getDishAnalysis(dish);
    const salesMix = getSalesMixPercentage(dish.name);
    
    // Metodo BCG migliorato con dati di vendita reali
    const totalDishes = dishes.length;
    const hurdleRate = (100 / totalDishes) * 0.70; // Soglia di popolarità
    
    const avgMargin = dishes.reduce((sum, d) => {
      const dAnalysis = getDishAnalysis(d);
      return sum + dAnalysis.margin;
    }, 0) / dishes.length;

    const highPopularity = salesMix > hurdleRate;
    const highProfitability = analysis.margin > avgMargin;

    if (highPopularity && highProfitability) return "star";
    if (highPopularity && !highProfitability) return "plowhorse";
    if (!highPopularity && highProfitability) return "puzzle";
    return "dog";
  };

  const allDishAnalyses = useMemo(() => Array.from(dishAnalysisMap.values()), [dishAnalysisMap]);

  const avgFoodCostPercentage = allDishAnalyses.length > 0 
    ? allDishAnalyses.reduce((sum, analysis) => sum + analysis.foodCostPercentage, 0) / allDishAnalyses.length 
    : 0;

  // Calculate total revenue including variations from detailed sales data
  const totalRevenue = useMemo(() => {
    if (detailedSalesData && dateRange) {
      const { periodStartLocal, periodEndLocal } = convertTimePeriodToParams(selectedPeriod, dateRange);
      
      const filteredSales = detailedSalesData.filter(sale => {
        if (!sale.sale_date_local) return false;
        return sale.sale_date_local >= periodStartLocal && sale.sale_date_local <= periodEndLocal;
      });
      
      // Include ALL revenue: products + variations
      const totalRevenueIncludingVariations = filteredSales.reduce((total, sale) => {
        return total + (Number(sale.total_amount_sold_for_row) || 0);
      }, 0);
      
      console.log(`[FoodCostAnalysis] Total revenue including variations: €${totalRevenueIncludingVariations.toFixed(2)}`);
      return totalRevenueIncludingVariations;
    }
    
    // Fallback to aggregated sales data
    return salesData
      .filter(s => s.period === selectedPeriod)
      .reduce((total, s) => total + (s.revenue || 0), 0);
  }, [detailedSalesData, dateRange, selectedPeriod, salesData]);

  const dishMapByName = useMemo(() => {
    const map = new Map<string, Dish>();
    dishes.forEach(dish => {
      map.set(dish.name.toLowerCase(), dish);
    });
    return map;
  }, [dishes]);

  const totalCostOfGoodsSold = useMemo(() => {
    let totalCost = 0;
    salesData.forEach(sale => {
      if (sale.period !== selectedPeriod) return;

      const dish = dishMapByName.get(sale.dishName.toLowerCase());
      if (dish) {
        const analysis = getDishAnalysis(dish);
        if (analysis) {
            totalCost += analysis.foodCost * sale.unitsSold;
        }
      }
    });
    return totalCost;
  }, [salesData, selectedPeriod, dishMapByName, getDishAnalysis]);

  const totalMargin = useMemo(() => {
    if (totalRevenue === 0 && totalCostOfGoodsSold === 0) return 0;
    console.log(`[FoodCostAnalysis] Total Revenue: ${totalRevenue}, Total COGS: ${totalCostOfGoodsSold}, Margin: ${totalRevenue - totalCostOfGoodsSold}`);
    return totalRevenue - totalCostOfGoodsSold;
  }, [totalRevenue, totalCostOfGoodsSold]);
    
  const criticalDishes = allDishAnalyses.filter(analysis => analysis.foodCostPercentage > settings.criticalThreshold).length;
  const targetReached = allDishAnalyses.length > 0 
    ? (allDishAnalyses.filter(analysis => analysis.foodCostPercentage < settings.targetThreshold).length / allDishAnalyses.length) * 100 
    : 0;

  return {
    getDishSalesData,
    getTotalSalesForPeriod,
    getSalesMixPercentage,
    getPopularityScore,
    getDishAnalysis,
    getRecipeAnalysis,
    getMenuEngineeringCategory,
    avgFoodCostPercentage,
    totalMargin,
    totalRevenue,
    criticalDishes,
    targetReached
  };
};
