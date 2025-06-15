
-- Aggiunge la colonna per l'ID esterno del prodotto, fondamentale per il collegamento
ALTER TABLE public.external_sales_data
ADD COLUMN external_product_id TEXT;

COMMENT ON COLUMN public.external_sales_data.external_product_id IS 'The external ID of the product from the POS system (e.g., Cassa in Cloud). Used to link to dishes table.';

-- Aggiunge un indice per velocizzare le ricerche basate su ristorante e prodotto
CREATE INDEX IF NOT EXISTS idx_external_sales_data_restaurant_product
ON public.external_sales_data (restaurant_id, external_product_id);

-- Aggiunge un indice sulla data di vendita per velocizzare i filtri per periodo
CREATE INDEX IF NOT EXISTS idx_external_sales_data_sale_timestamp
ON public.external_sales_data (sale_timestamp);
