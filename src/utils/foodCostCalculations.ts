
import { Recipe, Dish, SalesData, SettingsConfig, DishAnalysis, RecipeAnalysis } from "@/types/foodCost";
import { MenuCategory } from "@/components/MenuEngineeringBadge";

export const calculateRecipeCost = (recipeIngredients: Recipe['recipe_ingredients']) => {
  if (!recipeIngredients) return 0;
  return recipeIngredients.reduce((total, ri) => {
    return total + (ri.ingredients.effective_cost_per_unit * ri.quantity);
  }, 0);
};

export const getDishSalesData = (dishName: string, salesData: SalesData[], selectedPeriod: string) => {
  return salesData.find(s => s.dishName.toLowerCase() === dishName.toLowerCase() && s.period === selectedPeriod);
};

export const getTotalSalesForPeriod = (salesData: SalesData[], selectedPeriod: string) => {
  return salesData
    .filter(s => s.period === selectedPeriod)
    .reduce((total, s) => total + s.unitsSold, 0);
};

export const getSalesMixPercentage = (dishName: string, salesData: SalesData[], selectedPeriod: string) => {
  const dishSales = getDishSalesData(dishName, salesData, selectedPeriod);
  const totalSales = getTotalSalesForPeriod(salesData, selectedPeriod);
  
  if (!dishSales || totalSales === 0) return 0;
  return (dishSales.unitsSold / totalSales) * 100;
};

export const getPopularityScore = (dishName: string, salesData: SalesData[], selectedPeriod: string) => {
  const salesMix = getSalesMixPercentage(dishName, salesData, selectedPeriod);
  return Math.min(100, Math.max(1, salesMix * 10));
};

export const getDishAnalysis = (dish: Dish, settings: SettingsConfig, salesData: SalesData[], selectedPeriod: string): DishAnalysis => {
  const foodCost = dish.recipes ? calculateRecipeCost(dish.recipes.recipe_ingredients) : 0;
  const foodCostPercentage = dish.selling_price > 0 ? (foodCost / dish.selling_price) * 100 : 0;
  const margin = dish.selling_price - foodCost;
  
  let status = "ottimo";
  if (foodCostPercentage > settings.criticalThreshold) status = "critico";
  else if (foodCostPercentage > 30) status = "buono";

  const popularity = getPopularityScore(dish.name, salesData, selectedPeriod);

  return {
    foodCost,
    foodCostPercentage,
    margin,
    status,
    popularity
  };
};

export const getRecipeAnalysis = (recipe: Recipe, settings: SettingsConfig, assumedPrice: number = 25): RecipeAnalysis => {
  const foodCost = calculateRecipeCost(recipe.recipe_ingredients);
  const foodCostPercentage = assumedPrice > 0 ? (foodCost / assumedPrice) * 100 : 0;
  const margin = assumedPrice - foodCost;
  
  let status = "ottimo";
  if (foodCostPercentage > settings.criticalThreshold) status = "critico";
  else if (foodCostPercentage > 30) status = "buono";

  return {
    foodCost,
    foodCostPercentage,
    margin,
    status,
    assumedPrice,
    popularity: Math.floor(Math.random() * 50) + 1
  };
};

export const getMenuEngineeringCategory = (dish: Dish, dishes: Dish[], salesData: SalesData[], selectedPeriod: string, settings: SettingsConfig): MenuCategory => {
  const analysis = getDishAnalysis(dish, settings, salesData, selectedPeriod);
  const salesMix = getSalesMixPercentage(dish.name, salesData, selectedPeriod);
  
  const totalDishes = dishes.length;
  const hurdleRate = (100 / totalDishes) * 0.70;
  
  const avgMargin = dishes.reduce((sum, d) => {
    const dAnalysis = getDishAnalysis(d, settings, salesData, selectedPeriod);
    return sum + dAnalysis.margin;
  }, 0) / dishes.length;

  const highPopularity = salesMix > hurdleRate;
  const highProfitability = analysis.margin > avgMargin;

  if (highPopularity && highProfitability) return "star";
  if (highPopularity && !highProfitability) return "plowhorse";
  if (!highPopularity && highProfitability) return "puzzle";
  return "dog";
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case "ottimo": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "buono": return "bg-blue-100 text-blue-800 border-blue-200";
    case "critico": return "bg-red-100 text-red-800 border-red-200";
    default: return "bg-gray-100 text-gray-800 border-gray-200";
  }
};
