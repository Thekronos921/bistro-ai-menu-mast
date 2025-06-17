
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import IngredientsManagement from "@/components/IngredientsManagement";
import InventoryTrackingDashboard from "@/components/inventory/InventoryTrackingDashboard";
import UnifiedLabelGenerator from "@/components/labeling/UnifiedLabelGenerator";

const Inventory = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {/* Mobile Layout */}
          <div className="flex flex-col space-y-3 sm:hidden">
            {/* Title Row */}
            <div className="flex items-center space-x-2">
              <Link to="/" className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0">
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </Link>
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">📦</span>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-lg font-bold text-slate-800 truncate">Gestione Inventario</h1>
                <p className="text-xs text-slate-500">Ingredienti, scorte e tracciabilità</p>
              </div>
            </div>
            
            {/* Generator Button Row */}
            <div className="flex justify-end">
              <UnifiedLabelGenerator />
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">📦</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Gestione Inventario</h1>
                  <p className="text-sm text-slate-500">Ingredienti, scorte e tracciabilità prodotti</p>
                </div>
              </div>
            </div>
            <UnifiedLabelGenerator />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <Tabs defaultValue="ingredients" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
            <TabsTrigger value="ingredients" className="text-xs sm:text-sm">Gestione Ingredienti</TabsTrigger>
            <TabsTrigger value="tracking" className="text-xs sm:text-sm">Inventario Tracciato</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ingredients">
            <IngredientsManagement />
          </TabsContent>
          
          <TabsContent value="tracking">
            <InventoryTrackingDashboard />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Inventory;
