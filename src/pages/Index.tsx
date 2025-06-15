
import { ArrowRight, BarChart3, Calculator, ChefHat, Package, TrendingUp, Users, Utensils, PieChart, Calendar, Target, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-800 mb-4">
            Gestione Intelligente del Ristorante
          </h2>
          <p className="text-base sm:text-xl text-slate-600 max-w-3xl mx-auto px-4">
            Ottimizza costi, ricette e operazioni con la nostra piattaforma all-in-one
          </p>
        </div>

        {/* Main Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {/* Food Cost Analysis */}
          <Link to="/food-cost">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer bg-white border-0 shadow-lg h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <Calculator className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                </div>
                <CardTitle className="text-lg sm:text-xl group-hover:text-emerald-600 transition-colors">
                  Food Cost Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base text-slate-600 mb-4">
                  Analizza i costi di produzione e ottimizza la redditività dei tuoi piatti
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs">
                    Analisi Costi
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                    ROI
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Menu Engineering */}
          <Link to="/menu-engineering">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer bg-white border-0 shadow-lg h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <PieChart className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-orange-600 transition-colors" />
                </div>
                <CardTitle className="text-lg sm:text-xl group-hover:text-orange-600 transition-colors">
                  Menu Engineering
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base text-slate-600 mb-4">
                  Ottimizza il menu con analisi delle performance e marginalità
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-orange-50 text-orange-700 text-xs">
                    Performance
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-xs">
                    Margini
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Recipe Management */}
          <Link to="/recipes">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer bg-white border-0 shadow-lg h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                    <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
                </div>
                <CardTitle className="text-lg sm:text-xl group-hover:text-purple-600 transition-colors">
                  Mapping Ricette
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base text-slate-600 mb-4">
                  Gestisci ricette, ingredienti e calcola i costi di produzione
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700 text-xs">
                    Ricette
                  </Badge>
                  <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs">
                    Costi
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Inventory Management */}
          <Link to="/inventory">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer bg-white border-0 shadow-lg h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <Package className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                </div>
                <CardTitle className="text-lg sm:text-xl group-hover:text-blue-600 transition-colors">
                  Inventario Ingredienti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base text-slate-600 mb-4">
                  Monitora scorte, fornitori e soglie di riordino in tempo reale
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                    Scorte
                  </Badge>
                  <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 text-xs">
                    Fornitori
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Demand Forecast */}
          <Link to="/demand-forecast">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer bg-white border-0 shadow-lg h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                </div>
                <CardTitle className="text-lg sm:text-xl group-hover:text-indigo-600 transition-colors">
                  Previsione Domanda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base text-slate-600 mb-4">
                  Prevedi la domanda futura per ottimizzare acquisti e preparazioni
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 text-xs">
                    Previsioni
                  </Badge>
                  <Badge variant="secondary" className="bg-green-50 text-green-700 text-xs">
                    AI
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Customer Analysis */}
          <Link to="/customer-analysis">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer bg-white border-0 shadow-lg h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-pink-600 transition-colors" />
                </div>
                <CardTitle className="text-lg sm:text-xl group-hover:text-pink-600 transition-colors">
                  Analisi Clienti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base text-slate-600 mb-4">
                  Comprendi i comportamenti dei clienti e personalizza l'offerta
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-pink-50 text-pink-700 text-xs">
                    Clienti
                  </Badge>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                    Insights
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Actions Section */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 p-6 sm:p-8 mb-8 sm:mb-12 shadow-lg">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Staff & Servizio</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Link to="/staff">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-0 bg-gradient-to-br from-teal-50 to-cyan-50 h-full">
                <CardContent className="p-3 sm:p-4 text-center">
                  <Utensils className="w-6 h-6 sm:w-8 sm:h-8 text-teal-600 mx-auto mb-2" />
                  <h4 className="text-sm sm:text-base font-semibold text-slate-800 group-hover:text-teal-600 transition-colors">
                    Dashboard Staff
                  </h4>
                </CardContent>
              </Card>
            </Link>

            <Link to="/gestione-turni">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-0 bg-gradient-to-br from-amber-50 to-orange-50 h-full">
                <CardContent className="p-3 sm:p-4 text-center">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-amber-600 mx-auto mb-2" />
                  <h4 className="text-sm sm:text-base font-semibold text-slate-800 group-hover:text-amber-600 transition-colors">
                    Gestione Turni
                  </h4>
                </CardContent>
              </Card>
            </Link>

            <Link to="/reservations">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-0 bg-gradient-to-br from-green-50 to-emerald-50 h-full">
                <CardContent className="p-3 sm:p-4 text-center">
                  <Target className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 mx-auto mb-2" />
                  <h4 className="text-sm sm:text-base font-semibold text-slate-800 group-hover:text-green-600 transition-colors">
                    Prenotazioni
                  </h4>
                </CardContent>
              </Card>
            </Link>

            <Link to="/cassa-in-cloud">
              <Card className="group hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer border-0 bg-gradient-to-br from-violet-50 to-purple-50 h-full">
                <CardContent className="p-3 sm:p-4 text-center">
                  <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-violet-600 mx-auto mb-2" />
                  <h4 className="text-sm sm:text-base font-semibold text-slate-800 group-hover:text-violet-600 transition-colors">
                    CassaInCloud
                  </h4>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* KPI Dashboard */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-lg">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4 sm:mb-6">Dashboard KPI</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card className="border-0 bg-gradient-to-br from-emerald-50 to-green-50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                  <Badge className="bg-emerald-600 text-xs">+12%</Badge>
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-800">28.5%</h4>
                <p className="text-xs sm:text-sm text-slate-600">Food Cost Medio</p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  <Badge className="bg-blue-600 text-xs">+8%</Badge>
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-800">€142</h4>
                <p className="text-xs sm:text-sm text-slate-600">Scontrino Medio</p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-purple-50 to-violet-50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                  <Badge className="bg-purple-600 text-xs">+5%</Badge>
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-800">87</h4>
                <p className="text-xs sm:text-sm text-slate-600">Ricette Attive</p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-orange-50 to-red-50">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                  <Badge variant="destructive" className="text-xs">-3%</Badge>
                </div>
                <h4 className="text-xl sm:text-2xl font-bold text-slate-800">94%</h4>
                <p className="text-xs sm:text-sm text-slate-600">Disponibilità Stock</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
