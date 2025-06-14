import { calculateTotalCost, calculateCostPerPortion } from "@/utils/recipeCalculations";
import { MenuCategory } from "@/components/MenuEngineeringBadge";
import type { Recipe } from "@/types/recipe";
import { TimePeriod } from "@/components/PeriodSelector";

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

export const useFoodCostAnalysis = (
  dishes: Dish[],
  recipes: Recipe[],
  salesData: SalesData[],
  selectedPeriod: TimePeriod,
  settings: SettingsConfig
) => {
  const getDishSalesData = (dishName: string) => {
    return salesData.find(s => s.dishName.toLowerCase() === dishName.toLowerCase() && s.period === selectedPeriod);
  };

  const getTotalSalesForPeriod = () => {
    return salesData
      .filter(s => s.period === selectedPeriod)
      .reduce((total, s) => total + s.unitsSold, 0);
  };

  const getSalesMixPercentage = (dishName: string) => {
    const dishSales = getDishSalesData(dishName);
    const totalSales = getTotalSalesForPeriod();
    
    if (!dishSales || totalSales === 0) return 0;
    return (dishSales.unitsSold / totalSales) * 100;
  };

  const getPopularityScore = (dishName: string) => {
    const salesMix = getSalesMixPercentage(dishName);
    // Normalizza in scala 1-100 per la visualizzazione
    return Math.min(100, Math.max(1, salesMix * 10));
  };

  const getDishAnalysis = (dish: Dish) => {
    const foodCost = dish.recipes ? calculateTotalCost(dish.recipes.recipe_ingredients) : 0;
    const costPerPortion = dish.recipes ? calculateCostPerPortion(dish.recipes.recipe_ingredients, dish.recipes.portions) : 0;
    const foodCostPercentage = dish.selling_price > 0 ? (costPerPortion / dish.selling_price) * 100 : 0;
    const margin = dish.selling_price - costPerPortion;
    
    let status = "ottimo";
    if (foodCostPercentage > settings.criticalThreshold) status = "critico";
    else if (foodCostPercentage > 30) status = "buono";

    const popularity = getPopularityScore(dish.name);

    return {
      foodCost: costPerPortion,
      foodCostPercentage,
      margin,
      status,
      popularity
    };
  };

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

  // Calcola statistiche aggregate
  const allDishAnalyses = dishes.map(getDishAnalysis);
  const avgFoodCostPercentage = allDishAnalyses.length > 0 
    ? allDishAnalyses.reduce((sum, analysis) => sum + analysis.foodCostPercentage, 0) / allDishAnalyses.length 
    : 0;

  const totalMargin = allDishAnalyses.reduce((sum, analysis) => {
    const dishSales = getDishSalesData(dishes.find(d => getDishAnalysis(d) === analysis)?.name || "");
    const soldUnits = dishSales?.unitsSold || 0;
    return sum + (analysis.margin * soldUnits);
  }, 0);

  const totalRevenue = salesData
    .filter(s => s.period === selectedPeriod)
    .reduce((total, s) => total + (s.revenue || 0), 0);

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
