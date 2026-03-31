import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, FileText, AlertTriangle, Sun, Moon, User, LogOut, ChevronDown, PhoneCall } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTheme } from './ThemeProvider';
import { useAuth } from '../auth/AuthContext';
import { AuthModal } from './AuthModal';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { path: '/', label: 'Base', matchPaths: ['/'] },
  { path: '/report', label: 'Report', matchPaths: ['/report'], icon: AlertTriangle },
  { path: '/permits', label: 'Permits', matchPaths: ['/permits'], icon: FileText },
  { path: '/command', label: 'HQ', matchPaths: ['/command'], icon: LayoutDashboard },
];

export function Navbar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const isDark = theme === 'dark';

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b backdrop-blur-xl transition-all duration-500",
        isDark
          ? "bg-black/80 border-white/5"
          : "bg-white/80 border-black/5"
      )}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between h-20 items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 select-none">
              <span className={cn("text-xl font-black tracking-tighter uppercase italic", isDark ? "text-white" : "text-black")}>
                VIGIL<span className="text-zinc-500">X</span>
              </span>
              <span className={cn(
                "text-[7px] font-black uppercase tracking-[0.3em] px-2 py-0.5 rounded border border-current opacity-30",
                isDark ? "text-white" : "text-black"
              )}>
                OPERATIONAL
              </span>
            </Link>

            {/* Nav Links + Actions */}
            <div className="flex items-center space-x-2">
              {/* Desktop Nav */}
              <div className="hidden md:flex items-center space-x-1 mr-4">
                {NAV_ITEMS.map((item) => {
                  const isActive = item.matchPaths.some(p => location.pathname === p);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                        isActive
                          ? isDark
                            ? "bg-white/10 text-white"
                            : "bg-black/5 text-black"
                          : isDark
                            ? "text-zinc-500 hover:text-white hover:bg-white/5"
                            : "text-zinc-400 hover:text-black hover:bg-black/5"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              {/* Call Center Button */}
              <a 
                href="tel:100"
                className="hidden lg:flex items-center space-x-2 px-4 py-2 bg-red-600/10 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all mr-2"
              >
                <PhoneCall className="w-3 h-3" />
                <span>Call HQ</span>
              </a>

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={cn(
                  "p-2.5 rounded-xl transition-all",
                  isDark
                    ? "hover:bg-white/10 text-white/40 hover:text-white"
                    : "hover:bg-black/5 text-black/40 hover:text-black"
                )}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User / Auth */}
              {user ? (
                <div className="relative ml-2">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={cn(
                      "flex items-center space-x-2.5 px-3 py-1.5 rounded-xl transition-all",
                      isDark ? "hover:bg-white/10 text-white/80" : "hover:bg-black/5 text-black/80"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm",
                      isDark ? "bg-white text-black" : "bg-black text-white"
                    )}>
                      {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", showUserMenu && "rotate-180")} />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <>
                        <motion.div 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-40" 
                          onClick={() => setShowUserMenu(false)} 
                        />
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className={cn(
                            "absolute right-0 top-full mt-3 w-56 rounded-[2rem] border shadow-2xl z-50 overflow-hidden p-2",
                            isDark ? "bg-zinc-900 border-white/5" : "bg-white border-black/5"
                          )}
                        >
                          <div className={cn("px-4 py-4 mb-2 rounded-2xl", isDark ? "bg-white/5" : "bg-black/5")}>
                            <p className={cn("text-[10px] font-black uppercase tracking-widest truncate", isDark ? "text-white" : "text-black")}>
                              {user.displayName || 'Operational Unit'}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-bold mt-1 truncate">
                              ID: {user.uid.slice(0, 8).toUpperCase()}
                            </p>
                          </div>
                          <button
                            onClick={() => { logout(); setShowUserMenu(false); }}
                            className={cn(
                              "w-full px-4 py-3 text-left rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-3 transition-colors",
                              isDark ? "text-red-400 hover:bg-red-400/10" : "text-red-600 hover:bg-red-600/5"
                            )}
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Archive Session</span>
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuth(true)}
                  className={cn(
                    "ml-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-xl hover:scale-105 active:scale-95",
                    isDark ? "bg-white text-black hover:bg-zinc-200" : "bg-black text-white hover:bg-zinc-800"
                  )}
                >
                  Authorize
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
