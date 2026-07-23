import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Save, BarChart3, Calendar, LogOut, AlertCircle, Loader2 } from 'lucide-react';

import { Button }   from './ui/button';
import { Card }     from './ui/card';
import { Input }    from './ui/input';
import { Textarea } from './ui/textarea';
import { Label }    from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

import StockSelector    from './StockSelector';
import DictionaryEditor from './DictionaryEditor';
import NetworkNode      from './NetworkNode';
import SourceCategory   from './SourceCategory';

import { fetchChartData, scoreText, aggregateScores } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuth }  from '../../lib/AuthContext';
import { useDictionary } from '../../lib/DictionaryContext';


const BACKEND_CATEGORY_SLUG: Record<string, 'earnings_call' | 'filings' | 'regulatory' | 'news'> = {
  '1': 'earnings_call',
  '2': 'filings',
  '3': 'regulatory',
  '4': 'news',
};

export type Document = {
  id: string;
  name: string;
  content: string;
  fi: number;
  tfi: number;
  regime: number;
  weight: number;
  scorePending?: boolean; 
};

export type SourceCategoryType = {
  id: string;
  name: string;
  documents: Document[];
  weight: number;
  fi: number;
  tfi: number;
  regime: number;
  hasRealData: boolean;
  isCustom?: boolean;
};

const initialCategories: SourceCategoryType[] = [
  { id: '1', name: 'Earnings Calls',           documents: [], weight: 0.25, fi: 0, tfi: 0, regime: 0, hasRealData: false },
  { id: '2', name: 'Company Filings',          documents: [], weight: 0.25, fi: 0, tfi: 0, regime: 0, hasRealData: false },
  { id: '3', name: 'Regulatory Announcements', documents: [], weight: 0.25, fi: 0, tfi: 0, regime: 0, hasRealData: false },
  { id: '4', name: 'News Articles',            documents: [], weight: 0.25, fi: 0, tfi: 0, regime: 0, hasRealData: true  },
];

type ConnectorPath = { id: string; d: string; x1: number; y1: number; x2: number; y2: number };

export default function NetworkGraph() {
  const navigate = useNavigate();
  const { user }  = useAuth();

  // Category weights now come from the SAME source the DictionaryEditor
  // sidebar edits — no more separate/disconnected local weight sliders.
  const { weights: backendWeights, updateWeights: updateBackendWeights } = useDictionary();

  const [categories, setCategories]           = useState<SourceCategoryType[]>(initialCategories);
  const [selectedStock, setSelectedStock]     = useState('Select Stock');
  const [lastUpdated, setLastUpdated]         = useState(new Date().toLocaleDateString());
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<string | null>(null);
  const [newDocName, setNewDocName]           = useState('');
  const [newDocContent, setNewDocContent]     = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [docError, setDocError]               = useState('');
  const [scoring, setScoring]                 = useState(false);

  // Keep each category's local weight display in sync with the backend
  // weights (so the sliders and the sidebar always agree).
  useEffect(() => {
    setCategories(prev => prev.map(cat => {
      const slug = BACKEND_CATEGORY_SLUG[cat.id];
      return slug ? { ...cat, weight: backendWeights[slug] ?? 0.25 } : cat;
    }));
  }, [backendWeights]);

  const [aggregated, setAggregated] = useState({ fi: 0, tfi: 0, regime: 0 });

  const calcLocalPreview = () => {
    
    const real = categories.filter(c => !c.isCustom && c.documents.length > 0);
    if (!real.length) return { fi: 0, tfi: 0, regime: 0 };
    const tw = real.reduce((s, c) => s + c.weight, 0) || 1;
    return {
      fi:     real.reduce((s, c) => s + c.fi     * c.weight, 0) / tw,
      tfi:    real.reduce((s, c) => s + c.tfi    * c.weight, 0) / tw,
      regime: real.reduce((s, c) => s + c.regime * c.weight, 0) / tw,
    };
  };

  useEffect(() => {
    setAggregated(calcLocalPreview()); 

    const scored: Record<string, { fi_score: number }> = {};
    categories.forEach(cat => {
      const slug = BACKEND_CATEGORY_SLUG[cat.id];
      if (slug && cat.documents.length > 0) {
        scored[slug] = { fi_score: cat.fi };
      }
    });

    if (Object.keys(scored).length === 0) return;

    aggregateScores(scored)
      .then(res => {
        if (res.final_score !== null) {
        
          setAggregated(prev => ({ ...prev, fi: res.final_score, regime: res.final_score }));
        }
      })
      .catch(() => {
        
      });
  
  }, [categories, backendWeights]);

  // --- Connector line geometry -------------------------------------------
  // Draws one dashed curve from the Aggregated Results node to each
  // category's weight circle, measured from real DOM positions rather
  // than hardcoded offsets. The previous version anchored each line at a
  // fixed "-top-300px" offset inside an `overflow-hidden` parent, which
  // clipped almost the entire line — only stray fragments of the moving
  // dot survived, which is what read as "confetti".
  const graphAreaRef = useRef<HTMLDivElement>(null);
  const mainNodeRef  = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [connectors, setConnectors] = useState<ConnectorPath[]>([]);

  useLayoutEffect(() => {
    function recompute() {
      const container = graphAreaRef.current;
      const main = mainNodeRef.current;
      if (!container || !main) return;

      const containerRect = container.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      const originX = mainRect.left + mainRect.width / 2 - containerRect.left;
      const originY = mainRect.bottom - containerRect.top;

      const next: ConnectorPath[] = [];
      categories.forEach(cat => {
        const el = categoryRefs.current.get(cat.id);
        if (!el) return;
        const r = el.getBoundingClientRect();
        // Anchor to the weight circle (first child, w-16 = 64px) rather
        // than the row's outer edge, so the line visibly plugs into it.
        const targetX = r.left - containerRect.left + 32;
        const targetY = r.top - containerRect.top + 32;
        const midY = originY + (targetY - originY) * 0.5;
        next.push({
          id: cat.id,
          d: `M ${originX} ${originY} C ${originX} ${midY}, ${targetX} ${midY}, ${targetX} ${targetY}`,
          x1: originX, y1: originY, x2: targetX, y2: targetY,
        });
      });
      setConnectors(next);
    }

    recompute();
    const ro = new ResizeObserver(recompute);
    if (graphAreaRef.current) ro.observe(graphAreaRef.current);
    window.addEventListener('resize', recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, [categories]);


  const handleAddDocument = async () => {
    setDocError('');
    if (!currentCategory) return;
    if (!newDocName.trim()) { setDocError('Document name is required.'); return; }
    if (!newDocContent.trim()) { setDocError('Please paste the document text before adding.'); return; }

    const slug = BACKEND_CATEGORY_SLUG[currentCategory];

    let fi = 0, tfi = 0, scorePending = false;

    if (!slug) {
      scorePending = true;
    } else {
      setScoring(true);
      try {
        const result = await scoreText(newDocContent.trim(), slug);
        fi  = result.fi_score  ?? 0;
        tfi = result.tfi_score ?? 0;
      } catch {
        scorePending = true; // backend unreachable or error — flag it, don't fake a score
      } finally {
        setScoring(false);
      }
    }

    const newDoc: Document = {
      id:      Date.now().toString(),
      name:    newDocName.trim(),
      content: newDocContent.trim(),
      fi,
      tfi,
      regime:  fi,
      weight:  1.0,
      scorePending,
    };

    setCategories(prev => prev.map(cat => {
      if (cat.id !== currentCategory) return cat;
      const updatedDocs = [...cat.documents, newDoc];
      // Category-level fi/tfi = average across all scored documents in
      // this category (unscored/scorePending docs are excluded from the average).
      const scoredDocs = updatedDocs.filter(d => !d.scorePending);
      const avgFi  = scoredDocs.length ? scoredDocs.reduce((s, d) => s + d.fi,  0) / scoredDocs.length : cat.fi;
      const avgTfi = scoredDocs.length ? scoredDocs.reduce((s, d) => s + d.tfi, 0) / scoredDocs.length : cat.tfi;
      return {
        ...cat,
        documents: updatedDocs,
        hasRealData: true,
        fi: avgFi,
        tfi: avgTfi,
        regime: avgFi,
      };
    }));

    setShowDocumentDialog(false);
    setNewDocName(''); setNewDocContent(''); setCurrentCategory(null);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    setCategories(prev => [...prev, {
      id: Date.now().toString(), name: newCategoryName.trim(),
      documents: [], weight: 0.1, fi: 0, tfi: 0, regime: 0,
      hasRealData: false, isCustom: true,
    }]);
    setShowCategoryDialog(false); setNewCategoryName('');
  };

  // Weight changes on the ORIGINAL 4 categories now write through to the
  // backend (same store the DictionaryEditor sidebar edits) so both UIs
  // always agree. Custom categories stay local-only since they have
  // nowhere to persist to server-side.
  const handleCategoryWeightChange = (id: string, weight: number) => {
    const slug = BACKEND_CATEGORY_SLUG[id];
    if (slug) {
      updateBackendWeights({ ...backendWeights, [slug]: weight });
    } else {
      setCategories(prev => prev.map(cat => cat.id === id ? { ...cat, weight } : cat));
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (categories.findIndex(c => c.id === id) < 4) return;
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const handleSignOut = async () => { await supabase.auth.signOut(); navigate('/login'); };

  const currentCategoryIsCustom = currentCategory ? !BACKEND_CATEGORY_SLUG[currentCategory] : false;

  return (
    <div className="min-h-screen bg-[--background] p-6 transition-colors">
      <div className="max-w-[1800px] mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <span className="signal-dot bg-amber-400" />
            <h1 className="text-2xl font-bold text-[--foreground] font-mono tracking-tight">
              FI Network Graph
            </h1>
          </div>
          <div className="flex gap-3 items-center">
            {user && <span className="text-sm text-[--muted-foreground] font-mono">{user.email}</span>}
            <span className="text-sm text-[--muted-foreground]">
              Stock: <strong className="text-[--foreground]">{selectedStock}</strong>
            </span>
            {user && (
              <button onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
                  border border-[--border] text-[--muted-foreground]
                  hover:border-red-400/60 hover:text-red-400 transition-all">
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            )}
            <button onClick={() => navigate('/')}
              className="px-3 py-1.5 rounded-lg text-sm border border-[--border]
                text-[--muted-foreground] hover:border-amber-400/60 hover:text-amber-400 transition-all">
              ← Overview
            </button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-12 gap-5">

          {/* Stock Selector */}
          <div className="col-span-2">
            <StockSelector selectedStock={selectedStock} onSelectStock={setSelectedStock} />
          </div>

          {/* Network Graph */}
          <div className="col-span-7">
            <div ref={graphAreaRef} className="fi-card p-6 min-h-[800px] relative overflow-hidden hover-glow">
              <style>{`
                .fi-connector-line {
                  stroke: var(--border, #ffffff);
                  stroke-width: 1.75;
                  stroke-dasharray: 5 7;
                  fill: none;
                  animation: fi-connector-flow 1.6s linear infinite;
                }
                @keyframes fi-connector-flow {
                  to { stroke-dashoffset: -24; }
                }
                @media (prefers-reduced-motion: reduce) {
                  .fi-connector-line { animation: none; }
                }
              `}</style>

              {/* Connector overlay — sits behind the nodes, measured from real positions */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                {connectors.map(c => (
                  <g key={c.id}>
                    <path d={c.d} className="fi-connector-line" />
                    <circle cx={c.x1} cy={c.y1} r="3" fill="#f59e0b" />
                    <circle cx={c.x2} cy={c.y2} r="3" fill="#f59e0b" />
                  </g>
                ))}
              </svg>

              <div ref={mainNodeRef} className="relative flex justify-center mb-8" style={{ zIndex: 1 }}>
                <NetworkNode
                  title="Aggregated Results"
                  fi={aggregated.fi}
                  tfi={aggregated.tfi}
                  regime={aggregated.regime}
                  isMain
                />
              </div>

              <div className="relative space-y-6" style={{ zIndex: 1 }}>
                {categories.map((category) => (
                  <div
                    key={category.id}
                    ref={(el) => {
                      if (el) categoryRefs.current.set(category.id, el);
                      else categoryRefs.current.delete(category.id);
                    }}
                  >
                    <SourceCategory
                      category={category}
                      onWeightChange={w => handleCategoryWeightChange(category.id, w)}
                      onAddDocument={() => { setCurrentCategory(category.id); setDocError(''); setShowDocumentDialog(true); }}
                      onDelete={() => handleDeleteCategory(category.id)}
                      canDelete={categories.indexOf(category) >= 4}
                    />
                  </div>
                ))}

                <div className="flex justify-center mt-6">
                  <button onClick={() => setShowCategoryDialog(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm
                      border-2 border-dashed border-[--border] text-[--muted-foreground]
                      hover:border-amber-400/60 hover:text-amber-400 transition-all">
                    <Plus className="w-4 h-4" /> Add Source Category
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Dictionary Editor */}
          <div className="col-span-3">
            <DictionaryEditor />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-5 fi-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-5 text-sm text-[--muted-foreground]">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {lastUpdated}
            </span>
            <span className="text-amber-500 font-mono text-xs">
              NIFTY IT · Feb 2026 · Post-Anthropic Shock
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setLastUpdated(new Date().toLocaleDateString())}
              className="px-4 py-2 rounded-lg text-sm border border-[--border]
                text-[--muted-foreground] hover:border-amber-400/60 hover:text-amber-400 transition-all">
              UPDATE
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm
              border border-[--border] text-[--muted-foreground]
              hover:border-amber-400/60 hover:text-amber-400 transition-all">
              <Save className="w-4 h-4" /> SAVE
            </button>
            <button onClick={() => navigate('/analysis')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium
                bg-amber-400 hover:bg-amber-300 text-black
                transition-all hover:shadow-[0_0_16px_rgba(245,158,11,0.4)]">
              <BarChart3 className="w-4 h-4" /> GO TO FINAL ANALYSIS
            </button>
          </div>
        </div>

        {/* Add Document Dialog */}
        <Dialog open={showDocumentDialog} onOpenChange={open => {
          setShowDocumentDialog(open);
          if (!open) { setDocError(''); setNewDocName(''); setNewDocContent(''); }
        }}>
          <DialogContent className="fi-card border-[--border] max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-[--foreground]">Add Document</DialogTitle>
              <p className="text-sm text-[--muted-foreground] mt-1">
                {currentCategoryIsCustom
                  ? "Custom categories aren't scored automatically yet — this document will be added unscored."
                  : "Text will be scored against your active dictionary words and an FI score assigned."}
              </p>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              {docError && (
                <div className="flex items-start gap-2 p-3 rounded-lg
                  bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  {docError}
                </div>
              )}
              <div>
                <Label className="text-[--foreground] text-xs uppercase tracking-wider mb-1.5 block">
                  Document Name
                </Label>
                <input
                  value={newDocName}
                  onChange={e => setNewDocName(e.target.value)}
                  placeholder="e.g. TCS Q3 2026 Earnings Call"
                  className="w-full px-3 py-2.5 rounded-lg text-sm
                    bg-[--input-background] text-[--foreground] border border-[--border]
                    focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <div>
                <Label className="text-[--foreground] text-xs uppercase tracking-wider mb-1.5 block">
                  Text Content <span className="text-red-400 ml-1">*</span>
                </Label>
                <textarea
                  value={newDocContent}
                  onChange={e => setNewDocContent(e.target.value)}
                  placeholder="Paste the full document text here. FI score will be calculated automatically from this content using the dictionary."
                  rows={8}
                  className="w-full px-3 py-2.5 rounded-lg text-sm resize-none
                    bg-[--input-background] text-[--foreground] border border-[--border]
                    focus:outline-none focus:border-amber-400 transition-colors"
                />
                <p className="text-xs text-[--muted-foreground] mt-1">
                  FI is calculated from the words in this text matched against your active dictionary words.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button onClick={() => setShowDocumentDialog(false)}
                  className="px-4 py-2 rounded-lg text-sm border border-[--border]
                    text-[--muted-foreground] hover:border-amber-400/60 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleAddDocument}
                  disabled={!newDocName.trim() || !newDocContent.trim() || scoring}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    bg-amber-400 hover:bg-amber-300 text-black
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all hover:shadow-[0_0_16px_rgba(245,158,11,0.4)]"
                >
                  {scoring ? <><Loader2 className="w-4 h-4 animate-spin" /> Scoring…</> : 'Add Document'}
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Category Dialog */}
        <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
          <DialogContent className="fi-card border-[--border]">
            <DialogHeader>
              <DialogTitle className="text-[--foreground]">Add Source Category</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="flex items-start gap-2 p-3 rounded-lg
                bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                Custom categories are local-only right now — they show on this graph
                but don't count toward the backend Final Score or persist your weights.
                The 4 original categories are the ones fully wired to scoring.
              </div>
              <div>
                <Label className="text-[--foreground] text-xs uppercase tracking-wider mb-1.5 block">
                  Category Name
                </Label>
                <input
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Social Media Signals"
                  className="w-full px-3 py-2.5 rounded-lg text-sm
                    bg-[--input-background] text-[--foreground] border border-[--border]
                    focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowCategoryDialog(false)}
                  className="px-4 py-2 rounded-lg text-sm border border-[--border]
                    text-[--muted-foreground] hover:border-amber-400/60 transition-all">
                  Cancel
                </button>
                <button onClick={handleAddCategory}
                  className="px-4 py-2 rounded-lg text-sm font-medium
                    bg-amber-400 hover:bg-amber-300 text-black transition-all
                    hover:shadow-[0_0_16px_rgba(245,158,11,0.4)]">
                  Add Category
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}