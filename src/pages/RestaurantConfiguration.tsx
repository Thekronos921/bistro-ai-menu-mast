
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RestaurantBasicInfo } from "@/components/restaurant-config/RestaurantBasicInfo";
import { RestaurantTablesConfig } from "@/components/restaurant-config/RestaurantTablesConfig";
import { RestaurantShiftsConfig } from "@/components/restaurant-config/RestaurantShiftsConfig";
import { RestaurantIntegrations } from "@/components/restaurant-config/RestaurantIntegrations";

const RestaurantConfiguration = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4">
          {/* Mobile Layout */}
          <div className="flex items-center space-x-3 sm:hidden">
            <Link to="/" className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0">
              <ArrowLeft className="w-4 h-4 text-slate-600" />
            </Link>
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">⚙️</span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-bold text-slate-800 truncate">Configura Ristorante</h1>
              <p className="text-xs text-slate-500">Gestione tavoli, sale e configurazioni</p>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/" className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">⚙️</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Configura Ristorante</h1>
                  <p className="text-sm text-slate-500">Gestione configurazioni, tavoli, sale e integrazioni</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-4 sm:mb-6">
            <TabsTrigger value="basic" className="text-xs sm:text-sm">Info Base</TabsTrigger>
            <TabsTrigger value="tables" className="text-xs sm:text-sm">Tavoli & Sale</TabsTrigger>
            <TabsTrigger value="shifts" className="text-xs sm:text-sm">Turni</TabsTrigger>
            <TabsTrigger value="integrations" className="text-xs sm:text-sm">Integrazioni</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <RestaurantBasicInfo />
          </TabsContent>
          
          <TabsContent value="tables">
            <RestaurantTablesConfig />
          </TabsContent>
          
          <TabsContent value="shifts">
            <RestaurantShiftsConfig />
          </TabsContent>
          
          <TabsContent value="integrations">
            <RestaurantIntegrations />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RestaurantConfiguration;
