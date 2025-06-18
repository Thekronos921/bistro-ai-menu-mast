
import { useState, useEffect, useMemo } from "react";

export const useMenuIntelligencePagination = (filteredItems: any[]) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredItems.length, itemsPerPage]);

  // Pagination logic
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    paginatedItems,
    totalPages
  };
};
