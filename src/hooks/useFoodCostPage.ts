
import { useState, useEffect, useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { FilterConfig } from "@/components/AdvancedFilters";
import { TimePeriod } from "@/components/PeriodSelector";
import { useFoodCostData } from "@/hooks/useFoodCostData";
import { useFoodCostAnalysis } from "@/hooks/useFoodCostAnalysis";
import { useCategories } from '@/hooks/useCategories';
import type { Recipe } from "@/types/recipe";

interface Dish {
  id: string;
  name: string;
  category: string;
  selling_price: number;
  recipe_id?: string;
  external_id?: string;
  recipes?: Recipe;
}

interface FoodCostSalesData {
  dishName: string;
  unitsSold: number;
  saleDate: string;
  period?: string;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface SettingsConfig {
  criticalThreshold: number;
  targetThreshold: number;
  targetPercentage: number;
}

interface SimpleRecipe {
  id: string;
  name: string;
  category: string;
  is_semilavorato?: boolean;
  recipe_ingredients: {
    ingredients: {
      cost_per_unit: number;
    };
    quantity: number;
  }[];
}

export const useFoodCostPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("last30days");
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [associatingDish, setAssociatingDish] = useState<Dish | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterConfig>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const { toast } = useToast();
  const { categories } = useCategories();

  // Settings configuration
  const [settings, setSettings] = useState<SettingsConfig>(() => {
    const saved = localStorage.getItem('foodCostSettings');
    return saved ? JSON.parse(saved) : {
      criticalThreshold: 40,
      targetThreshold: 35,
      targetPercentage: 80
    };
  });

  const saveSettings = (newSettings: SettingsConfig) => {
    setSettings(newSettings);
    localStorage.setItem('foodCostSettings', JSON.stringify(newSettings));
  };

  const {
    dishes,
    recipes,
    allSalesData,
    foodCostSalesData,
    dateRange,
    setDateRange,
    loading,
    calculatingFoodCost,
    fetchData,
    createDishFromRecipe,
    handleSalesImport,
    deleteDish,
    calculateFoodCostForPeriod,
    loadFoodCostSalesData
  } = useFoodCostData();

  // Transform foodCostSalesData
  const transformedSalesData = useMemo(() => foodCostSalesData.map(sale => ({
    dishName: sale.dish_name,
    unitsSold: sale.total_quantity_sold,
    revenue: sale.total_revenue,
    period: selectedPeriod,
  })), [foodCostSalesData, selectedPeriod]);

  const {
    getTotalSalesForPeriod,
    getSalesMixPercentage,
    getDishAnalysis,
    getRecipeAnalysis,
    getMenuEngineeringCategory,
    avgFoodCostPercentage,
    totalMargin,
    totalRevenue,
    criticalDishes,
    targetReached
  } = useFoodCostAnalysis(dishes, recipes, transformedSalesData, selectedPeriod, settings);

  // Load food cost data when period or date range changes
  useEffect(() => {
    loadFoodCostSalesData(selectedPeriod, dateRange);
  }, [selectedPeriod, dateRange, loadFoodCostSalesData]);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, advancedFilters, itemsPerPage]);

  // Convert Recipe to SimpleRecipe for dialog components
  const convertToSimpleRecipe = (recipe: Recipe): SimpleRecipe => {
    return {
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
      is_semilavorato: recipe.is_semilavorato,
      recipe_ingredients: recipe.recipe_ingredients.map(ri => ({
        ingredients: {
          cost_per_unit: ri.ingredients.cost_per_unit
        },
        quantity: ri.quantity
      }))
    };
  };

  const handleEditRecipeFromDialog = useCallback((simpleRecipe: SimpleRecipe) => {
    const fullRecipe = recipes.find(r => r.id === simpleRecipe.id) || 
                      dishes.find(d => d.recipes?.id === simpleRecipe.id)?.recipes;
    
    if (fullRecipe) {
      const completeRecipe: Recipe = {
        ...fullRecipe,
        preparation_time: fullRecipe.preparation_time || 0,
        difficulty: fullRecipe.difficulty || 'Facile',
        portions: fullRecipe.portions || 1,
        description: fullRecipe.description || '',
        allergens: fullRecipe.allergens || '',
        calories: fullRecipe.calories || 0,
        protein: fullRecipe.protein || 0,
        carbs: fullRecipe.carbs || 0,
        fat: fullRecipe.fat || 0,
        is_semilavorato: fullRecipe.is_semilavorato || false,
        recipe_instructions: fullRecipe.recipe_instructions || []
      };
      setEditingRecipe(completeRecipe);
    }
  }, [dishes, recipes]);

  const handleSalesImportWrapper = useCallback((importedSales: FoodCostSalesData[]) => {
    const convertedSales = importedSales.map(sale => ({
      dishName: sale.dishName,
      unitsSold: sale.unitsSold,
      saleDate: sale.saleDate,
      period: sale.period || 'imported'
    }));
    
    handleSalesImport(convertedSales);
  }, [handleSalesImport]);

  const handleCalculateFoodCost = useCallback(() => {
    calculateFoodCostForPeriod(selectedPeriod, dateRange, false);
  }, [calculateFoodCostForPeriod, selectedPeriod, dateRange]);

  const handleRecalculateFoodCost = useCallback(() => {
    calculateFoodCostForPeriod(selectedPeriod, dateRange, true);
  }, [calculateFoodCostForPeriod, selectedPeriod, dateRange]);

  // Combine dishes and recipes for filtering
  const allItems = useMemo(() => [
    ...dishes.map(dish => {
      const saleDataForDish = foodCostSalesData.find(sale => 
        sale.dish_external_id === dish.external_id || sale.dish_id === dish.id
      );
      
      return {
        type: 'dish' as const, 
        item: dish, 
        name: dish.name, 
        category: dish.category,
        analysis: getDishAnalysis(dish),
        menuCategory: getMenuEngineeringCategory(dish),
        unitsSold: saleDataForDish?.total_quantity_sold ?? 0, 
        revenue: saleDataForDish?.total_revenue ?? 0, 
      };
    }),
    ...recipes
      .filter(recipe => !dishes.some(dish => dish.recipe_id === recipe.id))
      .map(recipe => ({ 
        type: 'recipe' as const, 
        item: recipe, 
        name: recipe.name, 
        category: recipe.category,
        analysis: getRecipeAnalysis(recipe),
        menuCategory: "puzzle" as const,
        unitsSold: 0,
        revenue: 0
      }))
  ], [dishes, recipes, foodCostSalesData, getDishAnalysis, getMenuEngineeringCategory, getRecipeAnalysis]);

  // Enhanced filtering
  const filteredItems = useMemo(() => allItems.filter(({ name, category, analysis, menuCategory }) => {
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || category === selectedCategory;
    
    const matchesFoodCostMin = !advancedFilters.foodCostMin || analysis.foodCostPercentage >= advancedFilters.foodCostMin;
    const matchesFoodCostMax = !advancedFilters.foodCostMax || analysis.foodCostPercentage <= advancedFilters.foodCostMax;
    const matchesMarginMin = !advancedFilters.marginMin || analysis.margin >= advancedFilters.marginMin;
    const matchesMarginMax = !advancedFilters.marginMax || analysis.margin <= advancedFilters.marginMax;
    const matchesMenuCategory = !advancedFilters.menuCategory || menuCategory === advancedFilters.menuCategory;

    return matchesSearch && matchesCategory && matchesFoodCostMin && matchesFoodCostMax && 
           matchesMarginMin && matchesMarginMax && matchesMenuCategory;
  }), [allItems, searchTerm, selectedCategory, advancedFilters]);

  // Pagination logic
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const exportToCSV = useCallback(() => {
    const csvData = filteredItems.map((item) => {
      const { type, item: dataItem, analysis, menuCategory, unitsSold } = item;
      return {
        Nome: dataItem.name,
        Tipo: type === 'dish' ? 'Piatto' : 'Ricetta',
        Categoria: dataItem.category,
        'Popolarità %': type === 'dish' ? getSalesMixPercentage(dataItem.name).toFixed(2) : 'N/A',
        'Unità Vendute': type === 'dish' ? unitsSold : 'N/A',
        'Prezzo Vendita': type === 'dish' ? (dataItem as Dish).selling_price : analysis.assumedPrice,
        'Costo Ingredienti': analysis.foodCost.toFixed(2),
        'Food Cost %': analysis.foodCostPercentage.toFixed(1),
        'Margine €': analysis.margin.toFixed(2),
        'Menu Engineering': menuCategory,
        'Popolarità Score': analysis.popularity,
        'Periodo Analisi': dateRange.from && dateRange.to 
          ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
          : 'Tutti i dati'
      };
    });

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `food-cost-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [filteredItems, getSalesMixPercentage, dateRange]);

  const handleDeleteDish = useCallback((dishId: string, dishName: string) => {
    deleteDish(dishId);
  }, [deleteDish]);

  return {
    // State
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedPeriod,
    setSelectedPeriod,
    editingRecipe,
    setEditingRecipe,
    editingDish,
    setEditingDish,
    associatingDish,
    setAssociatingDish,
    showAdvancedFilters,
    setShowAdvancedFilters,
    advancedFilters,
    setAdvancedFilters,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    dateRange,
    setDateRange,
    settings,
    saveSettings,

    // Data
    dishes,
    recipes,
    foodCostSalesData,
    categories,
    loading,
    calculatingFoodCost,
    
    // Computed values
    paginatedItems,
    filteredItems,
    totalPages,
    avgFoodCostPercentage,
    totalMargin,
    totalRevenue,
    criticalDishes,
    targetReached,
    getTotalSalesForPeriod,

    // Functions
    fetchData,
    createDishFromRecipe,
    handleEditRecipeFromDialog,
    handleSalesImportWrapper,
    handleCalculateFoodCost,
    handleRecalculateFoodCost,
    exportToCSV,
    handleDeleteDish
  };
};
