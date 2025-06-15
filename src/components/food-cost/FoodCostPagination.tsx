
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "@/components/ui/pagination";

interface FoodCostPaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  paginatedItemsLength: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

const FoodCostPagination = ({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  paginatedItemsLength,
  onPageChange,
  onItemsPerPageChange
}: FoodCostPaginationProps) => {
  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between mt-4">
      <div className="text-sm text-slate-600">
        Mostrando <strong>{paginatedItemsLength}</strong> di <strong>{totalItems}</strong> risultati
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-slate-600">Elementi per pagina:</span>
          <Select
            value={String(itemsPerPage)}
            onValueChange={(value) => {
              onItemsPerPageChange(Number(value));
              onPageChange(1);
            }}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue placeholder={itemsPerPage} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    onPageChange(Math.max(1, currentPage - 1)); 
                  }}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-4 py-2 text-sm">Pagina {currentPage} di {totalPages}</span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    onPageChange(Math.min(totalPages, currentPage + 1)); 
                  }}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
};

export default FoodCostPagination;
