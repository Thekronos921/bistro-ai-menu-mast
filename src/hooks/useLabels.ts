
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/use-toast';
import { useInventoryTracking } from '@/hooks/useInventoryTracking';

export interface LabelData {
  id?: string;
  label_type: 'semilavorato' | 'lavorato' | 'recipe' | 'defrosted' | 'ingredient';
  title: string;
  batch_number?: string;
  production_date?: string;
  expiry_date?: string;
  quantity?: number;
  unit?: string;
  storage_instructions?: string;
  allergens?: string;
  supplier?: string;
  notes?: string;
  status?: 'active' | 'consumed' | 'expired' | 'discarded';
  recipe_id?: string;
  ingredient_id?: string;
  dish_id?: string;
  storage_location_id?: string;
  ingredient_traceability?: any[];
  portions?: number; // For recipe labels
}

export const useLabels = () => {
  const [loading, setLoading] = useState(false);
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();
  const { allocateIngredient, allocateRecipeIngredients } = useInventoryTracking();

  const saveLabel = async (labelData: LabelData) => {
    if (!restaurantId) {
      throw new Error('Restaurant ID not found');
    }

    setLoading(true);
    try {
      const labelId = labelData.id || crypto.randomUUID();
      
      const qrData = {
        id: labelId,
        type: labelData.label_type,
        title: labelData.title,
        batch_number: labelData.batch_number,
        production_date: labelData.production_date,
        expiry_date: labelData.expiry_date,
        restaurant_id: restaurantId,
        timestamp: new Date().toISOString()
      };

      // Save label first
      const { data: savedLabel, error } = await supabase
        .from('labels')
        .insert({
          id: labelId,
          restaurant_id: restaurantId,
          label_type: labelData.label_type,
          title: labelData.title,
          batch_number: labelData.batch_number,
          production_date: labelData.production_date,
          expiry_date: labelData.expiry_date,
          quantity: labelData.quantity,
          unit: labelData.unit,
          storage_instructions: labelData.storage_instructions,
          allergens: labelData.allergens,
          supplier: labelData.supplier,
          notes: labelData.notes,
          status: labelData.status || 'active',
          recipe_id: labelData.recipe_id,
          ingredient_id: labelData.ingredient_id,
          dish_id: labelData.dish_id,
          storage_location_id: labelData.storage_location_id,
          ingredient_traceability: labelData.ingredient_traceability || [],
          qr_data: qrData
        })
        .select()
        .single();

      if (error) throw error;

      // Handle ingredient allocation based on label type
      if ((labelData.label_type === 'defrosted' || labelData.label_type === 'ingredient') && labelData.ingredient_id && labelData.quantity) {
        // Direct ingredient allocation for defrosted items or ingredient labels
        await allocateIngredient(
          labelData.ingredient_id,
          labelId,
          labelData.quantity,
          `Allocazione per etichetta ${labelData.label_type}: ${labelData.title}`,
          labelData.label_type // Passa il tipo di etichetta per gestire labeled_stock
        );
      } else if ((labelData.label_type === 'recipe' || labelData.label_type === 'semilavorato') && labelData.recipe_id && labelData.portions) {
        // Allocate all recipe ingredients
        await allocateRecipeIngredients(
          labelData.recipe_id,
          labelId,
          labelData.portions,
          `Allocazione ingredienti per ricetta: ${labelData.title}`
        );
      }

      toast({
        title: "Etichetta salvata",
        description: "L'etichetta è stata salvata e l'inventario è stato aggiornato"
      });

      return savedLabel;
    } catch (error: any) {
      console.error('Error saving label:', error);
      toast({
        title: "Errore",
        description: "Errore nel salvataggio dell'etichetta",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const fetchLabels = async (filters?: {
    label_type?: string;
    status?: string;
    expiring_soon?: boolean;
    storage_location_id?: string;
  }) => {
    if (!restaurantId) return [];

    setLoading(true);
    try {
      console.log('Fetching labels with filters:', filters);
      
      // First, get basic label data
      let query = supabase
        .from('labels')
        .select(`
          *,
          storage_locations(name, type)
        `)
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (filters?.label_type) {
        query = query.eq('label_type', filters.label_type);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.storage_location_id) {
        query = query.eq('storage_location_id', filters.storage_location_id);
      }

      if (filters?.expiring_soon) {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        query = query.lte('expiry_date', threeDaysFromNow.toISOString().split('T')[0]);
      }

      const { data: labelsData, error: labelsError } = await query;

      if (labelsError) {
        console.error('Error fetching labels:', labelsError);
        throw labelsError;
      }

      console.log('Raw labels data:', labelsData);

      // Now enrich the data with ingredients and recipes information
      const enrichedLabels = await Promise.all((labelsData || []).map(async (label) => {
        let enrichedLabel = { ...label };

        // Get ingredient info if this label is linked to an ingredient
        if (label.ingredient_id) {
          const { data: ingredient } = await supabase
            .from('ingredients')
            .select('name, unit')
            .eq('id', label.ingredient_id)
            .single();
          
          if (ingredient) {
            enrichedLabel.ingredients = ingredient;
          }
        }

        // Get recipe info if this label is linked to a recipe
        if (label.recipe_id) {
          const { data: recipe } = await supabase
            .from('recipes')
            .select('name, portions')
            .eq('id', label.recipe_id)
            .single();
          
          if (recipe) {
            enrichedLabel.recipes = recipe;
          }
        }

        return enrichedLabel;
      }));

      console.log('Enriched labels:', enrichedLabels);
      return enrichedLabels;
    } catch (error: any) {
      console.error('Error fetching labels:', error);
      toast({
        title: "Errore",
        description: "Errore nel caricamento delle etichette",
        variant: "destructive"
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateLabelStatus = async (labelId: string, newStatus: string, notes?: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('labels')
        .update({ status: newStatus })
        .eq('id', labelId);

      if (error) throw error;

      // Add to status history
      await supabase
        .from('label_status_history')
        .insert({
          label_id: labelId,
          new_status: newStatus,
          notes: notes
        });

      toast({
        title: "Stato aggiornato",
        description: "Lo stato dell'etichetta è stato aggiornato"
      });
    } catch (error: any) {
      console.error('Error updating label status:', error);
      toast({
        title: "Errore",
        description: "Errore nell'aggiornamento dello stato",
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    saveLabel,
    fetchLabels,
    updateLabelStatus,
    loading
  };
};
