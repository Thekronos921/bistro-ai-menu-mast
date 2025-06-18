
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DishCategory {
  id: string;
  restaurant_id: string;
  name: string;
  description?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateDishCategoryData {
  name: string;
  description?: string;
  display_order?: number;
}

export interface UpdateDishCategoryData {
  name?: string;
  description?: string;
  display_order?: number;
}

export const useDishCategories = (restaurantId?: string) => {
  const [categories, setCategories] = useState<DishCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCategories = async () => {
    if (!restaurantId) return;
    
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('dish_categories')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('display_order', { ascending: true });

      if (error) throw error;

      setCategories(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento delle categorie';
      setError(errorMessage);
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async (categoryData: CreateDishCategoryData): Promise<DishCategory | null> => {
    if (!restaurantId) return null;

    try {
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

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella creazione della categoria';
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  };

  const updateCategory = async (id: string, categoryData: UpdateDishCategoryData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('dish_categories')
        .update(categoryData)
        .eq('id', id);

      if (error) throw error;

      await fetchCategories(); // Ricarica la lista
      toast({
        title: "Categoria aggiornata",
        description: "La categoria è stata aggiornata con successo.",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nell\'aggiornamento della categoria';
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    try {
      // Prima controlla se ci sono piatti che usano questa categoria
      const { data: dishesCount, error: countError } = await supabase
        .from('dishes')
        .select('id', { count: 'exact' })
        .eq('category_id', id);

      if (countError) throw countError;

      if (dishesCount && dishesCount.length > 0) {
        toast({
          title: "Impossibile eliminare",
          description: `Non è possibile eliminare la categoria perché è utilizzata da ${dishesCount.length} piatti. Rimuovi prima i piatti dalla categoria.`,
          variant: "destructive",
        });
        return false;
      }

      const { error } = await supabase
        .from('dish_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchCategories(); // Ricarica la lista
      toast({
        title: "Categoria eliminata",
        description: "La categoria è stata eliminata con successo.",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nell\'eliminazione della categoria';
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
    }
  };

  const reorderCategories = async (categoryIds: string[]): Promise<boolean> => {
    try {
      const updates = categoryIds.map((id, index) => 
        supabase
          .from('dish_categories')
          .update({ display_order: index })
          .eq('id', id)
      );

      await Promise.all(updates);
      await fetchCategories(); // Ricarica la lista

      toast({
        title: "Ordine aggiornato",
        description: "L'ordine delle categorie è stato aggiornato.",
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel riordino delle categorie';
      toast({
        title: "Errore",
        description: errorMessage,
        variant: "destructive",
      });
      return false;
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
    updateCategory,
    deleteCategory,
    reorderCategories,
  };
};
