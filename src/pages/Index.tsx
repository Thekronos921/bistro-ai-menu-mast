
import { useAuth } from "@/contexts/AuthContext";
import { ChefHat, TrendingUp, Users, DollarSign, Star, Utensils, BarChart, Book, Package } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Index = () => {
  const { userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        {userProfile && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Benvenuto, {userProfile.full_name}!
              </h1>
              <p className="text-gray-600">
                Dashboard di gestione per{' '}
                <span className="font-medium text-orange-600">
                  {userProfile.restaurant?.name}
                </span>
              </p>
              <div className="mt-2 text-sm text-gray-500">
                <span className="capitalize">{userProfile.restaurant?.type}</span>
                {' • '}
                {userProfile.restaurant?.city}, {userProfile.restaurant?.country}
                {userProfile.restaurant?.seats_count && (
                  <>
                    {' • '}
                    {userProfile.restaurant.seats_count} coperti
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Title */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <ChefHat className="h-12 w-12 text-orange-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-900">Bistro AI</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            La piattaforma AI completa per la gestione intelligente del tuo ristorante
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Ricavi Oggi</p>
                  <p className="text-2xl font-bold text-gray-900">€2,847</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Clienti Serviti</p>
                  <p className="text-2xl font-bold text-gray-900">127</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Food Cost %</p>
                  <p className="text-2xl font-bold text-gray-900">28.4%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rating Medio</p>
                  <p className="text-2xl font-bold text-gray-900">4.8</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {/* Food Cost Analysis */}
          <Link to="/food-cost" className="block hover:shadow-md transition-shadow">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-red-100 rounded-lg">
                    <Utensils className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Analisi Food Cost</h3>
                    <p className="text-sm text-gray-600">Ottimizza i costi degli ingredienti</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Menu Engineering */}
          <Link to="/menu-engineering" className="block hover:shadow-md transition-shadow">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <BarChart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Menu Engineering</h3>
                    <p className="text-sm text-gray-600">Massimizza i profitti del tuo menu</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Recipes Management */}
          <Link to="/recipes" className="block hover:shadow-md transition-shadow">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Book className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Gestione Ricette</h3>
                    <p className="text-sm text-gray-600">Organizza e gestisci le tue ricette</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Inventory Management */}
          <Link to="/inventory" className="block hover:shadow-md transition-shadow">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-100 rounded-lg">
                    <Package className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Gestione Magazzino</h3>
                    <p className="text-sm text-gray-600">Monitora e gestisci il tuo inventario</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Demand Forecasting */}
          <Link to="/demand-forecast" className="block hover:shadow-md transition-shadow">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Previsione Domanda</h3>
                    <p className="text-sm text-gray-600">Prevedi la domanda dei clienti</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Customer Analysis */}
          <Link to="/customer-analysis" className="block hover:shadow-md transition-shadow">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Users className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">Analisi Clienti</h3>
                    <p className="text-sm text-gray-600">Comprendi meglio i tuoi clienti</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* AI Insights */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ottimizzazione Menu</h3>
                <p className="text-sm text-gray-600">
                  L'AI suggerisce di ridurre i prezzi dei piatti con basso margine e alta popolarità per aumentare i profitti complessivi.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Gestione Inventario</h3>
                <p className="text-sm text-gray-600">
                  L'AI prevede un aumento della domanda di pasta la prossima settimana. Assicurati di avere scorte sufficienti.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm py-4">
          © 2024 Bistro AI. Tutti i diritti riservati.
        </footer>
      </div>
    </div>
  );
};

export default Index;
