
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MenuCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  dishCount?: number;
}

export const useMenuCategories = (restaurantId?: string) => {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCategories = async () => {
    if (!restaurantId) return;
    
    setLoading(true);
    setError(null);

    try {
      // Carica le categorie dalla tabella dish_categories
      const { data: dishCategories, error: categoriesError } = await supabase
        .from('dish_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Carica il conteggio piatti per categoria usando restaurant_category_name
      const { data: dishes, error: dishesError } = await supabase
        .from('dishes')
        .select('restaurant_category_name')
        .eq('restaurant_id', restaurantId);

      if (dishesError) throw dishesError;

      // Conta i piatti per categoria
      const dishCounts: Record<string, number> = {};
      dishes?.forEach((dish) => {
        if (dish.restaurant_category_name) {
          dishCounts[dish.restaurant_category_name] = (dishCounts[dish.restaurant_category_name] || 0) + 1;
        }
      });

      // Combina le categorie con i conteggi
      const categoriesWithCounts: MenuCategory[] = (dishCategories || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        display_order: cat.display_order,
        dishCount: dishCounts[cat.name] || 0
      }));

      // Aggiungi le categorie esistenti nei piatti ma non ancora nella tabella dish_categories
      const existingCategoryNames = new Set(categoriesWithCounts.map(c => c.name));
      const uniqueDishCategories = [...new Set(dishes?.map(d => d.restaurant_category_name).filter(Boolean) || [])];
      
      uniqueDishCategories.forEach((categoryName, index) => {
        if (!existingCategoryNames.has(categoryName)) {
          categoriesWithCounts.push({
            id: `temp-${categoryName}`,
            name: categoryName,
            display_order: 999 + index,
            dishCount: dishCounts[categoryName] || 0
          });
        }
      });

      // Ordina per display_order
      categoriesWithCounts.sort((a, b) => a.display_order - b.display_order);

      setCategories(categoriesWithCounts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento delle categorie';
      setError(errorMessage);
      console.error('Errore caricamento categorie:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [restaurantId]);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    refresh: fetchCategories
  };
};
