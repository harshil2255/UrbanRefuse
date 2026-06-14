import { useEffect } from 'react';
import { Outlet, Navigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Trash2, Map, LayoutList, Shield, ClipboardList, Settings as SettingsIcon, Trophy } from 'lucide-react';

export default function AppLayout() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    // Initialize dark mode from local storage
    if (localStorage.getItem('theme') === 'dark' || 
       (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive 
        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' 
        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col font-['Outfit'] transition-colors">
      {/* Top Header */}
      <header className="bg-white dark:bg-slate-900 shadow-sm sticky top-0 z-40 border-b border-gray-100 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-500">
              <Trash2 size={28} />
              <span className="text-lg font-bold text-gray-900 dark:text-white tracking-tight leading-tight">Urban Refuse Tracking &<br/>Management System</span>
            </div>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-2">
              <NavLink to="/" className={navClass} end>
                <LayoutList size={18} />
                <span>Feed</span>
              </NavLink>
              
              <NavLink to="/map" className={navClass}>
                <Map size={18} />
                <span>Map</span>
              </NavLink>

              <NavLink to="/leaderboard" className={navClass}>
                <Trophy size={18} />
                <span>Leaderboard</span>
              </NavLink>

              {profile?.role === 'admin' && (
                <NavLink to="/admin" className={navClass}>
                  <Shield size={18} />
                  <span>Admin Panel</span>
                </NavLink>
              )}

              {profile?.role === 'collector' && (
                <NavLink to="/collector" className={navClass}>
                  <ClipboardList size={18} />
                  <span>My Tasks</span>
                </NavLink>
              )}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end hidden sm:block">
              <span className="text-sm font-bold text-gray-700 dark:text-gray-200 block leading-tight">
                {profile?.full_name || user.email}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium capitalize">
                {profile?.role || 'Citizen'}
              </span>
            </div>
            
            <NavLink
              to="/settings"
              className={({ isActive }) => `p-2 rounded-md transition-colors ${isActive ? 'bg-gray-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400' : 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'}`}
              title="Settings"
            >
              <SettingsIcon size={20} />
            </NavLink>
          </div>
        </div>
        
        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 flex overflow-x-auto space-x-2 transition-colors">
            <NavLink to="/" className={navClass} end>
              <LayoutList size={18} />
              <span>Feed</span>
            </NavLink>
            <NavLink to="/map" className={navClass}>
              <Map size={18} />
              <span>Map</span>
            </NavLink>
            <NavLink to="/leaderboard" className={navClass}>
              <Trophy size={18} />
              <span>Rankings</span>
            </NavLink>
            {profile?.role === 'admin' && (
              <NavLink to="/admin" className={navClass}>
                <Shield size={18} />
                <span>Admin</span>
              </NavLink>
            )}
            {profile?.role === 'collector' && (
              <NavLink to="/collector" className={navClass}>
                <ClipboardList size={18} />
                <span>Tasks</span>
              </NavLink>
            )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full relative z-0">
        <Outlet />
      </main>
    </div>
  );
}
