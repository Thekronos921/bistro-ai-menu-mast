
import { ArrowLeft, Users, Clock, TrendingUp, Award } from "lucide-react";
import { Link } from "react-router-dom";

const StaffDashboard = () => {
  const staffMembers = [
    {
      id: 1,
      name: "Marco Rossi",
      role: "Head Chef",
      shift: "Serale",
      tasksCompleted: 12,
      totalTasks: 15,
      efficiency: 92,
      revenue: 847,
      feedback: 4.8
    },
    {
      id: 2,
      name: "Sofia Bianchi",
      role: "Sous Chef",
      shift: "Serale",
      tasksCompleted: 18,
      totalTasks: 20,
      efficiency: 88,
      revenue: 623,
      feedback: 4.6
    },
    {
      id: 3,
      name: "Anna Verdi",
      role: "Pastry Chef",
      shift: "Mattina",
      tasksCompleted: 8,
      totalTasks: 8,
      efficiency: 95,
      revenue: 234,
      feedback: 4.9
    }
  ];

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 90) return "text-emerald-600";
    if (efficiency >= 80) return "text-amber-600";
    return "text-red-600";
  };

  const getEfficiencyBg = (efficiency: number) => {
    if (efficiency >= 90) return "bg-emerald-500";
    if (efficiency >= 80) return "bg-amber-500";
    return "bg-red-500";
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
              <div className="w-10 h-10 bg-gradient-to-br from-slate-500 to-gray-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Dashboard Dipendenti</h1>
                <p className="text-sm text-slate-500">Monitoraggio performance e attività team</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Team Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Staff Attivo</h3>
              <Users className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-3xl font-bold text-slate-800">8</p>
            <p className="text-sm text-slate-500 mt-1">membri del team</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Efficienza Media</h3>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-3xl font-bold text-emerald-600">91%</p>
            <p className="text-sm text-emerald-600 mt-1">+3% vs ieri</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Ricavi per Staff</h3>
              <Award className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-slate-800">€568</p>
            <p className="text-sm text-slate-500 mt-1">media giornaliera</p>
          </div>
          
          <div className="bg-white rounded-2xl p-6 border border-stone-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-500">Feedback Clienti</h3>
              <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            </div>
            <p className="text-3xl font-bold text-slate-800">4.7</p>
            <p className="text-sm text-slate-500 mt-1">stelle medie</p>
          </div>
        </div>

        {/* Staff Performance */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-stone-200">
            <h2 className="text-lg font-semibold text-slate-800">Performance del Team - Oggi</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Dipendente</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-500">Ruolo</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Turno</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Task</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Efficienza</th>
                  <th className="text-right px-6 py-3 text-sm font-medium text-slate-500">Ricavi Generati</th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-500">Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {staffMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {member.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">{member.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{member.role}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {member.shift}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm">
                        <span className="font-medium text-slate-800">{member.tasksCompleted}</span>
                        <span className="text-slate-500">/{member.totalTasks}</span>
                      </div>
                      <div className="w-16 bg-gray-200 rounded-full h-1.5 mx-auto mt-1">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${(member.tasksCompleted / member.totalTasks) * 100}%` }}
                        ></div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`${getEfficiencyBg(member.efficiency)} h-2 rounded-full transition-all duration-300`}
                            style={{ width: `${member.efficiency}%` }}
                          ></div>
                        </div>
                        <span className={`text-sm font-medium ${getEfficiencyColor(member.efficiency)}`}>
                          {member.efficiency}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">€{member.revenue}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-1">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-sm font-medium text-slate-800">{member.feedback}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Insights and Training */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">📊 Analisi Performance</h3>
            <div className="space-y-4">
              <div className="border border-stone-200 rounded-lg p-4">
                <h4 className="font-medium text-slate-800 mb-2">Top Performer</h4>
                <p className="text-sm text-slate-600">Anna Verdi mantiene il 95% di efficienza con feedback eccellenti dai clienti</p>
              </div>
              <div className="border border-stone-200 rounded-lg p-4">
                <h4 className="font-medium text-slate-800 mb-2">Area di Miglioramento</h4>
                <p className="text-sm text-slate-600">I tempi di preparazione pasta sono aumentati del 8% questa settimana</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">🤖 Suggerimenti AI per il Team</h3>
            <div className="space-y-3">
              <div className="bg-white/80 rounded-lg p-3">
                <p className="text-sm text-slate-700"><strong>Formazione:</strong> Organizza una sessione sulla gestione tempi per la stazione pasta</p>
              </div>
              <div className="bg-white/80 rounded-lg p-3">
                <p className="text-sm text-slate-700"><strong>Rotazione:</strong> Sofia potrebbe beneficiare di più tempo alla stazione antipasti</p>
              </div>
              <div className="bg-white/80 rounded-lg p-3">
                <p className="text-sm text-slate-700"><strong>Riconoscimento:</strong> Celebra l'eccellente lavoro di Anna con i dolci questa settimana</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;
