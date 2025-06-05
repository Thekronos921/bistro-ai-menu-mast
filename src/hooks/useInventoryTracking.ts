
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

  /**
   * Alloca un ingrediente a un'etichetta e aggiorna lo stock
   * @param ingredientId - ID dell'ingrediente da allocare
   * @param labelId - ID dell'etichetta a cui allocare l'ingrediente
   * @param quantity - Quantità da allocare
   * @param notes - Note opzionali per il movimento di inventario
   * @param labelType - Tipo di etichetta ('ingredient', 'defrosted', 'recipe', 'semilavorato')
   * @param reduceCurrentStock - Se true, riduce anche il current_stock (usato per ricette e semilavorati)
   * @param skipAllocatedStockUpdate - Se true, non incrementa l'allocated_stock (usato per ricette e semilavorati)
   * @returns true se l'allocazione è avvenuta con successo, false altrimenti
   */
  const allocateIngredient = async (
    ingredientId: string,
    labelId: string,
    quantity: number,
    notes?: string,
    labelType?: string,
    reduceCurrentStock: boolean = false,
    skipAllocatedStockUpdate: boolean = false
  ) => {
    if (!restaurantId) return false;

    setLoading(true);
    try {
      // Get current ingredient stock
      const { data: ingredient, error: ingredientError } = await supabase
        .from('ingredients')
        .select('current_stock, allocated_stock, labeled_stock, name')
        .eq('id', ingredientId)
        .single();

      if (ingredientError) throw ingredientError;

      const currentStock = ingredient.current_stock || 0;
      const allocatedStock = ingredient.allocated_stock || 0;
      const labeledStock = ingredient.labeled_stock || 0;
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

      // Prepara i campi da aggiornare
      const updateFields: { allocated_stock?: number; labeled_stock?: number; current_stock?: number } = {};
      
      // Aggiorna lo stock allocato solo se non è richiesto di saltare l'aggiornamento
      if (!skipAllocatedStockUpdate) {
        updateFields.allocated_stock = allocatedStock + quantity;
      }
      
      // Se è un'etichetta di tipo 'ingredient', aggiorna anche lo stock etichettato
      if (labelType === 'ingredient') {
        console.log('Debug labeled_stock:', { 
          labelType, 
          labeledStock, 
          quantity, 
          nuovo: labeledStock + quantity 
        });
        updateFields.labeled_stock = labeledStock + quantity;
      }
      
      // Se richiesto, riduci anche il current_stock (per ricette e semilavorati)
      if (reduceCurrentStock) {
        updateFields.current_stock = currentStock - quantity;
      }
      
      // Verifica che ci siano campi da aggiornare
      if (Object.keys(updateFields).length === 0) {
        console.log('Nessun campo da aggiornare per l\'ingrediente', ingredientId);
        return true;
      }

      const { error: updateError } = await supabase
        .from('ingredients')
        .update(updateFields)
        .eq('id', ingredientId);

      if (updateError) throw updateError;

      // Record movement
      await supabase
        .from('inventory_movements')
        .insert({
          restaurant_id: restaurantId,
          ingredient_id: ingredientId,
          label_id: labelId,
          movement_type: skipAllocatedStockUpdate ? 'consumed' : 'allocated',
          quantity_change: reduceCurrentStock ? -quantity : 0, // Reduce current_stock if requested
          quantity_before: currentStock,
          quantity_after: reduceCurrentStock ? currentStock - quantity : currentStock,
          allocated_quantity_change: skipAllocatedStockUpdate ? 0 : quantity,
          notes: notes
        });

      console.log(`Allocated ${quantity} units of ${ingredient.name} to label ${labelId}`);
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
      // Get label info to determine the logic
      const { data: label, error: labelError } = await supabase
        .from('labels')
        .select('label_type, title')
        .eq('id', labelId)
        .single();

      if (labelError) throw labelError;

      console.log(`Processing ${action} for label: ${label.title} (type: ${label.label_type})`);

      // Get all allocations for this label
      const { data: allocations, error: allocationsError } = await supabase
        .from('ingredient_allocations')
        .select('*')
        .eq('label_id', labelId);

      if (allocationsError) throw allocationsError;

      /*
       * LOGICA DI AGGIORNAMENTO STOCK PER TIPO DI ETICHETTA:
       * 
       * 1. SEMILAVORATO/LAVORATO/RECIPE: Quando consumate/scartate, riducono il current_stock
       *    perché rappresentano prodotti finiti che vengono serviti ai clienti
       * 
       * 2. DEFROSTED/INGREDIENT: 
       *    - Quando CONSUMATE, NON riducono il current_stock perché rappresentano 
       *      solo l'allocazione di ingredienti già esistenti.
       *    - Quando SCARTATE, riducono il current_stock perché il prodotto non è più utilizzabile.
       */
      // Modifica da:

      // A:
      const shouldReduceStock = 
        ['lavorato'].includes(label.label_type) || 
        (action === 'discarded' && ['ingredient', 'defrosted', 'recipe', 'semilavorato'].includes(label.label_type));

      console.log(`Should reduce stock for ${label.label_type}: ${shouldReduceStock}`);

      for (const allocation of allocations) {
        const { data: ingredient, error: ingredientError } = await supabase
          .from('ingredients')
          .select('current_stock, allocated_stock, labeled_stock, name')
          .eq('id', allocation.ingredient_id)
          .single();

        if (ingredientError) throw ingredientError;

        const currentStock = ingredient.current_stock || 0;
        const allocatedStock = ingredient.allocated_stock || 0;
        const labeledStock = ingredient.labeled_stock || 0;
        
        // Always reduce allocated stock when consuming/discarding
        const newAllocatedStock = Math.max(0, allocatedStock - allocation.allocated_quantity);
        
        // Only reduce current stock for finished products (semilavorato, lavorato, recipe)
        const newCurrentStock = shouldReduceStock 
          ? Math.max(0, currentStock - allocation.allocated_quantity)
          : currentStock;

        console.log(`Ingredient ${ingredient.name}:`, {
          currentStock,
          allocatedStock,
          labeledStock,
          allocationQuantity: allocation.allocated_quantity,
          newCurrentStock,
          newAllocatedStock,
          shouldReduceStock
        });

        // Update ingredient stock with labeled_stock if needed
        const updateFields: { current_stock: number; allocated_stock: number; labeled_stock?: number } = {
          current_stock: newCurrentStock,
          allocated_stock: newAllocatedStock
        };
        
        // If it's an ingredient label type, also update labeled_stock
        if (label.label_type === 'ingredient') {
          updateFields.labeled_stock = Math.max(0, labeledStock - allocation.allocated_quantity);
        }

        const { error: updateError } = await supabase
          .from('ingredients')
          .update(updateFields)
          .eq('id', allocation.ingredient_id);

        if (updateError) throw updateError;

        // Record movement with the correct logic
        const quantityChange = shouldReduceStock ? -allocation.allocated_quantity : 0;
        
        await supabase
          .from('inventory_movements')
          .insert({
            restaurant_id: restaurantId,
            ingredient_id: allocation.ingredient_id,
            label_id: labelId,
            movement_type: action,
            quantity_change: quantityChange,
            quantity_before: currentStock,
            quantity_after: newCurrentStock,
            allocated_quantity_change: -allocation.allocated_quantity,
            notes: notes || `${action === 'consumed' ? 'Consumo' : 'Scarto'} etichetta ${label.label_type}: ${label.title}`
          });

        console.log(`Updated ${ingredient.name}: current_stock ${currentStock} -> ${newCurrentStock}, allocated_stock ${allocatedStock} -> ${newAllocatedStock}`);
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

  /**
   * Alloca tutti gli ingredienti di una ricetta a un'etichetta
   * Riduce il current_stock degli ingredienti ma NON incrementa l'allocated_stock
   * @param recipeId - ID della ricetta
   * @param labelId - ID dell'etichetta
   * @param portions - Numero di porzioni
   * @param notes - Note opzionali per il movimento di inventario
   * @returns true se l'allocazione è avvenuta con successo, false altrimenti
   */
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

      console.log(`Allocating ingredients for recipe ${recipeId}, ${portions} portions`);

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
        const success = await allocateIngredient(
          ri.ingredient_id, 
          labelId, 
          neededQuantity, 
          notes || `Allocazione per ricetta (${portions} porzioni)`,
          undefined, // labelType
          true, // reduceCurrentStock - riduce current_stock alla creazione della ricetta
          true  // skipAllocatedStockUpdate - non incrementa allocated_stock per ricette/semilavorati
        );
        
        if (!success) {
          throw new Error(`Failed to allocate ingredient ${ri.ingredient_id}`);
        }
      }

      console.log(`Successfully allocated all ingredients for recipe ${recipeId}`);
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
