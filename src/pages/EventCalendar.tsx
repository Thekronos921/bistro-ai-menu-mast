
import { ArrowLeft, CalendarDays, Filter, List, Calendar as CalendarIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import EventCalendar from "@/components/demand-forecast/EventCalendar";
import EventFormDialog from "@/components/demand-forecast/EventFormDialog";
import { useEventCalendar } from "@/hooks/useEventCalendar";

const EventCalendarPage = () => {
  const { events, isLoading, deleteEvent } = useEventCalendar();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedImpact, setSelectedImpact] = useState<string>('all');

  const filteredEvents = events.filter(event => {
    const typeMatch = selectedType === 'all' || event.event_type === selectedType;
    const impactMatch = selectedImpact === 'all' || event.expected_impact === selectedImpact;
    return typeMatch && impactMatch;
  });

  const upcomingEvents = filteredEvents
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 10);

  const getEventTypeLabel = (type: string) => {
    const labels = {
      concert: 'Concerto',
      fair: 'Fiera',
      festival: 'Festival',
      sports: 'Evento Sportivo',
      market: 'Mercato',
      conference: 'Conferenza',
      exhibition: 'Mostra',
      cultural: 'Culturale',
      holiday: 'Festività',
      promotion: 'Promozione',
      private: 'Privato',
      other: 'Altro'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getImpactColor = (impact?: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
              <Link to="/demand-forecast" className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <CalendarDays className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-800">Calendario Eventi</h1>
                  <p className="text-sm text-slate-500">Gestisci eventi locali e promozioni</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <EventFormDialog />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Eventi Totali</p>
                  <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Prossimi 30 gg</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {events.filter(e => {
                      const eventDate = new Date(e.date);
                      const thirtyDaysFromNow = new Date();
                      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                      return eventDate >= new Date() && eventDate <= thirtyDaysFromNow;
                    }).length}
                  </p>
                </div>
                <CalendarDays className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Alto Impatto</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {events.filter(e => e.expected_impact === 'high').length}
                  </p>
                </div>
                <div className="text-2xl">🔥</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Ricorrenti</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {events.filter(e => e.is_recurring).length}
                  </p>
                </div>
                <div className="text-2xl">🔄</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filtri</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[200px]">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tipi</SelectItem>
                    <SelectItem value="concert">Concerti</SelectItem>
                    <SelectItem value="fair">Fiere</SelectItem>
                    <SelectItem value="festival">Festival</SelectItem>
                    <SelectItem value="sports">Eventi Sportivi</SelectItem>
                    <SelectItem value="market">Mercati</SelectItem>
                    <SelectItem value="conference">Conferenze</SelectItem>
                    <SelectItem value="exhibition">Mostre</SelectItem>
                    <SelectItem value="cultural">Culturali</SelectItem>
                    <SelectItem value="holiday">Festività</SelectItem>
                    <SelectItem value="promotion">Promozioni</SelectItem>
                    <SelectItem value="private">Eventi Privati</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[150px]">
                <Select value={selectedImpact} onValueChange={setSelectedImpact}>
                  <SelectTrigger>
                    <SelectValue placeholder="Impatto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli impatti</SelectItem>
                    <SelectItem value="high">Alto Impatto</SelectItem>
                    <SelectItem value="medium">Medio Impatto</SelectItem>
                    <SelectItem value="low">Basso Impatto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList>
            <TabsTrigger value="calendar" className="flex items-center space-x-2">
              <CalendarIcon className="w-4 h-4" />
              <span>Vista Calendario</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center space-x-2">
              <List className="w-4 h-4" />
              <span>Vista Lista</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar">
            <EventCalendar />
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-6">
              {/* Upcoming Events List */}
              <Card>
                <CardHeader>
                  <CardTitle>Prossimi Eventi</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingEvents.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingEvents.map(event => (
                        <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-gray-900">{event.name}</h3>
                              <Badge variant="secondary" className={getImpactColor(event.expected_impact)}>
                                {event.expected_impact || 'non specificato'}
                              </Badge>
                              <Badge variant="outline">
                                {getEventTypeLabel(event.event_type)}
                              </Badge>
                            </div>
                            
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>📅 {new Date(event.date).toLocaleDateString('it-IT', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}</div>
                              {(event.start_time || event.end_time) && (
                                <div>🕐 {event.start_time} - {event.end_time}</div>
                              )}
                              {event.location && <div>📍 {event.location}</div>}
                              {event.description && <div className="mt-2">{event.description}</div>}
                              {event.impact_percentage && (
                                <div>📈 Impatto stimato: +{event.impact_percentage}%</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <EventFormDialog 
                              event={event}
                              trigger={
                                <Button variant="outline" size="sm">
                                  Modifica
                                </Button>
                              }
                            />
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => deleteEvent.mutate(event.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Elimina
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Nessun evento prossimo trovato</p>
                      <p className="text-sm">Aggiungi eventi per iniziare a tracciare l'impatto sulla domanda</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default EventCalendarPage;
