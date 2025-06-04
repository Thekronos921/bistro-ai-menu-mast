
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/use-toast';

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
  ingredient_traceability?: any[];
}

export const useLabels = () => {
  const [loading, setLoading] = useState(false);
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();

  const saveLabel = async (labelData: LabelData) => {
    if (!restaurantId) {
      throw new Error('Restaurant ID not found');
    }

    setLoading(true);
    try {
      const qrData = {
        id: labelData.id || crypto.randomUUID(),
        type: labelData.label_type,
        title: labelData.title,
        batch_number: labelData.batch_number,
        production_date: labelData.production_date,
        expiry_date: labelData.expiry_date,
        restaurant_id: restaurantId,
        timestamp: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('labels')
        .insert({
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
          ingredient_traceability: labelData.ingredient_traceability || [],
          qr_data: qrData
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Etichetta salvata",
        description: "L'etichetta è stata salvata nel sistema di tracciabilità"
      });

      return data;
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
  }) => {
    if (!restaurantId) return [];

    setLoading(true);
    try {
      let query = supabase
        .from('labels')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false });

      if (filters?.label_type) {
        query = query.eq('label_type', filters.label_type);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.expiring_soon) {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        query = query.lte('expiry_date', threeDaysFromNow.toISOString().split('T')[0]);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
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

      // Aggiungi alla cronologia
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
