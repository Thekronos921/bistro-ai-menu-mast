
import { useState } from "react";
import { Search, Filter, X, TrendingUp, TrendingDown, Target, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FilterConfig {
  foodCostMin?: number;
  foodCostMax?: number;
  marginMin?: number;
  marginMax?: number;
  menuCategory?: string;
  salesMixMin?: number;
  unitsMin?: number;
  onlyProfitable?: boolean;
  onlyCritical?: boolean;
  onlyPopular?: boolean;
}

interface EnhancedFiltersProps {
  searchTerm: string;
  onSearchChange: (search: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Array<{ name: string }>;
  filters: FilterConfig;
  onFiltersChange: (filters: FilterConfig) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  totalItems: number;
  filteredItems: number;
  onClearFilters: () => void;
}

const EnhancedFilters = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories,
  filters,
  onFiltersChange,
  showAdvanced,
  onToggleAdvanced,
  totalItems,
  filteredItems,
  onClearFilters
}: EnhancedFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<FilterConfig>(filters);

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCategory !== "all") count++;
    if (filters.foodCostMin || filters.foodCostMax) count++;
    if (filters.marginMin || filters.marginMax) count++;
    if (filters.menuCategory) count++;
    if (filters.salesMixMin) count++;
    if (filters.unitsMin) count++;
    if (filters.onlyProfitable || filters.onlyCritical || filters.onlyPopular) count++;
    return count;
  };

  const quickFilters = [
    {
      label: "Solo Stars ⭐",
      active: filters.menuCategory === "star",
      onClick: () => onFiltersChange({ ...filters, menuCategory: filters.menuCategory === "star" ? undefined : "star" }),
      icon: TrendingUp,
      color: "bg-green-100 text-green-700 hover:bg-green-200"
    },
    {
      label: "Solo Critici ⚠️",
      active: filters.onlyCritical,
      onClick: () => onFiltersChange({ ...filters, onlyCritical: !filters.onlyCritical }),
      icon: AlertTriangle,
      color: "bg-red-100 text-red-700 hover:bg-red-200"
    },
    {
      label: "Più Profittevoli 💰",
      active: filters.onlyProfitable,
      onClick: () => onFiltersChange({ ...filters, onlyProfitable: !filters.onlyProfitable }),
      icon: Target,
      color: "bg-blue-100 text-blue-700 hover:bg-blue-200"
    },
    {
      label: "Più Popolari 🔥",
      active: filters.onlyPopular,
      onClick: () => onFiltersChange({ ...filters, onlyPopular: !filters.onlyPopular }),
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-700 hover:bg-purple-200"
    }
  ];

  return (
    <Card className="mb-6 border-stone-200">
      <CardContent className="p-4 sm:p-6">
        {/* Header con statistiche */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div className="flex items-center space-x-2 mb-2 sm:mb-0">
            <Filter className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-800">Filtri Intelligenti</h3>
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {getActiveFiltersCount()} attivi
              </Badge>
            )}
          </div>
          <div className="text-sm text-slate-600">
            {filteredItems} di {totalItems} piatti mostrati
          </div>
        </div>

        {/* Ricerca principale */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Cerca piatti per nome..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {quickFilters.map((filter, index) => {
            const IconComponent = filter.icon;
            return (
              <Button
                key={index}
                variant={filter.active ? "default" : "outline"}
                size="sm"
                onClick={filter.onClick}
                className={filter.active ? "" : filter.color}
              >
                <IconComponent className="w-4 h-4 mr-1" />
                {filter.label}
              </Button>
            );
          })}
        </div>

        {/* Filtro categoria base */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <Label className="text-sm font-medium text-slate-700 mb-2 block">Categoria</Label>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tutte le categorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutte le categorie</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.name} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={onToggleAdvanced}
              size="sm"
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>{showAdvanced ? "Nascondi" : "Filtri Avanzati"}</span>
            </Button>
          </div>
        </div>

        {/* Filtri Avanzati */}
        {showAdvanced && (
          <>
            <Separator className="my-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Food Cost Range */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Food Cost %</Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={localFilters.foodCostMin || ""}
                    onChange={(e) => setLocalFilters({ ...localFilters, foodCostMin: e.target.value ? Number(e.target.value) : undefined })}
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={localFilters.foodCostMax || ""}
                    onChange={(e) => setLocalFilters({ ...localFilters, foodCostMax: e.target.value ? Number(e.target.value) : undefined })}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Margine Range */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Margine €</Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={localFilters.marginMin || ""}
                    onChange={(e) => setLocalFilters({ ...localFilters, marginMin: e.target.value ? Number(e.target.value) : undefined })}
                    className="text-sm"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={localFilters.marginMax || ""}
                    onChange={(e) => setLocalFilters({ ...localFilters, marginMax: e.target.value ? Number(e.target.value) : undefined })}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Menu Engineering Category */}
              <div>
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Classificazione BCG</Label>
                <Select 
                  value={localFilters.menuCategory || "all"} 
                  onValueChange={(value) => setLocalFilters({ ...localFilters, menuCategory: value === "all" ? undefined : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tutte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte</SelectItem>
                    <SelectItem value="star">🌟 Star</SelectItem>
                    <SelectItem value="plowhorse">🐎 Plowhorse</SelectItem>
                    <SelectItem value="puzzle">🧩 Puzzle</SelectItem>
                    <SelectItem value="dog">🐕 Dog</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                <X className="w-4 h-4 mr-1" />
                Pulisci Filtri
              </Button>
              <Button size="sm" onClick={applyFilters}>
                Applica Filtri
              </Button>
            </div>
          </>
        )}

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex flex-wrap gap-2">
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>Categoria: {selectedCategory}</span>
                  <button onClick={() => onCategoryChange("all")} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {filters.menuCategory && (
                <Badge variant="secondary" className="flex items-center space-x-1">
                  <span>BCG: {filters.menuCategory}</span>
                  <button onClick={() => onFiltersChange({ ...filters, menuCategory: undefined })} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EnhancedFilters;
