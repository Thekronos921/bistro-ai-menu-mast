
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRestaurant } from './useRestaurant';
import { useToast } from './use-toast';

export interface Customer {
  id: string;
  restaurant_id: string;
  external_id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  address?: string;
  city?: string;
  country?: string;
  zip_code?: string;
  fiscal_code?: string;
  vat_number?: string;
  first_visit_date?: string;
  last_visit_date?: string;
  total_visits: number;
  total_lifetime_spend: number;
  average_spend_per_visit: number;
  visit_frequency: number;
  preferred_dish_category?: string;
  last_ordered_items: any[];
  loyalty_points: number;
  tags: string[];
  notes?: string;
  is_premium_buyer: boolean;
  score: number;
  referral_of?: string;
  id_organization?: string;
  cic_last_update?: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerFilters {
  search?: string;
  minSpend?: number;
  maxSpend?: number;
  tags?: string[];
  lastVisitFrom?: string;
  lastVisitTo?: string;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const { restaurantId } = useRestaurant();
  const { toast } = useToast();

  const fetchCustomers = async (
    page = 1,
    pageSize = 20,
    filters: CustomerFilters = {},
    sortBy = 'last_visit_date',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) => {
    if (!restaurantId) return;

    setLoading(true);
    try {
      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .eq('restaurant_id', restaurantId);

      // Apply filters
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone_number.ilike.%${filters.search}%`);
      }

      if (filters.minSpend !== undefined) {
        query = query.gte('total_lifetime_spend', filters.minSpend);
      }

      if (filters.maxSpend !== undefined) {
        query = query.lte('total_lifetime_spend', filters.maxSpend);
      }

      if (filters.lastVisitFrom) {
        query = query.gte('last_visit_date', filters.lastVisitFrom);
      }

      if (filters.lastVisitTo) {
        query = query.lte('last_visit_date', filters.lastVisitTo);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setCustomers(data || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i clienti',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createCustomer = async (customerData: Partial<Customer>) => {
    if (!restaurantId) return null;

    console.log('Creating customer with data:', customerData);

    try {
      // Generate unique external_id if not provided
      const external_id = customerData.external_id || `customer_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const dataToInsert = {
        ...customerData,
        restaurant_id: restaurantId,
        external_id,
        total_visits: customerData.total_visits || 0,
        total_lifetime_spend: customerData.total_lifetime_spend || 0,
        average_spend_per_visit: customerData.average_spend_per_visit || 0,
        visit_frequency: customerData.visit_frequency || 0,
        loyalty_points: customerData.loyalty_points || 0,
        tags: customerData.tags || [],
        last_ordered_items: customerData.last_ordered_items || [],
        is_premium_buyer: customerData.is_premium_buyer || false,
        score: customerData.score || 0,
      };

      const { data, error } = await supabase
        .from('customers')
        .insert([dataToInsert])
        .select()
        .single();

      if (error) {
        console.error('Supabase error creating customer:', error);
        throw error;
      }

      console.log('Customer created successfully:', data);

      toast({
        title: 'Successo',
        description: 'Cliente creato con successo',
      });

      // Refresh customers list
      fetchCustomers();
      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile creare il cliente',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCustomer = async (id: string, customerData: Partial<Customer>) => {
    console.log('Updating customer:', id, 'with data:', customerData);
    
    try {
      // Remove fields that shouldn't be updated
      const { created_at, updated_at, restaurant_id, customer_uuid, external_id, ...updateData } = customerData;
      
      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('customer_uuid', id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error updating customer:', error);
        throw error;
      }

      console.log('Customer updated successfully:', data);

      toast({
        title: 'Successo',
        description: 'Cliente aggiornato con successo',
      });

      // Refresh customers list
      fetchCustomers();
      return data;
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile aggiornare il cliente',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('customer_uuid', id);

      if (error) throw error;

      toast({
        title: 'Successo',
        description: 'Cliente eliminato con successo',
      });

      // Refresh customers list
      fetchCustomers();
      return true;
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare il cliente',
        variant: 'destructive',
      });
      return false;
    }
  };

  useEffect(() => {
    if (restaurantId) {
      fetchCustomers();
    }
  }, [restaurantId]);

  return {
    customers,
    loading,
    totalCount,
    fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
};
