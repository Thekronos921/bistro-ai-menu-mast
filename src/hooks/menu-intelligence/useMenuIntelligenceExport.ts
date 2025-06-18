
import { useCallback } from "react";

export const useMenuIntelligenceExport = (
  filteredItems: any[],
  getSalesMixPercentage: (name: string) => number,
  dateRange: any
) => {
  const exportToCSV = useCallback(() => {
    const csvData = filteredItems.map((item) => {
      const { type, item: dataItem, analysis, menuCategory, unitsSold } = item;
      return {
        Nome: dataItem.name,
        Tipo: type === 'dish' ? 'Piatto' : 'Ricetta',
        Categoria: dataItem.category,
        'Popolarità %': type === 'dish' ? getSalesMixPercentage(dataItem.name).toFixed(2) : 'N/A',
        'Unità Vendute': type === 'dish' ? unitsSold : 'N/A',
        'Prezzo Vendita': type === 'dish' ? dataItem.selling_price : analysis.assumedPrice,
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
    a.download = `menu-intelligence-analysis-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, [filteredItems, getSalesMixPercentage, dateRange]);

  return { exportToCSV };
};
