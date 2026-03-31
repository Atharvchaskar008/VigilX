import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mail, Lock, User, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register, loginAsGuest } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) { setError('Name is required'); setSubmitting(false); return; }
        await register(email, password, name);
      }
      onClose();
    } catch (err: any) {
      console.error("Auth Error:", err.code, err.message);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError(mode === 'login' ? 'Invalid credentials. If you are new, please Register first.' : err.message);
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Auth provider not enabled in Firebase Console.');
      } else {
        setError(err.message || 'Something went wrong');
      }
    }
    setSubmitting(false);
  };

  const handleGuest = async () => {
    setSubmitting(true);
    await loginAsGuest();
    setSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden">
              {/* Header */}
              <div className="p-6 pb-0 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">
                    {mode === 'login' ? 'Welcome Back' : 'Create Account'}
                  </h2>
                  <p className="text-xs text-zinc-500 font-medium mt-1">
                    {mode === 'login' ? 'Sign in to report disturbances' : 'Join VigilX to start reporting'}
                  </p>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Toggle */}
              <div className="px-6 pt-4">
                <div className="flex p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                  {(['login', 'register'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => { setMode(m); setError(null); }}
                      className={cn(
                        "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-1.5",
                        mode === m
                          ? "bg-white dark:bg-zinc-700 text-black dark:text-white shadow-sm"
                          : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                      )}
                    >
                      {m === 'login' ? <><LogIn className="w-3 h-3" />Sign In</> : <><UserPlus className="w-3 h-3" />Register</>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-3">
                {mode === 'register' && (
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-sm font-medium text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                    />
                  </div>
                )}

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-sm font-medium text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-black/10 dark:border-white/10 text-sm font-medium text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPassword ? <EyeOff className="w-4 h-4 text-zinc-400" /> : <Eye className="w-4 h-4 text-zinc-400" />}
                  </button>
                </div>

                {error && (
                  <p className="text-xs text-red-500 font-medium px-1 font-black uppercase tracking-widest leading-relaxed">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-xl font-bold uppercase tracking-widest text-sm hover:opacity-90 transition-all disabled:opacity-50 shadow-lg"
                >
                  {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                </button>

                <div className="relative flex items-center justify-center py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-200 dark:border-zinc-700" /></div>
                  <span className="relative bg-white dark:bg-zinc-900 px-3 text-[10px] text-zinc-400 font-bold uppercase tracking-widest">or</span>
                </div>

                <button
                  type="button"
                  onClick={handleGuest}
                  disabled={submitting}
                  className="w-full py-3.5 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all disabled:opacity-50 border border-black/5 dark:border-white/5"
                >
                  Continue as Guest
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
