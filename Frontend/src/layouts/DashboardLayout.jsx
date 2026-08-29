import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, X, Home as HomeIcon, LogOut, ShieldAlert,
  Car, CalendarCheck, DollarSign, UserCog, Shield, 
  Users, CheckCircle2, FileText, Settings 
} from 'lucide-react';
import { NotificationBell } from '../components/Common/NotificationBell';

export const DashboardLayout = ({ children, role = 'owner' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Define sidebar links based on role
  const ownerLinks = [
    { label: 'Dashboard', path: '/owner', icon: HomeIcon },
    { label: 'My Vehicles', path: '/owner/vehicles', icon: Car },
    { label: 'Bookings', path: '/owner/bookings', icon: CalendarCheck },
    { label: 'Earnings', path: '/owner/earnings', icon: DollarSign },
    { label: 'Profile', path: '/owner/profile', icon: UserCog }
  ];

  const adminLinks = [
    { label: 'Dashboard', path: '/admin', icon: HomeIcon },
    { label: 'Owner Verification', path: '/admin/verify-owners', icon: CheckCircle2 },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Reports', path: '/admin/reports', icon: FileText }
  ];

  const links = role === 'admin' ? adminLinks : ownerLinks;

  const getOwnerStatusLabel = () => {
    if (user?.verificationStatus === 'rejected') return '❌ Verification Rejected';
    if (user?.isVerified) return '✅ Verified Owner';
    return '⏳ Pending Owner Verification';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      {/* Mobile Top Bar */}
      <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-slate-900 text-white shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-accent font-black text-base">RM</div>
          <span className="font-extrabold tracking-tight text-sm">RideMate Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 text-slate-300 hover:text-white cursor-pointer"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      <div className="flex flex-row flex-grow relative">
        {/* Sidebar Container */}
        <aside 
          className={`
            fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-slate-400 flex flex-col justify-between border-r border-slate-800 transition-transform duration-300 lg:static lg:translate-x-0
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div>
            {/* Logo */}
            <div className="hidden lg:flex items-center gap-2.5 px-6 py-5 border-b border-slate-800">
              <img src="/logo.png" alt="RideMate Logo" className="w-10 h-10 rounded-xl object-contain shadow-md" />
              <span className="text-base font-extrabold text-white tracking-tight">
                Ride<span className="text-amber-400">Mate</span>
              </span>
            </div>

            {/* User Mini Info */}
            <div className="px-6 py-6 border-b border-slate-800 flex items-center gap-3">
              <img
                src={user?.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`) : 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                alt={user?.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
              />
              <div className="text-left">
                <p className="text-xs font-black text-white truncate max-w-[130px]">{user?.name}</p>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block mt-0.5">
                  {role === 'admin' ? '🛡️ Admin' : getOwnerStatusLabel()}
                </span>
              </div>
            </div>

            {/* Unverified Owner Banner */}
            {role === 'owner' && user && !user.isVerified && (
              <div className="mx-4 mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold leading-relaxed flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <div>
                  <p>
                    {user.verificationStatus === 'rejected' 
                      ? 'Verification Rejected. Update info in Profile to resubmit.' 
                      : 'Pending Owner Verification. Listings will hide from search until approved.'
                    }
                  </p>
                  <Link to="/owner/profile" className="text-primary-light font-bold hover:underline block mt-1">
                    Manage Verification →
                  </Link>
                </div>
              </div>
            )}

            {/* Sidebar Navigation */}
            <nav className="px-4 py-6 flex flex-col gap-1.5 text-left">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.label}
                    to={link.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-200
                      ${isActive 
                        ? 'bg-primary text-white shadow-xs' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom Actions */}
          <div className="p-4 border-t border-slate-800 flex flex-col gap-1.5">
            <Link 
              to="/" 
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <HomeIcon className="w-4 h-4" />
              <span>Back to Public Site</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-colors cursor-pointer text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Sidebar Overlay for Mobile */}
        {isSidebarOpen && (
          <div 
            onClick={() => setIsSidebarOpen(false)} 
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          ></div>
        )}

        {/* Page Content Panel */}
        <main className="flex-grow p-6 lg:p-10 max-h-screen overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
