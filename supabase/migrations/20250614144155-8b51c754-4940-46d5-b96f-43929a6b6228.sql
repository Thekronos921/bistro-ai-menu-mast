
-- Aggiungere il campo table_id alla tabella reservations per assegnare un tavolo
ALTER TABLE public.reservations 
ADD COLUMN table_id UUID REFERENCES public.restaurant_tables(id);

-- Aggiungere un indice per migliorare le performance delle query
CREATE INDEX idx_reservations_table_id ON public.reservations(table_id);

-- Aggiungere un indice composto per ottimizzare le query di disponibilità tavoli
CREATE INDEX idx_reservations_table_time ON public.reservations(table_id, reservation_time) 
WHERE status IN ('approvata', 'approvata_manualmente', 'approvata_automaticamente');
