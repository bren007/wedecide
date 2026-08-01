import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

import { LoadingSpinner } from '../components/Loading';
import { Plus, Trash2, Save, CircleHelp, TriangleAlert, ShieldCheck } from 'lucide-react';

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

interface PendingInvite {
    id: string;
    email: string;
    role: string;
    status: string;
    expires_at: string;
    token: string;
    created_at: string;
}

interface MeetingGroup {
    id: string;
    name: string;
    description: string | null;
    organization_id: string;
}

interface CapacitySettings {
    id: string;
    total_focus_slots: number;
    total_capex_limit: number;
    total_opex_limit: number;
    value_drop_horizon_days: number;
    calibration_large_steerable: number;
    calibration_historical_avg: number;
    friction_coefficient: number;
}

interface StrategicPillar {
    id: string;
    title: string;
    target_weight: number;
}

export const OrganizationSettingsPage: React.FC = () => {
    const { user } = useAuth();
    const [org, setOrg] = useState<Organization | null>(null);
    const [members, setMembers] = useState<Member[]>([]);
    const [meetingGroups, setMeetingGroups] = useState<MeetingGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [orgName, setOrgName] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Governance State
    const [capacitySettings, setCapacitySettings] = useState<CapacitySettings | null>(null);
    const [currentLoad, setCurrentLoad] = useState<number>(0);
    const [pillars, setPillars] = useState<StrategicPillar[]>([]);
    const [newPillarTitle, setNewPillarTitle] = useState('');
    const [newPillarWeight, setNewPillarWeight] = useState(0);
    const [frictionCoefficient, setFrictionCoefficient] = useState<number>(1.00);

    // Invite State
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

    const fetchOrganization = useCallback(async () => {
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
                const orgId = userData.organization_id;

                // 2. Get the organization details
                const { data: orgData, error: orgError } = await supabase
                    .from('organizations')
                    .select('*')
                    .eq('id', orgId)
                    .single();

                if (orgError) throw orgError;

                setOrg(orgData);
                setOrgName(orgData.name);

                // 3. Members & Roles
                const { data: usersData, error: usersError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('organization_id', orgId);

                if (usersError) throw usersError;

                const { data: rolesData, error: rolesError } = await supabase
                    .from('user_roles')
                    .select('*')
                    .eq('organization_id', orgId);

                if (rolesError) throw rolesError;

                if (usersData) {
                    const membersWithDetails = usersData.map((userMember) => {
                        const userRole = rolesData?.find(r => r.user_id === userMember.id);
                        return {
                            id: userMember.id,
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

                // 3b. Pending Invites
                const { data: invitesData, error: invitesError } = await supabase
                    .from('invitations')
                    .select('*')
                    .eq('organization_id', orgId)
                    .eq('status', 'pending')
                    .order('created_at', { ascending: false });

                if (!invitesError && invitesData) {
                    setPendingInvites(invitesData as PendingInvite[]);
                }

                // 4. Meeting Groups
                const { data: groupsData, error: groupsError } = await supabase
                    .from('meeting_groups')
                    .select('*')
                    .eq('organization_id', orgId)
                    .order('created_at', { ascending: true });

                if (groupsError) throw groupsError;
                setMeetingGroups(groupsData || []);

                // 5. Governance: Capacity Settings
                const { data: capData } = await supabase
                    .from('capacity_settings' as unknown)
                    .select('*')
                    .eq('org_id', orgId)
                    .maybeSingle();

                if (capData) {
                    setCapacitySettings(capData as unknown as CapacitySettings);
                    // Sync local Fm slider state from DB value
                    const fm = Number((capData as unknown).friction_coefficient);
                    if (fm >= 1.0 && fm <= 2.5) setFrictionCoefficient(fm);
                } else {
                    // Initialize empty state if needed, or rely on null
                    setCapacitySettings({
                        id: '',
                        total_focus_slots: 20,
                        total_capex_limit: 0,
                        total_opex_limit: 0,
                        value_drop_horizon_days: 30,
                        calibration_large_steerable: 2,
                        calibration_historical_avg: 8,
                        friction_coefficient: 1.00
                    } as CapacitySettings);
                    setFrictionCoefficient(1.00);
                }

                // 6. Governance: Strategic Pillars
                const { data: pillarsData } = await supabase
                    .from('strategic_pillars' as unknown)
                    .select('*')
                    .eq('org_id', orgId)
                    .order('target_weight', { ascending: false });

                if (pillarsData) {
                    setPillars(pillarsData as unknown as StrategicPillar[]);
                }

                // 7. Governance: Current Load
                // Only count initiatives that are actively drawing from capacity balance
                try {
                    const { data: initiatives } = await supabase
                        .from('initiatives' as unknown)
                        .select('focus_slots_required')
                        .eq('org_id', orgId)
                        .in('status', ['active', 'approved', 'on_hold', 'delayed']);

                    if (initiatives) {
                        const totalTokens = (initiatives as unknown[]).reduce((sum, init) => sum + (Number(init.focus_slots_required) || 0), 0);
                        setCurrentLoad(totalTokens);
                    }
                } catch (loadErr) {
                    console.error('Error loading current load:', loadErr);
                }
            }
        } catch (error) {
            console.error('Error fetching organization:', error);
            setMessage({ type: 'error', text: 'Failed to load organization details' });
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchOrganization();
        }
    }, [user, fetchOrganization]);

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



    const handleCreateGroup = async (name: string) => {
        try {
            if (!org) return;
            const { data, error } = await supabase
                .from('meeting_groups')
                .insert({
                    organization_id: org.id,
                    name: name,
                    description: ''
                })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setMeetingGroups([...meetingGroups, data]);
                setMessage({ type: 'success', text: 'Meeting group created!' });
            }
        } catch (error: unknown) {
            console.error('Error creating group:', error);
            setMessage({ type: 'error', text: 'Failed to create group.' });
        }
    };

    const handleDeleteGroup = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this group?')) return;
        try {
            const { error } = await supabase
                .from('meeting_groups')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMeetingGroups(meetingGroups.filter(g => g.id !== id));
            setMessage({ type: 'success', text: 'Meeting group deleted!' });
        } catch (error: unknown) {
            console.error('Error deleting group:', error);
            setMessage({ type: 'error', text: 'Failed to delete group.' });
        }
    };

    const handleUpdateRole = async (userId: string, newRole: string) => {
        try {
            if (!org) return;
            const { error } = await supabase
                .from('user_roles')
                .update({ role: newRole })
                .match({ user_id: userId, organization_id: org.id });

            if (error) throw error;

            setMembers(members.map(m =>
                m.user_id === userId ? { ...m, role: newRole } : m
            ));
            setMessage({ type: 'success', text: 'User role updated!' });
        } catch (error: unknown) {
            console.error('Error updating role:', error);
            setMessage({ type: 'error', text: 'Failed to update role.' });
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!window.confirm('Are you sure you want to remove this member from the organization?')) return;
        try {
            if (!org) return;
            // Note: complex logic might be needed to remove from all related tables if cascades aren't set up, 
            // but assuming DB handles it or we just remove the role linkage.
            // Actually, usually we remove the user_roles entry.
            const { error } = await supabase
                .from('user_roles')
                .delete()
                .match({ user_id: userId, organization_id: org.id });

            if (error) throw error;

            setMembers(members.filter(m => m.user_id !== userId));
            setMessage({ type: 'success', text: 'Member removed.' });
        } catch (error: unknown) {
            console.error('Error removing member:', error);
            setMessage({ type: 'error', text: 'Failed to remove member.' });
        }
    };

    const handleSaveCapacity = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!org || !capacitySettings) return;
        setSaving(true);
        setMessage(null);

        try {
            // Check if settings exist (has ID?)
            // We calculate total focus slots dynamically inside the form based on calibration.
            // Or if it was modified, we trust capacitySettings.total_focus_slots
            const calculatedSlots = (capacitySettings.calibration_large_steerable * 5) +
                Math.max(0, capacitySettings.calibration_historical_avg - capacitySettings.calibration_large_steerable) * 3;

            // Clamp Fm to valid range before persisting
            const clampedFm = Math.min(2.50, Math.max(1.00, frictionCoefficient));
            const adjustedSlots = Math.round(calculatedSlots / clampedFm);

            if (capacitySettings.id) {
                const { error } = await supabase
                    .from('capacity_settings' as unknown)
                    .update({
                        total_focus_slots: adjustedSlots, // friction-adjusted limit used by Command Centre
                        total_capex_limit: capacitySettings.total_capex_limit,
                        total_opex_limit: capacitySettings.total_opex_limit,
                        value_drop_horizon_days: capacitySettings.value_drop_horizon_days,
                        calibration_large_steerable: capacitySettings.calibration_large_steerable,
                        calibration_historical_avg: capacitySettings.calibration_historical_avg,
                        friction_coefficient: clampedFm
                    })
                    .eq('id', capacitySettings.id);
                if (error) throw error;
                setCapacitySettings(prev => prev ? { ...prev, total_focus_slots: adjustedSlots, friction_coefficient: clampedFm } : null);
            } else {
                // Insert new
                const { data, error } = await supabase
                    .from('capacity_settings' as unknown)
                    .insert({
                        org_id: org.id,
                        total_focus_slots: adjustedSlots,
                        total_capex_limit: capacitySettings.total_capex_limit,
                        total_opex_limit: capacitySettings.total_opex_limit,
                        value_drop_horizon_days: capacitySettings.value_drop_horizon_days,
                        calibration_large_steerable: capacitySettings.calibration_large_steerable,
                        calibration_historical_avg: capacitySettings.calibration_historical_avg,
                        friction_coefficient: clampedFm
                    })
                    .select()
                    .single();

                if (error) throw error;
                setCapacitySettings(data as unknown as CapacitySettings);
            }
            setMessage({ type: 'success', text: 'Capacity settings saved.' });
        } catch (err: unknown) {
            console.error('Error saving capacity:', err);
            setMessage({ type: 'error', text: 'Failed to save settings.' });
        } finally {
            setSaving(false);
        }
    };

    const handleAddPillar = async () => {
        if (!org || !newPillarTitle) return;

        // Validation: Check weight limit
        const currentTotal = pillars.reduce((sum, p) => sum + p.target_weight, 0);
        if (currentTotal + newPillarWeight > 100) {
            setMessage({ type: 'error', text: `Cannot add pillar: Total weighting would exceed 100% (Current: ${currentTotal}%)` });
            return;
        }

        try {
            const { data, error } = await supabase
                .from('strategic_pillars' as unknown)
                .insert({
                    org_id: org.id,
                    title: newPillarTitle,
                    target_weight: newPillarWeight
                })
                .select()
                .single();

            if (error) throw error;

            setPillars([...pillars, data as unknown as StrategicPillar]);
            setNewPillarTitle('');
            setNewPillarWeight(0);
            setMessage({ type: 'success', text: 'Strategic Pillar added.' });
        } catch (err: unknown) {
            console.error('Error adding pillar:', err);
            setMessage({ type: 'error', text: 'Failed to add pillar.' });
        }
    };

    const handleInviteUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!org || !inviteEmail) return;
        setInviteLoading(true);
        setMessage(null);

        try {
            const { data, error } = await supabase.rpc('invite_user', {
                p_email: inviteEmail,
                p_role: inviteRole
            });

            if (error) throw error;

            if (data?.success) {
                const fullLink = `${window.location.origin}/signup?token=${data.token}`;
                setInviteLink(fullLink);
                // Refresh pending list
                fetchOrganization();
            } else {
                throw new Error('Failed to generate invite');
            }
        } catch (err: unknown) {
            console.error('Invite error:', err);
            setMessage({ type: 'error', text: err.message || 'Failed to send invite' });
        } finally {
            setInviteLoading(false);
        }
    };

    const handleRevokeInvite = async (inviteId: string) => {
        if (!window.confirm('Are you sure you want to revoke this invitation?')) return;
        try {
            const { error } = await supabase
                .from('invitations')
                .delete()
                .eq('id', inviteId);

            if (error) throw error;

            setPendingInvites(pendingInvites.filter(i => i.id !== inviteId));
            setMessage({ type: 'success', text: 'Invitation revoked.' });
        } catch (err: unknown) {
            console.error('Revoke error:', err);
            setMessage({ type: 'error', text: 'Failed to revoke invitation.' });
        }
    };

    const copyInviteLink = () => {
        if (inviteLink) {
            navigator.clipboard.writeText(inviteLink);
            // Optional: show momentary 'Copied!' state
        }
    };

    const handleUpdatePillarWeight = async (id: string, newWeight: number) => {
        if (!org) return;
        const pillar = pillars.find(p => p.id === id);
        if (!pillar) return;

        // Validation
        const otherPillarsWeight = pillars.reduce((sum, p) => p.id === id ? sum : sum + p.target_weight, 0);
        if (otherPillarsWeight + newWeight > 100) {
            setMessage({ type: 'error', text: `Cannot update weight: Total would exceed 100% (Current others: ${otherPillarsWeight}%)` });
            // Revert UI change by forcing re-render? State won't update if we don't call setPillars.
            // But the input might be uncontrolled or controlled locally?
            // If controlled by 'pillars' state, we need to ensure it doesn't stick to the invalid value if the user typed it.
            // Actually, for simplicity, we'll just alert and fetch/reset? 
            // Better: update valid inputs only.
            return;
        }

        try {
            const { error } = await supabase
                .from('strategic_pillars' as unknown)
                .update({ target_weight: newWeight })
                .eq('id', id);

            if (error) throw error;

            setPillars(pillars.map(p => p.id === id ? { ...p, target_weight: newWeight } : p));
            setMessage({ type: 'success', text: 'Pillar weight updated.' });
        } catch (err: unknown) {
            console.error('Error updating pillar weight:', err);
            setMessage({ type: 'error', text: 'Failed to update pillar weight.' });
        }
    };

    const handleDeletePillar = async (id: string) => {
        if (!window.confirm('Delete this strategic pillar?')) return;
        try {
            const { error } = await supabase
                .from('strategic_pillars' as unknown)
                .delete()
                .eq('id', id);

            if (error) throw error;
            setPillars(pillars.filter(p => p.id !== id));
            setMessage({ type: 'success', text: 'Pillar deleted.' });
        } catch (err: unknown) {
            console.error('Error deleting pillar:', err);
            setMessage({ type: 'error', text: 'Failed to delete pillar.' });
        }
    };

    const [currentTab, setCurrentTab] = useState<'governance' | 'members' | 'groups' | 'general'>('governance');

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200  font-sans">
            <div className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-2xl font-bold text-white mb-6">Organization Settings</h1>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-800 mb-6">
                        <button
                            className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors ${currentTab === 'governance'
                                ? 'border-b-2 border-blue-500 text-blue-400'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                            onClick={() => setCurrentTab('governance')}
                        >
                            Governance
                        </button>
                        <button
                            className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors ${currentTab === 'general'
                                ? 'border-b-2 border-blue-500 text-blue-400'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                            onClick={() => setCurrentTab('general')}
                        >
                            General
                        </button>
                        <button
                            className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors ${currentTab === 'members'
                                ? 'border-b-2 border-blue-500 text-blue-400'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                            onClick={() => setCurrentTab('members')}
                        >
                            Members
                        </button>
                        <button
                            className={`py-2 px-4 font-medium text-sm focus:outline-none transition-colors ${currentTab === 'groups'
                                ? 'border-b-2 border-blue-500 text-blue-400'
                                : 'text-slate-400 hover:text-slate-200'
                                }`}
                            onClick={() => setCurrentTab('groups')}
                        >
                            Meeting Groups
                        </button>
                    </div>

                    {currentTab === 'governance' && (
                        <div className="space-y-6">
                            {/* Capacity Settings */}
                            <Card>
                                <div className="flex items-center gap-2 mb-4">
                                    <h2 className="text-xl font-semibold">Capacity Constraints</h2>
                                    <CircleHelp size={16} className="text-gray-400" />
                                </div>
                                <p className="text-sm text-gray-500 mb-6">
                                    Define the "physics" of your organization. These limits determine when the Command Center triggers alerts for over-commitment.
                                </p>

                                <form onSubmit={handleSaveCapacity}>
                                    <div className="bg-slate-900 border border-slate-700/50 p-6 rounded-lg mb-6">
                                        <h3 className="text-lg font-bold text-slate-200 mb-2">Capacity Calibration Wizard</h3>
                                        <p className="text-sm text-slate-400 mb-6">Anchor your Focus Slots to historical delivery capability, rather than an arbitrary limit.</p>

                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                                    1. How many <span className="text-action-blue font-bold">Large/Strategic</span> initiatives (Scale 5) can your Organization realistically steer with high rigor at once?
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full max-w-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-action-blue"
                                                    value={capacitySettings?.calibration_large_steerable || 0}
                                                    onChange={e => setCapacitySettings(prev => prev ? { ...prev, calibration_large_steerable: parseInt(e.target.value) || 0 } : null)}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                                    2. Looking at your most successful delivery year, what was the <span className="text-emerald-400 font-bold">average number of active projects</span> overall?
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="w-full max-w-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-action-blue"
                                                    value={capacitySettings?.calibration_historical_avg || 0}
                                                    onChange={e => setCapacitySettings(prev => prev ? { ...prev, calibration_historical_avg: parseInt(e.target.value) || 0 } : null)}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-8 p-4 bg-slate-950 border border-slate-800 rounded flex flex-col md:flex-row items-center justify-between">
                                            <div>
                                                <div className="text-slate-400 text-sm mb-1">Baseline Total Focus Slots</div>
                                                <div className="text-3xl font-mono text-white font-bold">
                                                    {capacitySettings
                                                        ? (capacitySettings.calibration_large_steerable * 5) + Math.max(0, capacitySettings.calibration_historical_avg - capacitySettings.calibration_large_steerable) * 3
                                                        : 0}
                                                </div>
                                            </div>
                                            {(() => {
                                                const baseline = capacitySettings
                                                    ? (capacitySettings.calibration_large_steerable * 5) + Math.max(0, capacitySettings.calibration_historical_avg - capacitySettings.calibration_large_steerable) * 3
                                                    : 0;
                                                const over = currentLoad - baseline;
                                                const percentOver = baseline > 0 ? (over / baseline) * 100 : 0;

                                                if (currentLoad > baseline && baseline > 0) {
                                                    return (
                                                        <div className="mt-4 md:mt-0 px-4 py-2 bg-red-900/30 border border-red-500/50 rounded text-red-400 flex items-center gap-2">
                                                            <TriangleAlert size={16} />
                                                            <span className="text-sm font-medium">Current load exceeds historical success baseline by {percentOver.toFixed(0)}%.</span>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                        {capacitySettings && capacitySettings.calibration_large_steerable > 0 && capacitySettings.calibration_historical_avg > 0 && (
                                            <div className="mt-4 p-3 bg-blue-950/30 border border-blue-800/30 rounded-lg">
                                                <p className="text-xs text-blue-300/80">
                                                    These values were set from your Strategic Capacity Audit. You may update them at any time as your organisation evolves.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* ── Friction Coefficient (Fm) ── */}
                                    <div className="bg-slate-900 border border-amber-700/30 p-6 rounded-lg mb-6">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-amber-300">Organisational Friction Coefficient (F&#x2098;)</h3>
                                            <span className="text-xs px-2 py-0.5 bg-amber-900/40 text-amber-400 rounded-full border border-amber-700/40 font-mono">ADVANCED</span>
                                        </div>
                                        <p className="text-sm text-slate-400 mb-5">
                                            Applies a systemic drag multiplier to your Nominal Capacity Baseline to account for public-sector administrative overhead, legacy bureaucracy, and political compliance load. <span className="text-amber-400/80">Adjusted Baseline = Nominal ÷ F&#x2098;</span>
                                        </p>

                                        <div className="space-y-3 mb-5">
                                            <div className="flex justify-between items-baseline">
                                                <label className="text-sm font-medium text-slate-300">
                                                    Friction Coefficient
                                                </label>
                                                <span className="text-2xl font-mono font-bold text-amber-300">{frictionCoefficient.toFixed(2)}</span>
                                            </div>
                                            <input
                                                id="friction-coefficient-slider"
                                                type="range"
                                                min="1.00"
                                                max="2.50"
                                                step="0.05"
                                                value={frictionCoefficient}
                                                onChange={e => setFrictionCoefficient(parseFloat(e.target.value))}
                                                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                                                style={{
                                                    background: `linear-gradient(to right, #f59e0b ${((frictionCoefficient - 1) / 1.5) * 100}%, #1e293b ${((frictionCoefficient - 1) / 1.5) * 100}%)`
                                                }}
                                            />
                                            <div className="flex justify-between text-xs text-slate-500 font-mono">
                                                <span>1.00 — No drag</span>
                                                <span>1.50 — Moderate</span>
                                                <span>2.50 — High drag</span>
                                            </div>
                                            <p className="text-xs text-slate-500 italic">
                                                {frictionCoefficient <= 1.10 ? 'Minimal overhead — lean, agile delivery environment.' :
                                                 frictionCoefficient <= 1.40 ? 'Low drag — some compliance and coordination overhead.' :
                                                 frictionCoefficient <= 1.70 ? 'Moderate bureaucratic drag — typical for mid-size public sector bodies.' :
                                                 frictionCoefficient <= 2.10 ? 'High drag — significant governance, reporting, and political compliance load.' :
                                                 'Severe systemic drag — mandates and legacy obligations heavily constrain operational throughput.'}
                                            </p>
                                        </div>

                                        {/* Live Baseline Preview */}
                                        {(() => {
                                            const nominal = capacitySettings
                                                ? (capacitySettings.calibration_large_steerable * 5) + Math.max(0, capacitySettings.calibration_historical_avg - capacitySettings.calibration_large_steerable) * 3
                                                : 0;
                                            const adjusted = nominal > 0 ? Math.round(nominal / frictionCoefficient) : 0;
                                            const reduction = nominal - adjusted;
                                            return (
                                                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950 border border-slate-800 rounded-lg">
                                                    <div className="text-center">
                                                        <div className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Nominal Baseline (B&#x2099;)</div>
                                                        <div className="text-2xl font-mono font-bold text-slate-200">{nominal}</div>
                                                        <div className="text-xs text-slate-500">slots</div>
                                                    </div>
                                                    <div className="text-center flex flex-col items-center justify-center">
                                                        <div className="text-lg text-amber-500 font-mono">÷ {frictionCoefficient.toFixed(2)}</div>
                                                        <div className="text-xs text-slate-500">F&#x2098;</div>
                                                    </div>
                                                    <div className="text-center">
                                                        <div className="text-xs text-amber-500/80 mb-1 uppercase tracking-wider">Adjusted Baseline (B&#x2090;)</div>
                                                        <div className="text-2xl font-mono font-bold text-amber-300">{adjusted}</div>
                                                        <div className="text-xs text-slate-500">slots</div>
                                                    </div>
                                                    {reduction > 0 && (
                                                        <div className="col-span-3 mt-2 pt-2 border-t border-slate-800 text-center">
                                                            <span className="text-xs text-amber-600/80">{reduction} slot{reduction !== 1 ? 's' : ''} absorbed by systemic friction — unavailable for programme delivery.</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">CAPEX Limit ($)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1000"
                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={capacitySettings?.total_capex_limit || 0}
                                                onChange={e => setCapacitySettings(prev => prev ? { ...prev, total_capex_limit: parseFloat(e.target.value) || 0 } : null)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">OPEX Limit ($)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="1000"
                                                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                value={capacitySettings?.total_opex_limit || 0}
                                                onChange={e => setCapacitySettings(prev => prev ? { ...prev, total_opex_limit: parseFloat(e.target.value) || 0 } : null)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <Button type="submit" variant="primary" isLoading={saving}>
                                            <Save size={16} className="mr-2" />
                                            Save Capacity
                                        </Button>
                                    </div>
                                </form>
                            </Card>

                            {/* Strategic Pillars */}
                            <Card>
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">Strategic Pillars</h2>
                                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${pillars.reduce((s, p) => s + p.target_weight, 0) === 100
                                        ? 'bg-green-100 text-green-800'
                                        : pillars.reduce((s, p) => s + p.target_weight, 0) > 100
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {pillars.reduce((s, p) => s + p.target_weight, 0) > 100 && <TriangleAlert size={14} />}
                                        Total Weight: {pillars.reduce((s, p) => s + p.target_weight, 0)}%
                                    </div>
                                </div>
                                <p className="text-sm text-gray-500 mb-6">
                                    Define the core pillars of your strategy. The total weighting should equal 100%.
                                </p>

                                <div className="overflow-x-auto mb-6">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr>
                                                <th className="py-2 px-4 border-b border-slate-700 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase">Pillar Title</th>
                                                <th className="py-2 px-4 border-b border-slate-700 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase">Target Weight (%)</th>
                                                <th className="py-2 px-4 border-b border-slate-700 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {pillars.map(p => (
                                                <tr key={p.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                                    <td className="py-3 px-4 font-medium text-slate-200">{p.title}</td>
                                                    <td className="py-3 px-4 text-slate-400">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                                            value={p.target_weight}
                                                            onChange={(e) => {
                                                                const val = parseInt(e.target.value) || 0;
                                                                // Optimistic update for UI feel, but commit on blur?
                                                                // Actually, let's commit on blur to avoid spamming.
                                                                // But controlled input needs state update.
                                                                // For now, simpler: update state locally, then save on blur.
                                                                setPillars(pillars.map(pil => pil.id === p.id ? { ...pil, target_weight: val } : pil));
                                                            }}
                                                            onBlur={(e) => handleUpdatePillarWeight(p.id, parseInt(e.target.value) || 0)}
                                                        />
                                                    </td>
                                                    <td className="py-3 px-4 border-b border-gray-200 text-right">
                                                        <button
                                                            onClick={() => handleDeletePillar(p.id)}
                                                            className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {pillars.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="py-8 text-center text-gray-500">
                                                        No strategic pillars defined.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                        {/* Add Row */}
                                        <tfoot>
                                            <tr className="bg-slate-900/50">
                                                <td className="py-3 px-4 border-t border-slate-700">
                                                    <input
                                                        type="text"
                                                        placeholder="New Pillar Title"
                                                        className="w-full px-3 py-1 bg-slate-950 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        value={newPillarTitle}
                                                        onChange={e => setNewPillarTitle(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleAddPillar()}
                                                    />
                                                </td>
                                                <td className="py-3 px-4 border-t border-gray-200">
                                                    <input
                                                        type="number"
                                                        placeholder="0"
                                                        min="0"
                                                        max="100"
                                                        className="w-20 px-3 py-1 bg-slate-950 border border-slate-700 rounded text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        value={newPillarWeight}
                                                        onChange={e => setNewPillarWeight(parseInt(e.target.value) || 0)}
                                                        onKeyDown={e => e.key === 'Enter' && handleAddPillar()}
                                                    />
                                                </td>
                                                <td className="py-3 px-4 border-t border-slate-700 text-right">
                                                    <Button variant="secondary" size="sm" onClick={handleAddPillar} disabled={!newPillarTitle}>
                                                        <Plus size={16} className="mr-1" />
                                                        Add
                                                    </Button>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    )}

                    {currentTab === 'general' && (
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
                                    <div className="p-3 bg-slate-900 border border-slate-700 rounded-md text-slate-400 font-mono text-sm">
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
                    )}

                    {/* Members Tab */}
                    {currentTab === 'members' && (
                        <>
                            {/* Invite Modal */}
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
                                                     <label className="block text-sm font-medium text-slate-400 mb-1">Role</label>
                                                     <select
                                                         value={inviteRole}
                                                         onChange={(e) => setInviteRole(e.target.value)}
                                                         className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-md text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                                                         style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='white'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
                                                     >
                                                         <option value="member" className="bg-slate-900">Member</option>
                                                         <option value="admin" className="bg-slate-900">Admin</option>
                                                         <option value="chair" className="bg-slate-900">Chair</option>
                                                         <option value="secretary" className="bg-slate-900">Secretary</option>
                                                     </select>
                                                     <p className="mt-2 text-[10px] text-slate-500 italic">
                                                         Note: The generated link will securely expire in 7 days. You will need to share it manually.
                                                     </p>
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
                                                 <div className="p-4 bg-blue-500/10 rounded-md border border-blue-500/30">
                                                     <div className="flex items-center gap-2 text-blue-400 mb-2 font-bold animate-pulse">
                                                         <ShieldCheck size={18} />
                                                         <span>Invitation Link Ready</span>
                                                     </div>
                                                     <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                                                         Copy the secure link below and send it to <span className="text-blue-400 font-mono">{inviteEmail}</span> via Teams, Slack, or Email.
                                                     </p>
                                                     <div className="flex gap-2">
                                                         <input
                                                             type="text"
                                                             readOnly
                                                             value={inviteLink}
                                                             className="flex-1 text-xs p-3 border border-slate-700 rounded bg-slate-950 text-slate-300 font-mono shadow-inner"
                                                         />
                                                         <Button type="button" variant="primary" onClick={copyInviteLink} size="sm">
                                                             Copy Link
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
                                                <th className="py-2 px-4 border-b border-slate-700 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">Member</th>
                                                <th className="py-2 px-4 border-b border-slate-700 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                                                <th className="py-2 px-4 border-b border-slate-700 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined</th>
                                                <th className="py-2 px-4 border-b border-slate-700 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {members.map((member) => (
                                                <tr key={member.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                                    <td className="py-3 px-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-200">{member.user_details?.name}</span>
                                                            <span className="text-sm text-slate-500">{member.user_details?.email}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <select
                                                            value={member.role}
                                                            onChange={(e) => handleUpdateRole(member.user_id, e.target.value)}
                                                            className="text-xs bg-slate-900 border border-slate-700 rounded-md focus:ring-blue-500 focus:border-blue-500 p-1 text-slate-300"
                                                            disabled={member.user_id === user?.id} // Prevent changing own role essentially locking oneself out
                                                        >
                                                            <option value="member">Member</option>
                                                            <option value="admin">Admin</option>
                                                            <option value="chair">Chair</option>
                                                            <option value="secretary">Secretary</option>
                                                        </select>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-slate-500">
                                                        {new Date(member.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {member.user_id !== user?.id && (
                                                            <Button variant="danger" size="sm" onClick={() => handleRemoveMember(member.user_id)}>
                                                                Remove
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {members.length === 0 && (
                                                <tr>
                                                    <td colSpan={3} className="py-4 text-center text-slate-500">
                                                        No members found.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                     </table>
                                 </div>
                             </Card>

                             {pendingInvites.length > 0 && (
                                 <Card className="mt-6 border border-slate-700/50 bg-slate-900/20">
                                     <h2 className="text-lg font-semibold mb-4 text-slate-300">Pending Invitations (7-Day Expiry)</h2>
                                     <div className="overflow-x-auto">
                                         <table className="w-full text-left border-collapse">
                                             <thead>
                                                 <tr>
                                                     <th className="py-2 px-4 border-b border-slate-700 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                                                     <th className="py-2 px-4 border-b border-slate-700 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">Role</th>
                                                     <th className="py-2 px-4 border-b border-slate-700 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">Created</th>
                                                     <th className="py-2 px-4 border-b border-slate-700 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">Expires In</th>
                                                     <th className="py-2 px-4 border-b border-slate-700 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                                 </tr>
                                             </thead>
                                             <tbody>
                                                 {pendingInvites.map((invite) => {
                                                     const daysLeft = Math.max(0, Math.ceil((new Date(invite.expires_at).getTime() - new Date().getTime()) / (1000 * 3600 * 24)));
                                                     return (
                                                         <tr key={invite.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                                             <td className="py-3 px-4 font-mono text-xs text-slate-300">
                                                                 {invite.email}
                                                             </td>
                                                             <td className="py-3 px-4">
                                                                 <span className="text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded uppercase tracking-wider">{invite.role}</span>
                                                             </td>
                                                             <td className="py-3 px-4 text-xs text-slate-500">
                                                                 {new Date(invite.created_at).toLocaleDateString()}
                                                             </td>
                                                             <td className="py-3 px-4 text-xs">
                                                                 {daysLeft > 0 ? (
                                                                     <span className="text-yellow-500/80">{daysLeft} days</span>
                                                                 ) : (
                                                                     <span className="text-red-500/80">Expired</span>
                                                                 )}
                                                             </td>
                                                             <td className="py-3 px-4">
                                                                 <Button variant="danger" size="sm" onClick={() => handleRevokeInvite(invite.id)}>
                                                                     Revoke
                                                                 </Button>
                                                                 <Button variant="secondary" size="sm" className="ml-2" onClick={() => navigator.clipboard.writeText(`${window.location.origin}/signup?token=${invite.token}`)}>
                                                                     Copy Link
                                                                 </Button>
                                                             </td>
                                                         </tr>
                                                     );
                                                 })}
                                             </tbody>
                                         </table>
                                     </div>
                                 </Card>
                             )}
                         </>
                     )}

                    {/* Groups Tab */}
                    {currentTab === 'groups' && (
                        <Card>
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">Meeting Groups</h2>
                                {/* TODO: Add Create Group Button logic */}
                                <Button variant="primary" size="sm" onClick={() => {
                                    // Placeholder for creating group
                                    const name = prompt('Enter group name:');
                                    if (name) handleCreateGroup(name);
                                }}>
                                    + New Group
                                </Button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr>
                                            <th className="py-2 px-4 border-b border-slate-700 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">Group Name</th>
                                            <th className="py-2 px-4 border-b border-slate-700 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
                                            <th className="py-2 px-4 border-b border-slate-700 bg-slate-900/50 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {meetingGroups.map((group) => (
                                            <tr key={group.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-slate-200">
                                                    {group.name}
                                                </td>
                                                <td className="py-3 px-4 text-slate-500">
                                                    {group.description || '-'}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Button variant="danger" size="sm" onClick={() => handleDeleteGroup(group.id)}>Delete</Button>
                                                </td>
                                            </tr>
                                        ))}
                                        {meetingGroups.length === 0 && (
                                            <tr>
                                                <td colSpan={3} className="py-4 text-center text-slate-500">
                                                    No meeting groups defined.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
};
