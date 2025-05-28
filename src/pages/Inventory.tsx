
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import IngredientsManagement from "@/components/IngredientsManagement";

const Inventory = () => {
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
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📦</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Inventario Ingredienti</h1>
                  <p className="text-sm text-slate-500">Gestione completa ingredienti e scorte</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <IngredientsManagement />
      </main>
    </div>
  );
};

export default Inventory;
