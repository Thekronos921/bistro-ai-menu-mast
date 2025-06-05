
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Package, Clock, MapPin } from 'lucide-react';
import { useLabels } from '@/hooks/useLabels';
import { useStorageLocations } from '@/hooks/useStorageLocations';
import { useInventoryTracking } from '@/hooks/useInventoryTracking';

const InventoryTrackingDashboard = () => {
  const [labels, setLabels] = useState<any[]>([]);
  const [filteredLabels, setFilteredLabels] = useState<any[]>([]);
  const [selectedStorageLocation, setSelectedStorageLocation] = useState<string>('all');
  
  const { fetchLabels, loading } = useLabels();
  const { storageLocations } = useStorageLocations();
  const { consumeOrDiscardLabel, loading: actionLoading } = useInventoryTracking();

  useEffect(() => {
    loadLabels();
  }, []);

  useEffect(() => {
    filterLabels();
  }, [labels, selectedStorageLocation]);

  const loadLabels = async () => {
    const data = await fetchLabels({ status: 'active' });
    setLabels(data);
  };

  const filterLabels = () => {
    let filtered = labels;
    
    if (selectedStorageLocation !== 'all') {
      filtered = filtered.filter(label => label.storage_location_id === selectedStorageLocation);
    }
    
    setFilteredLabels(filtered);
  };

  const handleConsumeOrDiscard = async (labelId: string, action: 'consumed' | 'discarded') => {
    const success = await consumeOrDiscardLabel(labelId, action);
    if (success) {
      await loadLabels();
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'default', text: 'Attivo' },
      consumed: { color: 'secondary', text: 'Consumato' },
      discarded: { color: 'destructive', text: 'Scartato' },
      expired: { color: 'destructive', text: 'Scaduto' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.color as any}>{config.text}</Badge>;
  };

  const getExpiryStatus = (expiryDate: string) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <Badge variant="destructive">Scaduto</Badge>;
    } else if (diffDays <= 3) {
      return <Badge variant="secondary">Scade tra {diffDays} giorni</Badge>;
    }
    return null;
  };

  const getLabelTypeIcon = (type: string) => {
    const icons = {
      defrosted: '🧊',
      recipe: '👨‍🍳',
      semilavorato: '📦',
      lavorato: '🍽️'
    };
    return icons[type as keyof typeof icons] || '📋';
  };

  const groupedLabels = filteredLabels.reduce((acc, label) => {
    const storageLocation = label.storage_locations?.name || 'Senza posizione';
    if (!acc[storageLocation]) {
      acc[storageLocation] = [];
    }
    acc[storageLocation].push(label);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inventario Tracciato</h2>
        <div className="flex items-center space-x-4">
          <Select value={selectedStorageLocation} onValueChange={setSelectedStorageLocation}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtra per posizione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutte le posizioni</SelectItem>
              {storageLocations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name} ({location.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="by-location" className="w-full">
        <TabsList>
          <TabsTrigger value="by-location">Per Posizione</TabsTrigger>
          <TabsTrigger value="by-type">Per Tipo</TabsTrigger>
          <TabsTrigger value="expiring">In Scadenza</TabsTrigger>
        </TabsList>

        <TabsContent value="by-location" className="space-y-4">
          {Object.entries(groupedLabels).map(([location, locationLabels]) => (
            <Card key={location}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5" />
                  <span>{location}</span>
                  <Badge variant="outline">{locationLabels.length} elementi</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locationLabels.map((label) => (
                    <Card key={label.id} className="relative">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{getLabelTypeIcon(label.label_type)}</span>
                            <div>
                              <h4 className="font-medium">{label.title}</h4>
                              <p className="text-sm text-gray-500 capitalize">{label.label_type}</p>
                            </div>
                          </div>
                          {getStatusBadge(label.status)}
                        </div>

                        {label.quantity && (
                          <p className="text-sm mb-2">
                            <strong>Quantità:</strong> {label.quantity} {label.unit || ''}
                          </p>
                        )}

                        {label.batch_number && (
                          <p className="text-sm mb-2">
                            <strong>Lotto:</strong> {label.batch_number}
                          </p>
                        )}

                        {label.expiry_date && (
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm">Scade: {new Date(label.expiry_date).toLocaleDateString()}</span>
                            {getExpiryStatus(label.expiry_date)}
                          </div>
                        )}

                        {label.ingredients && (
                          <p className="text-sm mb-2">
                            <strong>Ingrediente:</strong> {label.ingredients.name}
                          </p>
                        )}

                        {label.recipes && (
                          <p className="text-sm mb-2">
                            <strong>Ricetta:</strong> {label.recipes.name} ({label.recipes.portions} porzioni)
                          </p>
                        )}

                        {label.status === 'active' && (
                          <div className="flex space-x-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConsumeOrDiscard(label.id, 'consumed')}
                              disabled={actionLoading}
                              className="flex-1"
                            >
                              Consuma
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleConsumeOrDiscard(label.id, 'discarded')}
                              disabled={actionLoading}
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
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="by-type" className="space-y-4">
          {['defrosted', 'recipe', 'semilavorato', 'lavorato'].map((type) => {
            const typeLabels = filteredLabels.filter(label => label.label_type === type);
            if (typeLabels.length === 0) return null;

            return (
              <Card key={type}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <span className="text-2xl">{getLabelTypeIcon(type)}</span>
                    <span className="capitalize">{type}</span>
                    <Badge variant="outline">{typeLabels.length} elementi</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {typeLabels.map((label) => (
                      <Card key={label.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{label.title}</h4>
                            {getStatusBadge(label.status)}
                          </div>

                          {label.storage_locations && (
                            <p className="text-sm mb-2">
                              <MapPin className="w-4 h-4 inline mr-1" />
                              {label.storage_locations.name}
                            </p>
                          )}

                          {label.quantity && (
                            <p className="text-sm mb-2">
                              <Package className="w-4 h-4 inline mr-1" />
                              {label.quantity} {label.unit || ''}
                            </p>
                          )}

                          {label.expiry_date && getExpiryStatus(label.expiry_date)}

                          {label.status === 'active' && (
                            <div className="flex space-x-2 mt-4">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleConsumeOrDiscard(label.id, 'consumed')}
                                disabled={actionLoading}
                                className="flex-1"
                              >
                                Consuma
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleConsumeOrDiscard(label.id, 'discarded')}
                                disabled={actionLoading}
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
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="expiring" className="space-y-4">
          {(() => {
            const today = new Date();
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(today.getDate() + 3);
            
            const expiringLabels = filteredLabels.filter(label => {
              if (!label.expiry_date || label.status !== 'active') return false;
              const expiryDate = new Date(label.expiry_date);
              return expiryDate <= threeDaysFromNow;
            });

            if (expiringLabels.length === 0) {
              return (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-500">Nessun elemento in scadenza nei prossimi 3 giorni</p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span>Elementi in Scadenza</span>
                    <Badge variant="secondary">{expiringLabels.length} elementi</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {expiringLabels.map((label) => (
                      <Card key={label.id} className="border-orange-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{getLabelTypeIcon(label.label_type)}</span>
                              <div>
                                <h4 className="font-medium">{label.title}</h4>
                                <p className="text-sm text-gray-500 capitalize">{label.label_type}</p>
                              </div>
                            </div>
                            {getExpiryStatus(label.expiry_date)}
                          </div>

                          {label.storage_locations && (
                            <p className="text-sm mb-2">
                              <MapPin className="w-4 h-4 inline mr-1" />
                              {label.storage_locations.name}
                            </p>
                          )}

                          <div className="flex space-x-2 mt-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConsumeOrDiscard(label.id, 'consumed')}
                              disabled={actionLoading}
                              className="flex-1"
                            >
                              Consuma
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleConsumeOrDiscard(label.id, 'discarded')}
                              disabled={actionLoading}
                              className="flex-1"
                            >
                              Scarta
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InventoryTrackingDashboard;
