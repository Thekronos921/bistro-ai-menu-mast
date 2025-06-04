
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, ArrowLeft, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Email è obbligatoria');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Email non valida');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const result = await resetPassword(email);
      
      if (result.success) {
        setSent(true);
      } else {
        setError(result.error || 'Errore durante l\'invio dell\'email');
      }
    } catch (error) {
      setError('Errore durante l\'invio dell\'email');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <ChefHat className="h-8 w-8 text-orange-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Bistro AI</h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-center">Email Inviata</CardTitle>
              <CardDescription className="text-center">
                Abbiamo inviato le istruzioni per reimpostare la password al tuo indirizzo email.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-gray-600">
                <p>Controlla la tua casella di posta e clicca sul link per reimpostare la password.</p>
                <p className="mt-2">Non hai ricevuto l'email? Controlla anche la cartella spam.</p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSent(false);
                    setEmail('');
                  }}
                >
                  Invia di nuovo
                </Button>
                
                <Link to="/login" className="block">
                  <Button variant="ghost" className="w-full">
                    Torna al login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/login" className="inline-flex items-center text-orange-600 hover:text-orange-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Torna al login
          </Link>
          <div className="flex items-center justify-center mb-4">
            <ChefHat className="h-8 w-8 text-orange-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Bistro AI</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-700">Password Dimenticata</h2>
          <p className="text-gray-600 mt-2">Inserisci il tuo indirizzo email per ricevere le istruzioni</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Reimposta Password</CardTitle>
            <CardDescription>
              Ti invieremo un link per reimpostare la tua password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <Label htmlFor="email">Indirizzo Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="mario@ristorante.com"
                  autoComplete="email"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Invio in corso...' : 'Invia Istruzioni per il Reset'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Ti sei ricordato la password?{' '}
            <Link to="/login" className="text-orange-600 hover:underline">
              Torna al login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
