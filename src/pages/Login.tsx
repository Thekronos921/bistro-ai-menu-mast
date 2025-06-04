
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChefHat, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate('/');
    }

    // Show success message if coming from registration
    const message = searchParams.get('message');
    if (message === 'registration-success') {
      toast({
        title: "Registrazione completata",
        description: "Account creato con successo! Ora puoi effettuare il login.",
      });
    }
  }, [user, navigate, searchParams, toast]);

  const handleInputChange = (field: string, value: string) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email è obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email non valida';
    }
    
    if (!password) {
      newErrors.password = 'Password è obbligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await signIn(email, password);
      
      if (result.success) {
        navigate('/');
      } else {
        setErrors({ general: result.error || 'Email o password non validi' });
      }
    } catch (error) {
      setErrors({ general: 'Errore durante il login' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna alla homepage
          </Link>
          <div className="flex items-center justify-center mb-4">
            <ChefHat className="h-8 w-8 text-orange-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Bistro AI</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">Accedi al tuo Account</h2>
          <p className="text-gray-600 mt-2">Gestisci il tuo ristorante con l'intelligenza artificiale</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Inserisci le tue credenziali per accedere alla dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errors.general && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {errors.general}
                </div>
              )}

              <div>
                <Label htmlFor="email">Indirizzo Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="mario@ristorante.com"
                  autoComplete="email"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Inserisci la tua password"
                    autoComplete="current-password"
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

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm">
                    Ricordami
                  </Label>
                </div>
                <Link
                  to="/forgot-password"
                  className="text-sm text-orange-600 hover:underline"
                >
                  Password dimenticata?
                </Link>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Accesso in corso...' : 'Accedi'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Non hai un account?{' '}
            <Link to="/register" className="text-orange-600 hover:underline">
              Registrati qui
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
