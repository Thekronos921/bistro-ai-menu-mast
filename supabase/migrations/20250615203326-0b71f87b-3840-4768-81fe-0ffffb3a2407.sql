
-- Step 1: Add the new column to store the local date of the sale.
ALTER TABLE public.external_sales_data
ADD COLUMN sale_date_local DATE;

COMMENT ON COLUMN public.external_sales_data.sale_date_local IS 'The date of the sale in the restaurant''s local timezone (e.g., Europe/Rome), derived from sale_timestamp for accurate local-date filtering.';

-- Step 2: Populate the new column for all existing records.
UPDATE public.external_sales_data
SET sale_date_local = (sale_timestamp AT TIME ZONE 'Europe/Rome')::date
WHERE sale_date_local IS NULL;

-- Step 3: Make the new column mandatory for future records.
-- We can do this now that all existing records are populated.
ALTER TABLE public.external_sales_data
ALTER COLUMN sale_date_local SET NOT NULL;

-- Step 4: Add an index on the new column to speed up filtering by local date.
CREATE INDEX IF NOT EXISTS idx_external_sales_data_restaurant_date
ON public.external_sales_data(restaurant_id, sale_date_local);

