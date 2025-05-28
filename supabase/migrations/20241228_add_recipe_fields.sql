
-- Add new fields to recipes table
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_semilavorato BOOLEAN DEFAULT FALSE;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS notes_chef TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS selling_price NUMERIC;

-- Add field to recipe_ingredients table to mark semilavorati  
ALTER TABLE recipe_ingredients ADD COLUMN IF NOT EXISTS is_semilavorato BOOLEAN DEFAULT FALSE;

-- Create index for better performance on semilavorati queries
CREATE INDEX IF NOT EXISTS idx_recipes_is_semilavorato ON recipes(is_semilavorato);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_is_semilavorato ON recipe_ingredients(is_semilavorato);
