
-- Creazione del tipo ENUM per gli stati delle prenotazioni
CREATE TYPE reservation_status AS ENUM (
    'nuova',
    'approvata',
    'in_attesa',
    'rifiutata',
    'completata',
    'annullata_cliente',
    'annullata_ristorante'
);

-- Creazione della tabella delle prenotazioni
CREATE TABLE public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id),
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    number_of_guests INT NOT NULL,
    reservation_time TIMESTAMPTZ NOT NULL,
    booking_type TEXT, -- Es. "Terrazza", "Sala Interna"
    dish_id UUID REFERENCES public.dishes(id), -- Per pacchetti/menu speciali
    customer_notes TEXT,
    internal_notes TEXT, -- Note per lo staff
    status reservation_status NOT NULL DEFAULT 'nuova',
    calculated_score INT DEFAULT 0,
    social_score INT DEFAULT 0,
    final_score INT GENERATED ALWAYS AS (calculated_score + social_score) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger per aggiornare updated_at
CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON public.reservations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Abilita RLS
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Policy per permettere agli utenti di accedere solo alle prenotazioni del proprio ristorante
CREATE POLICY "Allow access to own restaurant's reservations"
ON public.reservations
FOR ALL
USING (restaurant_id = (SELECT restaurant_id FROM public.users WHERE id = auth.uid()));
