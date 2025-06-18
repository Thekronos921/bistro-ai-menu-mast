import EditRecipeDialog from "@/components/EditRecipeDialog";
import EditDishDialog from "@/components/EditDishDialog";
import AssociateRecipeDialog from "@/components/AssociateRecipeDialog";
import FoodCostHeader from "@/components/food-cost/FoodCostHeader";
import FoodCostKPIs from "@/components/food-cost/FoodCostKPIs";
import FoodCostFilters from "@/components/food-cost/FoodCostFilters";
import FoodCostTable from "@/components/food-cost/FoodCostTable";
import FoodCostCalculationSection from "@/components/food-cost/FoodCostCalculationSection";
import FoodCostPagination from "@/components/food-cost/FoodCostPagination";
import { useMenuIntelligencePage } from "@/hooks/useMenuIntelligencePage";
import { useMenuCategories } from "@/hooks/useMenuCategories";

const FoodCost = () => {
  const {
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
    foodCostSalesData,
    // This is now the aggregated data for the period
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
  } = useMenuIntelligencePage();

  // Importa il nuovo hook per le categorie menu
  const { categories: menuCategories, refresh: refreshCategories } = useMenuCategories(
    // Assumendo che il restaurantId sia disponibile nel context o derivabile
    '00000000-0000-0000-0000-000000000000' // Placeholder - dovrà essere sostituito con l'ID reale
  );

  // Transform categories array to match expected interface
  const formattedCategories = menuCategories.map(category => ({ name: category.name }));

  const handleRefreshWithCategories = () => {
    fetchData();
    refreshCategories();
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Caricamento Menu Intelligence...</p>
        </div>
      </div>;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50">
      <FoodCostHeader 
        selectedPeriod={selectedPeriod} 
        onPeriodChange={setSelectedPeriod} 
        settings={settings} 
        onSaveSettings={saveSettings} 
        onAddDish={fetchData} 
        onEditRecipe={handleEditRecipeFromDialog} 
      />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <FoodCostCalculationSection 
          onCalculate={handleCalculateFoodCost} 
          onRecalculate={handleRecalculateFoodCost} 
          calculatingFoodCost={calculatingFoodCost} 
          foodCostSalesDataCount={foodCostSalesData.length}
          lastCalculationDate={lastCalculationDate} 
        />

        <FoodCostKPIs 
          avgFoodCostPercentage={avgFoodCostPercentage} 
          totalMargin={totalMargin} 
          totalRevenue={totalRevenue} 
          criticalDishes={criticalDishes} 
          targetReached={targetReached} 
          selectedPeriod={selectedPeriod} 
          settings={settings} 
        />

        <FoodCostFilters 
          searchTerm={searchTerm} 
          onSearchChange={setSearchTerm} 
          selectedCategory={selectedCategory} 
          onCategoryChange={setSelectedCategory} 
          categories={formattedCategories} 
          advancedFilters={advancedFilters} 
          onAdvancedFiltersChange={setAdvancedFilters} 
          showAdvancedFilters={showAdvancedFilters} 
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)} 
          onImportSales={handleSalesImportWrapper} 
          onExportCSV={exportToCSV} 
          onRefresh={handleRefreshWithCategories} 
          dateRange={dateRange} 
          onDateRangeChange={setDateRange} 
          totalItems={filteredItems.length}
          filteredItems={paginatedItems.length}
          restaurantId="00000000-0000-0000-0000-000000000000" // Placeholder - dovrà essere sostituito
        />

        <FoodCostTable 
          filteredItems={paginatedItems} 
          totalItems={filteredItems.length} 
          getTotalSalesForPeriod={getTotalSalesForPeriod} 
          getSalesMixPercentage={getSalesMixPercentage} 
          settings={settings} 
          onEditDish={setEditingDish} 
          onEditRecipe={setEditingRecipe} 
          onCreateDishFromRecipe={createDishFromRecipe} 
          onAssociateRecipe={setAssociatingDish} 
          onDeleteDish={handleDeleteDish} 
        />

        <FoodCostPagination 
          currentPage={currentPage} 
          totalPages={totalPages} 
          itemsPerPage={itemsPerPage} 
          totalItems={filteredItems.length} 
          paginatedItemsLength={paginatedItems.length} 
          onPageChange={setCurrentPage} 
          onItemsPerPageChange={setItemsPerPage} 
        />
      </main>

      {/* Edit Recipe Dialog */}
      {editingRecipe && <EditRecipeDialog recipe={{
      ...editingRecipe,
      preparation_time: editingRecipe.preparation_time || 0,
      difficulty: editingRecipe.difficulty || 'Facile',
      portions: editingRecipe.portions || 1,
      description: editingRecipe.description || '',
      allergens: editingRecipe.allergens || '',
      calories: editingRecipe.calories || 0,
      protein: editingRecipe.protein || 0,
      carbs: editingRecipe.carbs || 0,
      fat: editingRecipe.fat || 0,
      is_semilavorato: editingRecipe.is_semilavorato || false,
      recipe_instructions: editingRecipe.recipe_instructions || []
    }} onClose={() => setEditingRecipe(null)} onRecipeUpdated={fetchData} />}

      {/* Edit Dish Dialog */}
      {editingDish && <EditDishDialog dish={editingDish} onClose={() => setEditingDish(null)} onDishUpdated={fetchData} onEditRecipe={handleEditRecipeFromDialog} />}

      {/* Associate Recipe Dialog */}
      <AssociateRecipeDialog dish={associatingDish} onClose={() => setAssociatingDish(null)} onAssociated={fetchData} />
    </div>;
};

export default FoodCost;
