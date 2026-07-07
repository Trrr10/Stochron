import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import type { ReactNode } from "react";
import {
  fetchDictionary,
  hideDictionaryWord,
  unhideDictionaryWord,
  fetchCategoryWeights,
  updateCategoryWeights,
} from "./api";

interface DictionaryEntry {
  id: number;
  word: string;
  active: boolean;
}

interface DictionaryContextValue {
  assurance: DictionaryEntry[];
  foreboding: DictionaryEntry[];
  loading: boolean;
  toggleWord: (wordId: number, currentlyActive: boolean) => Promise<void>;
  activeAssuranceWords: string[];
  activeForebodingWords: string[];
  weights: Record<string, number>;
  updateWeights: (weights: Record<string, number>) => Promise<void>;
  refresh: () => Promise<void>;
}

const DictionaryContext = createContext<DictionaryContextValue | null>(null);

const DEFAULT_WEIGHTS = {
  earnings_call: 0.25,
  filings: 0.25,
  regulatory: 0.25,
  news: 0.25,
};

export function DictionaryProvider({ children }: { children: ReactNode }) {
  const [assurance, setAssurance] = useState<DictionaryEntry[]>([]);
  const [foreboding, setForeboding] = useState<DictionaryEntry[]>([]);
  const [weights, setWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [dict, w] = await Promise.all([
        fetchDictionary(),
        fetchCategoryWeights(),
      ]);
      setAssurance(dict.assurance);
      setForeboding(dict.foreboding);
      setWeights(w);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Optimistic toggle — flips locally immediately, reverts if the
  // backend call fails (e.g. not signed in).
  const toggleWord = useCallback(async (wordId: number, currentlyActive: boolean) => {
    const flip = (list: DictionaryEntry[]) =>
      list.map((w) => (w.id === wordId ? { ...w, active: !currentlyActive } : w));

    setAssurance(flip);
    setForeboding(flip);

    try {
      if (currentlyActive) {
        await hideDictionaryWord(wordId);
      } else {
        await unhideDictionaryWord(wordId);
      }
    } catch (err) {
      // revert on failure — flip is its own inverse, safe to reapply
      setAssurance(flip);
      setForeboding(flip);
      console.error("Failed to toggle word, reverted:", err);
    }
  }, []);

  const updateWeights = useCallback(async (newWeights: Record<string, number>) => {
    const previous = weights;
    setWeights(newWeights); // optimistic
    try {
      const confirmed = await updateCategoryWeights(newWeights);
      setWeights(confirmed);
    } catch (err) {
      setWeights(previous);
      console.error("Failed to update weights, reverted:", err);
    }
  }, [weights]);

  const value: DictionaryContextValue = {
    assurance,
    foreboding,
    loading,
    toggleWord,
    activeAssuranceWords: assurance.filter((w) => w.active).map((w) => w.word.toLowerCase()),
    activeForebodingWords: foreboding.filter((w) => w.active).map((w) => w.word.toLowerCase()),
    weights,
    updateWeights,
    refresh,
  };

  return <DictionaryContext.Provider value={value}>{children}</DictionaryContext.Provider>;
}

export function useDictionary() {
  const ctx = useContext(DictionaryContext);
  if (!ctx) throw new Error("useDictionary must be used inside a DictionaryProvider");
  return ctx;
}