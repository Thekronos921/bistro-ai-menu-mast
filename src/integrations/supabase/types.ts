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
          category: string
          created_at: string
          id: string
          name: string
          recipe_id: string | null
          restaurant_id: string
          selling_price: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          name: string
          recipe_id?: string | null
          restaurant_id: string
          selling_price: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          recipe_id?: string | null
          restaurant_id?: string
          selling_price?: number
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
        ]
      }
      ingredient_batches: {
        Row: {
          batch_number: string
          created_at: string
          expiry_date: string
          id: string
          ingredient_id: string | null
          notes: string | null
          quantity_received: number
          quantity_remaining: number
          restaurant_id: string | null
          storage_location: string | null
          supplier_delivery_date: string | null
          updated_at: string
        }
        Insert: {
          batch_number: string
          created_at?: string
          expiry_date: string
          id?: string
          ingredient_id?: string | null
          notes?: string | null
          quantity_received?: number
          quantity_remaining?: number
          restaurant_id?: string | null
          storage_location?: string | null
          supplier_delivery_date?: string | null
          updated_at?: string
        }
        Update: {
          batch_number?: string
          created_at?: string
          expiry_date?: string
          id?: string
          ingredient_id?: string | null
          notes?: string | null
          quantity_received?: number
          quantity_remaining?: number
          restaurant_id?: string | null
          storage_location?: string | null
          supplier_delivery_date?: string | null
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
          batch_number: string | null
          category: string | null
          cost_per_unit: number
          created_at: string
          current_stock: number | null
          effective_cost_per_unit: number | null
          expiry_date: string | null
          external_id: string | null
          id: string
          last_synced_at: string | null
          min_stock_threshold: number | null
          name: string
          notes: string | null
          origin_certification: string | null
          par_level: number | null
          restaurant_id: string
          storage_instructions: string | null
          supplier: string | null
          supplier_product_code: string | null
          unit: string
          updated_at: string
          yield_percentage: number
        }
        Insert: {
          batch_number?: string | null
          category?: string | null
          cost_per_unit: number
          created_at?: string
          current_stock?: number | null
          effective_cost_per_unit?: number | null
          expiry_date?: string | null
          external_id?: string | null
          id?: string
          last_synced_at?: string | null
          min_stock_threshold?: number | null
          name: string
          notes?: string | null
          origin_certification?: string | null
          par_level?: number | null
          restaurant_id: string
          storage_instructions?: string | null
          supplier?: string | null
          supplier_product_code?: string | null
          unit?: string
          updated_at?: string
          yield_percentage?: number
        }
        Update: {
          batch_number?: string | null
          category?: string | null
          cost_per_unit?: number
          created_at?: string
          current_stock?: number | null
          effective_cost_per_unit?: number | null
          expiry_date?: string | null
          external_id?: string | null
          id?: string
          last_synced_at?: string | null
          min_stock_threshold?: number | null
          name?: string
          notes?: string | null
          origin_certification?: string | null
          par_level?: number | null
          restaurant_id?: string
          storage_instructions?: string | null
          supplier?: string | null
          supplier_product_code?: string | null
          unit?: string
          updated_at?: string
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
      local_events: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          event_type: string
          expected_impact: string | null
          id: string
          impact_percentage: number | null
          is_active: boolean | null
          location: string | null
          name: string
          radius_km: number | null
          restaurant_id: string
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          event_type: string
          expected_impact?: string | null
          id?: string
          impact_percentage?: number | null
          is_active?: boolean | null
          location?: string | null
          name: string
          radius_km?: number | null
          restaurant_id: string
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          event_type?: string
          expected_impact?: string | null
          id?: string
          impact_percentage?: number | null
          is_active?: boolean | null
          location?: string | null
          name?: string
          radius_km?: number | null
          restaurant_id?: string
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
          unit: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_id?: string | null
          is_semilavorato?: boolean | null
          quantity: number
          recipe_id?: string | null
          unit?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_id?: string | null
          is_semilavorato?: boolean | null
          quantity?: number
          recipe_id?: string | null
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
          calories: number | null
          carbs: number | null
          category: string
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
          calories?: number | null
          carbs?: number | null
          category: string
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
          calories?: number | null
          carbs?: number | null
          category?: string
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
      restaurants: {
        Row: {
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
          date: string
          day_of_week: number
          id: string
          is_holiday: boolean | null
          notes: string | null
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
          date: string
          day_of_week: number
          id?: string
          is_holiday?: boolean | null
          notes?: string | null
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
          date?: string
          day_of_week?: number
          id?: string
          is_holiday?: boolean | null
          notes?: string | null
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
      users: {
        Row: {
          created_at: string
          email: string
          email_verified_at: string | null
          full_name: string
          id: string
          last_login_at: string | null
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
          full_name: string
          id?: string
          last_login_at?: string | null
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
          full_name?: string
          id?: string
          last_login_at?: string | null
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
      [_ in never]: never
    }
    Functions: {
      get_current_user_restaurant_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_owner_or_manager: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
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
