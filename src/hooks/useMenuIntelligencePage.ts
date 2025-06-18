
import { useState, useMemo } from "react";
import { TimePeriod } from "@/components/PeriodSelector";
import { useFoodCostData } from "@/hooks/useFoodCostData";
import { useFoodCostAnalysis } from "@/hooks/useFoodCostAnalysis";
import { useCategories } from '@/hooks/useCategories';
import { convertTimePeriodToParams } from "@/integrations/cassaInCloud/foodCostCalculationService";
import { useMenuIntelligenceFilters } from "./menu-intelligence/useMenuIntelligenceFilters";
import { useMenuIntelligencePagination } from "./menu-intelligence/useMenuIntelligencePagination";
import { useMenuIntelligenceItems } from "./menu-intelligence/useMenuIntelligenceItems";
import { useMenuIntelligenceSettings } from "./menu-intelligence/useMenuIntelligenceSettings";
import { useMenuIntelligenceActions } from "./menu-intelligence/useMenuIntelligenceActions";
import { useMenuIntelligenceExport } from "./menu-intelligence/useMenuIntelligenceExport";
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

export const useMenuIntelligencePage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("last30days");
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [associatingDish, setAssociatingDish] = useState<Dish | null>(null);

  const { categories } = useCategories();
  const { settings, saveSettings } = useMenuIntelligenceSettings();

  const {
    dishes,
    recipes,
    detailedSalesData,
    lastCalculationDate,
    dateRange,
    setDateRange,
    loading,
    calculatingFoodCost,
    fetchData,
    createDishFromRecipe,
    handleSalesImport,
    deleteDish,
    triggerSalesCalculation
  } = useFoodCostData();

  // Use aggregated sales data
  const aggregatedSalesData = useMemo(() => {
    if (!detailedSalesData || detailedSalesData.length === 0) return [];
    
    const { periodStartLocal, periodEndLocal } = convertTimePeriodToParams(selectedPeriod, dateRange);
    const filteredSales = detailedSalesData.filter(sale => {
      if (!sale.sale_date_local) return false;
      return sale.sale_date_local >= periodStartLocal && sale.sale_date_local <= periodEndLocal;
    });
    
    const salesByDish = filteredSales.reduce((acc, sale) => {
      const key = sale.external_product_id;
      if (!acc[key]) {
        acc[key] = {
          dishExternalId: key,
          dishName: sale.unmapped_product_description || 'Prodotto sconosciuto',
          unitsSold: 0,
          revenue: 0,
        };
      }
      acc[key].unitsSold += Number(sale.quantity_sold) || 0;
      acc[key].revenue += Number(sale.total_amount_sold_for_row) || 0;
      return acc;
    }, {} as Record<string, any>);
    
    const dishesByExternalId = new Map(dishes.map(d => [d.external_id, d.name]));
    
    return Object.values(salesByDish).map(sale => ({
        ...sale,
        dishName: dishesByExternalId.get(sale.dishExternalId) || sale.dishName,
        period: selectedPeriod,
    }));
  }, [detailedSalesData, selectedPeriod, dateRange, dishes]);

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
  } = useFoodCostAnalysis(dishes, recipes, aggregatedSalesData, selectedPeriod, settings, detailedSalesData, dateRange);

  const { allItems } = useMenuIntelligenceItems(
    dishes, 
    recipes, 
    aggregatedSalesData, 
    getDishAnalysis, 
    getRecipeAnalysis, 
    getMenuEngineeringCategory
  );

  const {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    showAdvancedFilters,
    setShowAdvancedFilters,
    advancedFilters,
    setAdvancedFilters,
    applyFilters
  } = useMenuIntelligenceFilters();

  const filteredItems = applyFilters(allItems);

  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    paginatedItems,
    totalPages
  } = useMenuIntelligencePagination(filteredItems);

  const {
    handleEditRecipeFromDialog,
    handleSalesImportWrapper,
    handleCalculateFoodCost,
    handleRecalculateFoodCost,
    handleDeleteDish
  } = useMenuIntelligenceActions(
    dishes,
    recipes,
    handleSalesImport,
    triggerSalesCalculation,
    deleteDish
  );

  const { exportToCSV } = useMenuIntelligenceExport(
    filteredItems,
    getSalesMixPercentage,
    dateRange
  );

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
    foodCostSalesData: aggregatedSalesData,
    lastCalculationDate,
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
    getSalesMixPercentage,

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
