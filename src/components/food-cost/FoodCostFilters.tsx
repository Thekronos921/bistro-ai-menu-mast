
import { FilterConfig } from "@/components/AdvancedFilters";
import { FoodCostSalesData, DateRange } from "@/hooks/food-cost/types";
import EnhancedFilters from "./EnhancedFilters";

interface FoodCostFiltersProps {
  searchTerm: string;
  onSearchChange: (search: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Array<{ name: string }>;
  advancedFilters: FilterConfig;
  onAdvancedFiltersChange: (filters: FilterConfig) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  onImportSales: (data: FoodCostSalesData[]) => void;
  onExportCSV: () => void;
  onRefresh: () => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  totalItems?: number;
  filteredItems?: number;
}

const FoodCostFilters = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  advancedFilters,
  onAdvancedFiltersChange,
  showAdvancedFilters,
  onToggleAdvancedFilters,
  totalItems = 0,
  filteredItems = 0
}: FoodCostFiltersProps) => {
  const handleClearFilters = () => {
    onSearchChange("");
    onCategoryChange("all");
    onAdvancedFiltersChange({});
  };

  return (
    <EnhancedFilters
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
      selectedCategory={selectedCategory}
      onCategoryChange={onCategoryChange}
      categories={categories}
      filters={advancedFilters}
      onFiltersChange={onAdvancedFiltersChange}
      showAdvanced={showAdvancedFilters}
      onToggleAdvanced={onToggleAdvancedFilters}
      totalItems={totalItems}
      filteredItems={filteredItems}
      onClearFilters={handleClearFilters}
    />
  );
};

export default FoodCostFilters;
