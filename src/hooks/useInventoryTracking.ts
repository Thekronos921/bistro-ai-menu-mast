
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/use-toast';

export interface InventoryMovement {
  id: string;
  restaurant_id: string;
  ingredient_id: string;
  label_id?: string;
  movement_type: 'allocated' | 'consumed' | 'discarded' | 'restocked' | 'unallocated';
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  allocated_quantity_change?: number;
  notes?: string;
  created_by_user_id?: string;
  created_at: string;
}

export interface IngredientAllocation {
  id: string;
  restaurant_id: string;
  ingredient_id: string;
  label_id: string;
  allocated_quantity: number;
  created_at: string;
  updated_at: string;
}

export const useInventoryTracking = () => {
  const [loading, setLoading] = useState(false);
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();

  const allocateIngredient = async (
    ingredientId: string,
    labelId: string,
    quantity: number,
    notes?: string
  ) => {
    if (!restaurantId) return false;

    setLoading(true);
    try {
      // Get current ingredient stock
      const { data: ingredient, error: ingredientError } = await supabase
        .from('ingredients')
        .select('current_stock, allocated_stock, name')
        .eq('id', ingredientId)
        .single();

      if (ingredientError) throw ingredientError;

      const currentStock = ingredient.current_stock || 0;
      const allocatedStock = ingredient.allocated_stock || 0;
      const availableStock = currentStock - allocatedStock;

      if (availableStock < quantity) {
        toast({
          title: "Stock insufficiente",
          description: `Stock disponibile: ${availableStock}, richiesto: ${quantity}`,
          variant: "destructive"
        });
        return false;
      }

      // Create or update allocation
      const { error: allocationError } = await supabase
        .from('ingredient_allocations')
        .upsert({
          restaurant_id: restaurantId,
          ingredient_id: ingredientId,
          label_id: labelId,
          allocated_quantity: quantity
        });

      if (allocationError) throw allocationError;

      // Update ingredient allocated stock
      const { error: updateError } = await supabase
        .from('ingredients')
        .update({
          allocated_stock: allocatedStock + quantity
        })
        .eq('id', ingredientId);

      if (updateError) throw updateError;

      // Record movement
      await supabase
        .from('inventory_movements')
        .insert({
          restaurant_id: restaurantId,
          ingredient_id: ingredientId,
          label_id: labelId,
          movement_type: 'allocated',
          quantity_change: 0, // No change in current_stock
          quantity_before: currentStock,
          quantity_after: currentStock,
          allocated_quantity_change: quantity,
          notes: notes
        });

      toast({
        title: "Ingrediente allocato",
        description: `${quantity} unità di ${ingredient.name} allocate con successo`
      });

      return true;
    } catch (error: any) {
      console.error('Error allocating ingredient:', error);
      toast({
        title: "Errore",
        description: "Errore nell'allocazione dell'ingrediente",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const consumeOrDiscardLabel = async (
    labelId: string,
    action: 'consumed' | 'discarded',
    notes?: string
  ) => {
    if (!restaurantId) return false;

    setLoading(true);
    try {
      // Get all allocations for this label
      const { data: allocations, error: allocationsError } = await supabase
        .from('ingredient_allocations')
        .select('*')
        .eq('label_id', labelId);

      if (allocationsError) throw allocationsError;

      // For recipe labels, reduce current_stock; for defrosted, just deallocate
      const { data: label, error: labelError } = await supabase
        .from('labels')
        .select('label_type')
        .eq('id', labelId)
        .single();

      if (labelError) throw labelError;

      const shouldReduceStock = label.label_type === 'recipe' || label.label_type === 'lavorato';

      for (const allocation of allocations) {
        const { data: ingredient, error: ingredientError } = await supabase
          .from('ingredients')
          .select('current_stock, allocated_stock, name')
          .eq('id', allocation.ingredient_id)
          .single();

        if (ingredientError) throw ingredientError;

        const currentStock = ingredient.current_stock || 0;
        const allocatedStock = ingredient.allocated_stock || 0;
        const newAllocatedStock = allocatedStock - allocation.allocated_quantity;
        const newCurrentStock = shouldReduceStock 
          ? currentStock - allocation.allocated_quantity 
          : currentStock;

        // Update ingredient stock
        const { error: updateError } = await supabase
          .from('ingredients')
          .update({
            current_stock: Math.max(0, newCurrentStock),
            allocated_stock: Math.max(0, newAllocatedStock)
          })
          .eq('id', allocation.ingredient_id);

        if (updateError) throw updateError;

        // Record movement
        await supabase
          .from('inventory_movements')
          .insert({
            restaurant_id: restaurantId,
            ingredient_id: allocation.ingredient_id,
            label_id: labelId,
            movement_type: action,
            quantity_change: shouldReduceStock ? -allocation.allocated_quantity : 0,
            quantity_before: currentStock,
            quantity_after: Math.max(0, newCurrentStock),
            allocated_quantity_change: -allocation.allocated_quantity,
            notes: notes
          });
      }

      // Remove allocations
      await supabase
        .from('ingredient_allocations')
        .delete()
        .eq('label_id', labelId);

      // Update label status
      await supabase
        .from('labels')
        .update({ status: action })
        .eq('id', labelId);

      toast({
        title: action === 'consumed' ? "Etichetta consumata" : "Etichetta scartata",
        description: "L'inventario è stato aggiornato automaticamente"
      });

      return true;
    } catch (error: any) {
      console.error(`Error ${action} label:`, error);
      toast({
        title: "Errore",
        description: `Errore nel ${action === 'consumed' ? 'consumo' : 'scarto'} dell'etichetta`,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const allocateRecipeIngredients = async (
    recipeId: string,
    labelId: string,
    portions: number,
    notes?: string
  ) => {
    if (!restaurantId) return false;

    setLoading(true);
    try {
      // Get recipe ingredients
      const { data: recipeIngredients, error: recipeError } = await supabase
        .from('recipe_ingredients')
        .select(`
          ingredient_id,
          quantity,
          ingredients!inner(name, current_stock, allocated_stock)
        `)
        .eq('recipe_id', recipeId);

      if (recipeError) throw recipeError;

      // Check if all ingredients are available
      for (const ri of recipeIngredients) {
        const neededQuantity = ri.quantity * portions;
        const ingredient = ri.ingredients as any;
        const availableStock = (ingredient.current_stock || 0) - (ingredient.allocated_stock || 0);
        
        if (availableStock < neededQuantity) {
          toast({
            title: "Ingredienti insufficienti",
            description: `${ingredient.name}: disponibile ${availableStock}, richiesto ${neededQuantity}`,
            variant: "destructive"
          });
          return false;
        }
      }

      // Allocate all ingredients
      for (const ri of recipeIngredients) {
        const neededQuantity = ri.quantity * portions;
        await allocateIngredient(ri.ingredient_id, labelId, neededQuantity, notes);
      }

      return true;
    } catch (error: any) {
      console.error('Error allocating recipe ingredients:', error);
      toast({
        title: "Errore",
        description: "Errore nell'allocazione degli ingredienti della ricetta",
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    allocateIngredient,
    consumeOrDiscardLabel,
    allocateRecipeIngredients
  };
};
