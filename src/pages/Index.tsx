import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PostRegistrationSetup from '@/components/PostRegistrationSetup';
import { Link } from 'react-router-dom';
import { Rocket, BarChartBig, ListChecks, Users, TrendingUp, MessageSquare, LayoutDashboard } from 'lucide-react';

const Index = () => {
  const { user, userProfile, loading } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // If user is authenticated but has no profile, check if they need to complete setup
  if (user && !userProfile) {
    const pendingRegistration = localStorage.getItem('pendingRegistration');
    if (pendingRegistration) {
      return <PostRegistrationSetup />;
    }
  }

  // If not authenticated, show a landing page
  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl lg:text-6xl">
            <span className="block">Gestisci il tuo Ristorante</span>
            <span className="block text-orange-600">con l'Intelligenza Artificiale</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Ottimizza costi, ricette e inventario con l'intelligenza artificiale.
            La piattaforma completa per la gestione moderna del food service.
          </p>
          <div className="mt-8 sm:flex sm:justify-center lg:justify-start">
            <div className="rounded-md shadow">
              <Link
                to="/register"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 md:py-4 md:text-lg md:px-10"
              >
                Inizia Ora
              </Link>
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-3">
              <Link
                to="/login"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 md:py-4 md:text-lg md:px-10"
              >
                Accedi
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If authenticated, show the main dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Gestisci il tuo Ristorante con l'AI
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Ottimizza costi, ricette e inventario con l'intelligenza artificiale. 
          La piattaforma completa per la gestione moderna del food service.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
        {/* Food Cost Analysis */}
        <Link to="/food-cost" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <BarChartBig className="h-6 w-6 text-orange-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">Analisi dei Costi Alimentari</h3>
          </div>
          <p className="text-gray-700">
            Monitora e ottimizza i costi degli ingredienti per massimizzare i profitti.
          </p>
        </Link>

        {/* Menu Engineering */}
        <Link to="/menu-engineering" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <TrendingUp className="h-6 w-6 text-orange-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">Menu Engineering</h3>
          </div>
          <p className="text-gray-700">
            Progetta un menu strategico basato sui dati di vendita e sui margini di profitto.
          </p>
        </Link>

        {/* Recipe Management */}
        <Link to="/recipes" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <ListChecks className="h-6 w-6 text-orange-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">Gestione Ricette</h3>
          </div>
          <p className="text-gray-700">
            Organizza e standardizza le tue ricette per garantire qualità e coerenza.
          </p>
        </Link>

        {/* Inventory Management */}
        <Link to="/inventory" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <Rocket className="h-6 w-6 text-orange-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">Gestione Inventario</h3>
          </div>
          <p className="text-gray-700">
            Traccia l'inventario in tempo reale per ridurre gli sprechi e ottimizzare gli acquisti.
          </p>
        </Link>

        {/* Demand Forecasting */}
        <Link to="/demand-forecast" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <LayoutDashboard className="h-6 w-6 text-orange-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">Previsione della Domanda</h3>
          </div>
          <p className="text-gray-700">
            Prevedi la domanda futura per pianificare la produzione e ridurre le scorte in eccesso.
          </p>
        </Link>

        {/* Customer Analysis */}
        <Link to="/customer-analysis" className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center mb-4">
            <Users className="h-6 w-6 text-orange-600 mr-2" />
            <h3 className="text-xl font-semibold text-gray-900">Analisi dei Clienti</h3>
          </div>
          <p className="text-gray-700">
            Comprendi meglio i tuoi clienti per personalizzare l'offerta e aumentare la fidelizzazione.
          </p>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Dashboard Rapida
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div className="text-center">
            <p className="text-gray-500 uppercase tracking-wider text-sm">Ricavi Totali</p>
            <p className="text-3xl font-bold text-green-600">$125,000</p>
          </div>

          {/* Food Cost Percentage */}
          <div className="text-center">
            <p className="text-gray-500 uppercase tracking-wider text-sm">Costo Materie Prime</p>
            <p className="text-3xl font-bold text-red-600">28%</p>
          </div>

          {/* Customer Satisfaction */}
          <div className="text-center">
            <p className="text-gray-500 uppercase tracking-wider text-sm">Soddisfazione Clienti</p>
            <p className="text-3xl font-bold text-blue-600">92%</p>
          </div>

          {/* Inventory Turnover */}
          <div className="text-center">
            <p className="text-gray-500 uppercase tracking-wider text-sm">Rotazione Inventario</p>
            <p className="text-3xl font-bold text-orange-600">12x</p>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg shadow-lg p-8 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          Inizia a Ottimizzare il tuo Ristorante
        </h2>
        <p className="text-xl mb-6 opacity-90">
          Scopri come l'AI può trasformare la gestione del tuo locale
        </p>
        <div className="flex justify-center gap-4">
          <Link to="/food-cost" className="bg-white text-orange-600 font-bold py-3 px-6 rounded-md hover:bg-orange-100 transition-colors">
            Analisi Costi
          </Link>
          <Link to="/recipes" className="bg-white text-orange-600 font-bold py-3 px-6 rounded-md hover:bg-orange-100 transition-colors">
            Gestione Ricette
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Index;
