
-- Step 1: Rimuove le righe duplicate, conservando la voce più recente
-- per ogni combinazione di ristorante e ID riga documento.
-- Questo passaggio è necessario prima di poter aggiungere il vincolo univoco.
WITH duplicates AS (
    SELECT
        id,
        ROW_NUMBER() OVER(
            PARTITION BY restaurant_id, document_row_id_external
            ORDER BY created_at DESC
        ) as rn
    FROM public.external_sales_data
    WHERE document_row_id_external IS NOT NULL
)
DELETE FROM public.external_sales_data
WHERE id IN (
    SELECT id
    FROM duplicates
    WHERE rn > 1
);

-- Step 2: Aggiunge il vincolo univoco per prevenire duplicati futuri.
-- L'operazione di upsert nella Edge Function si basa su questo vincolo.
ALTER TABLE public.external_sales_data
ADD CONSTRAINT unique_restaurant_document_row
UNIQUE (restaurant_id, document_row_id_external);

