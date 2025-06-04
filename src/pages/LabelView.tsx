
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package, Calendar, AlertTriangle, MapPin, User, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';

const LabelView = () => {
  const { id } = useParams();
  const [label, setLabel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (id) {
      fetchLabel(id);
    }
  }, [id]);

  const fetchLabel = async (labelId: string) => {
    try {
      const { data, error } = await supabase
        .from('labels')
        .select('*')
        .eq('id', labelId)
        .single();

      if (error) throw error;

      if (data) {
        setLabel(data);
      } else {
        setError('Etichetta non trovata');
      }
    } catch (error: any) {
      console.error('Error fetching label:', error);
      setError('Errore nel caricamento dell\'etichetta');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Attivo' },
      consumed: { color: 'bg-blue-100 text-blue-800', label: 'Consumato' },
      expired: { color: 'bg-red-100 text-red-800', label: 'Scaduto' },
      discarded: { color: 'bg-gray-100 text-gray-800', label: 'Scartato' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;

    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;

    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) {
      return { color: 'bg-red-100 text-red-800', label: 'Scaduto', icon: AlertTriangle };
    } else if (daysUntilExpiry <= 1) {
      return { color: 'bg-orange-100 text-orange-800', label: 'Scade oggi/domani', icon: AlertTriangle };
    } else if (daysUntilExpiry <= 3) {
      return { color: 'bg-yellow-100 text-yellow-800', label: `Scade tra ${daysUntilExpiry} giorni`, icon: Clock };
    }

    return { color: 'bg-green-100 text-green-800', label: 'Fresco', icon: null };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Caricamento etichetta...</p>
        </div>
      </div>
    );
  }

  if (error || !label) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Etichetta non trovata</h2>
            <p className="text-gray-600 mb-4">{error || 'L\'etichetta richiesta non esiste o non è più disponibile.'}</p>
            <Link to="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna alla Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expiryStatus = getExpiryStatus(label.expiry_date);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-stone-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna alla Home
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{label.title}</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="capitalize">
                    {label.label_type}
                  </Badge>
                  {getStatusBadge(label.status)}
                  {expiryStatus && (
                    <Badge className={expiryStatus.color}>
                      {expiryStatus.icon && <expiryStatus.icon className="w-3 h-3 mr-1" />}
                      {expiryStatus.label}
                    </Badge>
                  )}
                </div>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Informazioni principali */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Informazioni Prodotto</h3>
                
                {label.batch_number && (
                  <div className="flex items-center space-x-2">
                    <Package className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Lotto:</span>
                    <span className="font-mono">{label.batch_number}</span>
                  </div>
                )}

                {label.quantity && label.unit && (
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Quantità:</span>
                    <span>{label.quantity} {label.unit}</span>
                  </div>
                )}

                {label.supplier && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Fornitore:</span>
                    <span>{label.supplier}</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Date Importanti</h3>
                
                {label.production_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Produzione:</span>
                    <span>{format(new Date(label.production_date), 'dd MMMM yyyy', { locale: it })}</span>
                  </div>
                )}

                {label.expiry_date && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Scadenza:</span>
                    <span className="font-bold">{format(new Date(label.expiry_date), 'dd MMMM yyyy', { locale: it })}</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Creazione etichetta:</span>
                  <span>{format(new Date(label.created_at), 'dd MMMM yyyy HH:mm', { locale: it })}</span>
                </div>
              </div>
            </div>

            {/* Allergeni */}
            {label.allergens && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Allergeni
                </h4>
                <p className="text-yellow-700">{label.allergens}</p>
              </div>
            )}

            {/* Istruzioni di conservazione */}
            {label.storage_instructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  Istruzioni di Conservazione
                </h4>
                <p className="text-blue-700">{label.storage_instructions}</p>
              </div>
            )}

            {/* Note aggiuntive */}
            {label.notes && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Note Aggiuntive</h4>
                <p className="text-gray-700">{label.notes}</p>
              </div>
            )}

            {/* Tracciabilità ingredienti */}
            {label.ingredient_traceability && label.ingredient_traceability.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-3">Tracciabilità Ingredienti</h4>
                <div className="space-y-2">
                  {label.ingredient_traceability.map((ingredient: any, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div>
                        <span className="font-medium">{ingredient.name}</span>
                        {ingredient.supplier && (
                          <span className="text-sm text-gray-600 ml-2">({ingredient.supplier})</span>
                        )}
                      </div>
                      {ingredient.quantity && ingredient.unit && (
                        <span className="text-sm text-gray-600">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LabelView;
