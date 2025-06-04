
import type { FoodCostSalesData, DateRange } from "./types";

export const filterSalesDataByDateRange = (
  salesData: FoodCostSalesData[], 
  dateRange: DateRange
): FoodCostSalesData[] => {
  if (!dateRange.from && !dateRange.to) {
    return salesData;
  }

  return salesData.filter(sale => {
    const saleDate = new Date(sale.saleDate);
    
    if (dateRange.from && saleDate < dateRange.from) {
      return false;
    }
    
    if (dateRange.to && saleDate > dateRange.to) {
      return false;
    }
    
    return true;
  });
};

export const mergeSalesData = (
  existingSales: FoodCostSalesData[], 
  importedSales: FoodCostSalesData[]
): FoodCostSalesData[] => {
  // Rimuovi dati esistenti per le stesse date e aggiungi nuovi dati
  const existingDates = new Set(importedSales.map(s => s.saleDate));
  const otherDates = existingSales.filter(s => !existingDates.has(s.saleDate));
  return [...otherDates, ...importedSales];
};
