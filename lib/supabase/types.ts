export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SessionStatus = 'draft' | 'open' | 'submitted' | 'closed';

export interface Database {
  public: {
    Tables: {
      settings: {
        Row: {
          id: number;
          whatsapp_number: string;
          code_separator: string;
          default_max_selection: number;
          message_template: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          whatsapp_number?: string;
          code_separator?: string;
          default_max_selection?: number;
          message_template?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          whatsapp_number?: string;
          code_separator?: string;
          default_max_selection?: number;
          message_template?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      sessions: {
        Row: {
          id: string;
          slug: string;
          client_name: string;
          client_phone: string | null;
          university: string | null;
          graduation_date: string | null;
          drive_folder_id: string;
          max_selection: number;
          status: SessionStatus;
          expires_at: string | null;
          submitted_at: string | null;
          last_synced_at: string | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          client_name: string;
          client_phone?: string | null;
          university?: string | null;
          graduation_date?: string | null;
          drive_folder_id: string;
          max_selection?: number;
          status?: SessionStatus;
          expires_at?: string | null;
          submitted_at?: string | null;
          last_synced_at?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          client_name?: string;
          client_phone?: string | null;
          university?: string | null;
          graduation_date?: string | null;
          drive_folder_id?: string;
          max_selection?: number;
          status?: SessionStatus;
          expires_at?: string | null;
          submitted_at?: string | null;
          last_synced_at?: string | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      photos: {
        Row: {
          id: string;
          session_id: string;
          drive_file_id: string;
          file_name: string;
          code: string;
          width: number | null;
          height: number | null;
          sort_order: number;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          drive_file_id: string;
          file_name: string;
          code: string;
          width?: number | null;
          height?: number | null;
          sort_order?: number;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          drive_file_id?: string;
          file_name?: string;
          code?: string;
          width?: number | null;
          height?: number | null;
          sort_order?: number;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "photos_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      selections: {
        Row: {
          session_id: string;
          photo_id: string;
          created_at: string | null;
        };
        Insert: {
          session_id: string;
          photo_id: string;
          created_at?: string | null;
        };
        Update: {
          session_id?: string;
          photo_id?: string;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "selections_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "selections_photo_id_fkey";
            columns: ["photo_id"];
            referencedRelation: "photos";
            referencedColumns: ["id"];
          }
        ];
      };
      submissions: {
        Row: {
          id: string;
          session_id: string;
          photo_codes: string[];
          photo_count: number;
          submitted_at: string | null;
        };
        Insert: {
          id?: string;
          session_id: string;
          photo_codes: string[];
          photo_count: number;
          submitted_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string;
          photo_codes?: string[];
          photo_count?: number;
          submitted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "sessions";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      toggle_selection: {
        Args: {
          p_slug: string;
          p_photo_id: string;
        };
        Returns: {
          ok: boolean;
          error?: string;
          selected?: boolean;
          count?: number;
        };
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
