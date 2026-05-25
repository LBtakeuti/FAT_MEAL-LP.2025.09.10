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
      ambassadors: {
        Row: {
          created_at: string
          date: string
          department: string | null
          description: string
          icon_image: string
          id: string
          instagram_url: string | null
          is_active: boolean | null
          referrer_id: string | null
          sort_order: number | null
          thumbnail_image: string
          thumbnail_label: string | null
          tiktok_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          department?: string | null
          description: string
          icon_image: string
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          referrer_id?: string | null
          sort_order?: number | null
          thumbnail_image: string
          thumbnail_label?: string | null
          tiktok_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          department?: string | null
          description?: string
          icon_image?: string
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          referrer_id?: string | null
          sort_order?: number | null
          thumbnail_image?: string
          thumbnail_label?: string | null
          tiktok_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ambassadors_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["id"]
          },
        ]
      }
      banner_settings: {
        Row: {
          id: number
          image_url: string
          is_active: boolean
          link_url: string
          updated_at: string
        }
        Insert: {
          id?: number
          image_url?: string
          is_active?: boolean
          link_url?: string
          updated_at?: string
        }
        Update: {
          id?: number
          image_url?: string
          is_active?: boolean
          link_url?: string
          updated_at?: string
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
      faqs: {
        Row: {
          answer_detail: string
          answer_title: string
          created_at: string
          id: string
          is_active: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer_detail?: string
          answer_title: string
          created_at?: string
          id?: string
          is_active?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer_detail?: string
          answer_title?: string
          created_at?: string
          id?: string
          is_active?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          created_at: string
          date: string
          description: string
          id: string
          instagram_url: string | null
          is_active: boolean | null
          sort_order: number | null
          thumbnail_image: string
          thumbnail_label: string | null
          tiktok_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          description: string
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          thumbnail_image: string
          thumbnail_label?: string | null
          tiktok_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          sort_order?: number | null
          thumbnail_image?: string
          thumbnail_label?: string | null
          tiktok_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      individual_messages: {
        Row: {
          body_html: string
          created_at: string
          id: string
          images: Json
          is_active: boolean
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body_html?: string
          created_at?: string
          id?: string
          images?: Json
          is_active?: boolean
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          created_at?: string
          id?: string
          images?: Json
          is_active?: boolean
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_settings: {
        Row: {
          id: string
          items_per_set: number
          set_type: string
          stock_sets: number
          updated_at: string | null
        }
        Insert: {
          id?: string
          items_per_set?: number
          set_type?: string
          stock_sets?: number
          updated_at?: string | null
        }
        Update: {
          id?: string
          items_per_set?: number
          set_type?: string
          stock_sets?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      media_logos: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
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
          weight: number | null
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
          weight?: number | null
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
          weight?: number | null
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
          preferred_delivery_date: string | null
          quantity: number
          referral_code: string | null
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
          preferred_delivery_date?: string | null
          quantity?: number
          referral_code?: string | null
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
          preferred_delivery_date?: string | null
          quantity?: number
          referral_code?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          file_path: string
          filename: string
          id: string
          mime_type: string | null
          share_link_id: string
          size_bytes: number | null
          sort_order: number
          uploaded_at: string
        }
        Insert: {
          file_path: string
          filename: string
          id?: string
          mime_type?: string | null
          share_link_id: string
          size_bytes?: number | null
          sort_order?: number
          uploaded_at?: string
        }
        Update: {
          file_path?: string
          filename?: string
          id?: string
          mime_type?: string | null
          share_link_id?: string
          size_bytes?: number | null
          sort_order?: number
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_share_link_id_fkey"
            columns: ["share_link_id"]
            isOneToOne: false
            referencedRelation: "share_links"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_surveys: {
        Row: {
          created_at: string
          customer_email: string
          id: string
          order_id: string | null
          q1_answers: string[]
          q1_other_text: string | null
          q2_answers: string[]
          q2_other_text: string | null
          q3_answers: string[]
          q3_other_text: string | null
          stripe_session_id: string
          subscription_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email: string
          id?: string
          order_id?: string | null
          q1_answers?: string[]
          q1_other_text?: string | null
          q2_answers?: string[]
          q2_other_text?: string | null
          q3_answers?: string[]
          q3_other_text?: string | null
          stripe_session_id: string
          subscription_id?: string | null
        }
        Update: {
          created_at?: string
          customer_email?: string
          id?: string
          order_id?: string | null
          q1_answers?: string[]
          q1_other_text?: string | null
          q2_answers?: string[]
          q2_other_text?: string | null
          q3_answers?: string[]
          q3_other_text?: string | null
          stripe_session_id?: string
          subscription_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_surveys_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_surveys_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_commissions: {
        Row: {
          billing_period_end: string | null
          billing_period_start: string | null
          commission_amount: number
          commission_type: string
          created_at: string
          id: string
          plan_id: string
          referral_code: string
          source_id: string
          source_type: string
          stripe_invoice_id: string | null
        }
        Insert: {
          billing_period_end?: string | null
          billing_period_start?: string | null
          commission_amount: number
          commission_type: string
          created_at?: string
          id?: string
          plan_id: string
          referral_code: string
          source_id: string
          source_type: string
          stripe_invoice_id?: string | null
        }
        Update: {
          billing_period_end?: string | null
          billing_period_start?: string | null
          commission_amount?: number
          commission_type?: string
          created_at?: string
          id?: string
          plan_id?: string
          referral_code?: string
          source_id?: string
          source_type?: string
          stripe_invoice_id?: string | null
        }
        Relationships: []
      }
      referral_payouts: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          note: string | null
          paid_at: string | null
          referrer_code: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          note?: string | null
          paid_at?: string | null
          referrer_code: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          note?: string | null
          paid_at?: string | null
          referrer_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_payouts_referrer_code_fkey"
            columns: ["referrer_code"]
            isOneToOne: false
            referencedRelation: "referrers"
            referencedColumns: ["referral_code"]
          },
        ]
      }
      referrers: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
          referral_code: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          referral_code: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          referral_code?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          icon_preset: string | null
          icon_url: string | null
          id: string
          is_active: boolean | null
          name: string
          rating: number
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          comment: string
          created_at?: string
          icon_preset?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rating?: number
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          comment?: string
          created_at?: string
          icon_preset?: string | null
          icon_url?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rating?: number
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      share_access_logs: {
        Row: {
          accessed_at: string
          id: string
          ip_address: string | null
          referer: string | null
          share_link_id: string
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string
          id?: string
          ip_address?: string | null
          referer?: string | null
          share_link_id: string
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          id?: string
          ip_address?: string | null
          referer?: string | null
          share_link_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_access_logs_share_link_id_fkey"
            columns: ["share_link_id"]
            isOneToOne: false
            referencedRelation: "share_links"
            referencedColumns: ["id"]
          },
        ]
      }
      share_download_logs: {
        Row: {
          download_type: string
          downloaded_at: string
          id: string
          ip_address: string | null
          photo_id: string | null
          share_link_id: string
          user_agent: string | null
        }
        Insert: {
          download_type: string
          downloaded_at?: string
          id?: string
          ip_address?: string | null
          photo_id?: string | null
          share_link_id: string
          user_agent?: string | null
        }
        Update: {
          download_type?: string
          downloaded_at?: string
          id?: string
          ip_address?: string | null
          photo_id?: string | null
          share_link_id?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_download_logs_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "share_download_logs_share_link_id_fkey"
            columns: ["share_link_id"]
            isOneToOne: false
            referencedRelation: "share_links"
            referencedColumns: ["id"]
          },
        ]
      }
      share_link_conversions: {
        Row: {
          created_at: string
          id: string
          plan_id: string | null
          share_link_id: string
          source_id: string
          source_type: string
          stripe_invoice_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          plan_id?: string | null
          share_link_id: string
          source_id: string
          source_type: string
          stripe_invoice_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          plan_id?: string | null
          share_link_id?: string
          source_id?: string
          source_type?: string
          stripe_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "share_link_conversions_share_link_id_fkey"
            columns: ["share_link_id"]
            isOneToOne: false
            referencedRelation: "share_links"
            referencedColumns: ["id"]
          },
        ]
      }
      share_links: {
        Row: {
          body_html: string
          created_at: string
          expires_at: string | null
          id: string
          label: string | null
          slug: string
          title: string | null
        }
        Insert: {
          body_html?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          label?: string | null
          slug: string
          title?: string | null
        }
        Update: {
          body_html?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          label?: string | null
          slug?: string
          title?: string | null
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
          reasons: string[] | null
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
          reasons?: string[] | null
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
          reasons?: string[] | null
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
          carrier_notified_at: string | null
          created_at: string
          customer_email: string | null
          delivered_date: string | null
          id: string
          meals_per_delivery: number
          menu_set: string
          order_id: string | null
          order_number: number | null
          preferred_delivery_date: string | null
          quantity: number
          scheduled_date: string
          status: string
          stripe_invoice_id: string | null
          subscription_id: string
          updated_at: string
        }
        Insert: {
          carrier_notified_at?: string | null
          created_at?: string
          customer_email?: string | null
          delivered_date?: string | null
          id?: string
          meals_per_delivery?: number
          menu_set: string
          order_id?: string | null
          order_number?: number | null
          preferred_delivery_date?: string | null
          quantity?: number
          scheduled_date: string
          status?: string
          stripe_invoice_id?: string | null
          subscription_id: string
          updated_at?: string
        }
        Update: {
          carrier_notified_at?: string | null
          created_at?: string
          customer_email?: string | null
          delivered_date?: string | null
          id?: string
          meals_per_delivery?: number
          menu_set?: string
          order_id?: string | null
          order_number?: number | null
          preferred_delivery_date?: string | null
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
          notes: string | null
          payment_status: string
          plan_id: string
          plan_name: string
          preferred_delivery_date: string | null
          quantity: number
          referral_code: string | null
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
          notes?: string | null
          payment_status?: string
          plan_id: string
          plan_name: string
          preferred_delivery_date?: string | null
          quantity?: number
          referral_code?: string | null
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
          notes?: string | null
          payment_status?: string
          plan_id?: string
          plan_name?: string
          preferred_delivery_date?: string | null
          quantity?: number
          referral_code?: string | null
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
      tiktok_shop_orders: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          buyer_message: string | null
          buyer_username: string | null
          city_ward: string | null
          country: string | null
          county: string | null
          created_at: string
          created_time: string | null
          delivered_time: string | null
          first_name: string | null
          id: string
          imported_at: string
          last_name: string | null
          order_amount: string | null
          order_status: string | null
          order_substatus: string | null
          package_id: string | null
          paid_time: string | null
          payment_method: string | null
          phone: string | null
          prefecture: string | null
          product_category: string | null
          product_name: string | null
          quantity: number | null
          recipient: string | null
          rts_time: string | null
          seller_note: string | null
          seller_sku: string | null
          shipped_time: string | null
          shipping_fee_after_discount: string | null
          shipping_provider_name: string | null
          sku_id: string | null
          sku_subtotal_after_discount: string | null
          sku_unit_original_price: string | null
          status: string
          tiktok_order_id: string
          tracking_id: string | null
          updated_at: string
          variation: string | null
          zipcode: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          buyer_message?: string | null
          buyer_username?: string | null
          city_ward?: string | null
          country?: string | null
          county?: string | null
          created_at?: string
          created_time?: string | null
          delivered_time?: string | null
          first_name?: string | null
          id?: string
          imported_at?: string
          last_name?: string | null
          order_amount?: string | null
          order_status?: string | null
          order_substatus?: string | null
          package_id?: string | null
          paid_time?: string | null
          payment_method?: string | null
          phone?: string | null
          prefecture?: string | null
          product_category?: string | null
          product_name?: string | null
          quantity?: number | null
          recipient?: string | null
          rts_time?: string | null
          seller_note?: string | null
          seller_sku?: string | null
          shipped_time?: string | null
          shipping_fee_after_discount?: string | null
          shipping_provider_name?: string | null
          sku_id?: string | null
          sku_subtotal_after_discount?: string | null
          sku_unit_original_price?: string | null
          status?: string
          tiktok_order_id: string
          tracking_id?: string | null
          updated_at?: string
          variation?: string | null
          zipcode?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          buyer_message?: string | null
          buyer_username?: string | null
          city_ward?: string | null
          country?: string | null
          county?: string | null
          created_at?: string
          created_time?: string | null
          delivered_time?: string | null
          first_name?: string | null
          id?: string
          imported_at?: string
          last_name?: string | null
          order_amount?: string | null
          order_status?: string | null
          order_substatus?: string | null
          package_id?: string | null
          paid_time?: string | null
          payment_method?: string | null
          phone?: string | null
          prefecture?: string | null
          product_category?: string | null
          product_name?: string | null
          quantity?: number | null
          recipient?: string | null
          rts_time?: string | null
          seller_note?: string | null
          seller_sku?: string | null
          shipped_time?: string | null
          shipping_fee_after_discount?: string | null
          shipping_provider_name?: string | null
          sku_id?: string | null
          sku_subtotal_after_discount?: string | null
          sku_unit_original_price?: string | null
          status?: string
          tiktok_order_id?: string
          tracking_id?: string | null
          updated_at?: string
          variation?: string | null
          zipcode?: string | null
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

