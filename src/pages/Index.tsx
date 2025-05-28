
import { Link } from "react-router-dom";
import { ChefHat, DollarSign, BarChart3, Package, Users, TrendingUp, Calendar, Settings } from "lucide-react";

const Index = () => {
  const menuItems = [
    {
      title: "Food Cost",
      description: "Calcolo automatico costi ingredienti e food cost teorico/reale",
      icon: DollarSign,
      href: "/food-cost",
      color: "bg-gradient-to-br from-emerald-500 to-teal-600"
    },
    {
      title: "Menu Engineering",
      description: "Classificazione piatti AI-driven e analisi redditività",
      icon: BarChart3,
      href: "/menu-engineering",
      color: "bg-gradient-to-br from-blue-500 to-indigo-600"
    },
    {
      title: "Mapping Ricette",
      description: "Gestione completa ricette e ingredienti",
      icon: ChefHat,
      href: "/recipes",
      color: "bg-gradient-to-br from-purple-500 to-violet-600"
    },
    {
      title: "Gestione Scorte",
      description: "Analisi trend consumo e previsione scorte intelligente",
      icon: Package,
      href: "/inventory",
      color: "bg-gradient-to-br from-amber-500 to-orange-600"
    },
    {
      title: "Previsione Domanda",
      description: "Predizioni basate su meteo, eventi e stagionalità",
      icon: TrendingUp,
      href: "/demand-forecast",
      color: "bg-gradient-to-br from-rose-500 to-pink-600"
    },
    {
      title: "Analisi Clienti",
      description: "Segmentazione clienti e personalizzazione marketing",
      icon: Users,
      href: "/customer-analysis",
      color: "bg-gradient-to-br from-cyan-500 to-blue-600"
    },
    {
      title: "Pianificazione",
      description: "Gestione produzione e pianificazione operativa",
      icon: Calendar,
      href: "/production-planning",
      color: "bg-gradient-to-br from-green-500 to-emerald-600"
    },
    {
      title: "Dashboard Dipendenti",
      description: "Monitoraggio attività e performance del team",
      icon: Settings,
      href: "/staff-dashboard",
      color: "bg-gradient-to-br from-slate-500 to-gray-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">RestaurantOS</h1>
                <p className="text-sm text-slate-500">Sistema di Gestione Intelligente</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Ristorante</p>
              <p className="font-semibold text-slate-700">La Tavola d'Oro</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-800 mb-4">
            Dashboard Principale
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Sistema integrato per la gestione intelligente di Food Cost, Menu Engineering 
            e ottimizzazione operativa del ristorante
          </p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.title}
                to={item.href}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-200 hover:border-stone-300"
              >
                <div className="p-6">
                  <div className={`w-16 h-16 ${item.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            );
          })}
        </div>

        {/* Statistics Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-700">Food Cost Medio</h3>
              <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
            </div>
            <p className="text-3xl font-bold text-slate-800">28.5%</p>
            <p className="text-sm text-emerald-600 mt-1">↓ -2.3% dal mese scorso</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-700">Margine Medio</h3>
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            </div>
            <p className="text-3xl font-bold text-slate-800">71.5%</p>
            <p className="text-sm text-blue-600 mt-1">↑ +1.8% dal mese scorso</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-700">Efficienza Scorte</h3>
              <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
            </div>
            <p className="text-3xl font-bold text-slate-800">94.2%</p>
            <p className="text-sm text-amber-600 mt-1">→ Stabile</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
