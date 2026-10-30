import React, { useState } from 'react';
import { Flame, Lock, User as UserIcon, Mail, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CandleFlame } from '../components/CandleFlame';

export const AuthPage: React.FC = () => {
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignup) {
        await signup(username, password, displayName || username, email);
      } else {
        await login(username, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      await login('demo', 'echoes2026');
    } catch (err: any) {
      setError("Demo account login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-obsidian-950">
      {/* Background golden glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-700/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md parchment-card rounded-3xl border border-amber-600/40 shadow-2xl p-8 sm:p-10 space-y-6">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <CandleFlame isLit={true} size="md" colorType="cempasuchil_gold" />
          <h1 className="font-cinzel text-2xl sm:text-3xl font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 mt-3">
            ECHOES
          </h1>
          <p className="font-playfair italic text-xs sm:text-sm text-amber-300/80">
            Memories Never Die • Offline Preservation
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-700/50 text-red-200 text-xs text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-amber-300/80 mb-1">Username *</label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. elena_keeper"
                className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-amber-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {isSignup && (
            <>
              <div>
                <label className="block text-xs text-amber-300/80 mb-1">Display Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Elena's Grandchild"
                    className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-amber-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-amber-300/80 mb-1">Email (Optional)</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. family@memory.local"
                    className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-amber-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-amber-300/80 mb-1">Password *</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-obsidian-900 border border-amber-900/60 rounded-xl pl-10 pr-4 py-2.5 text-sm text-amber-100 placeholder:text-stone-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-medium text-sm shadow-candle-sm hover:shadow-candle-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isSignup ? "Create Memory Vault" : "Enter Sanctuary"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Demo Login */}
        <div className="pt-2">
          <button
            type="button"
            disabled={loading}
            onClick={handleQuickDemo}
            className="w-full py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-semibold text-xs transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Demo Access (Seeded Abuela Elena Vault)</span>
          </button>
        </div>

        <div className="text-center pt-2 border-t border-amber-900/30">
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError(null);
            }}
            className="text-xs text-stone-400 hover:text-amber-300 transition"
          >
            {isSignup
              ? "Already have an account? Sign In"
              : "Don't have an account? Create Keeper Vault"}
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-stone-500 font-serif text-center pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>All data remains strictly on your local computer.</span>
        </div>
      </div>
    </div>
  );
};
