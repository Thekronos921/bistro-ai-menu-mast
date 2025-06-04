
import { ArrowLeft, Users, Target, TrendingUp, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const CustomerAnalysis = () => {
  const customerSegments = [
    {
      id: 1,
      name: "Gourmet Enthusiasts",
      size: 156,
      percentage: 32,
      avgSpend: 67.50,
      frequency: "2-3 volte/mese",
      preferences: ["Piatti speciali", "Vini pregiati", "Dolci artigianali"],
      color: "emerald",
      loyalty: 94
    },
    {
      id: 2,
      name: "Business Diners",
      size: 98,
      percentage: 20,
      avgSpend: 45.80,
      frequency: "1-2 volte/settimana",
      preferences: ["Pranzi veloci", "Menu fisso", "Ambiente riservato"],
      color: "blue",
      loyalty: 78
    },
    {
      id: 3,
      name: "Family Groups",
      size: 127,
      percentage: 26,
      avgSpend: 38.20,
      frequency: "1 volta/settimana",
      preferences: ["Porzioni abbondanti", "Menu bambini", "Prezzi accessibili"],
      color: "amber",
      loyalty: 85
    },
    {
      id: 4,
      name: "Young Couples",
      size: 89,
      percentage: 18,
      avgSpend: 52.30,
      frequency: "2 volte/mese",
      preferences: ["Atmosfera romantica", "Piatti da condividere", "Cocktail"],
      color: "rose",
      loyalty: 72
    }
  ];

  const recentInsights = [
    {
      type: "opportunity",
      title: "Nuovo Segmento Identificato",
      description: "Clienti vegetariani in crescita del 45% negli ultimi 3 mesi",
      action: "Espandi il menu vegetariano"
    },
    {
      type: "retention",
      title: "Alert Fidelizzazione",
      description: "12 clienti VIP non visitano da oltre 30 giorni",
      action: "Campagna di riattivazione personalizzata"
    },
    {
      type: "upselling",
      title: "Opportunità Upselling",
      description: "I Business Diners ordinano raramente il dolce (8%)",
      action: "Promuovi dolci express per il pranzo"
    }
  ];

  const getSegmentColor = (color: string) => {
    const colors = {
      emerald: "from-emerald-500 to-green-600",
      blue: "from-blue-500 to-indigo-600",
      amber: "from-amber-500 to-orange-600",
      rose: "from-rose-500 to-pink-600"
    };
    return colors[color as keyof typeof colors] || colors.emerald;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/" className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Analisi Clienti</h1>
                <p className="text-sm text-slate-500">Segmentazione e personalizzazione marketing</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Clienti Totali</h3>
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-800">470</p>
            <p className="text-sm text-emerald-600 mt-1">+12% questo mese</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Spesa Media</h3>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-slate-800">€51.20</p>
            <p className="text-sm text-emerald-600 mt-1">+8.5% vs mese scorso</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Tasso di Ritorno</h3>
              <Heart className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-3xl font-bold text-slate-800">82%</p>
            <p className="text-sm text-rose-600 mt-1">Clienti che ritornano</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">NPS Score</h3>
              <Target className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-800">8.7</p>
            <p className="text-sm text-blue-600 mt-1">Eccellente</p>
          </div>
        </div>

        {/* Customer Segments */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Segmentazione Clienti AI</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {customerSegments.map((segment) => (
              <div key={segment.id} className="border border-stone-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getSegmentColor(segment.color)} rounded-xl flex items-center justify-center`}>
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{segment.name}</h3>
                      <p className="text-sm text-slate-500">{segment.size} clienti ({segment.percentage}%)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-800">€{segment.avgSpend}</p>
                    <p className="text-xs text-slate-500">spesa media</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Frequenza:</span>
                    <span className="text-sm font-medium text-slate-800">{segment.frequency}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Loyalty Score:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`bg-gradient-to-r ${getSegmentColor(segment.color)} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${segment.loyalty}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-slate-800">{segment.loyalty}%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-sm text-slate-600 block mb-2">Preferenze:</span>
                    <div className="flex flex-wrap gap-2">
                      {segment.preferences.map((pref, index) => (
                        <span key={index} className="bg-stone-100 text-slate-700 px-2 py-1 rounded-full text-xs">
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-6">🤖 Insight e Raccomandazioni AI</h2>
          <div className="space-y-4">
            {recentInsights.map((insight, index) => (
              <div key={index} className="border border-stone-200 rounded-lg p-4 hover:bg-stone-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`w-3 h-3 rounded-full ${
                        insight.type === 'opportunity' ? 'bg-emerald-400' :
                        insight.type === 'retention' ? 'bg-amber-400' : 'bg-blue-400'
                      }`}></span>
                      <h3 className="font-semibold text-slate-800">{insight.title}</h3>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{insight.description}</p>
                    <p className="text-sm font-medium text-slate-800">💡 {insight.action}</p>
                  </div>
                  <button className="ml-4 px-3 py-1 bg-cyan-100 text-cyan-700 rounded-lg text-sm font-medium hover:bg-cyan-200 transition-colors">
                    Implementa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerAnalysis;
