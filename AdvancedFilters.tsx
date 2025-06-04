
import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MenuCategory } from "./MenuEngineeringBadge";

export interface FilterConfig {
  foodCostMin?: number;
  foodCostMax?: number;
  marginMin?: number;
  marginMax?: number;
  menuCategory?: MenuCategory;
  withSuggestions?: boolean;
}

interface AdvancedFiltersProps {
  filters: FilterConfig;
  onFiltersChange: (filters: FilterConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const AdvancedFilters = ({ filters, onFiltersChange, isOpen, onToggle }: AdvancedFiltersProps) => {
  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onToggle}
          className={`flex items-center space-x-2 ${hasActiveFilters ? 'border-emerald-500 text-emerald-700' : ''}`}
        >
          <Filter className="w-4 h-4" />
          <span>Filtri Avanzati</span>
          {hasActiveFilters && <span className="bg-emerald-500 text-white rounded-full px-2 py-0.5 text-xs">●</span>}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-1" />
            Cancella Filtri
          </Button>
        )}
      </div>

      {isOpen && (
        <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Food Cost %</label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.foodCostMin || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  foodCostMin: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                className="w-full"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.foodCostMax || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  foodCostMax: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Margine €</label>
            <div className="flex space-x-2">
              <Input
                type="number"
                placeholder="Min"
                value={filters.marginMin || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  marginMin: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                className="w-full"
              />
              <Input
                type="number"
                placeholder="Max"
                value={filters.marginMax || ''}
                onChange={(e) => onFiltersChange({
                  ...filters,
                  marginMax: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Categoria Menu Engineering</label>
            <Select 
              value={filters.menuCategory || ""} 
              onValueChange={(value) => onFiltersChange({
                ...filters,
                menuCategory: value as MenuCategory || undefined
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tutte le categorie" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="">Tutte le categorie</SelectItem>
                <SelectItem value="star">Star</SelectItem>
                <SelectItem value="plowhorse">Plowhorse</SelectItem>
                <SelectItem value="puzzle">Puzzle</SelectItem>
                <SelectItem value="dog">Dog</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
