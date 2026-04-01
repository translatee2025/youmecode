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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
          tenant_id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
          tenant_id: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          applies_to: string | null
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number | null
          tenant_id: string
          translations: Json | null
        }
        Insert: {
          applies_to?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number | null
          tenant_id: string
          translations?: Json | null
        }
        Update: {
          applies_to?: string | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number | null
          tenant_id?: string
          translations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      category_packages: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          slug: string
          suggested_categories: Json | null
          suggested_filter_fields: Json | null
          suggested_subcategories: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          slug: string
          suggested_categories?: Json | null
          suggested_filter_fields?: Json | null
          suggested_subcategories?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          slug?: string
          suggested_categories?: Json | null
          suggested_filter_fields?: Json | null
          suggested_subcategories?: Json | null
        }
        Relationships: []
      }
      checkins: {
        Row: {
          created_at: string | null
          id: string
          note: string | null
          tenant_id: string
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          note?: string | null
          tenant_id: string
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          note?: string | null
          tenant_id?: string
          user_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checkins_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checkins_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      claim_requests: {
        Row: {
          created_at: string | null
          document_url: string | null
          email_used: string | null
          id: string
          message: string | null
          method: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          tenant_id: string
          user_id: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_url?: string | null
          email_used?: string | null
          id?: string
          message?: string | null
          method: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tenant_id: string
          user_id?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_url?: string | null
          email_used?: string | null
          id?: string
          message?: string | null
          method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          tenant_id?: string
          user_id?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "claim_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "claim_requests_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          is_hidden: boolean | null
          likes_count: number | null
          parent_id: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_hidden?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_hidden?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      filter_fields: {
        Row: {
          applies_to: string | null
          category_id: string
          created_at: string | null
          field_key: string
          field_type: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          label: string
          options: Json | null
          placeholder: string | null
          show_in_card: boolean | null
          show_in_quick_filters: boolean | null
          sort_order: number | null
          subcategory_id: string | null
          tenant_id: string
          translations: Json | null
        }
        Insert: {
          applies_to?: string | null
          category_id: string
          created_at?: string | null
          field_key: string
          field_type: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          label: string
          options?: Json | null
          placeholder?: string | null
          show_in_card?: boolean | null
          show_in_quick_filters?: boolean | null
          sort_order?: number | null
          subcategory_id?: string | null
          tenant_id: string
          translations?: Json | null
        }
        Update: {
          applies_to?: string | null
          category_id?: string
          created_at?: string | null
          field_key?: string
          field_type?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          label?: string
          options?: Json | null
          placeholder?: string | null
          show_in_card?: boolean | null
          show_in_quick_filters?: boolean | null
          sort_order?: number | null
          subcategory_id?: string | null
          tenant_id?: string
          translations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "filter_fields_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filter_fields_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "filter_fields_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          followee_id: string
          followee_type: string
          follower_id: string
          id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          followee_id: string
          followee_type: string
          follower_id: string
          id?: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          followee_id?: string
          followee_type?: string
          follower_id?: string
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtags: {
        Row: {
          created_at: string | null
          followers_count: number | null
          id: string
          posts_count: number | null
          tag: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          followers_count?: number | null
          id?: string
          posts_count?: number | null
          tag: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          followers_count?: number | null
          id?: string
          posts_count?: number | null
          tag?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hashtags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      module_settings: {
        Row: {
          icon: string | null
          id: string
          is_enabled: boolean | null
          is_homepage: boolean | null
          label: string
          module_key: string
          nav_label: string | null
          show_in_nav: boolean | null
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          is_homepage?: boolean | null
          label: string
          module_key: string
          nav_label?: string | null
          show_in_nav?: boolean | null
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          icon?: string | null
          id?: string
          is_enabled?: boolean | null
          is_homepage?: boolean | null
          label?: string
          module_key?: string
          nav_label?: string | null
          show_in_nav?: boolean | null
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mutes: {
        Row: {
          created_at: string | null
          id: string
          muted_id: string
          muter_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          muted_id: string
          muter_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          muted_id?: string
          muter_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mutes_muted_id_fkey"
            columns: ["muted_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mutes_muter_id_fkey"
            columns: ["muter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mutes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          poll_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          poll_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number
          poll_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poll_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      polls: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          options: Json
          question: string
          tenant_id: string
          total_votes: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          options?: Json
          question: string
          tenant_id: string
          total_votes?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          options?: Json
          question?: string
          tenant_id?: string
          total_votes?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "polls_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "polls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string | null
          created_at: string | null
          hashtags: string[] | null
          id: string
          is_pinned: boolean | null
          likes_count: number | null
          location_city: string | null
          location_lat: number | null
          location_lng: number | null
          media_urls: Json | null
          poll_id: string | null
          post_type: string | null
          scheduled_at: string | null
          tenant_id: string
          thumbnail_url: string | null
          user_id: string | null
          venue_id: string | null
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          location_city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          media_urls?: Json | null
          poll_id?: string | null
          post_type?: string | null
          scheduled_at?: string | null
          tenant_id: string
          thumbnail_url?: string | null
          user_id?: string | null
          venue_id?: string | null
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          comments_count?: number | null
          content?: string | null
          created_at?: string | null
          hashtags?: string[] | null
          id?: string
          is_pinned?: boolean | null
          likes_count?: number | null
          location_city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          media_urls?: Json | null
          poll_id?: string | null
          post_type?: string | null
          scheduled_at?: string | null
          tenant_id?: string
          thumbnail_url?: string | null
          user_id?: string | null
          venue_id?: string | null
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      product_types: {
        Row: {
          category_id: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          tenant_id: string
          translations: Json | null
        }
        Insert: {
          category_id: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          tenant_id: string
          translations?: Json | null
        }
        Update: {
          category_id?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          tenant_id?: string
          translations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "product_types_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          external_link: string | null
          filter_values: Json | null
          id: string
          images: Json | null
          likes_count: number | null
          name: string
          payment_methods: Json | null
          price: number | null
          price_unit: string | null
          product_type_id: string | null
          rating_avg: number | null
          rating_count: number | null
          sort_order: number | null
          status: string | null
          subcategory_id: string | null
          tenant_id: string
          venue_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_link?: string | null
          filter_values?: Json | null
          id?: string
          images?: Json | null
          likes_count?: number | null
          name: string
          payment_methods?: Json | null
          price?: number | null
          price_unit?: string | null
          product_type_id?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          sort_order?: number | null
          status?: string | null
          subcategory_id?: string | null
          tenant_id: string
          venue_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_link?: string | null
          filter_values?: Json | null
          id?: string
          images?: Json | null
          likes_count?: number | null
          name?: string
          payment_methods?: Json | null
          price?: number | null
          price_unit?: string | null
          product_type_id?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          sort_order?: number | null
          status?: string | null
          subcategory_id?: string | null
          tenant_id?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_type_id_fkey"
            columns: ["product_type_id"]
            isOneToOne: false
            referencedRelation: "product_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          review_text: string | null
          score: number
          status: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          review_text?: string | null
          score: number
          status?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          review_text?: string | null
          score?: number
          status?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ratings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          detail: string | null
          entity_id: string
          entity_type: string
          id: string
          reason: string
          reporter_id: string | null
          reviewed_by: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          detail?: string | null
          entity_id: string
          entity_type: string
          id?: string
          reason: string
          reporter_id?: string | null
          reviewed_by?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          detail?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string
          reporter_id?: string | null
          reviewed_by?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      saves: {
        Row: {
          collection_name: string | null
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          collection_name?: string | null
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          collection_name?: string | null
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saves_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          active_languages: Json | null
          commerce_enabled: boolean | null
          contact_email: string | null
          custom_css: string | null
          default_language: string | null
          favicon_url: string | null
          footer_html: string | null
          id: string
          local_llm_endpoint: string | null
          media_upload_mode: string | null
          permissions_matrix: Json | null
          product_label: string | null
          rtl_languages: Json | null
          seo_description: string | null
          seo_title: string | null
          site_logo_url: string | null
          site_name: string | null
          site_tagline: string | null
          social_links: Json | null
          tenant_id: string
          translation_api_key: string | null
          translation_model: string | null
          translation_provider: string | null
          updated_at: string | null
          user_api_keys_enabled: boolean | null
          user_label: string | null
          venue_label: string | null
          widgets_enabled: boolean | null
        }
        Insert: {
          active_languages?: Json | null
          commerce_enabled?: boolean | null
          contact_email?: string | null
          custom_css?: string | null
          default_language?: string | null
          favicon_url?: string | null
          footer_html?: string | null
          id?: string
          local_llm_endpoint?: string | null
          media_upload_mode?: string | null
          permissions_matrix?: Json | null
          product_label?: string | null
          rtl_languages?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          site_logo_url?: string | null
          site_name?: string | null
          site_tagline?: string | null
          social_links?: Json | null
          tenant_id: string
          translation_api_key?: string | null
          translation_model?: string | null
          translation_provider?: string | null
          updated_at?: string | null
          user_api_keys_enabled?: boolean | null
          user_label?: string | null
          venue_label?: string | null
          widgets_enabled?: boolean | null
        }
        Update: {
          active_languages?: Json | null
          commerce_enabled?: boolean | null
          contact_email?: string | null
          custom_css?: string | null
          default_language?: string | null
          favicon_url?: string | null
          footer_html?: string | null
          id?: string
          local_llm_endpoint?: string | null
          media_upload_mode?: string | null
          permissions_matrix?: Json | null
          product_label?: string | null
          rtl_languages?: Json | null
          seo_description?: string | null
          seo_title?: string | null
          site_logo_url?: string | null
          site_name?: string | null
          site_tagline?: string | null
          social_links?: Json | null
          tenant_id?: string
          translation_api_key?: string | null
          translation_model?: string | null
          translation_provider?: string | null
          updated_at?: string | null
          user_api_keys_enabled?: boolean | null
          user_label?: string | null
          venue_label?: string | null
          widgets_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          applies_to: string | null
          category_id: string
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          sort_order: number | null
          tenant_id: string
          translations: Json | null
        }
        Insert: {
          applies_to?: string | null
          category_id: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          tenant_id: string
          translations?: Json | null
        }
        Update: {
          applies_to?: string | null
          category_id?: string
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          tenant_id?: string
          translations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subcategories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          custom_domain: string | null
          id: string
          logo_url: string | null
          name: string
          onboarding_completed: boolean | null
          platform_type: string | null
          status: string | null
          subdomain: string | null
        }
        Insert: {
          created_at?: string | null
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          onboarding_completed?: boolean | null
          platform_type?: string | null
          status?: string | null
          subdomain?: string | null
        }
        Update: {
          created_at?: string | null
          custom_domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          onboarding_completed?: boolean | null
          platform_type?: string | null
          status?: string | null
          subdomain?: string | null
        }
        Relationships: []
      }
      theme_settings: {
        Row: {
          id: string
          key: string
          tenant_id: string
          updated_at: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          tenant_id: string
          updated_at?: string | null
          value: string
        }
        Update: {
          id?: string
          key?: string
          tenant_id?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string | null
          custom_field_values: Json | null
          display_name: string | null
          email: string | null
          followers_count: number | null
          following_count: number | null
          id: string
          is_banned: boolean | null
          is_verified: boolean | null
          location_city: string | null
          location_lat: number | null
          location_lng: number | null
          notification_prefs: Json | null
          own_api_key: string | null
          preferred_language: string | null
          role: string | null
          tenant_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          custom_field_values?: Json | null
          display_name?: string | null
          email?: string | null
          followers_count?: number | null
          following_count?: number | null
          id: string
          is_banned?: boolean | null
          is_verified?: boolean | null
          location_city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notification_prefs?: Json | null
          own_api_key?: string | null
          preferred_language?: string | null
          role?: string | null
          tenant_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string | null
          custom_field_values?: Json | null
          display_name?: string | null
          email?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          is_banned?: boolean | null
          is_verified?: boolean | null
          location_city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notification_prefs?: Json | null
          own_api_key?: string | null
          preferred_language?: string | null
          role?: string | null
          tenant_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          address: string | null
          category_id: string | null
          commerce_terms_accepted_at: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          email: string | null
          filter_values: Json | null
          id: string
          images: Json | null
          is_featured: boolean | null
          is_verified: boolean | null
          likes_count: number | null
          location_city: string | null
          location_country: string | null
          location_lat: number | null
          location_lng: number | null
          name: string
          opening_hours: Json | null
          owner_id: string | null
          phone: string | null
          postcode: string | null
          rating_avg: number | null
          rating_count: number | null
          short_description: string | null
          slug: string | null
          social_links: Json | null
          status: string | null
          subcategory_id: string | null
          subscription_expires_at: string | null
          subscription_status: string | null
          tags: string[] | null
          tenant_id: string
          views_count: number | null
          website: string | null
        }
        Insert: {
          address?: string | null
          category_id?: string | null
          commerce_terms_accepted_at?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          filter_values?: Json | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          likes_count?: number | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lng?: number | null
          name: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          postcode?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          short_description?: string | null
          slug?: string | null
          social_links?: Json | null
          status?: string | null
          subcategory_id?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          tags?: string[] | null
          tenant_id: string
          views_count?: number | null
          website?: string | null
        }
        Update: {
          address?: string | null
          category_id?: string | null
          commerce_terms_accepted_at?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          email?: string | null
          filter_values?: Json | null
          id?: string
          images?: Json | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          likes_count?: number | null
          location_city?: string | null
          location_country?: string | null
          location_lat?: number | null
          location_lng?: number | null
          name?: string
          opening_hours?: Json | null
          owner_id?: string | null
          phone?: string | null
          postcode?: string | null
          rating_avg?: number | null
          rating_count?: number | null
          short_description?: string | null
          slug?: string | null
          social_links?: Json | null
          status?: string | null
          subcategory_id?: string | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          tags?: string[] | null
          tenant_id?: string
          views_count?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venues_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venues_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
