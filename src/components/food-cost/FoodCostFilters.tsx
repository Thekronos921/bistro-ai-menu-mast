
import { Search, Filter, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdvancedFilters, { FilterConfig } from "@/components/AdvancedFilters";
import EnhancedSalesImportDialog from "./EnhancedSalesImportDialog";
import DateRangeFilter from "./DateRangeFilter";

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface SalesData {
  dishName: string;
  unitsSold: number;
  saleDate: string;
  period?: string;
}

interface FoodCostFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  categories: string[];
  advancedFilters: FilterConfig;
  onAdvancedFiltersChange: (filters: FilterConfig) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  onImportSales: (salesData: SalesData[]) => void;
  onExportCSV: () => void;
  onRefresh: () => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
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
  onImportSales,
  onExportCSV,
  onRefresh,
  dateRange,
  onDateRangeChange
}: FoodCostFiltersProps) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-3 sm:p-6 space-y-4">
      {/* Mobile Layout */}
      <div className="block sm:hidden space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Cerca piatti o ricette..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filters Row */}
        <div className="grid grid-cols-2 gap-2">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "Tutte" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DateRangeFilter 
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleAdvancedFilters}
            className="flex items-center justify-center"
          >
            <Filter className="w-4 h-4 mr-1" />
            Filtri
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Aggiorna
          </Button>
        </div>

        {/* Import/Export Row */}
        <div className="grid grid-cols-2 gap-2">
          <EnhancedSalesImportDialog onImportSales={onImportSales} />
          
          <Button
            variant="outline"
            size="sm"
            onClick={onExportCSV}
            className="flex items-center justify-center"
          >
            <Download className="w-4 h-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden sm:block">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Cerca piatti o ricette..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === "all" ? "Tutte le categorie" : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Range Filter */}
          <DateRangeFilter 
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onToggleAdvancedFilters}
              className="flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtri Avanzati
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Aggiorna
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <EnhancedSalesImportDialog onImportSales={onImportSales} />
            
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCSV}
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Esporta CSV
            </Button>
          </div>
        </div>
      </div>

      {showAdvancedFilters && (
        <div className="pt-4 border-t border-stone-200">
          <AdvancedFilters
            filters={advancedFilters}
            onFiltersChange={onAdvancedFiltersChange}
            isOpen={showAdvancedFilters}
            onToggle={onToggleAdvancedFilters}
          />
        </div>
      )}
    </div>
  );
};

export default FoodCostFilters;
