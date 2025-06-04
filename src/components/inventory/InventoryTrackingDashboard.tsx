
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useLabels } from '@/hooks/useLabels';
import { Search, Filter, Calendar, Package, AlertTriangle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';

const InventoryTrackingDashboard = () => {
  const [labels, setLabels] = useState<any[]>([]);
  const [filteredLabels, setFilteredLabels] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { fetchLabels, updateLabelStatus, loading } = useLabels();

  useEffect(() => {
    loadLabels();
  }, []);

  useEffect(() => {
    filterLabels();
  }, [labels, searchTerm, typeFilter, statusFilter]);

  const loadLabels = async () => {
    const data = await fetchLabels();
    setLabels(data);
  };

  const filterLabels = () => {
    let filtered = [...labels];

    if (searchTerm) {
      filtered = filtered.filter(label =>
        label.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        label.batch_number?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(label => label.label_type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(label => label.status === statusFilter);
    }

    setFilteredLabels(filtered);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Attivo' },
      consumed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Consumato' },
      expired: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Scaduto' },
      discarded: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Scartato' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getExpiryWarning = (expiryDate: string | null) => {
    if (!expiryDate) return null;

    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = differenceInDays(expiry, today);

    if (daysUntilExpiry < 0) {
      return <Badge className="bg-red-100 text-red-800">Scaduto</Badge>;
    } else if (daysUntilExpiry <= 1) {
      return <Badge className="bg-orange-100 text-orange-800">Scade oggi/domani</Badge>;
    } else if (daysUntilExpiry <= 3) {
      return <Badge className="bg-yellow-100 text-yellow-800">Scade tra {daysUntilExpiry} giorni</Badge>;
    }

    return null;
  };

  const handleStatusChange = async (labelId: string, newStatus: string) => {
    await updateLabelStatus(labelId, newStatus);
    loadLabels();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'semilavorato':
        return <Package className="w-4 h-4" />;
      case 'lavorato':
        return <Package className="w-4 h-4" />;
      case 'defrosted':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const stats = {
    total: labels.length,
    active: labels.filter(l => l.status === 'active').length,
    expiringSoon: labels.filter(l => {
      if (!l.expiry_date) return false;
      const daysUntilExpiry = differenceInDays(new Date(l.expiry_date), new Date());
      return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
    }).length,
    expired: labels.filter(l => {
      if (!l.expiry_date) return false;
      return differenceInDays(new Date(l.expiry_date), new Date()) < 0;
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Statistiche */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Totale Etichette</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Attive</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">In Scadenza</p>
                <p className="text-2xl font-bold">{stats.expiringSoon}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Scadute</p>
                <p className="text-2xl font-bold">{stats.expired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtri */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filtri</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cerca per nome o lotto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtra per tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti i tipi</SelectItem>
                <SelectItem value="semilavorato">Semilavorati</SelectItem>
                <SelectItem value="lavorato">Lavorati</SelectItem>
                <SelectItem value="defrosted">Decongelati</SelectItem>
                <SelectItem value="recipe">Ricette</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtra per stato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tutti gli stati</SelectItem>
                <SelectItem value="active">Attivo</SelectItem>
                <SelectItem value="consumed">Consumato</SelectItem>
                <SelectItem value="expired">Scaduto</SelectItem>
                <SelectItem value="discarded">Scartato</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista etichette */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLabels.map((label) => (
          <Card key={label.id} className="relative">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {getTypeIcon(label.label_type)}
                    <h3 className="font-semibold truncate">{label.title}</h3>
                  </div>
                  {getStatusBadge(label.status)}
                </div>

                {label.batch_number && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Lotto:</span> {label.batch_number}
                  </p>
                )}

                {label.quantity && label.unit && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Quantità:</span> {label.quantity} {label.unit}
                  </p>
                )}

                {label.expiry_date && (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">Scadenza:</span> {format(new Date(label.expiry_date), 'dd/MM/yyyy', { locale: it })}
                    </p>
                    {getExpiryWarning(label.expiry_date)}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Creato: {format(new Date(label.created_at), 'dd/MM/yyyy', { locale: it })}</span>
                </div>

                {label.status === 'active' && (
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(label.id, 'consumed')}
                      className="flex-1"
                    >
                      Consuma
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(label.id, 'discarded')}
                      className="flex-1"
                    >
                      Scarta
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLabels.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Nessuna etichetta trovata</h3>
            <p className="text-gray-500">
              {labels.length === 0 
                ? "Non hai ancora creato nessuna etichetta tracciata."
                : "Prova a modificare i filtri di ricerca."
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InventoryTrackingDashboard;
