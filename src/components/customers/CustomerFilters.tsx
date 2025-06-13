
import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CustomerFilters as CustomerFiltersType } from '@/hooks/useCustomers';

interface CustomerFiltersProps {
  filters: CustomerFiltersType;
  onFiltersChange: (filters: CustomerFiltersType) => void;
}

const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  filters,
  onFiltersChange,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localFilters, setLocalFilters] = useState<CustomerFiltersType>(filters);

  const handleFilterChange = (key: keyof CustomerFiltersType, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const emptyFilters: CustomerFiltersType = {};
    setLocalFilters(emptyFilters);
    onFiltersChange(emptyFilters);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => 
      value !== undefined && value !== '' && 
      (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Cerca per nome, email o telefono..."
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtri Avanzati
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" onClick={clearFilters}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Spesa Minima (€)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={localFilters.minSpend || ''}
                  onChange={(e) => handleFilterChange('minSpend', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Spesa Massima (€)
                </label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={localFilters.maxSpend || ''}
                  onChange={(e) => handleFilterChange('maxSpend', e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Ultima Visita Da
                </label>
                <Input
                  type="date"
                  value={localFilters.lastVisitFrom || ''}
                  onChange={(e) => handleFilterChange('lastVisitFrom', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Ultima Visita A
                </label>
                <Input
                  type="date"
                  value={localFilters.lastVisitTo || ''}
                  onChange={(e) => handleFilterChange('lastVisitTo', e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Tag Clienti
              </label>
              <div className="flex flex-wrap gap-2">
                {['VIP', 'Fedele', 'Vegetariano', 'Famiglia', 'Business', 'Celiaco'].map((tag) => (
                  <Badge
                    key={tag}
                    variant={localFilters.tags?.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      const currentTags = localFilters.tags || [];
                      const newTags = currentTags.includes(tag)
                        ? currentTags.filter(t => t !== tag)
                        : [...currentTags, tag];
                      handleFilterChange('tags', newTags);
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerFilters;
