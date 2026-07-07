import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './lib/AuthContext';
import PlatformOverview from './app/components/PlatformOverview';
import NetworkGraph     from './app/components/NetworkGraph';
import FinalAnalysis    from './app/components/FinalAnalysis';
import Login            from './pages/Login';
import { DictionaryProvider } from "./lib/DictionaryContext";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  if (session === undefined) return null;
  return session ? <>{children}</> : <Navigate to="/login" replace />;
}

// Theme toggle — lives outside Router so it's always visible
function ThemeToggle({ dark, setDark }: { dark: boolean; setDark: (d: boolean) => void }) {
  return (
    <button
      onClick={() => setDark(!dark)}
      aria-label="Toggle theme"
      className={`
        fixed top-4 right-4 z-50
        flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono
        border transition-all duration-200
        ${dark
          ? 'bg-[#111827] border-[#1E2A3A] text-slate-400 hover:border-amber-400 hover:text-amber-400'
          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 shadow-sm'
        }
      `}
    >
      {dark ? '☀ Light' : '☾ Dark'}
    </button>
  );
}

export default function App() {
  // Default to dark — this is a financial intelligence platform
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('fi-theme');
    return saved !== null ? saved === 'dark' : true;
  });

  useEffect(() => {
    // This is the ONE place we set dark mode — on the html element
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('fi-theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <AuthProvider>
       <DictionaryProvider>
      <Router>
        <ThemeToggle dark={dark} setDark={setDark} />
        <Routes>
          <Route path="/"         element={<PlatformOverview />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/network"  element={<PrivateRoute><NetworkGraph /></PrivateRoute>} />
          <Route path="/analysis" element={<PrivateRoute><FinalAnalysis /></PrivateRoute>} />
        </Routes>
      </Router>
      </DictionaryProvider>
    </AuthProvider>
  );
}