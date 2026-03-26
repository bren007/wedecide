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
            leads: {
                Row: {
                    id: string
                    created_at: string
                    email: string
                    organization_name: string | null
                    portfolio_scale: string | null
                    primary_pain_point: string | null
                    data_minimisation_acknowledged: boolean | null
                    nda_accepted: boolean | null
                    payment_status: string | null
                    audit_status: string | null
                    file_url: string | null
                    report_url: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    email: string
                    organization_name?: string | null
                    portfolio_scale?: string | null
                    primary_pain_point?: string | null
                    data_minimisation_acknowledged?: boolean | null
                    nda_accepted?: boolean | null
                    payment_status?: string | null
                    audit_status?: string | null
                    file_url?: string | null
                    report_url?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    email?: string
                    organization_name?: string | null
                    portfolio_scale?: string | null
                    primary_pain_point?: string | null
                    data_minimisation_acknowledged?: boolean | null
                    nda_accepted?: boolean | null
                    payment_status?: string | null
                    audit_status?: string | null
                    file_url?: string | null
                    report_url?: string | null
                }
                Relationships: []
            }
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
                    is_global_admin: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    email: string
                    name: string
                    organization_id: string
                    is_global_admin?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    name?: string
                    organization_id?: string
                    is_global_admin?: boolean
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
                    status: "draft" | "submitted" | "active" | "completed" | "rejected"
                    owner_id: string
                    organization_id: string
                    created_at: string
                    updated_at: string
                    decision: string | null
                    decision_type: "note" | "approve" | null
                    reversibility_type: "type1_irreversible" | "type2_reversible" | null
                    agenda_item_id: string | null
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    status?: "draft" | "submitted" | "active" | "completed" | "rejected"
                    owner_id: string
                    organization_id: string
                    created_at?: string
                    updated_at?: string
                    decision?: string | null
                    decision_type?: "note" | "approve" | null
                    reversibility_type?: "type1_irreversible" | "type2_reversible" | null
                    agenda_item_id?: string | null
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    status?: "draft" | "submitted" | "active" | "completed" | "rejected"
                    owner_id?: string
                    organization_id?: string
                    created_at?: string
                    updated_at?: string
                    decision?: string | null
                    decision_type?: "note" | "approve" | null
                    reversibility_type?: "type1_irreversible" | "type2_reversible" | null
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
                    },
                    {
                        foreignKeyName: "decisions_agenda_item_id_fkey"
                        columns: ["agenda_item_id"]
                        referencedRelation: "agenda_items"
                        referencedColumns: ["id"]
                    }
                ]
            }
            decision_feedback: {
                Row: {
                    id: string
                    decision_id: string
                    user_id: string
                    content: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    decision_id: string
                    user_id: string
                    content: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    decision_id?: string
                    user_id?: string
                    content?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "decision_feedback_decision_id_fkey"
                        columns: ["decision_id"]
                        referencedRelation: "decisions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "decision_feedback_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
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
                    started_at: string | null
                    ended_at: string | null
                    snapshot_start: Json | null
                    snapshot_end: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    title: string
                    description?: string | null
                    scheduled_at?: string
                    location?: string | null
                    status?: "scheduled" | "in_progress" | "completed" | "cancelled"
                    started_at?: string | null
                    ended_at?: string | null
                    snapshot_start?: Json | null
                    snapshot_end?: Json | null
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
                    started_at?: string | null
                    ended_at?: string | null
                    snapshot_start?: Json | null
                    snapshot_end?: Json | null
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
            },
            meeting_groups: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    description: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    name?: string
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "meeting_groups_organization_id_fkey"
                        columns: ["organization_id"]
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    }
                ]
            },
            meeting_attendees: {
                Row: {
                    id: string
                    meeting_id: string
                    user_id: string
                    status: "invited" | "accepted" | "declined" | "present" | "absent"
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    meeting_id: string
                    user_id: string
                    status?: "invited" | "accepted" | "declined" | "present" | "absent"
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    meeting_id?: string
                    user_id?: string
                    status?: "invited" | "accepted" | "declined" | "present" | "absent"
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "meeting_attendees_meeting_id_fkey"
                        columns: ["meeting_id"]
                        referencedRelation: "meetings"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "meeting_attendees_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            },
            decision_rapid_roles: {
                Row: {
                    id: string
                    decision_id: string
                    role_type: "recommend" | "agree" | "perform" | "input" | "decide"
                    user_id: string | null
                    external_name: string | null
                    external_role: string | null
                    meeting_group_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    decision_id: string
                    role_type: "recommend" | "agree" | "perform" | "input" | "decide"
                    user_id?: string | null
                    external_name?: string | null
                    external_role?: string | null
                    meeting_group_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    decision_id?: string
                    role_type: "recommend" | "agree" | "perform" | "input" | "decide"
                    user_id?: string | null
                    external_name?: string | null
                    external_role?: string | null
                    meeting_group_id?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "decision_rapid_roles_decision_id_fkey"
                        columns: ["decision_id"]
                        referencedRelation: "decisions"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "decision_rapid_roles_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "decision_rapid_roles_meeting_group_id_fkey"
                        columns: ["meeting_group_id"]
                        referencedRelation: "meeting_groups"
                        referencedColumns: ["id"]
                    }
                ]
            }
            capacity_settings: {
                Row: {
                    id: string
                    org_id: string
                    total_focus_slots: number
                    total_capex_limit: number
                    total_opex_limit: number
                    value_drop_horizon_days: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    org_id: string
                    total_focus_slots?: number
                    total_capex_limit?: number
                    total_opex_limit?: number
                    value_drop_horizon_days?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    org_id?: string
                    total_focus_slots?: number
                    total_capex_limit?: number
                    total_opex_limit?: number
                    value_drop_horizon_days?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "capacity_settings_org_id_fkey"
                        columns: ["org_id"]
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            strategic_pillars: {
                Row: {
                    id: string
                    org_id: string
                    title: string
                    target_weight: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    org_id: string
                    title: string
                    target_weight?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    org_id?: string
                    title?: string
                    target_weight?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "strategic_pillars_org_id_fkey"
                        columns: ["org_id"]
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    }
                ]
            }
            initiatives: {
                Row: {
                    id: string
                    org_id: string
                    owner_id: string | null
                    title: string
                    focus_slots_required: number
                    capex_required: number
                    opex_required: number
                    short_term_win: boolean
                    strategic_pillar_id: string | null
                    status: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    org_id: string
                    owner_id?: string | null
                    title: string
                    focus_slots_required?: number
                    capex_required?: number
                    opex_required?: number
                    short_term_win?: boolean
                    strategic_pillar_id?: string | null
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    org_id?: string
                    owner_id?: string | null
                    title?: string
                    focus_slots_required?: number
                    capex_required?: number
                    opex_required?: number
                    short_term_win?: boolean
                    strategic_pillar_id?: string | null
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "initiatives_org_id_fkey"
                        columns: ["org_id"]
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "initiatives_owner_id_fkey"
                        columns: ["owner_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "initiatives_strategic_pillar_id_fkey"
                        columns: ["strategic_pillar_id"]
                        referencedRelation: "strategic_pillars"
                        referencedColumns: ["id"]
                    }
                ]
            }
            strategic_ledger: {
                Row: {
                    id: string
                    org_id: string
                    initiative_id: string | null
                    chair_id: string | null
                    action_type: string
                    rationale: string | null
                    replaced_ids: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    org_id: string
                    initiative_id?: string | null
                    chair_id?: string | null
                    action_type: string
                    rationale?: string | null
                    replaced_ids?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    org_id?: string
                    initiative_id?: string | null
                    chair_id?: string | null
                    action_type?: string
                    rationale?: string | null
                    replaced_ids?: Json | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "strategic_ledger_org_id_fkey"
                        columns: ["org_id"]
                        referencedRelation: "organizations"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "strategic_ledger_initiative_id_fkey"
                        columns: ["initiative_id"]
                        referencedRelation: "initiatives"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "strategic_ledger_chair_id_fkey"
                        columns: ["chair_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            },
            invitations: {
                Row: {
                    id: string
                    organization_id: string
                    email: string
                    role: string
                    token: string
                    status: string
                    expires_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    email: string
                    role: string
                    token: string
                    status?: string
                    expires_at: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    email?: string
                    role?: string
                    token?: string
                    status?: string
                    expires_at?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "invitations_organization_id_fkey"
                        columns: ["organization_id"]
                        referencedRelation: "organizations"
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
            update_lead_by_email: {
                Args: {
                    p_email: string
                    p_status: string
                    p_file_url?: string
                }
                Returns: undefined
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
