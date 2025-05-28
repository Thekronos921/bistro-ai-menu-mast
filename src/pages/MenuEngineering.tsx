
import { useState } from "react";
import { ArrowLeft, BarChart3, Star, Zap, AlertTriangle, TrendingDown } from "lucide-react";
import { Link } from "react-router-dom";

const MenuEngineering = () => {
  const dishes = [
    {
      id: 1,
      name: "Risotto ai Porcini",
      category: "Stars",
      popularity: 85,
      profitability: 78,
      weeklyOrders: 42,
      profit: 13.15,
      recommendation: "Mantieni posizione prominente nel menu",
      color: "emerald"
    },
    {
      id: 2,
      name: "Branzino in Crosta",
      category: "Plowhorses",
      popularity: 72,
      profitability: 45,
      weeklyOrders: 28,
      profit: 15.80,
      recommendation: "Riduci costi o aumenta prezzo",
      color: "blue"
    },
    {
      id: 3,
      name: "Tagliata di Manzo",
      category: "Puzzles",
      popularity: 35,
      profitability: 82,
      weeklyOrders: 12,
      profit: 15.50,
      recommendation: "Promuovi attivamente o rimuovi",
      color: "amber"
    },
    {
      id: 4,
      name: "Pasta all'Amatriciana",
      category: "Dogs",
      popularity: 28,
      profitability: 32,
      weeklyOrders: 8,
      profit: 8.20,
      recommendation: "Considera rimozione dal menu",
      color: "red"
    }
  ];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Stars": return <Star className="w-5 h-5" />;
      case "Plowhorses": return <Zap className="w-5 h-5" />;
      case "Puzzles": return <AlertTriangle className="w-5 h-5" />;
      case "Dogs": return <TrendingDown className="w-5 h-5" />;
      default: return <BarChart3 className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Stars": return "from-emerald-500 to-green-600";
      case "Plowhorses": return "from-blue-500 to-indigo-600";
      case "Puzzles": return "from-amber-500 to-orange-600";
      case "Dogs": return "from-red-500 to-rose-600";
      default: return "from-gray-500 to-slate-600";
    }
  };

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
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Menu Engineering AI</h1>
                  <p className="text-sm text-slate-500">Analisi intelligente performance menu</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Matrix Overview */}
        <div className="bg-white rounded-2xl border border-stone-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Menu Engineering Matrix</h2>
          <div className="grid grid-cols-2 gap-6">
            {/* Stars Quadrant */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-emerald-800">STARS</h3>
                  <p className="text-sm text-emerald-600">Alta Popolarità + Alta Redditività</p>
                </div>
              </div>
              <p className="text-emerald-700 text-sm mb-3">Mantieni prominenti nel menu, promuovi attivamente</p>
              <div className="space-y-2">
                {dishes.filter(d => d.category === "Stars").map(dish => (
                  <div key={dish.id} className="bg-white/60 rounded-lg p-3">
                    <p className="font-medium text-emerald-800">{dish.name}</p>
                    <p className="text-sm text-emerald-600">{dish.weeklyOrders} ordini/settimana</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Plowhorses Quadrant */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-800">PLOWHORSES</h3>
                  <p className="text-sm text-blue-600">Alta Popolarità + Bassa Redditività</p>
                </div>
              </div>
              <p className="text-blue-700 text-sm mb-3">Riduci costi o aumenta prezzi strategicamente</p>
              <div className="space-y-2">
                {dishes.filter(d => d.category === "Plowhorses").map(dish => (
                  <div key={dish.id} className="bg-white/60 rounded-lg p-3">
                    <p className="font-medium text-blue-800">{dish.name}</p>
                    <p className="text-sm text-blue-600">{dish.weeklyOrders} ordini/settimana</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Puzzles Quadrant */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-amber-800">PUZZLES</h3>
                  <p className="text-sm text-amber-600">Bassa Popolarità + Alta Redditività</p>
                </div>
              </div>
              <p className="text-amber-700 text-sm mb-3">Promuovi o riprogetta la presentazione</p>
              <div className="space-y-2">
                {dishes.filter(d => d.category === "Puzzles").map(dish => (
                  <div key={dish.id} className="bg-white/60 rounded-lg p-3">
                    <p className="font-medium text-amber-800">{dish.name}</p>
                    <p className="text-sm text-amber-600">{dish.weeklyOrders} ordini/settimana</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dogs Quadrant */}
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-xl p-6 border-2 border-red-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-600 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-red-800">DOGS</h3>
                  <p className="text-sm text-red-600">Bassa Popolarità + Bassa Redditività</p>
                </div>
              </div>
              <p className="text-red-700 text-sm mb-3">Considera rimozione o completa rivisitazione</p>
              <div className="space-y-2">
                {dishes.filter(d => d.category === "Dogs").map(dish => (
                  <div key={dish.id} className="bg-white/60 rounded-lg p-3">
                    <p className="font-medium text-red-800">{dish.name}</p>
                    <p className="text-sm text-red-600">{dish.weeklyOrders} ordini/settimana</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200">
            <h2 className="text-lg font-semibold text-slate-800">Analisi Dettagliata Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Piatto</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Categoria</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Popolarità</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Redditività</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Ordini/Settimana</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Raccomandazione AI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {dishes.map((dish) => (
                  <tr key={dish.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{dish.name}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r ${getCategoryColor(dish.category)} text-white text-sm font-medium`}>
                        {getCategoryIcon(dish.category)}
                        <span>{dish.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${dish.popularity}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700">{dish.popularity}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${dish.profitability}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700">{dish.profitability}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">{dish.weeklyOrders}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{dish.recommendation}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="mt-8 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200 p-6">
          <h3 className="text-lg font-semibold text-indigo-800 mb-4">🤖 Raccomandazioni AI Settimanali</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/60 rounded-lg p-4">
              <h4 className="font-medium text-indigo-800 mb-2">Azione Prioritaria</h4>
              <p className="text-sm text-indigo-700">Aumenta il prezzo del "Branzino in Crosta" di €2-3 per migliorare la redditività mantenendo la popolarità.</p>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <h4 className="font-medium text-indigo-800 mb-2">Opportunità Marketing</h4>
              <p className="text-sm text-indigo-700">Promuovi la "Tagliata di Manzo" con descrizioni accattivanti per aumentarne la visibilità e gli ordini.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MenuEngineering;
