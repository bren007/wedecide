export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            organizations: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    subscription_tier: string
                    subscription_status: string
                    max_users: number
                    max_decisions: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    subscription_tier?: string
                    subscription_status?: string
                    max_users?: number
                    max_decisions?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    subscription_tier?: string
                    subscription_status?: string
                    max_users?: number
                    max_decisions?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            users: {
                Row: {
                    id: string
                    email: string
                    name: string
                    organization_id: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    name: string
                    organization_id: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string
                    organization_id?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "users_organization_id_fkey"
                        columns: ["organization_id"]
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            user_roles: {
                Row: {
                    id: string
                    user_id: string
                    organization_id: string
                    role: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    organization_id: string
                    role: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    organization_id?: string
                    role?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_roles_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "user_roles_organization_id_fkey"
                        columns: ["organization_id"]
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            decisions: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    status: "draft" | "active" | "completed"
                    owner_id: string
                    organization_id: string
                    created_at: string
                    updated_at: string
                    decision: string | null
                    decision_type: "note" | "approve" | null
                    agenda_item_id: string | null
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    status?: "draft" | "active" | "completed"
                    owner_id: string
                    organization_id: string
                    created_at?: string
                    updated_at?: string
                    decision?: string | null
                    decision_type?: "note" | "approve" | null
                    agenda_item_id?: string | null
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    status?: "draft" | "active" | "completed"
                    owner_id?: string
                    organization_id?: string
                    created_at?: string
                    updated_at?: string
                    decision?: string | null
                    decision_type?: "note" | "approve" | null
                    agenda_item_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "decisions_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "decisions_organization_id_fkey"
                        columns: ["organization_id"]
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            stakeholders: {
                Row: {
                    id: string
                    decision_id: string
                    email: string
                    name: string
                    user_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    decision_id: string
                    email: string
                    name: string
                    user_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    decision_id?: string
                    email?: string
                    name?: string
                    user_id?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "stakeholders_decision_id_fkey"
                        columns: ["decision_id"]
                        referencedRelation: "decisions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "stakeholders_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            documents: {
                Row: {
                    id: string
                    decision_id: string
                    uploaded_by: string
                    organization_id: string
                    name: string
                    type: string
                    url: string
                    file_size: number | null
                    mime_type: string | null
                    description: string | null
                    is_part_of_meeting_pack: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    decision_id: string
                    uploaded_by: string
                    organization_id: string
                    name: string
                    type: string
                    url: string
                    file_size?: number | null
                    mime_type?: string | null
                    description?: string | null
                    is_part_of_meeting_pack?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    decision_id?: string
                    uploaded_by?: string
                    organization_id?: string
                    name?: string
                    type?: string
                    url?: string
                    file_size?: number | null
                    mime_type?: string | null
                    description?: string | null
                    is_part_of_meeting_pack?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "documents_decision_id_fkey"
                        columns: ["decision_id"]
                        referencedRelation: "decisions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "documents_uploaded_by_fkey"
                        columns: ["uploaded_by"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "documents_organization_id_fkey"
                        columns: ["organization_id"]
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            affected_parties: {
                Row: {
                    id: string
                    decision_id: string
                    name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    decision_id: string
                    name: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    decision_id?: string
                    name?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "affected_parties_decision_id_fkey"
                        columns: ["decision_id"]
                        referencedRelation: "decisions"
                        referencedColumns: ["id"]
                    }
                ]
            }
            meetings: {
                Row: {
                    id: string
                    organization_id: string
                    title: string
                    description: string | null
                    scheduled_at: string
                    location: string | null
                    status: "scheduled" | "in_progress" | "completed" | "cancelled"
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    title: string
                    description?: string | null
                    scheduled_at: string
                    location?: string | null
                    status?: "scheduled" | "in_progress" | "completed" | "cancelled"
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    title?: string
                    description?: string | null
                    scheduled_at?: string
                    location?: string | null
                    status?: "scheduled" | "in_progress" | "completed" | "cancelled"
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "meetings_organization_id_fkey"
                        columns: ["organization_id"]
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            agenda_items: {
                Row: {
                    id: string
                    meeting_id: string
                    title: string
                    description: string | null
                    order_index: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    meeting_id: string
                    title: string
                    description?: string | null
                    order_index?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    meeting_id?: string
                    title?: string
                    description?: string | null
                    order_index?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "agenda_items_meeting_id_fkey"
                        columns: ["meeting_id"]
                        referencedRelation: "meetings"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            invite_user: {
                Args: {
                    p_email: string
                    p_role: string
                }
                Returns: {
                    success: boolean
                    token: string
                }
            }
            accept_invitation: {
                Args: {
                    p_token: string
                }
                Returns: Json
            }
            create_signup_data: {
                Args: {
                    p_user_id: string
                    p_email: string
                    p_name: string
                    p_org_name: string
                    p_org_slug: string
                }
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
