
-- Step 1: Aggiunge la nuova colonna per la foreign key, permettendo valori NULL inizialmente.
ALTER TABLE public.external_sales_data
ADD COLUMN receipt_id UUID;

COMMENT ON COLUMN public.external_sales_data.receipt_id IS 'Foreign key to the cassa_in_cloud_receipts table.';

-- Step 2: Popola la nuova colonna receipt_id per le righe esistenti, collegandole tramite l'ID esterno della ricevuta.
UPDATE public.external_sales_data esd
SET receipt_id = ccr.id
FROM public.cassa_in_cloud_receipts ccr
WHERE esd.restaurant_id = ccr.restaurant_id
  AND esd.bill_id_external = ccr.external_id
  AND esd.receipt_id IS NULL; -- Aggiorna solo le righe non ancora popolate

-- Step 3: Aggiunge il vincolo di foreign key per rafforzare l'integrità dei dati.
-- Usiamo ON DELETE SET NULL così, se una ricevuta viene cancellata, il dato di vendita non viene perso.
ALTER TABLE public.external_sales_data
ADD CONSTRAINT fk_external_sales_data_receipt_id
FOREIGN KEY (receipt_id)
REFERENCES public.cassa_in_cloud_receipts(id)
ON DELETE SET NULL;

-- Step 4: Aggiunge un indice sulla nuova colonna per migliorare le performance delle query.
CREATE INDEX IF NOT EXISTS idx_external_sales_data_receipt_id
ON public.external_sales_data(receipt_id);
