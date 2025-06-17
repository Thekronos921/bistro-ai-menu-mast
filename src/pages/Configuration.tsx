
import React, { useState } from 'react';
import { Settings, Plus, Edit, Trash2, Table, Building2, Users, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useRestaurantTables } from '@/hooks/useRestaurantTables';

const Configuration = () => {
  const { restaurantId } = useRestaurant();
  const { tables, rooms } = useRestaurantTables(restaurantId);
  const [activeTab, setActiveTab] = useState('categories');

  // Mock data per categorie piatti e ingredienti
  const dishCategories = [
    { id: 1, name: 'Antipasti', count: 12 },
    { id: 2, name: 'Primi Piatti', count: 18 },
    { id: 3, name: 'Secondi Piatti', count: 15 },
    { id: 4, name: 'Dolci', count: 8 },
  ];

  const ingredientCategories = [
    { id: 1, name: 'Carni', count: 25 },
    { id: 2, name: 'Pesce', count: 15 },
    { id: 3, name: 'Verdure', count: 30 },
    { id: 4, name: 'Latticini', count: 12 },
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <Settings className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configurazione</h1>
          <p className="text-sm text-slate-500">Gestisci categorie, tavoli, sale e impostazioni del ristorante</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="categories">Categorie</TabsTrigger>
          <TabsTrigger value="tables">Tavoli</TabsTrigger>
          <TabsTrigger value="rooms">Sale</TabsTrigger>
          <TabsTrigger value="settings">Impostazioni</TabsTrigger>
        </TabsList>

        {/* Categorie Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Categorie Piatti */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Tag className="w-5 h-5" />
                  <span>Categorie Piatti</span>
                </CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dishCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{category.name}</span>
                        <Badge variant="secondary">{category.count} piatti</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Categorie Ingredienti */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Tag className="w-5 h-5" />
                  <span>Categorie Ingredienti</span>
                </CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Aggiungi
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {ingredientCategories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{category.name}</span>
                        <Badge variant="secondary">{category.count} ingredienti</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tavoli Tab */}
        <TabsContent value="tables" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Table className="w-5 h-5" />
                <span>Gestione Tavoli</span>
              </CardTitle>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuovo Tavolo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((table) => (
                  <div key={table.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{table.name}</span>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>Posti: {table.seats || 'N/A'}</p>
                      <p>Sala: {table.room_name || 'Principale'}</p>
                    </div>
                  </div>
                ))}
                {tables.length === 0 && (
                  <div className="col-span-full text-center py-8 text-slate-500">
                    Nessun tavolo configurato
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sale Tab */}
        <TabsContent value="rooms" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5" />
                <span>Gestione Sale</span>
              </CardTitle>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nuova Sala
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rooms.map((room) => (
                  <div key={room.id} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{room.name}</span>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>{room.description || 'Nessuna descrizione'}</p>
                    </div>
                  </div>
                ))}
                {rooms.length === 0 && (
                  <div className="col-span-full text-center py-8 text-slate-500">
                    Nessuna sala configurata
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impostazioni Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Impostazioni Generali</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Numero Coperti Totali</label>
                  <input 
                    type="number" 
                    className="w-full p-2 border rounded-md" 
                    placeholder="Es. 80"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Prezzo Coperto (€)</label>
                  <input 
                    type="number" 
                    step="0.50"
                    className="w-full p-2 border rounded-md" 
                    placeholder="Es. 2.50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Orario Apertura Pranzo</label>
                  <input 
                    type="time" 
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Orario Chiusura Pranzo</label>
                  <input 
                    type="time" 
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Orario Apertura Cena</label>
                  <input 
                    type="time" 
                    className="w-full p-2 border rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Orario Chiusura Cena</label>
                  <input 
                    type="time" 
                    className="w-full p-2 border rounded-md"
                  />
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button className="w-full md:w-auto">
                  Salva Impostazioni
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Configuration;
