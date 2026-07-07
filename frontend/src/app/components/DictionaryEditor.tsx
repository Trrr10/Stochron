import { useState, useMemo, useEffect } from "react";
import { useDictionary } from "../../lib/DictionaryContext";

type Tab = "foreboding" | "assurance";

export default function DictionaryEditor() {
  const { assurance, foreboding, loading, toggleWord, weights, updateWeights } = useDictionary();
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>("foreboding");
  const [search, setSearch] = useState("");

  const list = tab === "foreboding" ? foreboding : assurance;

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((w) => w.word.toLowerCase().includes(q));
  }, [list, search]);

  const activeCount = list.filter((w) => w.active).length;

  return (
    <aside
      style={{
        width: expanded ? 320 : 220,
        transition: "width 180ms ease",
        background: "var(--bg-surface, #14161a)",
        border: "1px solid var(--border, #2a2d33)",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        height: "100%",
      }}
    >
      {/* Collapsed header — always visible */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          background: "transparent",
          border: "none",
          borderBottom: expanded ? "1px solid var(--border, #2a2d33)" : "none",
          cursor: "pointer",
          color: "var(--text-primary, #e8e9ec)",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.2 }}>
          Dictionary Words
        </span>
        <span
          style={{
            fontSize: 12,
            color: "var(--text-secondary, #8a8f98)",
            transform: expanded ? "rotate(180deg)" : "none",
            transition: "transform 150ms ease",
          }}
        >
          ▾
        </span>
      </button>

      {!expanded && (
        <div style={{ padding: "0 16px 14px", fontSize: 12, color: "var(--text-secondary, #8a8f98)" }}>
          {assurance.filter((w) => w.active).length} assurance · {foreboding.filter((w) => w.active).length} foreboding active
        </div>
      )}

      {expanded && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          {/* Tabs */}
          <div style={{ display: "flex", padding: "10px 12px 0", gap: 6 }}>
            {(["foreboding", "assurance"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "capitalize",
                  cursor: "pointer",
                  background:
                    tab === t
                      ? t === "foreboding"
                        ? "#ef444422"
                        : "#22c55e22"
                      : "transparent",
                  color:
                    tab === t
                      ? t === "foreboding"
                        ? "#ef4444"
                        : "#22c55e"
                      : "var(--text-secondary, #8a8f98)",
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Search + count */}
          <div style={{ padding: "10px 12px 6px" }}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${tab} words…`}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--border, #2a2d33)",
                background: "var(--bg-base, #0b0c0e)",
                color: "var(--text-primary, #e8e9ec)",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
            <div style={{ fontSize: 11, color: "var(--text-secondary, #8a8f98)", marginTop: 6 }}>
              {activeCount} of {list.length} active — scoring only counts active words
            </div>
          </div>

          {/* Word list — hide, don't delete */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 12px 12px" }}>
            {loading && (
              <div style={{ fontSize: 12, color: "var(--text-secondary, #8a8f98)", padding: 8 }}>
                Loading dictionary…
              </div>
            )}
            {!loading &&
              filtered.map((w) => (
                <label
                  key={w.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 4px",
                    fontSize: 13,
                    color: w.active ? "var(--text-primary, #e8e9ec)" : "var(--text-secondary, #5a5e66)",
                    textDecoration: w.active ? "none" : "line-through",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={w.active}
                    onChange={() => toggleWord(w.id, w.active)}
                    style={{ accentColor: tab === "foreboding" ? "#ef4444" : "#22c55e" }}
                  />
                  {w.word}
                </label>
              ))}
            {!loading && filtered.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--text-secondary, #8a8f98)", padding: 8 }}>
                No words match “{search}”
              </div>
            )}
          </div>

          {/* Category weights */}
          <CategoryWeights weights={weights} onUpdate={updateWeights} />
        </div>
      )}
    </aside>
  );
}

function CategoryWeights({
  weights,
  onUpdate,
}: {
  weights: Record<string, number>;
  onUpdate: (w: Record<string, number>) => void;
}) {
  const [local, setLocal] = useState(weights);

  // Resync when the real backend-loaded weights arrive (or change from
  // elsewhere) — useState's initial value is only read on first mount,
  // so without this the inputs get stuck showing the 0.25 defaults even
  // after fetchCategoryWeights() resolves with the user's saved values.
  useEffect(() => {
    setLocal(weights);
  }, [weights]);

  const labels: Record<string, string> = {
    earnings_call: "Earnings Calls",
    filings: "Company Filings",
    regulatory: "Regulatory",
    news: "News Articles",
  };

  const total = Object.values(local).reduce((a, b) => a + b, 0);

  return (
    <div style={{ borderTop: "1px solid var(--border, #2a2d33)", padding: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: "var(--text-primary, #e8e9ec)" }}>
        Category Weights
      </div>
      {Object.keys(labels).map((cat) => (
        <div key={cat} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 12, flex: 1, color: "var(--text-secondary, #8a8f98)" }}>{labels[cat]}</span>
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={local[cat] ?? 0.25}
            onChange={(e) => setLocal({ ...local, [cat]: parseFloat(e.target.value) || 0 })}
            style={{
              width: 56,
              padding: "4px 6px",
              borderRadius: 6,
              border: "1px solid var(--border, #2a2d33)",
              background: "var(--bg-base, #0b0c0e)",
              color: "var(--text-primary, #e8e9ec)",
              fontSize: 12,
              textAlign: "right",
            }}
          />
        </div>
      ))}
      <div style={{ fontSize: 11, color: Math.abs(total - 1) < 0.001 ? "#22c55e" : "#eab308", marginBottom: 8 }}>
        Sum: {total.toFixed(2)} {Math.abs(total - 1) > 0.001 && "(will auto-normalize)"}
      </div>
      <button
        onClick={() => onUpdate(local)}
        style={{
          width: "100%",
          padding: "8px",
          borderRadius: 8,
          border: "none",
          background: "var(--accent, #6366f1)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Save Weights
      </button>
    </div>
  );
}