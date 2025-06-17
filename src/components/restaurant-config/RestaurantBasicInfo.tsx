
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRestaurant } from "@/hooks/useRestaurant";
import { supabase } from "@/integrations/supabase/client";
import { Building, Users, MapPin } from "lucide-react";

interface RestaurantData {
  name: string;
  type: string;
  city: string;
  country: string;
  seats_count: number | null;
  vat_number: string | null;
}

export const RestaurantBasicInfo = () => {
  const [loading, setLoading] = useState(false);
  const [restaurantData, setRestaurantData] = useState<RestaurantData>({
    name: "",
    type: "ristorante",
    city: "",
    country: "",
    seats_count: null,
    vat_number: ""
  });
  const { toast } = useToast();
  const { restaurantId } = useRestaurant();

  useEffect(() => {
    if (restaurantId) {
      fetchRestaurantData();
    }
  }, [restaurantId]);

  const fetchRestaurantData = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();

      if (error) throw error;

      if (data) {
        setRestaurantData({
          name: data.name || "",
          type: data.type || "ristorante",
          city: data.city || "",
          country: data.country || "",
          seats_count: data.seats_count,
          vat_number: data.vat_number
        });
      }
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      toast({
        title: "Errore",
        description: "Impossibile caricare i dati del ristorante",
        variant: "destructive"
      });
    }
  };

  const handleSave = async () => {
    if (!restaurantId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({
          name: restaurantData.name,
          type: restaurantData.type,
          city: restaurantData.city,
          country: restaurantData.country,
          seats_count: restaurantData.seats_count,
          vat_number: restaurantData.vat_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', restaurantId);

      if (error) throw error;

      toast({
        title: "Successo",
        description: "Dati del ristorante aggiornati correttamente"
      });
    } catch (error) {
      console.error('Error updating restaurant:', error);
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento dei dati",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Informazioni Base</span>
          </CardTitle>
          <CardDescription>
            Configura le informazioni principali del tuo ristorante
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Ristorante *</Label>
              <Input
                id="name"
                value={restaurantData.name}
                onChange={(e) => setRestaurantData({...restaurantData, name: e.target.value})}
                placeholder="Nome del ristorante"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo di Locale</Label>
              <Select value={restaurantData.type} onValueChange={(value) => setRestaurantData({...restaurantData, type: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ristorante">Ristorante</SelectItem>
                  <SelectItem value="pizzeria">Pizzeria</SelectItem>
                  <SelectItem value="trattoria">Trattoria</SelectItem>
                  <SelectItem value="osteria">Osteria</SelectItem>
                  <SelectItem value="bar">Bar</SelectItem>
                  <SelectItem value="pub">Pub</SelectItem>
                  <SelectItem value="altro">Altro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">Città *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="city"
                  value={restaurantData.city}
                  onChange={(e) => setRestaurantData({...restaurantData, city: e.target.value})}
                  placeholder="Città"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Paese *</Label>
              <Input
                id="country"
                value={restaurantData.country}
                onChange={(e) => setRestaurantData({...restaurantData, country: e.target.value})}
                placeholder="Paese"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seats">Numero Posti a Sedere</Label>
              <div className="relative">
                <Users className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="seats"
                  type="number"
                  min="1"
                  value={restaurantData.seats_count || ""}
                  onChange={(e) => setRestaurantData({
                    ...restaurantData, 
                    seats_count: e.target.value ? parseInt(e.target.value) : null
                  })}
                  placeholder="Es. 50"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vat">Partita IVA</Label>
              <Input
                id="vat"
                value={restaurantData.vat_number || ""}
                onChange={(e) => setRestaurantData({...restaurantData, vat_number: e.target.value})}
                placeholder="IT12345678901"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? "Salvataggio..." : "Salva Modifiche"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
