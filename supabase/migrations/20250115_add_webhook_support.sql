-- Migration: Add webhook support for CassaInCloud integration
-- Date: 2025-01-15
-- Description: Adds necessary columns and tables to support webhook processing

-- Add sales point mapping column to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS cic_sales_point_id TEXT;

-- Add comment for documentation
COMMENT ON COLUMN restaurants.cic_sales_point_id IS 'ID del punto vendita CassaInCloud mappato a questo ristorante';

-- Create index for performance on sales point lookups
CREATE INDEX IF NOT EXISTS idx_restaurants_cic_sales_point 
ON restaurants(cic_sales_point_id) 
WHERE cic_sales_point_id IS NOT NULL;

-- Ensure cassa_in_cloud_bills_state table exists with correct structure
-- (This table might already exist based on the types file)
CREATE TABLE IF NOT EXISTS cassa_in_cloud_bills_state (
    bill_id TEXT PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    last_updated_at TIMESTAMP WITH TIME ZONE,
    processed_row_ids JSONB
);

-- Add comments for documentation
COMMENT ON TABLE cassa_in_cloud_bills_state IS 'Traccia lo stato di processamento dei conti CassaInCloud per garantire idempotenza';
COMMENT ON COLUMN cassa_in_cloud_bills_state.bill_id IS 'ID univoco del conto da CassaInCloud';
COMMENT ON COLUMN cassa_in_cloud_bills_state.restaurant_id IS 'ID del ristorante che ha processato il conto';
COMMENT ON COLUMN cassa_in_cloud_bills_state.last_updated_at IS 'Timestamp ultimo aggiornamento';
COMMENT ON COLUMN cassa_in_cloud_bills_state.processed_row_ids IS 'Array JSON degli ID degli item processati dal conto';

-- Create index for performance on restaurant and date queries
CREATE INDEX IF NOT EXISTS idx_bills_state_restaurant_date 
ON cassa_in_cloud_bills_state(restaurant_id, last_updated_at DESC);

-- Create index for bill_id lookups
CREATE INDEX IF NOT EXISTS idx_bills_state_bill_id 
ON cassa_in_cloud_bills_state(bill_id);

-- Ensure sales_data table has proper indexes for webhook queries
CREATE INDEX IF NOT EXISTS idx_sales_data_restaurant_date 
ON sales_data(restaurant_id, date DESC);

-- Ensure dish_sales_data table has proper indexes
CREATE INDEX IF NOT EXISTS idx_dish_sales_data_restaurant_created 
ON dish_sales_data(restaurant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dish_sales_data_sales_data_id 
ON dish_sales_data(sales_data_id);

-- Add webhook configuration columns to restaurants table if needed
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS webhook_enabled BOOLEAN DEFAULT FALSE;

ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS webhook_last_received_at TIMESTAMP WITH TIME ZONE;

-- Add comments
COMMENT ON COLUMN restaurants.webhook_enabled IS 'Indica se il webhook è abilitato per questo ristorante';
COMMENT ON COLUMN restaurants.webhook_last_received_at IS 'Timestamp ultimo webhook ricevuto';

-- Create a view for webhook statistics
CREATE OR REPLACE VIEW webhook_stats AS
SELECT 
    r.id as restaurant_id,
    r.name as restaurant_name,
    r.cic_sales_point_id,
    r.webhook_enabled,
    r.webhook_last_received_at,
    COUNT(bs.bill_id) as total_bills_processed,
    COUNT(bs.bill_id) FILTER (WHERE bs.last_updated_at >= CURRENT_DATE - INTERVAL '30 days') as bills_last_30_days,
    COUNT(bs.bill_id) FILTER (WHERE bs.last_updated_at >= CURRENT_DATE - INTERVAL '7 days') as bills_last_7_days,
    MAX(bs.last_updated_at) as last_bill_processed_at,
    AVG(jsonb_array_length(bs.processed_row_ids)) as avg_items_per_bill
FROM restaurants r
LEFT JOIN cassa_in_cloud_bills_state bs ON r.id::text = bs.restaurant_id::text
WHERE r.cic_sales_point_id IS NOT NULL
GROUP BY r.id, r.name, r.cic_sales_point_id, r.webhook_enabled, r.webhook_last_received_at;

-- Add comment to view
COMMENT ON VIEW webhook_stats IS 'Vista aggregata delle statistiche webhook per ristorante';

-- Create function to update webhook last received timestamp
CREATE OR REPLACE FUNCTION update_webhook_last_received(restaurant_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE restaurants 
    SET webhook_last_received_at = NOW()
    WHERE id = restaurant_uuid;
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION update_webhook_last_received(UUID) IS 'Aggiorna il timestamp ultimo webhook ricevuto per un ristorante';

-- Create function to get unmapped products from recent sales
CREATE OR REPLACE FUNCTION get_unmapped_products_last_days(restaurant_uuid UUID, days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    dish_name TEXT,
    occurrences BIGINT,
    last_seen TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dsd.dish_name,
        COUNT(*) as occurrences,
        MAX(dsd.created_at) as last_seen
    FROM dish_sales_data dsd
    LEFT JOIN dishes d ON d.restaurant_id = dsd.restaurant_id AND d.name = dsd.dish_name
    WHERE dsd.restaurant_id = restaurant_uuid
        AND dsd.created_at >= CURRENT_DATE - INTERVAL '1 day' * days_back
        AND d.id IS NULL  -- Dish not found in dishes table
    GROUP BY dsd.dish_name
    ORDER BY occurrences DESC, last_seen DESC;
END;
$$ LANGUAGE plpgsql;

-- Add comment to function
COMMENT ON FUNCTION get_unmapped_products_last_days(UUID, INTEGER) IS 'Restituisce i prodotti venduti ma non mappati nei piatti del ristorante';

-- Create a trigger to automatically update webhook_last_received_at when a bill is processed
CREATE OR REPLACE FUNCTION trigger_update_webhook_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the restaurant's webhook_last_received_at timestamp
    UPDATE restaurants 
    SET webhook_last_received_at = NEW.last_updated_at
    WHERE id = NEW.restaurant_id::uuid;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS update_webhook_timestamp_trigger ON cassa_in_cloud_bills_state;
CREATE TRIGGER update_webhook_timestamp_trigger
    AFTER INSERT OR UPDATE ON cassa_in_cloud_bills_state
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_webhook_timestamp();

-- Add comment to trigger
COMMENT ON TRIGGER update_webhook_timestamp_trigger ON cassa_in_cloud_bills_state IS 'Aggiorna automaticamente webhook_last_received_at quando viene processato un conto';

-- Create policy for webhook access (if RLS is enabled)
-- Note: Adjust these policies based on your security requirements

-- Policy for cassa_in_cloud_bills_state
DROP POLICY IF EXISTS "webhook_bills_state_policy" ON cassa_in_cloud_bills_state;
CREATE POLICY "webhook_bills_state_policy" ON cassa_in_cloud_bills_state
    FOR ALL USING (true);  -- Adjust based on your auth requirements

-- Enable RLS if not already enabled
ALTER TABLE cassa_in_cloud_bills_state ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions to service role
-- Note: These grants might need adjustment based on your setup
GRANT ALL ON cassa_in_cloud_bills_state TO service_role;
GRANT ALL ON webhook_stats TO service_role;
GRANT EXECUTE ON FUNCTION update_webhook_last_received(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION get_unmapped_products_last_days(UUID, INTEGER) TO service_role;

-- Insert sample configuration for testing (optional)
-- Uncomment and modify as needed for your test environment
/*
INSERT INTO restaurants (name, cic_sales_point_id, webhook_enabled) 
VALUES ('Test Restaurant', 'SP001', true)
ON CONFLICT (name) DO UPDATE SET 
    cic_sales_point_id = EXCLUDED.cic_sales_point_id,
    webhook_enabled = EXCLUDED.webhook_enabled;
*/

-- Create a cleanup function for old bill states (optional)
CREATE OR REPLACE FUNCTION cleanup_old_bill_states(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM cassa_in_cloud_bills_state 
    WHERE last_updated_at < CURRENT_DATE - INTERVAL '1 day' * days_to_keep;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment to cleanup function
COMMENT ON FUNCTION cleanup_old_bill_states(INTEGER) IS 'Rimuove i record di stato dei conti più vecchi del numero di giorni specificato';

-- Final verification queries (commented out for production)
/*
-- Verify the migration
SELECT 
    'restaurants.cic_sales_point_id' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'restaurants' AND column_name = 'cic_sales_point_id'
    ) THEN 'OK' ELSE 'MISSING' END as status;

SELECT 
    'cassa_in_cloud_bills_state table' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'cassa_in_cloud_bills_state'
    ) THEN 'OK' ELSE 'MISSING' END as status;

SELECT 
    'webhook_stats view' as check_name,
    CASE WHEN EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_name = 'webhook_stats'
    ) THEN 'OK' ELSE 'MISSING' END as status;
*/