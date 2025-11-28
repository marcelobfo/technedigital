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
      blog_posts: {
        Row: {
          author_id: string
          category: string
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["post_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category: string
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["post_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["post_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_settings: {
        Row: {
          automation_enabled: boolean
          id: string
          posts_per_week: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          automation_enabled?: boolean
          id?: string
          posts_per_week?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          automation_enabled?: boolean
          id?: string
          posts_per_week?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      contact_settings: {
        Row: {
          business_hours: string | null
          created_at: string | null
          email: string
          id: string
          location: string
          maps_embed_url: string
          phone: string
          show_map: boolean | null
          updated_at: string | null
          updated_by: string | null
          whatsapp_number: string | null
        }
        Insert: {
          business_hours?: string | null
          created_at?: string | null
          email?: string
          id?: string
          location?: string
          maps_embed_url?: string
          phone?: string
          show_map?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          business_hours?: string | null
          created_at?: string | null
          email?: string
          id?: string
          location?: string
          maps_embed_url?: string
          phone?: string
          show_map?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_settings: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          provider: string
          resend_api_key: string | null
          resend_from_email: string | null
          resend_from_name: string | null
          smtp_from_email: string | null
          smtp_from_name: string | null
          smtp_host: string | null
          smtp_password: string | null
          smtp_port: number | null
          smtp_secure: boolean | null
          smtp_user: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          resend_api_key?: string | null
          resend_from_email?: string | null
          resend_from_name?: string | null
          smtp_from_email?: string | null
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_user?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          provider?: string
          resend_api_key?: string | null
          resend_from_email?: string | null
          resend_from_name?: string | null
          smtp_from_email?: string | null
          smtp_from_name?: string | null
          smtp_host?: string | null
          smtp_password?: string | null
          smtp_port?: number | null
          smtp_secure?: boolean | null
          smtp_user?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      financial_records: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          date: string
          id: string
          installment_number: number | null
          installments: number | null
          lead_id: string | null
          notes: string | null
          payment_method: string | null
          proposal_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["financial_type"]
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          date: string
          id?: string
          installment_number?: number | null
          installments?: number | null
          lead_id?: string | null
          notes?: string | null
          payment_method?: string | null
          proposal_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type: Database["public"]["Enums"]["financial_type"]
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          date?: string
          id?: string
          installment_number?: number | null
          installments?: number | null
          lead_id?: string | null
          notes?: string | null
          payment_method?: string | null
          proposal_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          type?: Database["public"]["Enums"]["financial_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_records_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_records_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      google_search_console_settings: {
        Row: {
          access_token: string | null
          auto_submit_on_publish: boolean | null
          auto_submit_sitemap: boolean | null
          client_id: string
          client_secret: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sitemap_submit: string | null
          property_url: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          access_token?: string | null
          auto_submit_on_publish?: boolean | null
          auto_submit_sitemap?: boolean | null
          client_id: string
          client_secret: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sitemap_submit?: string | null
          property_url?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          access_token?: string | null
          auto_submit_on_publish?: boolean | null
          auto_submit_sitemap?: boolean | null
          client_id?: string
          client_secret?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sitemap_submit?: string | null
          property_url?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at: string
          description: string
          id: string
          lead_id: string
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          description: string
          id?: string
          lead_id: string
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          created_at?: string
          description?: string
          id?: string
          lead_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          assigned_to: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          priority: Database["public"]["Enums"]["lead_priority"]
          read: boolean | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          read?: boolean | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          read?: boolean | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_logs: {
        Row: {
          api_response: Json | null
          created_at: string
          email: string
          error_message: string | null
          id: string
          post_id: string | null
          send_type: string
          sent_at: string | null
          status: string
          subscriber_id: string | null
        }
        Insert: {
          api_response?: Json | null
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          post_id?: string | null
          send_type?: string
          sent_at?: string | null
          status?: string
          subscriber_id?: string | null
        }
        Update: {
          api_response?: Json | null
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          post_id?: string | null
          send_type?: string
          sent_at?: string | null
          status?: string
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_logs_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_logs_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          status: string
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          status?: string
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      portfolio_projects: {
        Row: {
          challenge: string | null
          client_name: string | null
          cover_image: string | null
          created_at: string
          description: string
          display_order: number | null
          gallery_images: string[] | null
          id: string
          is_featured: boolean | null
          project_url: string | null
          results: string | null
          slug: string
          solution: string | null
          status: Database["public"]["Enums"]["content_status"]
          tags: string[] | null
          technologies: string[] | null
          title: string
        }
        Insert: {
          challenge?: string | null
          client_name?: string | null
          cover_image?: string | null
          created_at?: string
          description: string
          display_order?: number | null
          gallery_images?: string[] | null
          id?: string
          is_featured?: boolean | null
          project_url?: string | null
          results?: string | null
          slug: string
          solution?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          technologies?: string[] | null
          title: string
        }
        Update: {
          challenge?: string | null
          client_name?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string
          display_order?: number | null
          gallery_images?: string[] | null
          id?: string
          is_featured?: boolean | null
          project_url?: string | null
          results?: string | null
          slug?: string
          solution?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: string[] | null
          technologies?: string[] | null
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
        }
        Relationships: []
      }
      proposal_items: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          proposal_id: string
          quantity: number
          service_name: string
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          proposal_id: string
          quantity?: number
          service_name: string
          subtotal?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          proposal_id?: string
          quantity?: number
          service_name?: string
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          created_at: string
          created_by: string
          discount_amount: number | null
          discount_percentage: number | null
          final_amount: number
          id: string
          lead_id: string
          notes: string | null
          proposal_number: string
          sent_at: string | null
          sent_to_email: string | null
          sent_to_whatsapp: string | null
          sent_via: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          terms_and_conditions: string | null
          total_amount: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          discount_amount?: number | null
          discount_percentage?: number | null
          final_amount?: number
          id?: string
          lead_id: string
          notes?: string | null
          proposal_number: string
          sent_at?: string | null
          sent_to_email?: string | null
          sent_to_whatsapp?: string | null
          sent_via?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          discount_amount?: number | null
          discount_percentage?: number | null
          final_amount?: number
          id?: string
          lead_id?: string
          notes?: string | null
          proposal_number?: string
          sent_at?: string | null
          sent_to_email?: string | null
          sent_to_whatsapp?: string | null
          sent_via?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_indexing_status: {
        Row: {
          coverage_state: string | null
          created_at: string | null
          errors: Json | null
          id: string
          indexing_status: string | null
          last_checked: string | null
          last_crawled: string | null
          page_type: string | null
          reference_id: string | null
          url: string
          warnings: Json | null
        }
        Insert: {
          coverage_state?: string | null
          created_at?: string | null
          errors?: Json | null
          id?: string
          indexing_status?: string | null
          last_checked?: string | null
          last_crawled?: string | null
          page_type?: string | null
          reference_id?: string | null
          url: string
          warnings?: Json | null
        }
        Update: {
          coverage_state?: string | null
          created_at?: string | null
          errors?: Json | null
          id?: string
          indexing_status?: string | null
          last_checked?: string | null
          last_crawled?: string | null
          page_type?: string | null
          reference_id?: string | null
          url?: string
          warnings?: Json | null
        }
        Relationships: []
      }
      service_catalog: {
        Row: {
          category: string | null
          created_at: string
          default_price: number
          description: string | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          default_price: number
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          default_price?: number
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          display_order: number | null
          features: Json | null
          full_description: string
          icon: string | null
          id: string
          is_featured: boolean | null
          short_description: string
          slug: string
          status: Database["public"]["Enums"]["content_status"]
          title: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          features?: Json | null
          full_description: string
          icon?: string | null
          id?: string
          is_featured?: boolean | null
          short_description: string
          slug: string
          status?: Database["public"]["Enums"]["content_status"]
          title: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          features?: Json | null
          full_description?: string
          icon?: string | null
          id?: string
          is_featured?: boolean | null
          short_description?: string
          slug?: string
          status?: Database["public"]["Enums"]["content_status"]
          title?: string
        }
        Relationships: []
      }
      site_analytics: {
        Row: {
          created_at: string | null
          device_type: string | null
          id: string
          page_path: string
          referrer: string | null
          session_id: string
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          id?: string
          page_path: string
          referrer?: string | null
          session_id: string
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          id?: string
          page_path?: string
          referrer?: string | null
          session_id?: string
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          custom_body_scripts: string | null
          custom_head_scripts: string | null
          facebook_pixel_id: string | null
          google_analytics_id: string | null
          id: string
          meta_description: string | null
          meta_keywords: string[] | null
          meta_title: string | null
          tracking_pixels: Json | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          custom_body_scripts?: string | null
          custom_head_scripts?: string | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          tracking_pixels?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          custom_body_scripts?: string | null
          custom_head_scripts?: string | null
          facebook_pixel_id?: string | null
          google_analytics_id?: string | null
          id?: string
          meta_description?: string | null
          meta_keywords?: string[] | null
          meta_title?: string | null
          tracking_pixels?: Json | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          client_company: string | null
          client_name: string
          client_photo: string | null
          client_role: string
          created_at: string
          display_order: number | null
          id: string
          is_featured: boolean | null
          rating: number
          status: Database["public"]["Enums"]["content_status"]
          testimonial_text: string
        }
        Insert: {
          client_company?: string | null
          client_name: string
          client_photo?: string | null
          client_role: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          rating: number
          status?: Database["public"]["Enums"]["content_status"]
          testimonial_text: string
        }
        Update: {
          client_company?: string | null
          client_name?: string
          client_photo?: string | null
          client_role?: string
          created_at?: string
          display_order?: number | null
          id?: string
          is_featured?: boolean | null
          rating?: number
          status?: Database["public"]["Enums"]["content_status"]
          testimonial_text?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_logs: {
        Row: {
          api_response: Json | null
          created_at: string
          error_message: string | null
          formatted_phone: string | null
          id: string
          lead_id: string | null
          message_type: string
          phone_number: string
          status: string
        }
        Insert: {
          api_response?: Json | null
          created_at?: string
          error_message?: string | null
          formatted_phone?: string | null
          id?: string
          lead_id?: string | null
          message_type?: string
          phone_number: string
          status?: string
        }
        Update: {
          api_response?: Json | null
          created_at?: string
          error_message?: string | null
          formatted_phone?: string | null
          id?: string
          lead_id?: string | null
          message_type?: string
          phone_number?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_settings: {
        Row: {
          api_token: string
          api_url: string
          id: string
          instance_name: string
          is_active: boolean | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          api_token: string
          api_url: string
          id?: string
          instance_name: string
          is_active?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          api_token?: string
          api_url?: string
          id?: string
          instance_name?: string
          is_active?: boolean | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_proposal_number: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_type:
        | "note"
        | "status_change"
        | "email_sent"
        | "call"
        | "meeting"
        | "proposal_sent"
      app_role: "admin" | "editor" | "viewer"
      content_status: "active" | "inactive"
      financial_type: "income" | "expense"
      lead_priority: "low" | "medium" | "high"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "proposal_sent"
        | "won"
        | "lost"
      payment_status: "pending" | "paid" | "canceled"
      post_status: "draft" | "published" | "archived"
      proposal_status: "draft" | "sent" | "accepted" | "rejected"
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
    Enums: {
      activity_type: [
        "note",
        "status_change",
        "email_sent",
        "call",
        "meeting",
        "proposal_sent",
      ],
      app_role: ["admin", "editor", "viewer"],
      content_status: ["active", "inactive"],
      financial_type: ["income", "expense"],
      lead_priority: ["low", "medium", "high"],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "proposal_sent",
        "won",
        "lost",
      ],
      payment_status: ["pending", "paid", "canceled"],
      post_status: ["draft", "published", "archived"],
      proposal_status: ["draft", "sent", "accepted", "rejected"],
    },
  },
} as const
