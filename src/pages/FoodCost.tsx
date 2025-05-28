import { useState } from "react";
import { ArrowLeft, Search, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";
import AddDishDialog from "@/components/AddDishDialog";

const FoodCost = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [dishes, setDishes] = useState([
    {
      id: 1,
      name: "Risotto ai Porcini",
      category: "Primi Piatti",
      sellingPrice: 18.00,
      foodCost: 4.85,
      foodCostPercentage: 26.9,
      margin: 13.15,
      status: "ottimo",
      trend: "down"
    },
    {
      id: 2,
      name: "Branzino in Crosta",
      category: "Secondi Piatti",
      sellingPrice: 24.00,
      foodCost: 8.20,
      foodCostPercentage: 34.2,
      margin: 15.80,
      status: "buono",
      trend: "up"
    },
    {
      id: 3,
      name: "Tiramisù della Casa",
      category: "Dolci",
      sellingPrice: 8.00,
      foodCost: 2.10,
      foodCostPercentage: 26.3,
      margin: 5.90,
      status: "ottimo",
      trend: "stable"
    },
    {
      id: 4,
      name: "Tagliata di Manzo",
      category: "Secondi Piatti",
      sellingPrice: 28.00,
      foodCost: 12.50,
      foodCostPercentage: 44.6,
      margin: 15.50,
      status: "critico",
      trend: "up"
    }
  ]);

  const handleAddDish = (newDish: any) => {
    setDishes([...dishes, newDish]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ottimo": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "buono": return "bg-blue-100 text-blue-800 border-blue-200";
      case "critico": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up": return <TrendingUp className="w-4 h-4 text-red-500" />;
      case "down": return <TrendingDown className="w-4 h-4 text-emerald-500" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const filteredDishes = dishes.filter(dish =>
    dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dish.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Food Cost Analysis</h1>
                  <p className="text-sm text-slate-500">Gestione costi e marginalità</p>
                </div>
              </div>
            </div>
            <AddDishDialog onAddDish={handleAddDish} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Food Cost Medio</h3>
            <p className="text-3xl font-bold text-slate-800">32.8%</p>
            <div className="flex items-center mt-2">
              <TrendingDown className="w-4 h-4 text-emerald-500 mr-1" />
              <span className="text-sm text-emerald-600">-1.2% vs target</span>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Margine Totale</h3>
            <p className="text-3xl font-bold text-slate-800">€1,247</p>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-emerald-500 mr-1" />
              <span className="text-sm text-emerald-600">+8.5% vs ieri</span>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Piatti Critici</h3>
            <p className="text-3xl font-bold text-red-600">3</p>
            <span className="text-sm text-slate-500">Food cost &gt; 40%</span>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <h3 className="text-sm font-medium text-slate-500 mb-2">Target Raggiunto</h3>
            <p className="text-3xl font-bold text-emerald-600">78%</p>
            <span className="text-sm text-slate-500">dei piatti sotto il 35%</span>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cerca piatti o categorie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
            <select className="px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500">
              <option>Tutte le categorie</option>
              <option>Antipasti</option>
              <option>Primi Piatti</option>
              <option>Secondi Piatti</option>
              <option>Dolci</option>
            </select>
            <select className="px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500">
              <option>Tutti gli stati</option>
              <option>Ottimo (&lt; 30%)</option>
              <option>Buono (30-35%)</option>
              <option>Critico (&gt; 35%)</option>
            </select>
          </div>
        </div>

        {/* Dishes Table */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200">
            <h2 className="text-lg font-semibold text-slate-800">Analisi Food Cost per Piatto</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Piatto</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Categoria</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Prezzo Vendita</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Costo Ingredienti</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Food Cost %</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Margine</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Trend</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredDishes.map((dish) => (
                  <tr key={dish.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{dish.name}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{dish.category}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">€{dish.sellingPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-slate-600">€{dish.foodCost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-semibold ${dish.foodCostPercentage > 35 ? 'text-red-600' : dish.foodCostPercentage > 30 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {dish.foodCostPercentage.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">€{dish.margin.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      {getTrendIcon(dish.trend)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(dish.status)}`}>
                        {dish.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default FoodCost;
