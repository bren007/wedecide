import { supabase } from '../lib/supabase';

export interface RapidRoleAssignment {
    id?: string;
    role_type: 'recommend' | 'agree' | 'perform' | 'input' | 'decide';
    user_id?: string;
    user_name?: string; // For display purposes
    external_name?: string;
    external_role?: string;
    meeting_group_id?: string;
    meeting_group_name?: string; // For display purposes
}

export interface RapidRolesData {
    recommend: RapidRoleAssignment[];
    agree: RapidRoleAssignment[];
    perform: RapidRoleAssignment[];
    input: RapidRoleAssignment[];
    decide: RapidRoleAssignment[];
}

export function useRapidRoles() {

    async function getRapidRoles(decisionId: string): Promise<RapidRolesData> {
        try {
            const { data, error } = await supabase
                .from('decision_rapid_roles')
                .select(`
                    *,
                    user:users(id, name),
                    meeting_group:meeting_groups(id, name)
                `)
                .eq('decision_id', decisionId);

            if (error) throw error;

            // Transform to grouped structure
            const roles: RapidRolesData = {
                recommend: [],
                agree: [],
                perform: [],
                input: [],
                decide: []
            };

            (data || []).forEach((role: any) => {
                const assignment: RapidRoleAssignment = {
                    id: role.id,
                    role_type: role.role_type,
                    user_id: role.user_id,
                    user_name: role.user?.name,
                    external_name: role.external_name,
                    external_role: role.external_role,
                    meeting_group_id: role.meeting_group_id,
                    meeting_group_name: role.meeting_group?.name
                };

                roles[role.role_type as keyof RapidRolesData].push(assignment);
            });

            return roles;
        } catch (e) {
            console.error('❌ [getRapidRoles] Failed:', e);
            throw e;
        }
    }

    async function saveRapidRoles(decisionId: string, roles: RapidRolesData) {
        try {
            // 1. Delete existing RAPID roles for this decision
            const { error: deleteError } = await supabase
                .from('decision_rapid_roles')
                .delete()
                .eq('decision_id', decisionId);

            if (deleteError) throw deleteError;

            // 2. Flatten roles structure into insert array
            const insertData: any[] = [];

            Object.entries(roles).forEach(([roleType, assignments]) => {
                assignments.forEach((assignment: RapidRoleAssignment) => {
                    insertData.push({
                        decision_id: decisionId,
                        role_type: roleType,
                        user_id: assignment.user_id || null,
                        external_name: assignment.external_name || null,
                        external_role: assignment.external_role || null,
                        meeting_group_id: assignment.meeting_group_id || null
                    });
                });
            });

            // 3. Insert new roles (if any)
            if (insertData.length > 0) {
                const { error: insertError } = await supabase
                    .from('decision_rapid_roles')
                    .insert(insertData);

                if (insertError) throw insertError;
            }

            console.log(`✅ [saveRapidRoles] Saved ${insertData.length} RAPID role assignments`);
        } catch (e) {
            console.error('❌ [saveRapidRoles] Failed:', e);
            throw e;
        }
    }

    async function deleteRapidRoles(decisionId: string) {
        try {
            const { error } = await supabase
                .from('decision_rapid_roles')
                .delete()
                .eq('decision_id', decisionId);

            if (error) throw error;

            console.log(`✅ [deleteRapidRoles] Deleted RAPID roles for decision ${decisionId}`);
        } catch (e) {
            console.error('❌ [deleteRapidRoles] Failed:', e);
            throw e;
        }
    }

    return {
        getRapidRoles,
        saveRapidRoles,
        deleteRapidRoles
    };
}
