import { useState, useEffect } from "react";
import EditRecipeDialog from "@/components/EditRecipeDialog";
import EditDishDialog from "@/components/EditDishDialog";
import AssociateRecipeDialog from "@/components/AssociateRecipeDialog";
import { FilterConfig } from "@/components/AdvancedFilters";
import { TimePeriod } from "@/components/PeriodSelector";
import FoodCostHeader from "@/components/food-cost/FoodCostHeader";
import FoodCostKPIs from "@/components/food-cost/FoodCostKPIs";
import FoodCostFilters from "@/components/food-cost/FoodCostFilters";
import FoodCostTable from "@/components/food-cost/FoodCostTable";
import { useFoodCostData } from "@/hooks/useFoodCostData";
import { useFoodCostAnalysis } from "@/hooks/useFoodCostAnalysis";
import { useCategories } from '@/hooks/useCategories';
import type { Recipe } from "@/types/recipe";
import { getDishSalesByPeriod, type DishSaleData } from '@/integrations/cassaInCloud/cassaInCloudSalesService'; // Importa la nuova funzione e il tipo
import { useRestaurant } from '@/hooks/useRestaurant'; // Importa useRestaurant per restaurantId

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

// Simplified Recipe interface for dialogs
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

const FoodCost = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("last30days");
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [associatingDish, setAssociatingDish] = useState<Dish | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterConfig>({});
  const [dishSales, setDishSales] = useState<DishSaleData[]>([]); 
  const { restaurantId } = useRestaurant(); 

  // Configurazioni utente (persistenti nel localStorage)
  const [settings, setSettings] = useState<SettingsConfig>(() => {
    const saved = localStorage.getItem('foodCostSettings');
    return saved ? JSON.parse(saved) : {
      criticalThreshold: 40,
      targetThreshold: 35,
      targetPercentage: 80
    };
  });

  const { categories } = useCategories();
  const saveSettings = (newSettings: SettingsConfig) => {
    setSettings(newSettings);
    localStorage.setItem('foodCostSettings', JSON.stringify(newSettings));
  };

  const { 
    dishes, 
    recipes, 
    // salesData, // Non più usato direttamente qui per le vendite dei piatti, useremo dishSales
    allSalesData, // Mantenuto se serve per altre analisi o importazioni
    dateRange,
    setDateRange,
    loading, 
    fetchData, 
    createDishFromRecipe, 
    handleSalesImport,
    deleteDish
  } = useFoodCostData();

  // Trasforma dishSales (DishSaleData[]) in un formato compatibile con SalesData[]
  const transformedSalesData = dishSales.map(sale => {
    // Cerca il nome del piatto corrispondente in dishes usando dishId
    const dish = dishes.find(d => d.id === sale.dishId);
    return {
      dishName: dish ? dish.name : sale.dishName || 'Sconosciuto', // Usa il nome da dishes o quello in sale, o un default
      unitsSold: sale.totalQuantitySold,
      period: selectedPeriod, // Aggiungi il periodo corrente
    };
  });

  const {
    // getDishSalesData, // Questa funzione interna a useFoodCostAnalysis ora userà transformedSalesData
    getTotalSalesForPeriod,
    getSalesMixPercentage,
    getDishAnalysis,
    getRecipeAnalysis,
    getMenuEngineeringCategory,
    avgFoodCostPercentage,
    totalMargin,
    criticalDishes,
    targetReached
  } = useFoodCostAnalysis(dishes, recipes, transformedSalesData, selectedPeriod, settings);

  useEffect(() => {
    const fetchDishSalesData = async () => {
      if (restaurantId) {
        try {
          let startDateStr: string | undefined;
          let endDateStr: string | undefined = new Date().toISOString();

          const today = new Date();
          let calculatedStartDate = new Date();

          switch (selectedPeriod) {
            case 'today':
              calculatedStartDate.setDate(today.getDate());
              endDateStr = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();
              break;
            case 'yesterday':
              calculatedStartDate.setDate(today.getDate() - 1);
              endDateStr = new Date(today.getFullYear(), today.getMonth(), today.getDate() -1, 23, 59, 59, 999).toISOString();
              break;
            case 'last7days':
              calculatedStartDate.setDate(today.getDate() - 7);
              break;
            case 'last30days':
              calculatedStartDate.setDate(today.getDate() - 30);
              break;
            case 'last90days': // Aggiunto per coerenza se presente nel tipo TimePeriod
              calculatedStartDate.setDate(today.getDate() - 90);
              break;
            case 'currentMonth':
              calculatedStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
              break;
            case 'lastMonth':
              endDateStr = new Date(today.getFullYear(), today.getMonth(), 0).toISOString();
              calculatedStartDate = new Date(today.getFullYear(), new Date(endDateStr).getMonth(), 1);
              break;
            case 'custom':
              if (dateRange.from && dateRange.to) {
                startDateStr = dateRange.from.toISOString();
                endDateStr = dateRange.to.toISOString();
              } else {
                // Se custom è selezionato ma le date non ci sono, non fare nulla o imposta un default
                return; 
              }
              break;
            case 'allTime':
              startDateStr = undefined;
              endDateStr = undefined;
              break;
            default:
              // Gestisci altri casi o imposta un default se necessario
              console.warn(`Periodo selezionato non gestito: ${selectedPeriod}`);
              return;
          }

          if (selectedPeriod !== 'custom' && selectedPeriod !== 'allTime') {
            startDateStr = calculatedStartDate.toISOString();
          }

          // La chiamata a getDishSalesByPeriod ora usa startDateStr e endDateStr correttamente definiti
          // o undefined per 'allTime'
          const sales = await getDishSalesByPeriod({ restaurantId, startDate: startDateStr, endDate: endDateStr });
          console.log('Raw sales data from getDishSalesByPeriod:', sales); // LOG 1
          setDishSales(sales);
        } catch (error) {
          console.error("Error fetching dish sales:", error);
          // toast({ title: "Errore", description: "Errore nel caricamento delle vendite dei piatti", variant: "destructive" });
        }
      }
    };

    fetchDishSalesData();
  }, [restaurantId, selectedPeriod, dateRange]); // Aggiunto dateRange alle dipendenze

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

  const handleEditRecipeFromDialog = (simpleRecipe: SimpleRecipe) => {
    // Find the full recipe data
    const fullRecipe = recipes.find(r => r.id === simpleRecipe.id) || 
                      dishes.find(d => d.recipes?.id === simpleRecipe.id)?.recipes;
    
    if (fullRecipe) {
      // Ensure all required fields are present with proper defaults
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
  };

  const handleSalesImportWrapper = (importedSales: FoodCostSalesData[]) => {
    // Convert to the format expected by useFoodCostData
    const convertedSales = importedSales.map(sale => ({
      dishName: sale.dishName,
      unitsSold: sale.unitsSold,
      saleDate: sale.saleDate,
      period: sale.period || 'imported'
    }));
    
    handleSalesImport(convertedSales);
  };

  // Combina piatti e ricette per il filtro
  const allItems = [
    ...dishes.map(dish => {
      const saleDataForDish = dishSales.find(sale => sale.dishId === dish.id);
      console.log('Processing dish for allItems:', dish.name, 'Sale data:', saleDataForDish); // LOG 3
      return {
        type: 'dish' as const, 
        item: dish, 
        name: dish.name, 
        category: dish.category,
        analysis: getDishAnalysis(dish),
        menuCategory: getMenuEngineeringCategory(dish),
        unitsSold: saleDataForDish?.totalQuantitySold ?? 0, 
        revenue: saleDataForDish?.totalRevenue ?? 0, 
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
        unitsSold: 0, // Aggiungi unitsSold per le ricette
        revenue: 0 // Aggiungi revenue per le ricette, se necessario per coerenza
      }))
  ];

  // Enhanced filtering with date range consideration
  const filteredItems = allItems.filter(({ name, category, analysis, menuCategory }) => {
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || category === selectedCategory;
    
    // Filtri avanzati
    const matchesFoodCostMin = !advancedFilters.foodCostMin || analysis.foodCostPercentage >= advancedFilters.foodCostMin;
    const matchesFoodCostMax = !advancedFilters.foodCostMax || analysis.foodCostPercentage <= advancedFilters.foodCostMax;
    const matchesMarginMin = !advancedFilters.marginMin || analysis.margin >= advancedFilters.marginMin;
    const matchesMarginMax = !advancedFilters.marginMax || analysis.margin <= advancedFilters.marginMax;
    const matchesMenuCategory = !advancedFilters.menuCategory || menuCategory === advancedFilters.menuCategory;

    return matchesSearch && matchesCategory && matchesFoodCostMin && matchesFoodCostMax && 
           matchesMarginMin && matchesMarginMax && matchesMenuCategory;
  });

  const exportToCSV = () => {
    const csvData = filteredItems.map((item) => {
      const { type, item: dataItem, analysis, menuCategory, unitsSold } = item;
      return {
        Nome: dataItem.name,
        Tipo: type === 'dish' ? 'Piatto' : 'Ricetta',
        Categoria: dataItem.category,
        'Popolarità %': type === 'dish' ? getSalesMixPercentage(dataItem.name).toFixed(2) : 'N/A',
        'Unità Vendute': type === 'dish' ? unitsSold : 'N/A', // Ora unitsSold è sempre definito
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
  };

  const handleDeleteDish = (dishId: string, dishName: string) => {
    deleteDish(dishId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Caricamento analisi food cost...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50">
      <FoodCostHeader
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        settings={settings}
        onSaveSettings={saveSettings}
        onAddDish={fetchData}
        onEditRecipe={handleEditRecipeFromDialog}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <FoodCostKPIs
          avgFoodCostPercentage={avgFoodCostPercentage}
          totalMargin={totalMargin}
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
          categories={categories}
          advancedFilters={advancedFilters}
          onAdvancedFiltersChange={setAdvancedFilters}
          showAdvancedFilters={showAdvancedFilters}
          onToggleAdvancedFilters={() => setShowAdvancedFilters(!showAdvancedFilters)}
          onImportSales={handleSalesImportWrapper}
          onExportCSV={exportToCSV}
          onRefresh={fetchData}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />

        <FoodCostTable
          filteredItems={filteredItems}
          // getDishSalesData e getSalesMixPercentage sono stati rimossi perché i dati sono ora in filteredItems
          getTotalSalesForPeriod={getTotalSalesForPeriod}
          settings={settings}
          onEditDish={setEditingDish}
          onEditRecipe={setEditingRecipe}
          onCreateDishFromRecipe={createDishFromRecipe}
          onAssociateRecipe={setAssociatingDish}
          onDeleteDish={handleDeleteDish}
        />
      </main>

      {/* Edit Recipe Dialog */}
      {editingRecipe && (
        <EditRecipeDialog
          recipe={{
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
          }}
          onClose={() => setEditingRecipe(null)}
          onRecipeUpdated={fetchData}
        />
      )}

      {/* Edit Dish Dialog */}
      {editingDish && (
        <EditDishDialog
          dish={editingDish}
          onClose={() => setEditingDish(null)}
          onDishUpdated={fetchData}
          onEditRecipe={handleEditRecipeFromDialog}
        />
      )}

      {/* Associate Recipe Dialog */}
      <AssociateRecipeDialog
        dish={associatingDish}
        onClose={() => setAssociatingDish(null)}
        onAssociated={fetchData}
      />
    </div>
  );
};

export default FoodCost;
