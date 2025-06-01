
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, MapPin, Clock, TrendingUp } from 'lucide-react';
import { useEventCalendar, CalendarEvent } from '@/hooks/useEventCalendar';
import EventFormDialog from './EventFormDialog';

const EventCalendar = () => {
  const { events, isLoading, deleteEvent } = useEventCalendar();
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    
    const dateString = date.toISOString().split('T')[0];
    return events.filter(event => event.date === dateString);
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      concert: 'bg-purple-100 text-purple-800',
      fair: 'bg-orange-100 text-orange-800',
      festival: 'bg-pink-100 text-pink-800',
      sports: 'bg-green-100 text-green-800',
      market: 'bg-blue-100 text-blue-800',
      conference: 'bg-gray-100 text-gray-800',
      exhibition: 'bg-indigo-100 text-indigo-800',
      cultural: 'bg-violet-100 text-violet-800',
      holiday: 'bg-red-100 text-red-800',
      promotion: 'bg-emerald-100 text-emerald-800',
      private: 'bg-slate-100 text-slate-800',
      other: 'bg-yellow-100 text-yellow-800'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const getImpactIcon = (impact?: string) => {
    switch (impact) {
      case 'high': return '🔥';
      case 'medium': return '⚡';
      case 'low': return '📍';
      default: return '📅';
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ];

  const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Calendario Eventi</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-lg font-semibold min-w-[150px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
            <EventFormDialog />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-4">
          {dayNames.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1">
          {getDaysInMonth(currentDate).map((day, index) => {
            const dayEvents = getEventsForDate(day);
            const isToday = day && day.toDateString() === new Date().toDateString();
            
            return (
              <div
                key={index}
                className={`min-h-[100px] p-1 border border-gray-200 ${
                  day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
              >
                {day && (
                  <>
                    <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div key={event.id} className="group relative">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs p-1 w-full justify-start truncate cursor-pointer ${getEventTypeColor(event.event_type)}`}
                            title={`${event.name} - ${event.start_time || ''} ${event.location ? `@ ${event.location}` : ''}`}
                          >
                            <span className="mr-1">{getImpactIcon(event.expected_impact)}</span>
                            <span className="truncate">{event.name}</span>
                          </Badge>
                          
                          {/* Tooltip con dettagli evento */}
                          <div className="absolute z-10 invisible group-hover:visible bg-black text-white text-xs rounded p-2 -top-2 left-0 w-64 transform -translate-y-full">
                            <div className="font-semibold">{event.name}</div>
                            {event.description && <div className="text-gray-300 mt-1">{event.description}</div>}
                            <div className="flex items-center mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {event.start_time} - {event.end_time}
                            </div>
                            {event.location && (
                              <div className="flex items-center mt-1">
                                <MapPin className="w-3 h-3 mr-1" />
                                {event.location}
                              </div>
                            )}
                            {event.expected_impact && (
                              <div className="flex items-center mt-1">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Impatto: {event.expected_impact}
                                {event.impact_percentage && ` (+${event.impact_percentage}%)`}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{dayEvents.length - 2} altri
                        </Badge>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        
        {events.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nessun evento in programma</p>
            <p className="text-sm">Inizia aggiungendo il tuo primo evento</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventCalendar;
