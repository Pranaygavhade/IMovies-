import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Phone, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, authModalTab, closeAuthModal, login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(authModalTab);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync tab with context when modal opens
  React.useEffect(() => {
    setTab(authModalTab);
    setError(null);
  }, [authModalTab, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (tab === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password, phone);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify your details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-cinema-900 border border-cinema-750 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Tabs */}
        <div className="flex border-b border-cinema-800">
          <button
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-4 text-sm font-semibold text-center transition ${
              tab === 'login'
                ? 'text-crimson-500 border-b-2 border-crimson-500 bg-cinema-850/50'
                : 'text-cinema-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-4 text-sm font-semibold text-center transition ${
              tab === 'register'
                ? 'text-crimson-500 border-b-2 border-crimson-500 bg-cinema-850/50'
                : 'text-cinema-400 hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            onClick={closeAuthModal}
            className="p-3 text-cinema-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-crimson-950/60 border border-crimson-900/80 rounded-xl text-crimson-200 text-xs">
              <AlertCircle className="w-4 h-4 text-crimson-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-cinema-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinema-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full pl-10 pr-4 py-2.5 bg-cinema-850 border border-cinema-750 focus:border-crimson-500 rounded-xl text-sm text-white placeholder-cinema-500 outline-none transition"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-cinema-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinema-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-cinema-850 border border-cinema-750 focus:border-crimson-500 rounded-xl text-sm text-white placeholder-cinema-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-cinema-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinema-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-cinema-850 border border-cinema-750 focus:border-crimson-500 rounded-xl text-sm text-white placeholder-cinema-500 outline-none transition"
              />
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-cinema-300 uppercase tracking-wider mb-1.5">
                Phone Number (Optional)
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cinema-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 bg-cinema-850 border border-cinema-750 focus:border-crimson-500 rounded-xl text-sm text-white placeholder-cinema-500 outline-none transition"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-crimson-600 hover:bg-crimson-500 disabled:opacity-50 text-white font-semibold rounded-xl transition shadow-glow-crimson-sm mt-2"
          >
            {isSubmitting ? 'Processing...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Demo Credentials hint */}
        <div className="p-4 bg-cinema-950/70 border-t border-cinema-800 text-center text-xs text-cinema-400">
          Demo Admin: <span className="text-white">admin@imovies.com</span> /{' '}
          <span className="text-white">Admin@123456</span>
        </div>
      </div>
    </div>
  );
};
