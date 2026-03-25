import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Layers,
  LayoutDashboard,
  PlusSquare,
  UploadCloud,
  Calendar,
  ScrollText,
  Settings,
  LogOut,
  ChevronDown,
  User,
  Activity,
  Users,
  Menu,
  X
} from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout, isChair, isAdmin, isGlobalAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [intakeOpen, setIntakeOpen] = useState(false);
  const [governanceOpen, setGovernanceOpen] = useState(
    location.pathname.startsWith('/meetings') || location.pathname.startsWith('/strategic-ledger')
  );
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Unauthenticated Topbar
  if (!isAuthenticated) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950 border-b border-slate-800 py-4">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center no-underline">
            <Layers className="text-blue-500 inline-block mr-2" size={24} />
            <span className="text-xl font-bold text-white tracking-tight hover:text-blue-400 transition-colors">AlturaGov</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-slate-300 hover:text-blue-400 font-medium transition-colors">Login</Link>
            <Link to="/signup">
              <Button variant="primary" size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  // Active state checker
  const isActive = (path: string) => location.pathname === path;

  // Authenticated Sidebar
  return (
    <>
      {/* Mobile Header ( visible only on small screens ) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-950 border-b border-slate-800 z-50 flex items-center justify-between px-4">
        <Link to="/command-center" className="flex items-center no-underline">
          <Layers className="text-blue-500 inline-block mr-2" size={24} />
          <span className="text-xl font-bold text-white tracking-tight">AlturaGov</span>
        </Link>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-400 hover:text-white">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-slate-950 border-r border-slate-800 flex flex-col z-40 transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0 pt-16' : '-translate-x-full pt-16'} lg:translate-x-0 lg:pt-0`}>
        {/* Brand (Desktop only) */}
        <div className="hidden lg:flex h-16 items-center px-6 border-b border-slate-800 flex-shrink-0">
          <Link to="/command-center" className="flex items-center no-underline">
            <Layers className="text-blue-500 inline-block mr-2" size={24} />
            <span className="text-xl font-bold text-white tracking-tight hover:text-blue-400 transition-colors">AlturaGov</span>
          </Link>
        </div>

        {/* Navigation Zones */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">

          {/* Zone 1: The Arena */}
          <div>
            <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">The Arena</h3>
            <div className="space-y-1">
              <Link
                to="/command-center"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive('/command-center')
                    ? 'bg-blue-500/10 text-blue-400 font-bold'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
              >
                <LayoutDashboard size={18} className="mr-3 flex-shrink-0" />
                Command Center
              </Link>
            </div>
          </div>

          {/* Zone 2: The Pipeline */}
          <div>
            <button
              onClick={() => setIntakeOpen(!intakeOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
            >
              <span>The Pipeline</span>
              <ChevronDown size={14} className={`transform transition-transform duration-200 ${intakeOpen ? 'rotate-180' : ''}`} />
            </button>

            {intakeOpen && (
              <div className="mt-2 space-y-1 pl-2">
                <Link
                  to="/propose-initiative"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/propose-initiative')
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                >
                  <PlusSquare size={16} className="mr-3 flex-shrink-0" />
                  Propose Initiative
                </Link>
                <Link
                  to="/strategic-ingestion"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/strategic-ingestion')
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                >
                  <UploadCloud size={16} className="mr-3 flex-shrink-0" />
                  Strategic Ingestion
                </Link>
              </div>
            )}
          </div>

          {/* Zone 3: The Record */}
          <div>
            <button
              onClick={() => setGovernanceOpen(!governanceOpen)}
              className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
            >
              <span>The Record</span>
              <ChevronDown size={14} className={`transform transition-transform duration-200 ${governanceOpen ? 'rotate-180' : ''}`} />
            </button>

            {governanceOpen && (
              <div className="mt-2 space-y-1 pl-2">
                <Link
                  to="/meetings"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${location.pathname.startsWith('/meetings')
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                >
                  <Calendar size={16} className="mr-3 flex-shrink-0" />
                  Meetings
                </Link>
                <Link
                  to="/strategic-ledger"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/strategic-ledger')
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                >
                  <ScrollText size={16} className="mr-3 flex-shrink-0" />
                  Strategic Ledger
                </Link>
              </div>
            )}
          </div>

          {/* Administration Zone */}
          {(isAdmin || isGlobalAdmin) && (
            <div className="pt-4 border-t border-slate-800/50">
              <h3 className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Administration</h3>
              <div className="space-y-1">
                {/* Customer Admin Links */}
                {isAdmin && (
                  <>
                    <Link
                      to="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/settings')
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                        }`}
                    >
                      <Users size={16} className="mr-3 flex-shrink-0" />
                      Team & Governance
                    </Link>
                  </>
                )}

                {/* Global Admin Links */}
                {isGlobalAdmin && (
                  <Link
                    to="/admin/pulse"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/admin/pulse')
                      ? 'bg-red-500/10 text-red-400'
                      : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300'
                      }`}
                  >
                    <Activity size={16} className="mr-3 flex-shrink-0" />
                    System Pulse
                  </Link>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Profile Dropdown Bottom */}
        <div className="p-4 border-t border-slate-800 relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-900 transition-colors focus:outline-none ring-1 ring-slate-800"
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-slate-400" />
              </div>
              <div className="flex flex-col items-start truncate text-left">
                <span className="text-sm font-medium text-white truncate w-full">
                  {user?.name ? user.name.split(' ')[0] : 'Executive'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {isChair ? 'Chair' : (user?.roles?.[0] ? user.roles[0].charAt(0).toUpperCase() + user.roles[0].slice(1) : 'Member')}
                </span>
              </div>
            </div>
            <ChevronDown size={14} className={`text-slate-500 flex-shrink-0 transform transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu Popup over the button */}
          {profileOpen && (
            <>
              {/* Invisible overlay to catch clicks outside dropdown */}
              <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)}></div>
              <div className="absolute bottom-[calc(100%+8px)] left-4 right-4 bg-slate-900 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                <Link
                  to="/settings"
                  onClick={() => { setProfileOpen(false); setMobileMenuOpen(false); }}
                  className="flex items-center px-4 py-3 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Settings size={16} className="mr-3" />
                  Settings
                </Link>
                <div className="h-px bg-slate-800"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut size={16} className="mr-3" />
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Mobile Overlay Darken Background */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
};
