import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function Login() {
  const navigate                  = useNavigate();
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [isSignUp, setIsSignUp]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [message, setMessage]     = useState('');

  async function handleSubmit() {
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-muted-foreground text-xs uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-lg text-sm
                  bg-input-background text-foreground border border-border
                  focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-muted-foreground text-xs uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-lg text-sm
                  bg-input-background text-foreground border border-border
                  focus:outline-none focus:border-amber-400 transition-colors"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !email || !password}
              className="w-full py-3 rounded-lg font-semibold text-sm
                bg-amber-400 hover:bg-amber-300 text-black
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            >
              {loading ? 'Please wait…' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>   
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <button
              className="text-amber-500 hover:text-amber-400 transition-colors"
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