
import { useState } from "react";
import { Search, Download, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import SalesDataImportDialog from "@/components/SalesDataImportDialog";
import AdvancedFilters, { FilterConfig } from "@/components/AdvancedFilters";

interface SalesData {
  dishName: string;
  unitsSold: number;
  period: string;
}

interface FoodCostFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  advancedFilters: FilterConfig;
  onAdvancedFiltersChange: (filters: FilterConfig) => void;
  showAdvancedFilters: boolean;
  onToggleAdvancedFilters: () => void;
  onImportSales: (sales: SalesData[]) => void;
  onExportCSV: () => void;
  onRefresh: () => void;
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
  onRefresh
}: FoodCostFiltersProps) => {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6 space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex-1 relative max-w-md">
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cerca piatti o ricette..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <SalesDataImportDialog onImportSales={onImportSales} />
          <Button variant="outline" onClick={onExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Esporta CSV
          </Button>
          <Button variant="outline" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Aggiorna
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => onCategoryChange(category)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? "bg-emerald-600 text-white"
                : "bg-stone-100 text-slate-600 hover:bg-stone-200"
            }`}
          >
            {category === "all" ? "Tutte" : category}
          </button>
        ))}
      </div>

      <AdvancedFilters
        filters={advancedFilters}
        onFiltersChange={onAdvancedFiltersChange}
        isOpen={showAdvancedFilters}
        onToggle={onToggleAdvancedFilters}
      />
    </div>
  );
};

export default FoodCostFilters;
