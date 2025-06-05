-- Add labeled_stock field to ingredients table
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS labeled_stock NUMERIC NOT NULL DEFAULT 0;

-- Create index for better performance on labeled_stock queries
CREATE INDEX IF NOT EXISTS idx_ingredients_labeled_stock ON ingredients(labeled_stock);

-- Add comment to explain the purpose of the field
COMMENT ON COLUMN ingredients.labeled_stock IS 'Tracks the quantity of ingredient that has been labeled but not yet consumed or discarded';