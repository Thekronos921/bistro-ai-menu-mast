
-- Crea la tabella dish_categories
CREATE TABLE IF NOT EXISTS public.dish_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, name)
);

-- Abilita RLS
ALTER TABLE public.dish_categories ENABLE ROW LEVEL SECURITY;

-- Policy per vedere le proprie categorie
CREATE POLICY "Users can view their restaurant categories" ON public.dish_categories
  FOR SELECT USING (restaurant_id = get_current_user_restaurant_id());

-- Policy per inserire categorie
CREATE POLICY "Users can insert their restaurant categories" ON public.dish_categories
  FOR INSERT WITH CHECK (restaurant_id = get_current_user_restaurant_id());

-- Policy per aggiornare categorie
CREATE POLICY "Users can update their restaurant categories" ON public.dish_categories
  FOR UPDATE USING (restaurant_id = get_current_user_restaurant_id());

-- Policy per eliminare categorie
CREATE POLICY "Users can delete their restaurant categories" ON public.dish_categories
  FOR DELETE USING (restaurant_id = get_current_user_restaurant_id());

-- Aggiungi colonna category_id alla tabella dishes (se non esiste già)
ALTER TABLE public.dishes 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.dish_categories(id) ON DELETE SET NULL;

-- Trigger per aggiornare updated_at
CREATE OR REPLACE TRIGGER update_dish_categories_updated_at
    BEFORE UPDATE ON public.dish_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Migra i dati esistenti da restaurant_category_name a dish_categories
INSERT INTO public.dish_categories (restaurant_id, name, display_order)
SELECT DISTINCT 
    restaurant_id, 
    restaurant_category_name,
    ROW_NUMBER() OVER (PARTITION BY restaurant_id ORDER BY restaurant_category_name) - 1
FROM public.dishes 
WHERE restaurant_category_name IS NOT NULL 
  AND restaurant_category_name != ''
ON CONFLICT (restaurant_id, name) DO NOTHING;

-- Aggiorna i piatti esistenti con i category_id
UPDATE public.dishes 
SET category_id = dc.id
FROM public.dish_categories dc
WHERE dishes.restaurant_id = dc.restaurant_id 
  AND dishes.restaurant_category_name = dc.name
  AND dishes.category_id IS NULL;
