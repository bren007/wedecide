import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { Navbar } from '../components/Navbar';
import { LoadingSpinner } from '../components/Loading';

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

    // Invite State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchOrganization();
        }
    }, [user]);

    const fetchOrganization = async () => {
        try {
            if (!user) return;

            // 1. Get the organization the user belongs to via users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('organization_id')
                .eq('id', user.id)
                .single();

            if (userError) throw userError;

            if (userData) {
                // 2. Get the organization details
                const { data: orgData, error: orgError } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', userData.organization_id)
                    .single();

                if (orgError) throw orgError;

                setOrg(orgData);
                setOrgName(orgData.name);

                // 3. Get the members of the organization
                const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('organization_id', userData.organization_id);

                if (usersError) throw usersError;

                // 4. Get roles for these users
                const { data: rolesData, error: rolesError } = await supabase
                    .from('user_roles')
                    .select('*')
                    .eq('organization_id', userData.organization_id);

                if (rolesError) throw rolesError;

                if (usersData) {
                    const membersWithDetails = usersData.map((userMember) => {
                        const userRole = rolesData?.find(r => r.user_id === userMember.id);
                        return {
                            id: userMember.id, // Using user ID as member ID since we lack a join table id
                            user_id: userMember.id,
                            role: userRole?.role || 'member',
                            created_at: userMember.created_at,
                            user_details: {
                                name: userMember.name,
                                email: userMember.email
                            }
                        };
                    });
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

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        setInviteLink(null);
        setMessage(null);

        try {
            const { data, error } = await supabase.rpc('invite_user', {
                p_email: inviteEmail,
                p_role: inviteRole
            });

            if (error) throw error;

            if (data && data.success) {
                const link = `${window.location.origin}/signup?token=${data.token}`;
                setInviteLink(link);
                setMessage({ type: 'success', text: 'Invitation generated successfully!' });
                // Optionally clear form or keep it for the next one?
                // setInviteEmail('');
            }

        } catch (error: any) {
            console.error('Error inviting user:', error);
            setMessage({ type: 'error', text: error.message || 'Failed to invite user' });
        } finally {
            setInviteLoading(false);
        }
    };

    const copyInviteLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            setMessage({ type: 'success', text: 'Invite link copied to clipboard!' });
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
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

                    {/* Invite Modal / Section */}
                    {showInviteModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <Card className="w-full max-w-md">
                                <h2 className="text-xl font-semibold mb-4">Invite New Member</h2>

                                {!inviteLink ? (
                                    <form onSubmit={handleInviteUser}>
                                        <Input
                                            type="email"
                                            label="Email Address"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            placeholder="colleague@example.com"
                                            required
                                            className="mb-4"
                                        />

                                        <div className="mb-6">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                            <select
                                                value={inviteRole}
                                                onChange={(e) => setInviteRole(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="member">Member</option>
                                                <option value="admin">Admin</option>
                                                <option value="chair">Chair</option>
                                                <option value="secretary">Secretary</option>
                                            </select>
                                        </div>

                                        <div className="flex justify-end gap-3">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                onClick={() => setShowInviteModal(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="submit"
                                                variant="primary"
                                                disabled={inviteLoading}
                                            >
                                                {inviteLoading ? 'Generating Link...' : 'Generate Invite Link'}
                                            </Button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-4 bg-green-50 rounded-md border border-green-200">
                                            <p className="text-sm text-green-800 mb-2 font-medium">Invitation Created!</p>
                                            <p className="text-xs text-green-600 mb-3">Share this link with the user to let them join your organization.</p>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={inviteLink}
                                                    className="flex-1 text-sm p-2 border border-gray-300 rounded bg-white text-gray-600 font-mono"
                                                />
                                                <Button type="button" variant="secondary" onClick={copyInviteLink} size="sm">
                                                    Copy
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="flex justify-end">
                                            <Button
                                                type="button"
                                                variant="primary"
                                                onClick={() => {
                                                    setShowInviteModal(false);
                                                    setInviteLink(null);
                                                    setInviteEmail('');
                                                }}
                                            >
                                                Done
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}

                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Team Members</h2>
                            <Button variant="primary" size="sm" onClick={() => setShowInviteModal(true)}>
                                + Invite Member
                            </Button>
                        </div>
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
