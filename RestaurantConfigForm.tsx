
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const restaurantTypes = [
  { value: 'ristorante', label: 'Ristorante' },
  { value: 'bar', label: 'Bar' },
  { value: 'pizzeria', label: 'Pizzeria' },
  { value: 'pub', label: 'Pub' },
  { value: 'trattoria', label: 'Trattoria' },
  { value: 'osteria', label: 'Osteria' },
  { value: 'pasticceria', label: 'Pasticceria' },
  { value: 'gelateria', label: 'Gelateria' },
  { value: 'altro', label: 'Altro' }
];

const countries = [
  { value: 'IT', label: 'Italia' },
  { value: 'FR', label: 'Francia' },
  { value: 'ES', label: 'Spagna' },
  { value: 'DE', label: 'Germania' },
  { value: 'UK', label: 'Regno Unito' },
  { value: 'US', label: 'Stati Uniti' },
  { value: 'OTHER', label: 'Altro' }
];

interface RestaurantData {
  restaurantName: string;
  restaurantType: string;
  country: string;
  city: string;
  vatNumber: string;
  seatsCount: string;
}

interface RestaurantConfigFormProps {
  onSubmit: (data: RestaurantData) => Promise<void>;
  initialData?: Partial<RestaurantData>;
  isLoading?: boolean;
  title?: string;
  description?: string;
  submitText?: string;
}

const RestaurantConfigForm: React.FC<RestaurantConfigFormProps> = ({
  onSubmit,
  initialData = {},
  isLoading = false,
  title = "Configura il tuo Ristorante",
  description = "Inserisci i dettagli del tuo ristorante per iniziare",
  submitText = "Salva Configurazione"
}) => {
  const [formData, setFormData] = useState<RestaurantData>({
    restaurantName: initialData.restaurantName || '',
    restaurantType: initialData.restaurantType || '',
    country: initialData.country || '',
    city: initialData.city || '',
    vatNumber: initialData.vatNumber || '',
    seatsCount: initialData.seatsCount || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof RestaurantData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.restaurantName.trim()) {
      newErrors.restaurantName = 'Nome ristorante è obbligatorio';
    }
    if (!formData.restaurantType) {
      newErrors.restaurantType = 'Tipo di attività è obbligatorio';
    }
    if (!formData.country) {
      newErrors.country = 'Paese è obbligatorio';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'Città è obbligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    await onSubmit(formData);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="restaurantName">Nome Ristorante/Azienda *</Label>
            <Input
              id="restaurantName"
              value={formData.restaurantName}
              onChange={(e) => handleInputChange('restaurantName', e.target.value)}
              placeholder="Es. Ristorante Da Mario"
            />
            {errors.restaurantName && (
              <p className="text-sm text-red-600 mt-1">{errors.restaurantName}</p>
            )}
          </div>

          <div>
            <Label htmlFor="restaurantType">Tipo di Attività *</Label>
            <Select value={formData.restaurantType} onValueChange={(value) => handleInputChange('restaurantType', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona il tipo di attività" />
              </SelectTrigger>
              <SelectContent>
                {restaurantTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.restaurantType && (
              <p className="text-sm text-red-600 mt-1">{errors.restaurantType}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Paese *</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona il paese" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.value} value={country.value}>
                      {country.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-sm text-red-600 mt-1">{errors.country}</p>
              )}
            </div>

            <div>
              <Label htmlFor="city">Città *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Es. Roma"
              />
              {errors.city && (
                <p className="text-sm text-red-600 mt-1">{errors.city}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vatNumber">Partita IVA / Codice Fiscale</Label>
              <Input
                id="vatNumber"
                value={formData.vatNumber}
                onChange={(e) => handleInputChange('vatNumber', e.target.value)}
                placeholder="Es. 12345678901"
              />
            </div>

            <div>
              <Label htmlFor="seatsCount">Numero di Coperti</Label>
              <Input
                id="seatsCount"
                type="number"
                value={formData.seatsCount}
                onChange={(e) => handleInputChange('seatsCount', e.target.value)}
                placeholder="Es. 50"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Salvataggio...' : submitText}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default RestaurantConfigForm;
