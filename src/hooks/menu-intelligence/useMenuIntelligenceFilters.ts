
import { useState, useEffect, useMemo } from "react";
import { FilterConfig } from "@/components/AdvancedFilters";

export const useMenuIntelligenceFilters = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterConfig>({});

  // Enhanced filtering logic
  const applyFilters = (allItems: any[]) => {
    return allItems.filter(({ name, category, analysis, menuCategory }) => {
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "all" || category === selectedCategory;
      
      const matchesFoodCostMin = !advancedFilters.foodCostMin || analysis.foodCostPercentage >= advancedFilters.foodCostMin;
      const matchesFoodCostMax = !advancedFilters.foodCostMax || analysis.foodCostPercentage <= advancedFilters.foodCostMax;
      const matchesMarginMin = !advancedFilters.marginMin || analysis.margin >= advancedFilters.marginMin;
      const matchesMarginMax = !advancedFilters.marginMax || analysis.margin <= advancedFilters.marginMax;
      const matchesMenuCategory = !advancedFilters.menuCategory || menuCategory === advancedFilters.menuCategory;

      return matchesSearch && matchesCategory && matchesFoodCostMin && matchesFoodCostMax && 
             matchesMarginMin && matchesMarginMax && matchesMenuCategory;
    });
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    showAdvancedFilters,
    setShowAdvancedFilters,
    advancedFilters,
    setAdvancedFilters,
    applyFilters
  };
};
