
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UnifiedCategory {
  id: string;
  name: string;
  description?: string;
  display_order: number;
  dishCount?: number;
  isFromDishCategories: boolean; // True se viene da dish_categories, false se legacy
}

export interface CreateUnifiedCategoryData {
  name: string;
  description?: string;
  display_order?: number;
}

export const useUnifiedCategories = (restaurantId?: string) => {
  const [categories, setCategories] = useState<UnifiedCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCategories = async () => {
    if (!restaurantId) return;
    
    setLoading(true);
    setError(null);

    try {
      // Carica categorie da dish_categories (nuovo sistema)
      const { data: dishCategories, error: categoriesError } = await supabase
        .from('dish_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('display_order', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Carica piatti per conteggio
      const { data: dishes, error: dishesError } = await supabase
        .from('dishes')
        .select('category_id, restaurant_category_name')
        .eq('restaurant_id', restaurantId);

      if (dishesError) throw dishesError;

      // Conta piatti per categoria (nuovo sistema)
      const dishCountsByNew: Record<string, number> = {};
      const dishCountsByLegacy: Record<string, number> = {};

      dishes?.forEach((dish) => {
        if (dish.category_id) {
          const category = dishCategories?.find(cat => cat.id === dish.category_id);
          if (category) {
            dishCountsByNew[category.name] = (dishCountsByNew[category.name] || 0) + 1;
          }
        }
        if (dish.restaurant_category_name) {
          dishCountsByLegacy[dish.restaurant_category_name] = (dishCountsByLegacy[dish.restaurant_category_name] || 0) + 1;
        }
      });

      // Prepara categorie unificate dal nuovo sistema
      const unifiedCategories: UnifiedCategory[] = (dishCategories || []).map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        display_order: cat.display_order,
        dishCount: dishCountsByNew[cat.name] || 0,
        isFromDishCategories: true
      }));

      // Aggiungi categorie legacy che non sono nel nuovo sistema
      const existingCategoryNames = new Set(unifiedCategories.map(c => c.name));
      const legacyCategories = [...new Set(dishes?.map(d => d.restaurant_category_name).filter(Boolean) || [])];
      
      legacyCategories.forEach((categoryName, index) => {
        if (!existingCategoryNames.has(categoryName)) {
          unifiedCategories.push({
            id: `legacy-${categoryName}`,
            name: categoryName,
            display_order: 999 + index,
            dishCount: dishCountsByLegacy[categoryName] || 0,
            isFromDishCategories: false
          });
        }
      });

      // Ordina per display_order
      unifiedCategories.sort((a, b) => a.display_order - b.display_order);

      setCategories(unifiedCategories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento delle categorie';
      setError(errorMessage);
      console.error('Errore caricamento categorie unificate:', err);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: CreateUnifiedCategoryData): Promise<UnifiedCategory | null> => {
    if (!restaurantId) return null;

    try {
      // Crea sempre nel nuovo sistema
      const { data, error } = await supabase
        .from('dish_categories')
        .insert({
          restaurant_id: restaurantId,
          ...categoryData,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchCategories(); // Ricarica la lista
      toast({
        title: "Categoria creata",
        description: `La categoria "${categoryData.name}" è stata creata con successo.`,
      });

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        display_order: data.display_order,
        dishCount: 0,
        isFromDishCategories: true
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella creazione della categoria';
      console.error('Errore creazione categoria:', err);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const migrateLegacyCategory = async (categoryName: string): Promise<boolean> => {
    if (!restaurantId) return false;

    try {
      // Crea categoria nel nuovo sistema
      const { data: newCategory, error: createError } = await supabase
        .from('dish_categories')
        .insert({
          restaurant_id: restaurantId,
          name: categoryName,
          display_order: categories.length,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Aggiorna tutti i piatti che usano la categoria legacy
      const { error: updateError } = await supabase
        .from('dishes')
        .update({ 
          category_id: newCategory.id,
          restaurant_category_name: categoryName // Mantieni per compatibilità
        })
        .eq('restaurant_id', restaurantId)
        .eq('restaurant_category_name', categoryName)
        .is('category_id', null);

      if (updateError) throw updateError;

      await fetchCategories();
      toast({
        title: "Categoria migrata",
        description: `La categoria "${categoryName}" è stata migrata al nuovo sistema.`,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella migrazione della categoria';
      console.error('Errore migrazione categoria:', err);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const ensureCategoryExists = async (categoryName: string): Promise<string | null> => {
    if (!restaurantId || !categoryName) return null;

    try {
      // Prima controlla se esiste nel nuovo sistema
      const { data: existing, error: searchError } = await supabase
        .from('dish_categories')
        .select('id')
        .eq('restaurant_id', restaurantId)
        .eq('name', categoryName)
        .single();

      if (searchError && searchError.code !== 'PGRST116') throw searchError;

      if (existing) {
        return existing.id;
      }

      // Se non esiste, creala
      const { data: newCategory, error: createError } = await supabase
        .from('dish_categories')
        .insert({
          restaurant_id: restaurantId,
          name: categoryName,
          display_order: categories.length,
        })
        .select('id')
        .single();

      if (createError) throw createError;

      await fetchCategories(); // Ricarica dopo la creazione
      return newCategory.id;
    } catch (err) {
      console.error('Errore in ensureCategoryExists:', err);
      return null;
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
    createCategory,
    migrateLegacyCategory,
    ensureCategoryExists,
    refresh: fetchCategories
  };
};
