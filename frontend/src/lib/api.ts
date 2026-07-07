import { supabase } from './supabase';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function authHeader(required = false): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    if (required) throw new Error('Not signed in.');
    return {};
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

async function apiFetch(path: string, options: RequestInit = {}, requireAuth = false) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(await authHeader(requireAuth)),
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `API error ${res.status}`);
  }
  return res.json();
}

export const fetchChartData    = ()                                  => apiFetch('/chart-data');
export const fetchMindmap      = (date: string)                      => apiFetch(`/mindmap/${date}`);
export const updateWeight      = (id: number, w: number)             => apiFetch(`/articles/${id}/weight`, { method: 'PATCH', body: JSON.stringify({ weight: w }) }, true);
export const fetchAnalysis     = ()                                  => apiFetch('/analysis');

// ── Dictionary — legacy add/remove (unchanged, still works for
// adding brand-new GLOBAL words to db_dictionary) ─────────────
export const addDictionaryWord    = (dict: string, word: string)     => apiFetch(`/dictionary/${dict}`, { method: 'POST', body: JSON.stringify({ word }) });
export const removeDictionaryWord = (dict: string, word: string)     => apiFetch(`/dictionary/${dict}/${encodeURIComponent(word)}`, { method: 'DELETE' });

// ── Dictionary — NEW per-user hide/show ───────────────────────
// Returns { assurance: [{id, word, active}], foreboding: [{id, word, active}] }
export const fetchDictionary = () => apiFetch('/dictionary');

// Hide/unhide toggle a word for the CURRENT user only (requires login —
// guest/anonymous Supabase sessions still count as "signed in" so this
// works for anonymous users too, per your existing auth setup)
export const hideDictionaryWord   = (wordId: number) => apiFetch(`/dictionary/${wordId}/hide`,   { method: 'PATCH' }, true);
export const unhideDictionaryWord = (wordId: number) => apiFetch(`/dictionary/${wordId}/unhide`, { method: 'PATCH' }, true);

// ── Category weights (NEW) ────────────────────────────────────
// Returns { earnings_call: 0.25, filings: 0.25, regulatory: 0.25, news: 0.25 }
export const fetchCategoryWeights  = () => apiFetch('/dictionary/weights');
export const updateCategoryWeights = (weights: Record<string, number>) =>
  apiFetch('/dictionary/weights', { method: 'PUT', body: JSON.stringify({ weights }) }, true);

// ── Scoring (UPDATED — category replaces the old dictionary param) ──
// Old signature scored against a fixed D1-D4 dictionary variant, which
// no longer exists server-side. New signature scores against whichever
// words the CURRENT user has active, for a given upload category.
// Returns { fi_score, tfi_score, regime, regime_color, assurance_count,
//           foreboding_count, total_word_count, assurance_hits,
//           foreboding_hits, category }
export const scoreText = (text: string, category: 'earnings_call' | 'filings' | 'regulatory' | 'news') =>
  apiFetch('/score', { method: 'POST', body: JSON.stringify({ text, category }) });

// Combine already-scored categories into one Final Score using the
// user's saved category weights (or 0.25 defaults if none saved).
// Pass only the categories that actually have a document scored.
// Returns { final_score, regime, regime_color, categories_used, normalized_weights }
export const aggregateScores = (categories: Record<string, { fi_score: number }>) =>
  apiFetch('/score/aggregate', { method: 'POST', body: JSON.stringify({ categories }) }, true);