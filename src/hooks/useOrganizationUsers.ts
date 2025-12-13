import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export interface OrganizationUser {
    id: string;
    email: string;
    name: string;
    created_at: string;
}

export function useOrganizationUsers() {
    const { user } = useAuth();
    const [users, setUsers] = useState<OrganizationUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (user?.organization_id) {
            fetchUsers();
        }
    }, [user?.organization_id]);

    async function fetchUsers() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select('id, email, name, created_at')
                .eq('organization_id', user?.organization_id)
                .order('name');

            if (error) throw error;
            setUsers(data || []);
        } catch (e) {
            setError(e as Error);
        } finally {
            setLoading(false);
        }
    }

    return {
        users,
        loading,
        error,
        refresh: fetchUsers
    };
}
