import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate                    = useNavigate();
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [isSignUp, setIsSignUp]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [message, setMessage]       = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  async function handleSubmit() {
    if (loading || !email || !password) return;
    setLoading(true); setError(''); setMessage('');
    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Account created. You can now sign in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/network');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">

      {/* Back to home */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground
          hover:text-amber-400 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400/50
          rounded-md px-2 py-1 -ml-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to home
      </button>

      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <span className="signal-dot bg-amber-400" />
            <span className="text-amber-500 text-xs tracking-[0.25em] uppercase font-mono">
              Stochron Technologies
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Foreboding Index
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Market Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="fi-card p-8 shadow-xl">
          <h2 className="text-foreground font-semibold text-lg mb-6">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
            >
              {error}
            </div>
          )}
          {message && (
            <div
              role="status"
              className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm"
            >
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="fi-email" className="block text-muted-foreground text-xs uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                id="fi-email"
                ref={emailRef}
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg text-sm
                  bg-input-background text-foreground border border-border
                  focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-colors"
              />
            </div>
            <div>
              <label htmlFor="fi-password" className="block text-muted-foreground text-xs uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="fi-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 rounded-lg text-sm
                    bg-input-background text-foreground border border-border
                    focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground
                    hover:text-amber-400 transition-colors focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !email || !password}
              className="w-full py-3 rounded-lg font-semibold text-sm
                bg-amber-400 hover:bg-amber-300 text-black
                disabled:opacity-40 disabled:cursor-not-allowed
                flex items-center justify-center gap-2
                transition-all duration-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              className="text-amber-500 hover:text-amber-400 transition-colors focus:outline-none focus:underline"
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}