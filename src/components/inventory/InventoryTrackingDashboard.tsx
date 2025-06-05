import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, Package, Clock, AlertTriangle, Filter, Search } from 'lucide-react';
import { useLabels } from '@/hooks/useLabels';
import { useStorageLocations } from '@/hooks/useStorageLocations';
import { useInventoryTracking } from '@/hooks/useInventoryTracking';
import StorageLocationManager from './StorageLocationManager';

interface EnrichedLabel {
  id: string;
  label_type: string;
  title: string;
  batch_number?: string;
  production_date?: string;
  expiry_date?: string;
  quantity?: number;
  unit?: string;
  status?: string;
  storage_location_id?: string;
  ingredient_name?: string;
  ingredient_unit?: string;
  recipe_name?: string;
  recipe_portions?: number;
  storage_locations?: {
    name: string;
    type: string;
  };
  created_at: string;
}

const InventoryTrackingDashboard = () => {
  const { fetchLabels, updateLabelStatus, loading: labelsLoading } = useLabels();
  const { storageLocations } = useStorageLocations();
  const { consumeOrDiscardLabel } = useInventoryTracking();
  
  const [labels, setLabels] = useState<EnrichedLabel[]>([]);
  const [filteredLabels, setFilteredLabels] = useState<EnrichedLabel[]>([]);
  const [filters, setFilters] = useState({
    label_type: 'all',
    status: 'all',
    storage_location_id: 'all',
    search: ''
  });

  const loadLabels = async () => {
    try {
      const data = await fetchLabels();
      console.log('Loaded labels:', data);
      const typedData = data as EnrichedLabel[];
      setLabels(typedData);
      setFilteredLabels(typedData);
    } catch (error) {
      console.error('Error loading labels:', error);
    }
  };

  useEffect(() => {
    loadLabels();
  }, []);

  useEffect(() => {
    let filtered = labels;

    if (filters.label_type && filters.label_type !== 'all') {
      filtered = filtered.filter(label => label.label_type === filters.label_type);
    }

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(label => label.status === filters.status);
    }

    if (filters.storage_location_id && filters.storage_location_id !== 'all') {
      filtered = filtered.filter(label => label.storage_location_id === filters.storage_location_id);
    }

    if (filters.search) {
      filtered = filtered.filter(label => 
        label.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        (label.batch_number && label.batch_number.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    setFilteredLabels(filtered);
  }, [labels, filters]);

  const handleStatusUpdate = async (labelId: string, newStatus: 'consumed' | 'discarded') => {
    try {
      if (newStatus === 'consumed' || newStatus === 'discarded') {
        await consumeOrDiscardLabel(labelId, newStatus);
      } else {
        await updateLabelStatus(labelId, newStatus);
      }
      await loadLabels();
    } catch (error) {
      console.error('Error updating label status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'active': 'default',
      'consumed': 'secondary',
      'expired': 'destructive',
      'discarded': 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      'semilavorato': 'bg-blue-100 text-blue-800',
      'lavorato': 'bg-green-100 text-green-800',
      'recipe': 'bg-purple-100 text-purple-800',
      'defrosted': 'bg-orange-100 text-orange-800',
      'ingredient': 'bg-gray-100 text-gray-800'
    };
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type}
      </Badge>
    );
  };

  const isExpiring = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return expiry <= threeDaysFromNow;
  };

  const getExpiryWarning = (expiryDate: string) => {
    if (!expiryDate) return null;
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span className="text-red-600 font-medium">Scaduto {Math.abs(diffDays)} giorni fa</span>;
    } else if (diffDays <= 3) {
      return <span className="text-orange-600 font-medium">Scade in {diffDays} giorni</span>;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="labels" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="labels">Etichette Tracciate</TabsTrigger>
          <TabsTrigger value="storage">Posizioni Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="labels" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filtri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Input
                    placeholder="Cerca per titolo o lotto..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full"
                  />
                </div>
                
                <Select onValueChange={(value) => setFilters(prev => ({ ...prev, label_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo etichetta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tipi</SelectItem>
                    <SelectItem value="semilavorato">Semilavorato</SelectItem>
                    <SelectItem value="lavorato">Lavorato</SelectItem>
                    <SelectItem value="recipe">Ricetta</SelectItem>
                    <SelectItem value="defrosted">Scongelato</SelectItem>
                    <SelectItem value="ingredient">Ingrediente</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="active">Attivo</SelectItem>
                    <SelectItem value="consumed">Consumato</SelectItem>
                    <SelectItem value="expired">Scaduto</SelectItem>
                    <SelectItem value="discarded">Scartato</SelectItem>
                  </SelectContent>
                </Select>

                <Select onValueChange={(value) => setFilters(prev => ({ ...prev, storage_location_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Posizione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le posizioni</SelectItem>
                    {storageLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Labels Grid */}
          {labelsLoading ? (
            <div className="text-center py-8">Caricamento etichette...</div>
          ) : filteredLabels.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna etichetta trovata</h3>
                <p className="text-gray-500">
                  {labels.length === 0 
                    ? "Non ci sono etichette create. Vai alla sezione Gestione Etichette per crearne una."
                    : "Nessuna etichetta corrisponde ai filtri selezionati."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLabels.map((label) => (
                <Card key={label.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{label.title}</h3>
                        {label.batch_number && (
                          <p className="text-sm text-gray-600">Lotto: {label.batch_number}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        {getTypeBadge(label.label_type)}
                        {getStatusBadge(label.status || 'active')}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {/* Ingredient or Recipe info */}
                    {label.ingredient_name && (
                      <div className="text-sm">
                        <strong>Ingrediente:</strong> {label.ingredient_name}
                        {label.quantity && label.ingredient_unit && (
                          <span> - {label.quantity} {label.ingredient_unit}</span>
                        )}
                      </div>
                    )}
                    
                    {label.recipe_name && (
                      <div className="text-sm">
                        <strong>Ricetta:</strong> {label.recipe_name}
                        {label.recipe_portions && (
                          <span> - {label.recipe_portions} porzioni</span>
                        )}
                      </div>
                    )}

                    {/* Dates */}
                    <div className="space-y-1 text-sm">
                      {label.production_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Prodotto: {new Date(label.production_date).toLocaleDateString('it-IT')}</span>
                        </div>
                      )}
                      
                      {label.expiry_date && (
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Scade: {new Date(label.expiry_date).toLocaleDateString('it-IT')}</span>
                          {isExpiring(label.expiry_date) && (
                            <AlertTriangle className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                      )}
                      
                      {getExpiryWarning(label.expiry_date || '')}
                    </div>

                    {/* Storage Location */}
                    {label.storage_locations && (
                      <div className="text-sm">
                        <strong>Posizione:</strong> {label.storage_locations.name}
                      </div>
                    )}

                    {/* Actions */}
                    {label.status === 'active' && (
                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStatusUpdate(label.id, 'consumed')}
                          className="flex-1"
                        >
                          Consuma
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStatusUpdate(label.id, 'discarded')}
                          className="flex-1"
                        >
                          Scarta
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="storage">
          <StorageLocationManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryTrackingDashboard;
