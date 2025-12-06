import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Navbar } from '../components/Navbar';

interface Organization {
    id: string;
    name: string;
    slug: string;
    created_at: string;
}

interface Member {
    id: string;
    user_id: string;
    role: string;
    created_at: string;
    user_details?: {
        name: string;
        email: string;
    }
}

export const OrganizationSettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [org, setOrg] = useState<Organization | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [orgName, setOrgName] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        fetchOrganization();
    }, [user]);

    const fetchOrganization = async () => {
        try {
            if (!user) return;

            // 1. Get the organization the user belongs to via organization_members
            const { data: memberData, error: memberError } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', user.id)
                .single();

            if (memberError) throw memberError;

            if (memberData) {
                // 2. Get the organization details
                const { data: orgData, error: orgError } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', memberData.organization_id)
                    .single();

                if (orgError) throw orgError;

                setOrg(orgData);
                setOrgName(orgData.name);

                // 3. Get the members of the organization
                const { data: membersData, error: membersError } = await supabase
                    .from('organization_members')
                    .select('*')
                    .eq('organization_id', memberData.organization_id);

                if (membersError) throw membersError;

                // 4. For each member, we would ideally fetch user details (name, email)
                // However, `auth.users` is not accessible directly from the client.
                // In a real app, you'd have a public-facing `profiles` table or use an RPC function.
                // For now, we'll try to fetch from the `users` table we created.
                if (membersData) {
                    const membersWithDetails = await Promise.all(membersData.map(async (member) => {
                        const { data: userData } = await supabase
                            .from('users')
                            .select('name, email')
                            .eq('id', member.user_id)
                            .single();

                        return {
                            ...member,
                            user_details: userData || { name: 'Unknown User', email: '' }
                        };
                    }));
                    setMembers(membersWithDetails);
                }
            }
        } catch (error) {
            console.error('Error fetching organization:', error);
            setMessage({ type: 'error', text: 'Failed to load organization details' });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateName = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        setSaving(true);

        try {
            if (!org) return;

            const { error } = await supabase
                .from('organizations')
                .update({ name: orgName })
                .eq('id', org.id);

            if (error) throw error;

            setMessage({ type: 'success', text: 'Organization name updated successfully' });
            setOrg({ ...org, name: orgName });
        } catch (error) {
            console.error('Error updating organization:', error);
            setMessage({ type: 'error', text: 'Failed to update organization name' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex justify-center items-center">
                <p className="text-gray-500">Loading organization details...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold text-gray-900 mb-6">Organization Settings</h1>

                    <Card className="mb-6">
                        <h2 className="text-xl font-semibold mb-4">General Settings</h2>

                        <form onSubmit={handleUpdateName}>
                            <Input
                                label="Organization Name"
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                placeholder="Enter organization name"
                                className="mb-4"
                            />

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Slug</label>
                                <div className="p-3 bg-gray-100 rounded-md text-gray-600 font-mono text-sm">
                                    {org?.slug}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">The slug is used in URLs and cannot be changed.</p>
                            </div>

                            {message && (
                                <div className={`p-3 rounded-md mb-4 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                    }`}>
                                    {message.text}
                                </div>
                            )}

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={saving || orgName === org?.name}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    </Card>

                    <Card>
                        <h2 className="text-xl font-semibold mb-4">Team Members</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">Member</th>
                                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                                        <th className="py-2 px-4 border-b border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {members.map((member) => (
                                        <tr key={member.id}>
                                            <td className="py-3 px-4 border-b border-gray-200">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900">{member.user_details?.name}</span>
                                                    <span className="text-sm text-gray-500">{member.user_details?.email}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 border-b border-gray-200">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {member.role || 'Member'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 border-b border-gray-200 text-sm text-gray-500">
                                                {new Date(member.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {members.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-4 text-center text-gray-500">
                                                No members found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};
