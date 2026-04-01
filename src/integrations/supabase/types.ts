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
      ad_slots: {
        Row: {
          currency: string | null
          id: string
          is_enabled: boolean | null
          max_active: number | null
          price_monthly: number | null
          price_weekly: number | null
          slot_type: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          currency?: string | null
          id?: string
          is_enabled?: boolean | null
          max_active?: number | null
          price_monthly?: number | null
          price_weekly?: number | null
          slot_type: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          currency?: string | null
          id?: string
          is_enabled?: boolean | null
          max_active?: number | null
          price_monthly?: number | null
          price_weekly?: number | null
          slot_type?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_slots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          clicks: number | null
          created_at: string | null
          expires_at: string | null
          headline: string | null
          id: string
          impressions: number | null
          link_url: string | null
          media_url: string | null
          slot_type: string
          starts_at: string | null
          status: string | null
          tenant_id: string
          venue_id: string | null
        }
        Insert: {
          clicks?: number | null
          created_at?: string | null
          expires_at?: string | null
          headline?: string | null
          id?: string
          impressions?: number | null
          link_url?: string | null
          media_url?: string | null
          slot_type: string
          starts_at?: string | null
          status?: string | null
          tenant_id: string
          venue_id?: string | null
        }
        Update: {
          clicks?: number | null
          created_at?: string | null
          expires_at?: string | null
          headline?: string | null
          id?: string
          impressions?: number | null
          link_url?: string | null
          media_url?: string | null
          slot_type?: string
          starts_at?: string | null
          status?: string | null
          tenant_id?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ads_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          tenant_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          tenant_id: string
          trigger_threshold: number | null
          trigger_type: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tenant_id: string
          trigger_threshold?: number | null
          trigger_type?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tenant_id?: string
          trigger_threshold?: number | null
          trigger_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "badges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
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
      blog_posts: {
        Row: {
          author_id: string | null
          content: string | null
          cover_image_url: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          scheduled_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          tags: string[] | null
          tenant_id: string
          title: string
          views_count: number | null
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          tags?: string[] | null
          tenant_id: string
          title: string
          views_count?: number | null
        }
        Update: {
          author_id?: string | null
          content?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          scheduled_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          tags?: string[] | null
          tenant_id?: string
          title?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_tenant_id_fkey"
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
      chat_messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          is_deleted: boolean | null
          media_url: string | null
          room_id: string | null
          sender_id: string | null
          tenant_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          media_url?: string | null
          room_id?: string | null
          sender_id?: string | null
          tenant_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          is_deleted?: boolean | null
          media_url?: string | null
          room_id?: string | null
          sender_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string | null
          created_by: string | null
          group_id: string | null
          id: string
          name: string
          tenant_id: string
          type: string | null
          venue_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          id?: string
          name: string
          tenant_id: string
          type?: string | null
          venue_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          group_id?: string | null
          id?: string
          name?: string
          tenant_id?: string
          type?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_rooms_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
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
      conversations: {
        Row: {
          id: string
          last_message: string | null
          last_message_at: string | null
          participants: string[]
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          participants: string[]
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          last_message?: string | null
          last_message_at?: string | null
          participants?: string[]
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          badge_label: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          tenant_id: string
          terms_url: string | null
          title: string
          valid_from: string | null
          valid_to: string | null
          venue_id: string | null
        }
        Insert: {
          badge_label?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id: string
          terms_url?: string | null
          title: string
          valid_from?: string | null
          valid_to?: string | null
          venue_id?: string | null
        }
        Update: {
          badge_label?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          tenant_id?: string
          terms_url?: string | null
          title?: string
          valid_from?: string | null
          valid_to?: string | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_boards: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discussion_boards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_replies: {
        Row: {
          content: string
          created_at: string | null
          discussion_id: string | null
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
          discussion_id?: string | null
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
          discussion_id?: string | null
          id?: string
          is_hidden?: boolean | null
          likes_count?: number | null
          parent_id?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discussion_replies_discussion_id_fkey"
            columns: ["discussion_id"]
            isOneToOne: false
            referencedRelation: "discussions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "discussion_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussion_replies_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      discussions: {
        Row: {
          board_id: string | null
          content: string | null
          created_at: string | null
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          replies_count: number | null
          tenant_id: string
          title: string
          user_id: string | null
          views_count: number | null
        }
        Insert: {
          board_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          replies_count?: number | null
          tenant_id: string
          title: string
          user_id?: string | null
          views_count?: number | null
        }
        Update: {
          board_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          replies_count?: number | null
          tenant_id?: string
          title?: string
          user_id?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discussions_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "discussion_boards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discussions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          attendees_count: number | null
          capacity: number | null
          category_id: string | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          end_at: string | null
          id: string
          is_free: boolean | null
          location_lat: number | null
          location_lng: number | null
          price: number | null
          start_at: string | null
          status: string | null
          tenant_id: string
          ticket_link: string | null
          title: string
          venue_id: string | null
        }
        Insert: {
          address?: string | null
          attendees_count?: number | null
          capacity?: number | null
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          is_free?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          price?: number | null
          start_at?: string | null
          status?: string | null
          tenant_id: string
          ticket_link?: string | null
          title: string
          venue_id?: string | null
        }
        Update: {
          address?: string | null
          attendees_count?: number | null
          capacity?: number | null
          category_id?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          end_at?: string | null
          id?: string
          is_free?: boolean | null
          location_lat?: number | null
          location_lng?: number | null
          price?: number | null
          start_at?: string | null
          status?: string | null
          tenant_id?: string
          ticket_link?: string | null
          title?: string
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      faqs: {
        Row: {
          answer: string
          category: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          question: string
          sort_order: number | null
          tenant_id: string
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question: string
          sort_order?: number | null
          tenant_id: string
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          question?: string
          sort_order?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "faqs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      group_members: {
        Row: {
          group_id: string | null
          id: string
          joined_at: string | null
          role: string | null
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          group_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          group_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          avatar_url: string | null
          cover_url: string | null
          created_at: string | null
          creator_id: string | null
          description: string | null
          id: string
          is_private: boolean | null
          member_count: number | null
          name: string
          tenant_id: string
        }
        Insert: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name: string
          tenant_id: string
        }
        Update: {
          avatar_url?: string | null
          cover_url?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          member_count?: number | null
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_tenant_id_fkey"
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
      messages: {
        Row: {
          content: string | null
          conversation_id: string | null
          created_at: string | null
          id: string
          media_url: string | null
          original_content: string | null
          read_at: string | null
          sender_id: string | null
          tenant_id: string
          translated_content: Json | null
        }
        Insert: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          media_url?: string | null
          original_content?: string | null
          read_at?: string | null
          sender_id?: string | null
          tenant_id: string
          translated_content?: Json | null
        }
        Update: {
          content?: string | null
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          media_url?: string | null
          original_content?: string | null
          read_at?: string | null
          sender_id?: string | null
          tenant_id?: string
          translated_content?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      notifications: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          message: string
          read_at: string | null
          tenant_id: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message: string
          read_at?: string | null
          tenant_id: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          message?: string
          read_at?: string | null
          tenant_id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content_blocks: Json | null
          created_at: string | null
          id: string
          is_published: boolean | null
          nav_label: string | null
          og_image_url: string | null
          seo_description: string | null
          seo_title: string | null
          show_in_nav: boolean | null
          slug: string
          sort_order: number | null
          tenant_id: string
          title: string
        }
        Insert: {
          content_blocks?: Json | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          nav_label?: string | null
          og_image_url?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_in_nav?: boolean | null
          slug: string
          sort_order?: number | null
          tenant_id: string
          title: string
        }
        Update: {
          content_blocks?: Json | null
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          nav_label?: string | null
          og_image_url?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_in_nav?: boolean | null
          slug?: string
          sort_order?: number | null
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_tenant_id_fkey"
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
      subscription_plans: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price_annual: number | null
          price_monthly: number | null
          price_quarterly: number | null
          sort_order: number | null
          stripe_annual_price_id: string | null
          stripe_monthly_price_id: string | null
          stripe_quarterly_price_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price_annual?: number | null
          price_monthly?: number | null
          price_quarterly?: number | null
          sort_order?: number | null
          stripe_annual_price_id?: string | null
          stripe_monthly_price_id?: string | null
          stripe_quarterly_price_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_annual?: number | null
          price_monthly?: number | null
          price_quarterly?: number | null
          sort_order?: number | null
          stripe_annual_price_id?: string | null
          stripe_monthly_price_id?: string | null
          stripe_quarterly_price_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount: number | null
          billing_cycle: string | null
          cancelled_at: string | null
          created_at: string | null
          currency: string | null
          expires_at: string | null
          id: string
          plan_id: string | null
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          starts_at: string | null
          status: string | null
          subscriber_id: string
          subscriber_type: string
          tenant_id: string
        }
        Insert: {
          amount?: number | null
          billing_cycle?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          starts_at?: string | null
          status?: string | null
          subscriber_id: string
          subscriber_type: string
          tenant_id: string
        }
        Update: {
          amount?: number | null
          billing_cycle?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          currency?: string | null
          expires_at?: string | null
          id?: string
          plan_id?: string | null
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          starts_at?: string | null
          status?: string | null
          subscriber_id?: string
          subscriber_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_tenant_id_fkey"
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
      translations: {
        Row: {
          id: string
          language_code: string
          string_key: string
          tenant_id: string
          updated_at: string | null
          value: string
        }
        Insert: {
          id?: string
          language_code: string
          string_key: string
          tenant_id: string
          updated_at?: string | null
          value: string
        }
        Update: {
          id?: string
          language_code?: string
          string_key?: string
          tenant_id?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "translations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string | null
          earned_at: string | null
          id: string
          tenant_id: string
          user_id: string | null
        }
        Insert: {
          badge_id?: string | null
          earned_at?: string | null
          id?: string
          tenant_id: string
          user_id?: string | null
        }
        Update: {
          badge_id?: string | null
          earned_at?: string | null
          id?: string
          tenant_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
      webhook_logs: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          event: string | null
          id: string
          payload: Json | null
          response_body: string | null
          status_code: number | null
          tenant_id: string
          webhook_id: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          event?: string | null
          id?: string
          payload?: Json | null
          response_body?: string | null
          status_code?: number | null
          tenant_id: string
          webhook_id?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          event?: string | null
          id?: string
          payload?: Json | null
          response_body?: string | null
          status_code?: number | null
          tenant_id?: string
          webhook_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      webhooks: {
        Row: {
          created_at: string | null
          events: Json | null
          id: string
          is_active: boolean | null
          secret: string | null
          tenant_id: string
          url: string
        }
        Insert: {
          created_at?: string | null
          events?: Json | null
          id?: string
          is_active?: boolean | null
          secret?: string | null
          tenant_id: string
          url: string
        }
        Update: {
          created_at?: string | null
          events?: Json | null
          id?: string
          is_active?: boolean | null
          secret?: string | null
          tenant_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_tenant_id_fkey"
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
