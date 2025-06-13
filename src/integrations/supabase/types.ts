export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cassa_in_cloud_bills_state: {
        Row: {
          bill_id: string
          last_updated_at: string | null
          processed_row_ids: Json | null
          restaurant_id: number
        }
        Insert: {
          bill_id: string
          last_updated_at?: string | null
          processed_row_ids?: Json | null
          restaurant_id: number
        }
        Update: {
          bill_id?: string
          last_updated_at?: string | null
          processed_row_ids?: Json | null
          restaurant_id?: number
        }
        Relationships: []
      }
      cassa_in_cloud_document_reasons: {
        Row: {
          cic_reason_id: string
          code: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          raw_data: Json | null
          restaurant_id: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          cic_reason_id: string
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          raw_data?: Json | null
          restaurant_id: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          cic_reason_id?: string
          code?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          raw_data?: Json | null
          restaurant_id?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cassa_in_cloud_document_reasons_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cassa_in_cloud_operators: {
        Row: {
          created_at: string | null
          first_name: string | null
          id: string
          id_sales_point_cic: number | null
          is_active_cic: boolean | null
          last_name: string | null
          last_synced_at: string
          operator_id: string | null
          operator_id_external: string
          operator_name: string | null
          raw_data: Json | null
          restaurant_id: string
          role_cic: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          id_sales_point_cic?: number | null
          is_active_cic?: boolean | null
          last_name?: string | null
          last_synced_at: string
          operator_id?: string | null
          operator_id_external: string
          operator_name?: string | null
          raw_data?: Json | null
          restaurant_id: string
          role_cic?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string | null
          id?: string
          id_sales_point_cic?: number | null
          is_active_cic?: boolean | null
          last_name?: string | null
          last_synced_at?: string
          operator_id?: string | null
          operator_id_external?: string
          operator_name?: string | null
          raw_data?: Json | null
          restaurant_id?: string
          role_cic?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cassa_in_cloud_operators_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cassa_in_cloud_receipt_payments: {
        Row: {
          amount: number | null
          cic_payment_id: string | null
          cic_payment_method_id: string | null
          created_at: string | null
          id: string
          payment_date: string | null
          payment_method_description: string | null
          raw_data: Json | null
          receipt_id: string
          restaurant_id: string
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          cic_payment_id?: string | null
          cic_payment_method_id?: string | null
          created_at?: string | null
          id?: string
          payment_date?: string | null
          payment_method_description?: string | null
          raw_data?: Json | null
          receipt_id: string
          restaurant_id: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          cic_payment_id?: string | null
          cic_payment_method_id?: string | null
          created_at?: string | null
          id?: string
          payment_date?: string | null
          payment_method_description?: string | null
          raw_data?: Json | null
          receipt_id?: string
          restaurant_id?: string
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cassa_in_cloud_receipt_payments_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "cassa_in_cloud_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cassa_in_cloud_receipt_payments_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cassa_in_cloud_receipt_rows: {
        Row: {
          cic_department_id: string | null
          cic_product_id: string | null
          cic_row_id: string | null
          cic_tax_id: string | null
          created_at: string | null
          department_description: string | null
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          external_id: string | null
          id: string
          last_synced_at: string | null
          notes: string | null
          position: number | null
          price: number | null
          product_description: string | null
          product_sku: string | null
          quantity: number | null
          raw_data: Json | null
          receipt_id: string
          restaurant_id: string
          tax_description: string | null
          tax_percentage: number | null
          total: number | null
          total_price_gross: number | null
          total_price_net: number | null
          unit_price_gross: number | null
          unit_price_net: number | null
          updated_at: string | null
          vat: number | null
        }
        Insert: {
          cic_department_id?: string | null
          cic_product_id?: string | null
          cic_row_id?: string | null
          cic_tax_id?: string | null
          created_at?: string | null
          department_description?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          external_id?: string | null
          id?: string
          last_synced_at?: string | null
          notes?: string | null
          position?: number | null
          price?: number | null
          product_description?: string | null
          product_sku?: string | null
          quantity?: number | null
          raw_data?: Json | null
          receipt_id: string
          restaurant_id: string
          tax_description?: string | null
          tax_percentage?: number | null
          total?: number | null
          total_price_gross?: number | null
          total_price_net?: number | null
          unit_price_gross?: number | null
          unit_price_net?: number | null
          updated_at?: string | null
          vat?: number | null
        }
        Update: {
          cic_department_id?: string | null
          cic_product_id?: string | null
          cic_row_id?: string | null
          cic_tax_id?: string | null
          created_at?: string | null
          department_description?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          external_id?: string | null
          id?: string
          last_synced_at?: string | null
          notes?: string | null
          position?: number | null
          price?: number | null
          product_description?: string | null
          product_sku?: string | null
          quantity?: number | null
          raw_data?: Json | null
          receipt_id?: string
          restaurant_id?: string
          tax_description?: string | null
          tax_percentage?: number | null
          total?: number | null
          total_price_gross?: number | null
          total_price_net?: number | null
          unit_price_gross?: number | null
          unit_price_net?: number | null
          updated_at?: string | null
          vat?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cassa_in_cloud_receipt_rows_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "cassa_in_cloud_receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cassa_in_cloud_receipt_rows_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      cassa_in_cloud_receipts: {
        Row: {
          amount_change: number | null
          amount_discount: number | null
          amount_due: number | null
          amount_gross: number | null
          amount_net: number | null
          amount_rounding: number | null
          amount_tax: number | null
          cic_customer_id: string | null
          cic_document_reason_id: string | null
          cic_id: string | null
          cic_user_id: string | null
          connections: Json | null
          created_at: string | null
          customer_denominazione: string | null
          customer_details: Json | null
          date: string | null
          datetime: string | null
          document_external_id: string | null
          document_reason_description: string | null
          external_id: string | null
          id: string
          id_sales_point: number | null
          internal_id: string | null
          last_synced_at: string | null
          lottery_code: string | null
          notes: string | null
          number: string | null
          operator_id_external: string | null
          order_summary: Json | null
          raw_data: Json | null
          receipt_date: string | null
          receipt_number: string | null
          restaurant_id: string
          status: string | null
          total: number | null
          updated_at: string | null
          user_denominazione: string | null
          user_external_id: string | null
          z_number: string | null
        }
        Insert: {
          amount_change?: number | null
          amount_discount?: number | null
          amount_due?: number | null
          amount_gross?: number | null
          amount_net?: number | null
          amount_rounding?: number | null
          amount_tax?: number | null
          cic_customer_id?: string | null
          cic_document_reason_id?: string | null
          cic_id?: string | null
          cic_user_id?: string | null
          connections?: Json | null
          created_at?: string | null
          customer_denominazione?: string | null
          customer_details?: Json | null
          date?: string | null
          datetime?: string | null
          document_external_id?: string | null
          document_reason_description?: string | null
          external_id?: string | null
          id?: string
          id_sales_point?: number | null
          internal_id?: string | null
          last_synced_at?: string | null
          lottery_code?: string | null
          notes?: string | null
          number?: string | null
          operator_id_external?: string | null
          order_summary?: Json | null
          raw_data?: Json | null
          receipt_date?: string | null
          receipt_number?: string | null
          restaurant_id: string
          status?: string | null
          total?: number | null
          updated_at?: string | null
          user_denominazione?: string | null
          user_external_id?: string | null
          z_number?: string | null
        }
        Update: {
          amount_change?: number | null
          amount_discount?: number | null
          amount_due?: number | null
          amount_gross?: number | null
          amount_net?: number | null
          amount_rounding?: number | null
          amount_tax?: number | null
          cic_customer_id?: string | null
          cic_document_reason_id?: string | null
          cic_id?: string | null
          cic_user_id?: string | null
          connections?: Json | null
          created_at?: string | null
          customer_denominazione?: string | null
          customer_details?: Json | null
          date?: string | null
          datetime?: string | null
          document_external_id?: string | null
          document_reason_description?: string | null
          external_id?: string | null
          id?: string
          id_sales_point?: number | null
          internal_id?: string | null
          last_synced_at?: string | null
          lottery_code?: string | null
          notes?: string | null
          number?: string | null
          operator_id_external?: string | null
          order_summary?: Json | null
          raw_data?: Json | null
          receipt_date?: string | null
          receipt_number?: string | null
          restaurant_id?: string
          status?: string | null
          total?: number | null
          updated_at?: string | null
          user_denominazione?: string | null
          user_external_id?: string | null
          z_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cassa_in_cloud_receipts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          average_spend_per_visit: number | null
          cic_last_update: number | null
          city: string | null
          country: string | null
          created_at: string
          customer_uuid: string
          email: string | null
          external_id: string
          first_name: string | null
          fiscal_code: string | null
          id_organization: string | null
          is_premium_buyer: boolean | null
          last_name: string | null
          last_visit_date: string | null
          name: string | null
          notes: string | null
          phone_number: string | null
          referral_of: string | null
          restaurant_id: string
          score: number | null
          total_lifetime_spend: number | null
          updated_at: string
          vat_number: string | null
          visit_frequency: number | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          average_spend_per_visit?: number | null
          cic_last_update?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          customer_uuid?: string
          email?: string | null
          external_id: string
          first_name?: string | null
          fiscal_code?: string | null
          id_organization?: string | null
          is_premium_buyer?: boolean | null
          last_name?: string | null
          last_visit_date?: string | null
          name?: string | null
          notes?: string | null
          phone_number?: string | null
          referral_of?: string | null
          restaurant_id: string
          score?: number | null
          total_lifetime_spend?: number | null
          updated_at?: string
          vat_number?: string | null
          visit_frequency?: number | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          average_spend_per_visit?: number | null
          cic_last_update?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          customer_uuid?: string
          email?: string | null
          external_id?: string
          first_name?: string | null
          fiscal_code?: string | null
          id_organization?: string | null
          is_premium_buyer?: boolean | null
          last_name?: string | null
          last_visit_date?: string | null
          name?: string | null
          notes?: string | null
          phone_number?: string | null
          referral_of?: string | null
          restaurant_id?: string
          score?: number | null
          total_lifetime_spend?: number | null
          updated_at?: string
          vat_number?: string | null
          visit_frequency?: number | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_forecasts: {
        Row: {
          confidence_percentage: number
          created_at: string
          events_impact: string | null
          forecast_date: string
          generated_at: string
          id: string
          inventory_suggestions: string | null
          is_active: boolean | null
          key_factors: string[] | null
          model_version: string | null
          predicted_covers: number
          predicted_covers_dinner: number | null
          predicted_covers_lunch: number | null
          predicted_revenue: number | null
          recommended_dishes: Json | null
          restaurant_id: string
          staff_recommendations: string | null
          updated_at: string
          weather_impact: string | null
        }
        Insert: {
          confidence_percentage?: number
          created_at?: string
          events_impact?: string | null
          forecast_date: string
          generated_at?: string
          id?: string
          inventory_suggestions?: string | null
          is_active?: boolean | null
          key_factors?: string[] | null
          model_version?: string | null
          predicted_covers: number
          predicted_covers_dinner?: number | null
          predicted_covers_lunch?: number | null
          predicted_revenue?: number | null
          recommended_dishes?: Json | null
          restaurant_id: string
          staff_recommendations?: string | null
          updated_at?: string
          weather_impact?: string | null
        }
        Update: {
          confidence_percentage?: number
          created_at?: string
          events_impact?: string | null
          forecast_date?: string
          generated_at?: string
          id?: string
          inventory_suggestions?: string | null
          is_active?: boolean | null
          key_factors?: string[] | null
          model_version?: string | null
          predicted_covers?: number
          predicted_covers_dinner?: number | null
          predicted_covers_lunch?: number | null
          predicted_revenue?: number | null
          recommended_dishes?: Json | null
          restaurant_id?: string
          staff_recommendations?: string | null
          updated_at?: string
          weather_impact?: string | null
        }
        Relationships: []
      }
      dish_sales_data: {
        Row: {
          created_at: string
          dish_category: string | null
          dish_name: string
          external_product_id: string | null
          id: string
          meal_period: string | null
          quantity_sold: number
          restaurant_id: string
          revenue: number | null
          sales_data_id: string | null
        }
        Insert: {
          created_at?: string
          dish_category?: string | null
          dish_name: string
          external_product_id?: string | null
          id?: string
          meal_period?: string | null
          quantity_sold?: number
          restaurant_id: string
          revenue?: number | null
          sales_data_id?: string | null
        }
        Update: {
          created_at?: string
          dish_category?: string | null
          dish_name?: string
          external_product_id?: string | null
          id?: string
          meal_period?: string | null
          quantity_sold?: number
          restaurant_id?: string
          revenue?: number | null
          sales_data_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dish_sales_data_sales_data_id_fkey"
            columns: ["sales_data_id"]
            isOneToOne: false
            referencedRelation: "sales_data"
            referencedColumns: ["id"]
          },
        ]
      }
      dishes: {
        Row: {
          availability_status: string | null
          cic_department_id: string | null
          cic_department_name: string | null
          cic_has_variants: boolean | null
          cic_notes: string | null
          cic_price_includes_vat: boolean | null
          cic_variants_count: number | null
          cic_vat_percentage: number | null
          created_at: string
          external_category_id: string | null
          external_id: string | null
          id: string
          image_url: string | null
          is_enabled_for_restaurant: boolean | null
          is_visible_on_ecommerce: boolean | null
          is_visible_on_pos: boolean | null
          last_synced_at: string | null
          name: string
          recipe_id: string | null
          restaurant_category_id: string | null
          restaurant_category_name: string | null
          restaurant_id: string
          selling_price: number
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          availability_status?: string | null
          cic_department_id?: string | null
          cic_department_name?: string | null
          cic_has_variants?: boolean | null
          cic_notes?: string | null
          cic_price_includes_vat?: boolean | null
          cic_variants_count?: number | null
          cic_vat_percentage?: number | null
          created_at?: string
          external_category_id?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_enabled_for_restaurant?: boolean | null
          is_visible_on_ecommerce?: boolean | null
          is_visible_on_pos?: boolean | null
          last_synced_at?: string | null
          name: string
          recipe_id?: string | null
          restaurant_category_id?: string | null
          restaurant_category_name?: string | null
          restaurant_id: string
          selling_price: number
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          availability_status?: string | null
          cic_department_id?: string | null
          cic_department_name?: string | null
          cic_has_variants?: boolean | null
          cic_notes?: string | null
          cic_price_includes_vat?: boolean | null
          cic_variants_count?: number | null
          cic_vat_percentage?: number | null
          created_at?: string
          external_category_id?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          is_enabled_for_restaurant?: boolean | null
          is_visible_on_ecommerce?: boolean | null
          is_visible_on_pos?: boolean | null
          last_synced_at?: string | null
          name?: string
          recipe_id?: string | null
          restaurant_category_id?: string | null
          restaurant_category_name?: string | null
          restaurant_id?: string
          selling_price?: number
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dishes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_dishes_restaurant"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_dishes_restaurant_category"
            columns: ["restaurant_category_id"]
            isOneToOne: false
            referencedRelation: "restaurant_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      external_sales_data: {
        Row: {
          bill_id_external: string
          created_at: string
          dish_id: string | null
          document_row_id_external: string | null
          id: string
          operator_id_external: string | null
          operator_name: string | null
          price_per_unit_sold: number
          quantity_sold: number
          raw_bill_data: Json | null
          restaurant_id: string
          sale_timestamp: string
          total_amount_sold_for_row: number
          unmapped_product_description: string | null
        }
        Insert: {
          bill_id_external: string
          created_at?: string
          dish_id?: string | null
          document_row_id_external?: string | null
          id?: string
          operator_id_external?: string | null
          operator_name?: string | null
          price_per_unit_sold: number
          quantity_sold: number
          raw_bill_data?: Json | null
          restaurant_id: string
          sale_timestamp: string
          total_amount_sold_for_row: number
          unmapped_product_description?: string | null
        }
        Update: {
          bill_id_external?: string
          created_at?: string
          dish_id?: string | null
          document_row_id_external?: string | null
          id?: string
          operator_id_external?: string | null
          operator_name?: string | null
          price_per_unit_sold?: number
          quantity_sold?: number
          raw_bill_data?: Json | null
          restaurant_id?: string
          sale_timestamp?: string
          total_amount_sold_for_row?: number
          unmapped_product_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_external_sales_dish"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_external_sales_restaurant"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_allocations: {
        Row: {
          allocated_quantity: number
          created_at: string
          id: string
          ingredient_id: string
          label_id: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          allocated_quantity?: number
          created_at?: string
          id?: string
          ingredient_id: string
          label_id: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          allocated_quantity?: number
          created_at?: string
          id?: string
          ingredient_id?: string
          label_id?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_allocations_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_allocations_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients_with_conversions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_allocations_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_allocations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_batches: {
        Row: {
          batch_number: string
          calculated_pieces_per_kg: number | null
          calculated_weight_per_piece_g: number | null
          cost_per_piece: number | null
          created_at: string
          effective_cost_per_piece: number | null
          expiry_date: string
          id: string
          ingredient_id: string | null
          notes: string | null
          quantity_received: number
          quantity_remaining: number
          restaurant_id: string | null
          storage_location: string | null
          supplier_delivery_date: string | null
          total_pieces_count: number | null
          updated_at: string
        }
        Insert: {
          batch_number: string
          calculated_pieces_per_kg?: number | null
          calculated_weight_per_piece_g?: number | null
          cost_per_piece?: number | null
          created_at?: string
          effective_cost_per_piece?: number | null
          expiry_date: string
          id?: string
          ingredient_id?: string | null
          notes?: string | null
          quantity_received?: number
          quantity_remaining?: number
          restaurant_id?: string | null
          storage_location?: string | null
          supplier_delivery_date?: string | null
          total_pieces_count?: number | null
          updated_at?: string
        }
        Update: {
          batch_number?: string
          calculated_pieces_per_kg?: number | null
          calculated_weight_per_piece_g?: number | null
          cost_per_piece?: number | null
          created_at?: string
          effective_cost_per_piece?: number | null
          expiry_date?: string
          id?: string
          ingredient_id?: string | null
          notes?: string | null
          quantity_received?: number
          quantity_remaining?: number
          restaurant_id?: string | null
          storage_location?: string | null
          supplier_delivery_date?: string | null
          total_pieces_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_batches_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_batches_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients_with_conversions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_batches_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          allergens: string | null
          allocated_stock: number
          average_pieces_per_kg: number | null
          average_weight_per_piece_g: number | null
          batch_number: string | null
          category: string | null
          cost_per_unit: number
          created_at: string
          current_stock: number | null
          effective_cost_per_unit: number | null
          expiry_date: string | null
          external_id: string | null
          id: string
          is_semilavorato: boolean | null
          labeled_stock: number | null
          last_lot_conversion_update: string | null
          last_synced_at: string | null
          min_stock_threshold: number | null
          name: string
          notes: string | null
          origin_certification: string | null
          par_level: number | null
          primary_unit: string
          restaurant_id: string
          storage_instructions: string | null
          supplier: string | null
          supplier_product_code: string | null
          unit: string
          updated_at: string
          usage_unit: string | null
          yield_percentage: number
        }
        Insert: {
          allergens?: string | null
          allocated_stock?: number
          average_pieces_per_kg?: number | null
          average_weight_per_piece_g?: number | null
          batch_number?: string | null
          category?: string | null
          cost_per_unit: number
          created_at?: string
          current_stock?: number | null
          effective_cost_per_unit?: number | null
          expiry_date?: string | null
          external_id?: string | null
          id?: string
          is_semilavorato?: boolean | null
          labeled_stock?: number | null
          last_lot_conversion_update?: string | null
          last_synced_at?: string | null
          min_stock_threshold?: number | null
          name: string
          notes?: string | null
          origin_certification?: string | null
          par_level?: number | null
          primary_unit?: string
          restaurant_id: string
          storage_instructions?: string | null
          supplier?: string | null
          supplier_product_code?: string | null
          unit?: string
          updated_at?: string
          usage_unit?: string | null
          yield_percentage?: number
        }
        Update: {
          allergens?: string | null
          allocated_stock?: number
          average_pieces_per_kg?: number | null
          average_weight_per_piece_g?: number | null
          batch_number?: string | null
          category?: string | null
          cost_per_unit?: number
          created_at?: string
          current_stock?: number | null
          effective_cost_per_unit?: number | null
          expiry_date?: string | null
          external_id?: string | null
          id?: string
          is_semilavorato?: boolean | null
          labeled_stock?: number | null
          last_lot_conversion_update?: string | null
          last_synced_at?: string | null
          min_stock_threshold?: number | null
          name?: string
          notes?: string | null
          origin_certification?: string | null
          par_level?: number | null
          primary_unit?: string
          restaurant_id?: string
          storage_instructions?: string | null
          supplier?: string | null
          supplier_product_code?: string | null
          unit?: string
          updated_at?: string
          usage_unit?: string | null
          yield_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "fk_ingredients_restaurant"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          api_key: string | null
          auto_sync_enabled: boolean | null
          created_at: string
          id: string
          integration_type: string
          last_sync_at: string | null
          restaurant_id: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          auto_sync_enabled?: boolean | null
          created_at?: string
          id?: string
          integration_type: string
          last_sync_at?: string | null
          restaurant_id: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          auto_sync_enabled?: boolean | null
          created_at?: string
          id?: string
          integration_type?: string
          last_sync_at?: string | null
          restaurant_id?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "integration_settings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          allocated_quantity_change: number | null
          created_at: string
          created_by_user_id: string | null
          id: string
          ingredient_id: string
          label_id: string | null
          movement_type: string
          notes: string | null
          quantity_after: number
          quantity_before: number
          quantity_change: number
          restaurant_id: string
        }
        Insert: {
          allocated_quantity_change?: number | null
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          ingredient_id: string
          label_id?: string | null
          movement_type: string
          notes?: string | null
          quantity_after: number
          quantity_before: number
          quantity_change: number
          restaurant_id: string
        }
        Update: {
          allocated_quantity_change?: number | null
          created_at?: string
          created_by_user_id?: string | null
          id?: string
          ingredient_id?: string
          label_id?: string | null
          movement_type?: string
          notes?: string | null
          quantity_after?: number
          quantity_before?: number
          quantity_change?: number
          restaurant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients_with_conversions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      label_status_history: {
        Row: {
          changed_by_user_id: string | null
          created_at: string
          id: string
          label_id: string
          new_status: string
          notes: string | null
          old_status: string | null
        }
        Insert: {
          changed_by_user_id?: string | null
          created_at?: string
          id?: string
          label_id: string
          new_status: string
          notes?: string | null
          old_status?: string | null
        }
        Update: {
          changed_by_user_id?: string | null
          created_at?: string
          id?: string
          label_id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "label_status_history_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "labels"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          allergens: string | null
          batch_number: string | null
          created_at: string
          dish_id: string | null
          expiry_date: string | null
          id: string
          ingredient_id: string | null
          ingredient_traceability: Json | null
          label_type: string
          notes: string | null
          production_date: string | null
          qr_data: Json
          quantity: number | null
          recipe_id: string | null
          restaurant_id: string
          status: string | null
          storage_instructions: string | null
          storage_location_id: string | null
          supplier: string | null
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          allergens?: string | null
          batch_number?: string | null
          created_at?: string
          dish_id?: string | null
          expiry_date?: string | null
          id?: string
          ingredient_id?: string | null
          ingredient_traceability?: Json | null
          label_type: string
          notes?: string | null
          production_date?: string | null
          qr_data: Json
          quantity?: number | null
          recipe_id?: string | null
          restaurant_id: string
          status?: string | null
          storage_instructions?: string | null
          storage_location_id?: string | null
          supplier?: string | null
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          allergens?: string | null
          batch_number?: string | null
          created_at?: string
          dish_id?: string | null
          expiry_date?: string | null
          id?: string
          ingredient_id?: string | null
          ingredient_traceability?: Json | null
          label_type?: string
          notes?: string | null
          production_date?: string | null
          qr_data?: Json
          quantity?: number | null
          recipe_id?: string | null
          restaurant_id?: string
          status?: string | null
          storage_instructions?: string | null
          storage_location_id?: string | null
          supplier?: string | null
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "labels_storage_location_id_fkey"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      local_events: {
        Row: {
          created_at: string
          date: string
          description: string | null
          end_date: string | null
          end_time: string | null
          event_type: string
          expected_impact: string | null
          id: string
          impact_percentage: number | null
          is_active: boolean | null
          is_recurring: boolean | null
          location: string | null
          name: string
          radius_km: number | null
          recurrence_rule: string | null
          restaurant_id: string
          source: string | null
          start_date: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_type: string
          expected_impact?: string | null
          id?: string
          impact_percentage?: number | null
          is_active?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          name: string
          radius_km?: number | null
          recurrence_rule?: string | null
          restaurant_id: string
          source?: string | null
          start_date?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          end_date?: string | null
          end_time?: string | null
          event_type?: string
          expected_impact?: string | null
          id?: string
          impact_percentage?: number | null
          is_active?: boolean | null
          is_recurring?: boolean | null
          location?: string | null
          name?: string
          radius_km?: number | null
          recurrence_rule?: string | null
          restaurant_id?: string
          source?: string | null
          start_date?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_id: string | null
          is_semilavorato: boolean | null
          quantity: number
          recipe_id: string | null
          recipe_yield_percentage: number | null
          unit: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id?: string | null
          is_semilavorato?: boolean | null
          quantity: number
          recipe_id?: string | null
          recipe_yield_percentage?: number | null
          unit?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string | null
          is_semilavorato?: boolean | null
          quantity?: number
          recipe_id?: string | null
          recipe_yield_percentage?: number | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients_with_conversions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_instructions: {
        Row: {
          created_at: string
          id: string
          instruction: string
          recipe_id: string | null
          step_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          instruction: string
          recipe_id?: string | null
          step_number: number
        }
        Update: {
          created_at?: string
          id?: string
          instruction?: string
          recipe_id?: string | null
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_instructions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          allergens: string | null
          calculated_cost_per_portion: number | null
          calculated_total_cost: number | null
          calories: number | null
          carbs: number | null
          category: string
          cost_last_calculated_at: string | null
          created_at: string
          description: string | null
          difficulty: string
          fat: number | null
          id: string
          is_semilavorato: boolean | null
          name: string
          notes_chef: string | null
          portions: number
          preparation_time: number
          protein: number | null
          restaurant_id: string
          selling_price: number | null
          updated_at: string
        }
        Insert: {
          allergens?: string | null
          calculated_cost_per_portion?: number | null
          calculated_total_cost?: number | null
          calories?: number | null
          carbs?: number | null
          category: string
          cost_last_calculated_at?: string | null
          created_at?: string
          description?: string | null
          difficulty: string
          fat?: number | null
          id?: string
          is_semilavorato?: boolean | null
          name: string
          notes_chef?: string | null
          portions: number
          preparation_time: number
          protein?: number | null
          restaurant_id: string
          selling_price?: number | null
          updated_at?: string
        }
        Update: {
          allergens?: string | null
          calculated_cost_per_portion?: number | null
          calculated_total_cost?: number | null
          calories?: number | null
          carbs?: number | null
          category?: string
          cost_last_calculated_at?: string | null
          created_at?: string
          description?: string | null
          difficulty?: string
          fat?: number | null
          id?: string
          is_semilavorato?: boolean | null
          name?: string
          notes_chef?: string | null
          portions?: number
          preparation_time?: number
          protein?: number | null
          restaurant_id?: string
          selling_price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_recipes_restaurant"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          arrival_time: string | null
          booking_type: string | null
          calculated_score: number | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_notes: string | null
          customer_phone: string | null
          customer_score_at_request: number | null
          dish_id: string | null
          estimated_departure_time: string | null
          final_score: number | null
          id: string
          internal_notes: string | null
          is_golden_circle_at_request: boolean | null
          number_of_guests: number
          reservation_time: string
          restaurant_id: string
          social_score: number | null
          status: Database["public"]["Enums"]["reservation_status"]
          updated_at: string
        }
        Insert: {
          arrival_time?: string | null
          booking_type?: string | null
          calculated_score?: number | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_notes?: string | null
          customer_phone?: string | null
          customer_score_at_request?: number | null
          dish_id?: string | null
          estimated_departure_time?: string | null
          final_score?: number | null
          id?: string
          internal_notes?: string | null
          is_golden_circle_at_request?: boolean | null
          number_of_guests: number
          reservation_time: string
          restaurant_id: string
          social_score?: number | null
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Update: {
          arrival_time?: string | null
          booking_type?: string | null
          calculated_score?: number | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_notes?: string | null
          customer_phone?: string | null
          customer_score_at_request?: number | null
          dish_id?: string | null
          estimated_departure_time?: string | null
          final_score?: number | null
          id?: string
          internal_notes?: string | null
          is_golden_circle_at_request?: boolean | null
          number_of_guests?: number
          reservation_time?: string
          restaurant_id?: string
          social_score?: number | null
          status?: Database["public"]["Enums"]["reservation_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_categories: {
        Row: {
          created_at: string
          description: string | null
          external_id: string | null
          id: string
          name: string
          restaurant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          name: string
          restaurant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          name?: string
          restaurant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_categories_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_daily_availability: {
        Row: {
          available_seats: number
          date: string
          id: string
          last_updated: string | null
          restaurant_id: string
          total_seats: number
        }
        Insert: {
          available_seats: number
          date: string
          id?: string
          last_updated?: string | null
          restaurant_id: string
          total_seats: number
        }
        Update: {
          available_seats?: number
          date?: string
          id?: string
          last_updated?: string | null
          restaurant_id?: string
          total_seats?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_daily_availability_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_rooms: {
        Row: {
          created_at: string | null
          description: string | null
          external_id: string
          id: string
          id_sales_point: string | null
          last_synced_at: string | null
          name: string
          raw_data: Json | null
          restaurant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          external_id: string
          id?: string
          id_sales_point?: string | null
          last_synced_at?: string | null
          name: string
          raw_data?: Json | null
          restaurant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          external_id?: string
          id?: string
          id_sales_point?: string | null
          last_synced_at?: string | null
          name?: string
          raw_data?: Json | null
          restaurant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_rooms_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_shift_availability: {
        Row: {
          availability_date: string
          available_seats: number
          id: string
          last_updated: string | null
          restaurant_id: string
          shift_id: string
          total_seats: number
        }
        Insert: {
          availability_date: string
          available_seats: number
          id?: string
          last_updated?: string | null
          restaurant_id: string
          shift_id: string
          total_seats: number
        }
        Update: {
          availability_date?: string
          available_seats?: number
          id?: string
          last_updated?: string | null
          restaurant_id?: string
          shift_id?: string
          total_seats?: number
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_shift_availability_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_shift_availability_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "restaurant_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_shifts: {
        Row: {
          created_at: string | null
          days_active: number[] | null
          end_time: string
          id: string
          restaurant_id: string
          shift_name: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days_active?: number[] | null
          end_time: string
          id?: string
          restaurant_id: string
          shift_name: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days_active?: number[] | null
          end_time?: string
          id?: string
          restaurant_id?: string
          shift_name?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_shifts_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_tables: {
        Row: {
          created_at: string | null
          description: string | null
          external_id: string
          external_room_id: string | null
          id: string
          id_sales_point: string | null
          last_synced_at: string | null
          name: string
          raw_data: Json | null
          restaurant_id: string
          room_id: string | null
          seats: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          external_id: string
          external_room_id?: string | null
          id?: string
          id_sales_point?: string | null
          last_synced_at?: string | null
          name: string
          raw_data?: Json | null
          restaurant_id: string
          room_id?: string | null
          seats?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          external_id?: string
          external_room_id?: string | null
          id?: string
          id_sales_point?: string | null
          last_synced_at?: string | null
          name?: string
          raw_data?: Json | null
          restaurant_id?: string
          room_id?: string | null
          seats?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurant_tables_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurant_tables_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "restaurant_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurants: {
        Row: {
          cic_sales_point_id: string | null
          city: string
          country: string
          created_at: string
          id: string
          name: string
          owner_user_id: string | null
          seats_count: number | null
          subscription_status: string | null
          type: Database["public"]["Enums"]["restaurant_type"]
          updated_at: string
          vat_number: string | null
        }
        Insert: {
          cic_sales_point_id?: string | null
          city: string
          country: string
          created_at?: string
          id?: string
          name: string
          owner_user_id?: string | null
          seats_count?: number | null
          subscription_status?: string | null
          type?: Database["public"]["Enums"]["restaurant_type"]
          updated_at?: string
          vat_number?: string | null
        }
        Update: {
          cic_sales_point_id?: string | null
          city?: string
          country?: string
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string | null
          seats_count?: number | null
          subscription_status?: string | null
          type?: Database["public"]["Enums"]["restaurant_type"]
          updated_at?: string
          vat_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_restaurants_owner"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "restaurants_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_data: {
        Row: {
          avg_spending_per_cover: number | null
          covers_dinner: number | null
          covers_lunch: number | null
          covers_total: number
          created_at: string
          data: string
          day_of_week: number
          id: string
          is_holiday: boolean | null
          notes: string | null
          period_from: string | null
          period_to: string | null
          report_date: string | null
          restaurant_id: string
          revenue_dinner: number | null
          revenue_lunch: number | null
          revenue_total: number | null
          special_events: string[] | null
          temperature: number | null
          updated_at: string
          weather_condition: string | null
        }
        Insert: {
          avg_spending_per_cover?: number | null
          covers_dinner?: number | null
          covers_lunch?: number | null
          covers_total?: number
          created_at?: string
          data: string
          day_of_week: number
          id?: string
          is_holiday?: boolean | null
          notes?: string | null
          period_from?: string | null
          period_to?: string | null
          report_date?: string | null
          restaurant_id: string
          revenue_dinner?: number | null
          revenue_lunch?: number | null
          revenue_total?: number | null
          special_events?: string[] | null
          temperature?: number | null
          updated_at?: string
          weather_condition?: string | null
        }
        Update: {
          avg_spending_per_cover?: number | null
          covers_dinner?: number | null
          covers_lunch?: number | null
          covers_total?: number
          created_at?: string
          data?: string
          day_of_week?: number
          id?: string
          is_holiday?: boolean | null
          notes?: string | null
          period_from?: string | null
          period_to?: string | null
          report_date?: string | null
          restaurant_id?: string
          revenue_dinner?: number | null
          revenue_lunch?: number | null
          revenue_total?: number | null
          special_events?: string[] | null
          temperature?: number | null
          updated_at?: string
          weather_condition?: string | null
        }
        Relationships: []
      }
      sales_product_details: {
        Row: {
          created_at: string
          id: string
          id_menu_product: string | null
          is_composition_entry: boolean | null
          is_menu_entry: boolean | null
          menu_product_name: string | null
          percent_total: number | null
          product_id: string
          product_name: string
          profit: number | null
          quantity: number
          report_date: string
          restaurant_id: string
          sales_data_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          id_menu_product?: string | null
          is_composition_entry?: boolean | null
          is_menu_entry?: boolean | null
          menu_product_name?: string | null
          percent_total?: number | null
          product_id: string
          product_name: string
          profit?: number | null
          quantity?: number
          report_date: string
          restaurant_id: string
          sales_data_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          id_menu_product?: string | null
          is_composition_entry?: boolean | null
          is_menu_entry?: boolean | null
          menu_product_name?: string | null
          percent_total?: number | null
          product_id?: string
          product_name?: string
          profit?: number | null
          quantity?: number
          report_date?: string
          restaurant_id?: string
          sales_data_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_details_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_product_details_sales_data_id_fkey"
            columns: ["sales_data_id"]
            isOneToOne: false
            referencedRelation: "sales_data"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_locations: {
        Row: {
          capacity_description: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          restaurant_id: string
          temperature_max: number | null
          temperature_min: number | null
          type: string
          updated_at: string
        }
        Insert: {
          capacity_description?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          restaurant_id: string
          temperature_max?: number | null
          temperature_min?: number | null
          type?: string
          updated_at?: string
        }
        Update: {
          capacity_description?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          restaurant_id?: string
          temperature_max?: number | null
          temperature_min?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "storage_locations_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          email_verified_at: string | null
          external_id: string | null
          full_name: string | null
          id: string
          last_login_at: string | null
          last_synced_at: string | null
          name: string | null
          reset_password_expires_at: string | null
          reset_password_token: string | null
          restaurant_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          email_verified_at?: string | null
          external_id?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          last_synced_at?: string | null
          name?: string | null
          reset_password_expires_at?: string | null
          reset_password_token?: string | null
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          email_verified_at?: string | null
          external_id?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          last_synced_at?: string | null
          name?: string | null
          reset_password_expires_at?: string | null
          reset_password_token?: string | null
          restaurant_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      weather_data: {
        Row: {
          condition: string
          created_at: string
          date: string
          humidity_percentage: number | null
          id: string
          is_forecast: boolean | null
          precipitation_mm: number | null
          restaurant_id: string
          temperature_max: number | null
          temperature_min: number | null
          updated_at: string
          wind_speed_kmh: number | null
        }
        Insert: {
          condition: string
          created_at?: string
          date: string
          humidity_percentage?: number | null
          id?: string
          is_forecast?: boolean | null
          precipitation_mm?: number | null
          restaurant_id: string
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string
          wind_speed_kmh?: number | null
        }
        Update: {
          condition?: string
          created_at?: string
          date?: string
          humidity_percentage?: number | null
          id?: string
          is_forecast?: boolean | null
          precipitation_mm?: number | null
          restaurant_id?: string
          temperature_max?: number | null
          temperature_min?: number | null
          updated_at?: string
          wind_speed_kmh?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      ingredients_with_conversions: {
        Row: {
          allocated_stock: number | null
          average_pieces_per_kg: number | null
          average_weight_per_piece_g: number | null
          batch_number: string | null
          category: string | null
          cost_per_unit: number | null
          cost_per_usage_unit: number | null
          created_at: string | null
          current_stock: number | null
          effective_cost_per_unit: number | null
          effective_usage_unit: string | null
          expiry_date: string | null
          external_id: string | null
          id: string | null
          is_semilavorato: boolean | null
          labeled_stock: number | null
          last_lot_conversion_update: string | null
          last_synced_at: string | null
          min_stock_threshold: number | null
          name: string | null
          notes: string | null
          origin_certification: string | null
          par_level: number | null
          primary_unit: string | null
          restaurant_id: string | null
          storage_instructions: string | null
          supplier: string | null
          supplier_product_code: string | null
          unit: string | null
          updated_at: string | null
          usage_unit: string | null
          usage_units_per_primary_unit: number | null
          yield_percentage: number | null
        }
        Insert: {
          allocated_stock?: number | null
          average_pieces_per_kg?: number | null
          average_weight_per_piece_g?: number | null
          batch_number?: string | null
          category?: string | null
          cost_per_unit?: number | null
          cost_per_usage_unit?: never
          created_at?: string | null
          current_stock?: number | null
          effective_cost_per_unit?: number | null
          effective_usage_unit?: never
          expiry_date?: string | null
          external_id?: string | null
          id?: string | null
          is_semilavorato?: boolean | null
          labeled_stock?: number | null
          last_lot_conversion_update?: string | null
          last_synced_at?: string | null
          min_stock_threshold?: number | null
          name?: string | null
          notes?: string | null
          origin_certification?: string | null
          par_level?: number | null
          primary_unit?: string | null
          restaurant_id?: string | null
          storage_instructions?: string | null
          supplier?: string | null
          supplier_product_code?: string | null
          unit?: string | null
          updated_at?: string | null
          usage_unit?: string | null
          usage_units_per_primary_unit?: never
          yield_percentage?: number | null
        }
        Update: {
          allocated_stock?: number | null
          average_pieces_per_kg?: number | null
          average_weight_per_piece_g?: number | null
          batch_number?: string | null
          category?: string | null
          cost_per_unit?: number | null
          cost_per_usage_unit?: never
          created_at?: string | null
          current_stock?: number | null
          effective_cost_per_unit?: number | null
          effective_usage_unit?: never
          expiry_date?: string | null
          external_id?: string | null
          id?: string | null
          is_semilavorato?: boolean | null
          labeled_stock?: number | null
          last_lot_conversion_update?: string | null
          last_synced_at?: string | null
          min_stock_threshold?: number | null
          name?: string | null
          notes?: string | null
          origin_certification?: string | null
          par_level?: number | null
          primary_unit?: string | null
          restaurant_id?: string | null
          storage_instructions?: string | null
          supplier?: string | null
          supplier_product_code?: string | null
          unit?: string | null
          updated_at?: string | null
          usage_unit?: string | null
          usage_units_per_primary_unit?: never
          yield_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ingredients_restaurant"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_effective_cost_per_usage_unit: {
        Args: { ingredient_id_param: string }
        Returns: number
      }
      calculate_recipe_cost: {
        Args: { recipe_id_param: string }
        Returns: {
          total_cost: number
          cost_per_portion: number
        }[]
      }
      get_category_name: {
        Args: { cat_id: string }
        Returns: string
      }
      get_current_user_restaurant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_owner_or_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      recalculate_all_recipe_costs: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      recalculate_dependent_recipe_costs: {
        Args: { changed_ingredient_id: string; is_semilavorato_param?: boolean }
        Returns: undefined
      }
      update_ingredient_conversion_from_latest_batch: {
        Args: { ingredient_id_param: string }
        Returns: undefined
      }
      update_recipe_costs: {
        Args: { recipe_id_param: string }
        Returns: undefined
      }
      update_seats: {
        Args: {
          p_restaurant_id: string
          p_reservation_time: string
          p_guests: number
          p_operation: string
        }
        Returns: undefined
      }
    }
    Enums: {
      reservation_status:
        | "nuova"
        | "approvata"
        | "in_attesa"
        | "rifiutata"
        | "completata"
        | "annullata_cliente"
        | "annullata_ristorante"
        | "nuova_richiesta"
        | "in_attesa_golden_circle"
        | "in_attesa_standard"
        | "approvata_automaticamente"
        | "approvata_manualmente"
        | "rifiutata_capacita"
        | "rifiutata_no_show_precedente"
        | "cancellata_utente"
      restaurant_type:
        | "ristorante"
        | "bar"
        | "pizzeria"
        | "pub"
        | "trattoria"
        | "osteria"
        | "pasticceria"
        | "gelateria"
        | "altro"
      user_role: "owner" | "manager" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      reservation_status: [
        "nuova",
        "approvata",
        "in_attesa",
        "rifiutata",
        "completata",
        "annullata_cliente",
        "annullata_ristorante",
        "nuova_richiesta",
        "in_attesa_golden_circle",
        "in_attesa_standard",
        "approvata_automaticamente",
        "approvata_manualmente",
        "rifiutata_capacita",
        "rifiutata_no_show_precedente",
        "cancellata_utente",
      ],
      restaurant_type: [
        "ristorante",
        "bar",
        "pizzeria",
        "pub",
        "trattoria",
        "osteria",
        "pasticceria",
        "gelateria",
        "altro",
      ],
      user_role: ["owner", "manager", "staff"],
    },
  },
} as const
