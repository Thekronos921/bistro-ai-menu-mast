
-- Creare la tabella foodcost per salvare i dati di vendita aggregati
CREATE TABLE public.foodcost (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL,
  dish_id UUID REFERENCES public.dishes(id),
  dish_external_id TEXT,
  dish_name TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  period_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'custom'
  total_quantity_sold NUMERIC NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  average_unit_price NUMERIC NOT NULL DEFAULT 0,
  calculation_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Constraints per evitare duplicati
  UNIQUE(restaurant_id, dish_external_id, period_start, period_end, period_type)
);

-- Indici per ottimizzare le query
CREATE INDEX idx_foodcost_restaurant_period ON public.foodcost(restaurant_id, period_start, period_end);
CREATE INDEX idx_foodcost_dish_external_id ON public.foodcost(dish_external_id);
CREATE INDEX idx_foodcost_period_type ON public.foodcost(period_type);

-- RLS per la sicurezza
ALTER TABLE public.foodcost ENABLE ROW LEVEL SECURITY;

-- Policy per permettere l'accesso solo ai dati del proprio ristorante
CREATE POLICY "Users can view their restaurant foodcost data" 
  ON public.foodcost 
  FOR SELECT 
  USING (restaurant_id = get_current_user_restaurant_id());

CREATE POLICY "Users can insert their restaurant foodcost data" 
  ON public.foodcost 
  FOR INSERT 
  WITH CHECK (restaurant_id = get_current_user_restaurant_id());

CREATE POLICY "Users can update their restaurant foodcost data" 
  ON public.foodcost 
  FOR UPDATE 
  USING (restaurant_id = get_current_user_restaurant_id());

CREATE POLICY "Users can delete their restaurant foodcost data" 
  ON public.foodcost 
  FOR DELETE 
  USING (restaurant_id = get_current_user_restaurant_id());

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_foodcost_updated_at
  BEFORE UPDATE ON public.foodcost
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
