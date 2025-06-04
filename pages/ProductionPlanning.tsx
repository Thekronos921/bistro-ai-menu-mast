
import { ArrowLeft, Calendar, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";

const ProductionPlanning = () => {
  const productionTasks = [
    {
      id: 1,
      dish: "Risotto ai Porcini",
      quantity: 12,
      estimatedTime: 35,
      startTime: "17:30",
      status: "pending",
      priority: "high",
      chef: "Marco",
      notes: "Preparare brodo in anticipo"
    },
    {
      id: 2,
      dish: "Branzino in Crosta",
      quantity: 8,
      estimatedTime: 45,
      startTime: "17:00",
      status: "in-progress",
      priority: "medium",
      chef: "Sofia",
      notes: "Controllare temperatura forno"
    },
    {
      id: 3,
      dish: "Tiramisù della Casa",
      quantity: 15,
      estimatedTime: 20,
      startTime: "16:00",
      status: "completed",
      priority: "low",
      chef: "Anna",
      notes: "Preparato stamattina"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "in-progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "pending": return "bg-amber-100 text-amber-800 border-amber-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-emerald-600" />;
      case "in-progress": return <Clock className="w-4 h-4 text-blue-600" />;
      case "pending": return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "border-l-red-500";
      case "medium": return "border-l-amber-500";
      case "low": return "border-l-emerald-500";
      default: return "border-l-gray-500";
    }
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
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Pianificazione Produzione</h1>
                <p className="text-sm text-slate-500">Gestione operativa e timeline cucina</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Today's Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Task Totali</h3>
              <Calendar className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-800">18</p>
            <p className="text-sm text-slate-500 mt-1">per oggi</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Completati</h3>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-emerald-600">12</p>
            <p className="text-sm text-emerald-600 mt-1">67% completamento</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">In Corso</h3>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-blue-600">4</p>
            <p className="text-sm text-blue-600 mt-1">attivi ora</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">In Ritardo</h3>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-red-600">2</p>
            <p className="text-sm text-red-600 mt-1">priorità alta</p>
          </div>
        </div>

        {/* Production Timeline */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Timeline Produzione Oggi</h2>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-stone-200"></div>
            
            <div className="space-y-6">
              {productionTasks.map((task, index) => (
                <div key={task.id} className="relative flex items-start space-x-4">
                  {/* Timeline dot */}
                  <div className={`relative z-10 w-12 h-12 rounded-full border-4 border-white shadow-sm flex items-center justify-center ${
                    task.status === 'completed' ? 'bg-emerald-500' :
                    task.status === 'in-progress' ? 'bg-blue-500' : 'bg-amber-500'
                  }`}>
                    {getStatusIcon(task.status)}
                  </div>
                  
                  {/* Task card */}
                  <div className={`flex-1 bg-white border-l-4 ${getPriorityColor(task.priority)} border border-stone-200 rounded-lg p-4 shadow-sm`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-800">{task.dish}</h3>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(task.status)}`}>
                            {task.status === 'completed' ? 'Completato' :
                             task.status === 'in-progress' ? 'In corso' : 'In attesa'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-slate-600">
                          <div>
                            <span className="font-medium">Quantità:</span> {task.quantity} porzioni
                          </div>
                          <div>
                            <span className="font-medium">Tempo stimato:</span> {task.estimatedTime} min
                          </div>
                          <div>
                            <span className="font-medium">Inizio:</span> {task.startTime}
                          </div>
                          <div>
                            <span className="font-medium">Chef:</span> {task.chef}
                          </div>
                        </div>
                        
                        {task.notes && (
                          <div className="mt-2 p-2 bg-stone-50 rounded text-sm text-slate-600">
                            <span className="font-medium">Note:</span> {task.notes}
                          </div>
                        )}
                      </div>
                      
                      <div className="ml-4 text-right">
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          task.priority === 'high' ? 'bg-red-100 text-red-700' :
                          task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {task.priority === 'high' ? 'Alta' :
                           task.priority === 'medium' ? 'Media' : 'Bassa'} priorità
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Efficiency Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Efficienza Cucina</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Tempo medio preparazione:</span>
                <span className="font-semibold text-slate-800">28 min</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Task completati in orario:</span>
                <span className="font-semibold text-emerald-600">89%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Utilizzo stazioni:</span>
                <span className="font-semibold text-slate-800">76%</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-4">🤖 Suggerimenti AI</h3>
            <div className="space-y-3">
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-sm text-green-700">Anticipa la preparazione del branzino di 15 minuti per evitare accumuli alle 19:30</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-sm text-green-700">La stazione dolci è libera: considera di preparare i tiramisù extra per domani</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductionPlanning;
