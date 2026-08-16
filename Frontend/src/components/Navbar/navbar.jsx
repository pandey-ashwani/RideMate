import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, User, LogOut, LayoutDashboard, Calendar, Settings, Shield } from 'lucide-react';
import { Button } from '../Common/Button';
import { NotificationBell } from '../Common/NotificationBell';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setIsDropdownOpen(false);
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'owner') return '/owner';
    return '/dashboard';
  };

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-accent font-black text-xl shadow-md group-hover:rotate-6 transition-transform duration-200">
                RM
              </div>
              <span className="text-xl font-extrabold text-slate-800 tracking-tight">
                Ride<span className="text-primary-light">Mate</span>
              </span>
            </Link>
            
            {/* Desktop Nav Links */}
            <div className="hidden md:flex ml-8 space-x-6">
              <Link to="/" className="inline-flex items-center px-1 pt-1 text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
                Home
              </Link>
              <Link to="/vehicles" className="inline-flex items-center px-1 pt-1 text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
                Find Rides
              </Link>
              <Link to="/#how-it-works" className="inline-flex items-center px-1 pt-1 text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
                How It Works
              </Link>
              <Link to="/#why-choose-us" className="inline-flex items-center px-1 pt-1 text-sm font-semibold text-slate-600 hover:text-primary transition-colors">
                Why Us
              </Link>
            </div>
          </div>

          {/* Desktop Right items */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <NotificationBell />
                <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2.5 p-1 px-3 rounded-full hover:bg-slate-50 border border-slate-100 transition-colors duration-200 cursor-pointer"
                >
                  <img
                    src={user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`) : 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/10"
                  />
                  <div className="text-left hidden lg:block">
                    <p className="text-xs font-bold text-slate-800 leading-none">{user.name}</p>
                    <p className="text-[10px] text-slate-400 capitalize font-medium">{user.role}</p>
                  </div>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-52 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-50 animate-scale-up">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>

                    <Link
                      to={getDashboardPath()}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                    >
                      {user.role === 'admin' ? (
                        <Shield className="w-4 h-4 text-primary" />
                      ) : (
                        <LayoutDashboard className="w-4 h-4 text-primary" />
                      )}
                      Dashboard
                    </Link>

                    {user.role === 'customer' && (
                      <Link
                        to="/dashboard?tab=bookings"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-primary" />
                        My Bookings
                      </Link>
                    )}

                    <Link
                      to={user.role === 'customer' ? '/dashboard?tab=profile' : user.role === 'owner' ? '/owner/profile' : '#'}
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium transition-colors"
                    >
                      <Settings className="w-4 h-4 text-primary" />
                      Profile Settings
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50/50 font-medium border-t border-slate-100 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Hamburger button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none transition-colors duration-200 cursor-pointer"
            >
              {isOpen ? <X className="h-6 h-6" /> : <Menu className="h-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 animate-fade-in-up">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link
              to="/vehicles"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Find Rides
            </Link>
            <Link
              to="/#how-it-works"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
            >
              How It Works
            </Link>
            <Link
              to="/#why-choose-us"
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
            >
              Why Us
            </Link>
          </div>

          {/* Mobile Auth actions */}
          <div className="pt-4 pb-4 border-t border-slate-100 px-4">
            {user ? (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`) : 'https://api.dicebear.com/7.x/avataaars/svg?seed=User'}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/20"
                  />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{user.name}</h4>
                    <p className="text-xs text-slate-400 uppercase font-semibold">{user.role}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-primary transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                <Link to="/login" onClick={() => setIsOpen(false)} className="w-full">
                  <Button variant="outline" size="md" className="w-full">
                    Log In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setIsOpen(false)} className="w-full">
                  <Button variant="primary" size="md" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
