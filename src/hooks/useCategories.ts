import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface UseCategoriesResult {
  categories: string[];
  loading: boolean;
  error: Error | null;
}

export const useCategories = (): UseCategoriesResult => {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      setError(null);
      let fetchedCategories: string[] = [];

      try {
        // Try fetching from restaurant_categories first
        const { data: restaurantCategoriesData, error: restaurantCategoriesError } = await supabase
          .from('restaurant_categories')
          .select('name');

        if (restaurantCategoriesData && restaurantCategoriesData.length > 0) {
          fetchedCategories = restaurantCategoriesData.map(c => c.name);
        } else {
          // Fallback: extract unique categories from dishes if restaurant_categories is empty or not found
          console.warn('Restaurant categories not found or empty, falling back to distinct categories from dishes.');
          if (restaurantCategoriesError) console.error('Error fetching restaurant_categories:', restaurantCategoriesError);
          
          const { data: dishCategoriesData, error: dishCategoriesError } = await supabase
            .from('dishes')
            .select('category');

          if (dishCategoriesData) {
            const uniqueCategories = [...new Set(dishCategoriesData.map(d => d.category).filter(Boolean) as string[])];
            fetchedCategories = uniqueCategories;
          } else {
            if (dishCategoriesError) console.error('Error fetching dish categories:', dishCategoriesError);
            // If all else fails, use hardcoded categories as an extreme fallback
            fetchedCategories = ["Antipasti", "Primi Piatti", "Secondi Piatti", "Dolci", "Contorni"]; 
          }
        }
        setCategories(["all", ...fetchedCategories.sort()]);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError(err as Error);
        // Fallback to hardcoded categories on error
        setCategories(["all", "Antipasti", "Primi Piatti", "Secondi Piatti", "Dolci", "Contorni"]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, loading, error };
};