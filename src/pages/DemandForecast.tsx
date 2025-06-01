
import { ArrowLeft, TrendingUp, Cloud, Calendar, Users, Upload, Plus, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { useDemandForecast } from "@/hooks/useDemandForecast";
import SalesDataImportDialog from "@/components/demand-forecast/SalesDataImportDialog";
import LocalEventDialog from "@/components/demand-forecast/LocalEventDialog";
import { Button } from "@/components/ui/button";

const DemandForecast = () => {
  const { forecasts, salesData, localEvents, weatherData, isLoading } = useDemandForecast();

  // Mock data per ora - da sostituire con dati reali quando disponibili
  const mockForecasts = [
    {
      date: "2024-05-29",
      day: "Mercoledì",
      weather: "Soleggiato",
      temperature: "22°C",
      events: ["Mercato locale"],
      predictedCovers: 85,
      confidence: 92,
      topDishes: ["Risotto ai Porcini", "Branzino in Crosta", "Tiramisù"],
      revenue: 1847
    },
    {
      date: "2024-05-30",
      day: "Giovedì",
      weather: "Nuvoloso",
      temperature: "19°C",
      events: [],
      predictedCovers: 72,
      confidence: 88,
      topDishes: ["Pasta all'Amatriciana", "Tagliata di Manzo"],
      revenue: 1562
    },
    {
      date: "2024-05-31",
      day: "Venerdì",
      weather: "Pioggia",
      temperature: "16°C",
      events: ["Evento aziendale zona"],
      predictedCovers: 95,
      confidence: 85,
      topDishes: ["Risotto ai Porcini", "Branzino in Crosta"],
      revenue: 2103
    }
  ];

  const getWeatherIcon = (weather: string) => {
    switch (weather.toLowerCase()) {
      case "soleggiato": return "☀️";
      case "nuvoloso": return "☁️";
      case "pioggia": return "🌧️";
      default: return "🌤️";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-emerald-600";
    if (confidence >= 80) return "text-amber-600";
    return "text-red-600";
  };

  // Calcola KPI dai dati reali se disponibili
  const calculateKPIs = () => {
    if (forecasts.length > 0) {
      const totalCovers = forecasts.reduce((sum, f) => sum + f.predicted_covers, 0);
      const totalRevenue = forecasts.reduce((sum, f) => sum + (f.predicted_revenue || 0), 0);
      const avgConfidence = forecasts.reduce((sum, f) => sum + f.confidence_percentage, 0) / forecasts.length;
      const eventsCount = localEvents.length;

      return {
        covers: totalCovers,
        revenue: totalRevenue,
        confidence: Math.round(avgConfidence),
        events: eventsCount
      };
    }

    // Dati mock come fallback
    return {
      covers: 252,
      revenue: 5512,
      confidence: 88,
      events: 3
    };
  };

  const kpis = calculateKPIs();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600"></div>
      </div>
    );
  }

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
                <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Previsione Domanda</h1>
                  <p className="text-sm text-slate-500">Predizioni basate su meteo, eventi e AI</p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <Link to="/event-calendar">
                <Button variant="outline" className="flex items-center space-x-2">
                  <CalendarDays className="w-4 h-4" />
                  <span>Calendario Eventi</span>
                </Button>
              </Link>
              <SalesDataImportDialog />
              <LocalEventDialog />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Current Week Overview */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6">Panoramica Settimanale</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-rose-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{kpis.covers}</p>
              <p className="text-sm text-slate-500">Coperti Previsti</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-800">€{kpis.revenue.toLocaleString()}</p>
              <p className="text-sm text-slate-500">Ricavi Stimati</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Cloud className="w-8 h-8 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{kpis.confidence}%</p>
              <p className="text-sm text-slate-500">Precisione Media</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <p className="text-2xl font-bold text-slate-800">{kpis.events}</p>
              <p className="text-sm text-slate-500">Eventi Locali</p>
            </div>
          </div>
        </div>

        {/* Status Message */}
        {forecasts.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">🚀 Inizia a raccogliere i tuoi dati</h3>
            <p className="text-blue-700 mb-4">
              Per generare previsioni accurate, inizia importando i tuoi dati storici di vendita e aggiungendo eventi locali.
              Il sistema AI imparerà dai tuoi pattern per fornirti previsioni sempre più precise.
            </p>
            <div className="flex space-x-3">
              <SalesDataImportDialog />
              <LocalEventDialog />
            </div>
          </div>
        )}

        {/* Showing sample data for demonstration */}
        {/* Daily Forecasts */}
        <div className="space-y-6">
          {mockForecasts.map((forecast, index) => (
            <div key={index} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-stone-50 px-6 py-4 border-b border-stone-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-3xl">{getWeatherIcon(forecast.weather)}</div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">
                        {forecast.day} - {new Date(forecast.date).toLocaleDateString('it-IT')}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {forecast.weather} - {forecast.temperature}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-800">{forecast.predictedCovers}</p>
                    <p className="text-sm text-slate-500">coperti previsti</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Prediction Details */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Dettagli Previsione</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Ricavi stimati:</span>
                          <span className="font-medium text-slate-800">€{forecast.revenue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Affidabilità:</span>
                          <span className={`font-medium ${getConfidenceColor(forecast.confidence)}`}>
                            {forecast.confidence}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Coperti/ora picco:</span>
                          <span className="font-medium text-slate-800">
                            {Math.round(forecast.predictedCovers * 0.4)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Top Dishes */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Piatti Più Richiesti</h4>
                      <div className="space-y-2">
                        {forecast.topDishes.map((dish, dishIndex) => (
                          <div key={dishIndex} className="flex items-center space-x-2">
                            <span className="w-6 h-6 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xs font-medium">
                              {dishIndex + 1}
                            </span>
                            <span className="text-sm text-slate-700">{dish}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Events */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2">Eventi Locali</h4>
                      {forecast.events.length > 0 ? (
                        <div className="space-y-2">
                          {forecast.events.map((event, eventIndex) => (
                            <div key={eventIndex} className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <p className="text-sm text-amber-800">{event}</p>
                              <p className="text-xs text-amber-600">Impatto: +15% coperti</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 italic">Nessun evento particolare</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Insights */}
        <div className="mt-8 bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl border border-rose-200 p-6">
          <h3 className="text-lg font-semibold text-rose-800 mb-4">🤖 Insight AI Settimanali</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/60 rounded-lg p-4">
              <h4 className="font-medium text-rose-800 mb-2">Trend Identificato</h4>
              <p className="text-sm text-rose-700">I giorni di pioggia aumentano del 25% le ordinazioni di risotti. Prepara scorte extra di riso per venerdì.</p>
            </div>
            <div className="bg-white/60 rounded-lg p-4">
              <h4 className="font-medium text-rose-800 mb-2">Ottimizzazione Staff</h4>
              <p className="text-sm text-rose-700">Picco di coperti previsto venerdì sera. Considera di aggiungere 1 cameriere extra dalle 19:30.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DemandForecast;
