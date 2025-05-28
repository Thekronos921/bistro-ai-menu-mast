
import { useState } from "react";
import { ArrowLeft, Package, AlertTriangle, TrendingUp, Search, Plus } from "lucide-react";
import { Link } from "react-router-dom";

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const inventory = [
    {
      id: 1,
      name: "Riso Carnaroli",
      category: "Cereali",
      currentStock: 15,
      unit: "kg",
      minStock: 10,
      maxStock: 30,
      averageConsumption: 2.5,
      daysRemaining: 6,
      status: "warning",
      cost: 4.20,
      supplier: "Riseria San Massimo"
    },
    {
      id: 2,
      name: "Porcini freschi",
      category: "Funghi",
      currentStock: 3,
      unit: "kg",
      minStock: 2,
      maxStock: 8,
      averageConsumption: 1.2,
      daysRemaining: 2,
      status: "critical",
      cost: 14.00,
      supplier: "Funghi del Borgo"
    },
    {
      id: 3,
      name: "Branzino",
      category: "Pesce",
      currentStock: 12,
      unit: "kg",
      minStock: 5,
      maxStock: 20,
      averageConsumption: 3.8,
      daysRemaining: 3,
      status: "ok",
      cost: 8.00,
      supplier: "Mercato Ittico"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "warning": return "bg-amber-100 text-amber-800 border-amber-200";
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ok": return "Scorte OK";
      case "warning": return "Riordino suggerito";
      case "critical": return "Riordino urgente";
      default: return "N/A";
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
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
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Gestione Scorte</h1>
                  <p className="text-sm text-slate-500">Analisi trend e previsione intelligente</p>
                </div>
              </div>
            </div>
            <button className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <Plus className="w-4 h-4" />
              <span>Nuovo Ordine</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Articoli Totali</h3>
              <Package className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-800">127</p>
            <p className="text-sm text-slate-500 mt-1">In inventario</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Riordini Urgenti</h3>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600">8</p>
            <p className="text-sm text-red-500 mt-1">Sotto soglia minima</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Valore Scorte</h3>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-slate-800">€3,247</p>
            <p className="text-sm text-emerald-500 mt-1">+5.2% vs ieri</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Turnover Medio</h3>
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            </div>
            <p className="text-3xl font-bold text-slate-800">4.2</p>
            <p className="text-sm text-slate-500 mt-1">giorni</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cerca ingredienti..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-200">
            <h2 className="text-lg font-semibold text-slate-800">Inventario Attuale</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Ingrediente</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Categoria</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Scorta Attuale</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Consumo Medio</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Giorni Rimanenti</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Costo/Unità</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Status</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Fornitore</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredInventory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{item.name}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{item.category}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-slate-800">{item.currentStock} {item.unit}</div>
                      <div className="text-xs text-slate-500">Min: {item.minStock} | Max: {item.maxStock}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">{item.averageConsumption} {item.unit}/giorno</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-medium ${item.daysRemaining <= 3 ? 'text-red-600' : item.daysRemaining <= 7 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {item.daysRemaining} giorni
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">€{item.cost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{item.supplier}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="mt-8 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
          <h3 className="text-lg font-semibold text-amber-800 mb-4">🤖 Suggerimenti AI per Riordini</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/60 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 mb-2">Ordine Prioritario</h4>
              <p className="text-sm text-amber-700">Ordinare 5kg di Porcini freschi entro domani. Considerando il picco del weekend, consiglio 8kg.</p>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <h4 className="font-medium text-amber-800 mb-2">Ottimizzazione Costi</h4>
              <p className="text-sm text-amber-700">Il Riso Carnaroli ha un prezzo favorevole questa settimana. Considera un ordine più grande per risparmiare il 12%.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Inventory;
