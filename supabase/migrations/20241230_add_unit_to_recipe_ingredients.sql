
-- Add unit column to recipe_ingredients table to store the unit used in the recipe
ALTER TABLE recipe_ingredients 
ADD COLUMN unit text;

-- Update existing records to use the ingredient's base unit
UPDATE recipe_ingredients 
SET unit = ingredients.unit 
FROM ingredients 
WHERE recipe_ingredients.ingredient_id = ingredients.id 
AND recipe_ingredients.unit IS NULL;
