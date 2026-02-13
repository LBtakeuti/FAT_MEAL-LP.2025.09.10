export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          menu_item_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          menu_item_id: string
          quantity: number
          updated_at?: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          menu_item_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          name_kana: string | null
          phone: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          name_kana?: string | null
          phone?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          name_kana?: string | null
          phone?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          allergens: string[] | null
          calories: number
          carbs: number
          created_at: string | null
          description: string | null
          display_order: number | null
          fat: number
          id: string
          ingredients: string[] | null
          is_active: boolean | null
          main_image: string | null
          name: string
          price: number | null
          protein: number
          slug: string | null
          stock: number | null
          sub_images: string[] | null
          updated_at: string | null
        }
        Insert: {
          allergens?: string[] | null
          calories: number
          carbs: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          fat: number
          id?: string
          ingredients?: string[] | null
          is_active?: boolean | null
          main_image?: string | null
          name: string
          price?: number | null
          protein: number
          slug?: string | null
          stock?: number | null
          sub_images?: string[] | null
          updated_at?: string | null
        }
        Update: {
          allergens?: string[] | null
          calories?: number
          carbs?: number
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          fat?: number
          id?: string
          ingredients?: string[] | null
          is_active?: boolean | null
          main_image?: string | null
          name?: string
          price?: number | null
          protein?: number
          slug?: string | null
          stock?: number | null
          sub_images?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      news: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          date: string | null
          excerpt: string | null
          id: string
          image: string | null
          summary: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          date?: string | null
          excerpt?: string | null
          id?: string
          image?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          date?: string | null
          excerpt?: string | null
          id?: string
          image?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string | null
          address_detail: string | null
          amount: number
          building: string | null
          city: string | null
          created_at: string
          currency: string
          customer_email: string
          customer_name: string
          customer_name_kana: string | null
          id: string
          menu_set: string
          notes: string | null
          order_number: number
          phone: string | null
          postal_code: string | null
          prefecture: string | null
          quantity: number
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          address_detail?: string | null
          amount: number
          building?: string | null
          city?: string | null
          created_at?: string
          currency?: string
          customer_email: string
          customer_name: string
          customer_name_kana?: string | null
          id?: string
          menu_set: string
          notes?: string | null
          order_number?: number
          phone?: string | null
          postal_code?: string | null
          prefecture?: string | null
          quantity?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          address_detail?: string | null
          amount?: number
          building?: string | null
          city?: string | null
          created_at?: string
          currency?: string
          customer_email?: string
          customer_name?: string
          customer_name_kana?: string | null
          id?: string
          menu_set?: string
          notes?: string | null
          order_number?: number
          phone?: string | null
          postal_code?: string | null
          prefecture?: string | null
          quantity?: number
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscription_cancellation_requests: {
        Row: {
          cancelled_at: string | null
          created_at: string
          customer_email: string
          customer_name: string
          id: string
          message: string | null
          reason: string | null
          status: string
          stripe_subscription_id: string | null
          subscription_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          id?: string
          message?: string | null
          reason?: string | null
          status?: string
          stripe_subscription_id?: string | null
          subscription_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          id?: string
          message?: string | null
          reason?: string | null
          status?: string
          stripe_subscription_id?: string | null
          subscription_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_cancellation_requests_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_deliveries: {
        Row: {
          created_at: string
          delivered_date: string | null
          id: string
          meals_per_delivery: number
          menu_set: string
          order_id: string | null
          order_number: number | null
          quantity: number
          scheduled_date: string
          status: string
          stripe_invoice_id: string | null
          subscription_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivered_date?: string | null
          id?: string
          meals_per_delivery?: number
          menu_set: string
          order_id?: string | null
          order_number?: number | null
          quantity?: number
          scheduled_date: string
          status?: string
          stripe_invoice_id?: string | null
          subscription_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivered_date?: string | null
          id?: string
          meals_per_delivery?: number
          menu_set?: string
          order_id?: string | null
          order_number?: number | null
          quantity?: number
          scheduled_date?: string
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_deliveries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          deliveries_per_month: number
          id: string
          last_delivery_date: string | null
          meals_per_delivery: number
          monthly_product_price: number
          monthly_shipping_fee: number
          monthly_total_amount: number
          next_delivery_date: string | null
          payment_status: string
          plan_id: string
          plan_name: string
          preferred_delivery_date: string | null
          quantity: number
          shipping_address: Json
          started_at: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start: string
          deliveries_per_month: number
          id?: string
          last_delivery_date?: string | null
          meals_per_delivery?: number
          monthly_product_price: number
          monthly_shipping_fee: number
          monthly_total_amount: number
          next_delivery_date?: string | null
          payment_status?: string
          plan_id: string
          plan_name: string
          preferred_delivery_date?: string | null
          quantity?: number
          shipping_address: Json
          started_at?: string
          status?: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          deliveries_per_month?: number
          id?: string
          last_delivery_date?: string | null
          meals_per_delivery?: number
          monthly_product_price?: number
          monthly_shipping_fee?: number
          monthly_total_amount?: number
          next_delivery_date?: string | null
          payment_status?: string
          plan_id?: string
          plan_name?: string
          preferred_delivery_date?: string | null
          quantity?: number
          shipping_address?: Json
          started_at?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string
          stripe_subscription_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          address_detail: string | null
          building: string | null
          city: string | null
          created_at: string
          email: string
          first_name: string | null
          first_name_kana: string | null
          id: string
          last_name: string | null
          last_name_kana: string | null
          phone: string | null
          postal_code: string | null
          prefecture: string | null
          updated_at: string
        }
        Insert: {
          address_detail?: string | null
          building?: string | null
          city?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          first_name_kana?: string | null
          id: string
          last_name?: string | null
          last_name_kana?: string | null
          phone?: string | null
          postal_code?: string | null
          prefecture?: string | null
          updated_at?: string
        }
        Update: {
          address_detail?: string | null
          building?: string | null
          city?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          first_name_kana?: string | null
          id?: string
          last_name?: string | null
          last_name_kana?: string | null
          phone?: string | null
          postal_code?: string | null
          prefecture?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_settings: {
        Row: {
          id: string
          set_type: string
          stock_sets: number
          items_per_set: number
          updated_at: string
        }
        Insert: {
          id?: string
          set_type?: string
          stock_sets?: number
          items_per_set?: number
          updated_at?: string
        }
        Update: {
          id?: string
          set_type?: string
          stock_sets?: number
          items_per_set?: number
          updated_at?: string
        }
        Relationships: []
      }
      banner_settings: {
        Row: {
          id: number
          is_active: boolean
          image_url: string
          link_url: string
          updated_at: string
        }
        Insert: {
          id?: number
          is_active?: boolean
          image_url?: string
          link_url?: string
          updated_at?: string
        }
        Update: {
          id?: number
          is_active?: boolean
          image_url?: string
          link_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      referral_commissions: {
        Row: {
          id: string
          referral_code: string
          source_type: string
          source_id: string
          stripe_invoice_id: string | null
          plan_id: string
          commission_type: string
          commission_amount: number
          billing_period_start: string | null
          billing_period_end: string | null
          created_at: string
        }
        Insert: {
          id?: string
          referral_code: string
          source_type: string
          source_id: string
          stripe_invoice_id?: string | null
          plan_id: string
          commission_type: string
          commission_amount: number
          billing_period_start?: string | null
          billing_period_end?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          referral_code?: string
          source_type?: string
          source_id?: string
          stripe_invoice_id?: string | null
          plan_id?: string
          commission_type?: string
          commission_amount?: number
          billing_period_start?: string | null
          billing_period_end?: string | null
          created_at?: string
        }
        Relationships: []
      }
      referrers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          referral_code: string
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          referral_code: string
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          referral_code?: string
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          id: string
          thumbnail_image: string
          thumbnail_label: string | null
          date: string
          title: string
          description: string
          sort_order: number | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          thumbnail_image: string
          thumbnail_label?: string | null
          date: string
          title: string
          description: string
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          thumbnail_image?: string
          thumbnail_label?: string | null
          date?: string
          title?: string
          description?: string
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ambassadors: {
        Row: {
          id: string
          thumbnail_image: string
          thumbnail_label: string | null
          icon_image: string
          department: string | null
          date: string
          title: string
          description: string
          sort_order: number | null
          is_active: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          thumbnail_image: string
          thumbnail_label?: string | null
          icon_image: string
          department?: string | null
          date: string
          title: string
          description: string
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          thumbnail_image?: string
          thumbnail_label?: string | null
          icon_image?: string
          department?: string | null
          date?: string
          title?: string
          description?: string
          sort_order?: number | null
          is_active?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
