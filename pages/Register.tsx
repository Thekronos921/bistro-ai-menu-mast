
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChefHat, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
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

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Form data state
  const [formData, setFormData] = useState({
    restaurantName: '',
    restaurantType: '',
    country: '',
    city: '',
    vatNumber: '',
    seatsCount: '',
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep1 = () => {
    const stepErrors: Record<string, string> = {};
    
    if (!formData.restaurantName.trim()) {
      stepErrors.restaurantName = 'Nome ristorante è obbligatorio';
    }
    if (!formData.restaurantType) {
      stepErrors.restaurantType = 'Tipo di attività è obbligatorio';
    }
    if (!formData.country) {
      stepErrors.country = 'Paese è obbligatorio';
    }
    if (!formData.city.trim()) {
      stepErrors.city = 'Città è obbligatoria';
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const validateStep2 = () => {
    const stepErrors: Record<string, string> = {};
    
    if (!formData.fullName.trim()) {
      stepErrors.fullName = 'Nome completo è obbligatorio';
    }
    if (!formData.email.trim()) {
      stepErrors.email = 'Email è obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      stepErrors.email = 'Email non valida';
    }
    if (!formData.password) {
      stepErrors.password = 'Password è obbligatoria';
    } else if (formData.password.length < 8) {
      stepErrors.password = 'Password deve essere di almeno 8 caratteri';
    }
    if (formData.password !== formData.confirmPassword) {
      stepErrors.confirmPassword = 'Le password non coincidono';
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const validateStep3 = () => {
    const stepErrors: Record<string, string> = {};
    
    if (!termsAccepted) {
      stepErrors.terms = 'Devi accettare i Termini e Condizioni';
    }
    if (!privacyAccepted) {
      stepErrors.privacy = 'Devi accettare l\'Informativa sulla Privacy';
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep3()) return;

    setLoading(true);
    try {
      const result = await register({
        restaurantName: formData.restaurantName,
        restaurantType: formData.restaurantType,
        country: formData.country,
        city: formData.city,
        vatNumber: formData.vatNumber || undefined,
        seatsCount: formData.seatsCount ? parseInt(formData.seatsCount) : undefined,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password
      });

      if (result.success) {
        navigate('/login?message=registration-success');
      } else {
        toast({
          title: "Errore",
          description: result.error || "Errore durante la registrazione",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore durante la registrazione",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla homepage
          </Link>
          <div className="flex items-center justify-center mb-4">
            <ChefHat className="h-8 w-8 text-orange-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Bistro AI</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">Registra il tuo Ristorante</h2>
          <p className="text-gray-600 mt-2">Inizia a gestire il tuo ristorante con l'AI</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              {step < 3 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    step < currentStep ? 'bg-orange-600' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {currentStep === 1 && 'Informazioni sul Ristorante'}
              {currentStep === 2 && 'Informazioni sull\'Amministratore'}
              {currentStep === 3 && 'Termini e Condizioni'}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Inserisci i dettagli del tuo ristorante o attività'}
              {currentStep === 2 && 'Crea il tuo account amministratore'}
              {currentStep === 3 && 'Accetta i termini per completare la registrazione'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Restaurant Information */}
            {currentStep === 1 && (
              <>
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
              </>
            )}

            {/* Step 2: User Information */}
            {currentStep === 2 && (
              <>
                <div>
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="Es. Mario Rossi"
                  />
                  {errors.fullName && (
                    <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">Indirizzo Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="mario@ristorante.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      placeholder="Minimo 8 caratteri"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Conferma Password *</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Ripeti la password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </>
            )}

            {/* Step 3: Terms and Conditions */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="terms"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Accetto i{' '}
                      <a href="#" className="text-orange-600 hover:underline">
                        Termini e Condizioni
                      </a>{' '}
                      *
                    </label>
                  </div>
                </div>
                {errors.terms && (
                  <p className="text-sm text-red-600">{errors.terms}</p>
                )}

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="privacy"
                    checked={privacyAccepted}
                    onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor="privacy"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Ho letto l'{' '}
                      <a href="#" className="text-orange-600 hover:underline">
                        Informativa sulla Privacy
                      </a>{' '}
                      *
                    </label>
                  </div>
                </div>
                {errors.privacy && (
                  <p className="text-sm text-red-600">{errors.privacy}</p>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate('/')}
              >
                {currentStep === 1 ? 'Annulla' : 'Indietro'}
              </Button>

              {currentStep < 3 ? (
                <Button onClick={handleNext}>
                  Avanti
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Creazione account...' : 'Crea Account Ristorante'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Hai già un account?{' '}
            <Link to="/login" className="text-orange-600 hover:underline">
              Accedi qui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
