import { useState, useMemo, useEffect } from "react";
import { Check } from "lucide-react";
import { useDictionary } from "../../lib/DictionaryContext";

type Tab = "foreboding" | "assurance";

const ACCENT: Record<Tab, string> = {
  foreboding: "#ef4444",
  assurance: "#22c55e",
};

export default function DictionaryEditor() {
  const { assurance, foreboding, loading, toggleWord, weights, updateWeights } = useDictionary();
  const [expanded, setExpanded] = useState(false);
  const [tab, setTab] = useState<Tab>("foreboding");
  const [search, setSearch] = useState("");

  const list = tab === "foreboding" ? foreboding : assurance;
  const accent = ACCENT[tab];

  const filtered = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((w) => w.word.toLowerCase().includes(q));
  }, [list, search]);

  const activeCount = list.filter((w) => w.active).length;

  // Bulk toggle — only touches words currently in view (respects search + tab).
  const setVisibleActive = (activate: boolean) => {
    filtered.forEach((w) => {
      if (w.active !== activate) toggleWord(w.id, w.active);
    });
  };

  return (
    <aside
      style={{
        width: expanded ? 340 : 220,
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
          flexShrink: 0,
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
          {/* Sticky control header: tabs + search + bulk actions.
              Kept in its own block (not inside the scroll area) so it never
              scrolls out of view or blends into the word grid below it. */}
          <div
            style={{
              flexShrink: 0,
              background: "var(--bg-surface, #14161a)",
              borderBottom: "1px solid var(--border, #2a2d33)",
            }}
          >
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
                    background: tab === t ? `${ACCENT[t]}22` : "transparent",
                    color: tab === t ? ACCENT[t] : "var(--text-secondary, #8a8f98)",
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <div style={{ padding: "10px 12px 12px" }}>
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
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 11, color: "var(--text-secondary, #8a8f98)" }}>
                  {activeCount} of {list.length} active
                </span>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={() => setVisibleActive(true)}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 6,
                      border: "1px solid var(--border, #2a2d33)",
                      background: "transparent",
                      color: "var(--text-secondary, #8a8f98)",
                      cursor: "pointer",
                    }}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setVisibleActive(false)}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: "3px 8px",
                      borderRadius: 6,
                      border: "1px solid var(--border, #2a2d33)",
                      background: "transparent",
                      color: "var(--text-secondary, #8a8f98)",
                      cursor: "pointer",
                    }}
                  >
                    None
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Word chip grid — scrollable, visually contained, not a bare list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
            {loading && (
              <div style={{ fontSize: 12, color: "var(--text-secondary, #8a8f98)", padding: 8 }}>
                Loading dictionary…
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {filtered.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => toggleWord(w.id, w.active)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "5px 10px 5px 8px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                      lineHeight: 1.4,
                      cursor: "pointer",
                      border: `1px solid ${w.active ? `${accent}55` : "var(--border, #2a2d33)"}`,
                      background: w.active ? `${accent}18` : "transparent",
                      color: w.active ? accent : "var(--text-secondary, #6a6e76)",
                      opacity: w.active ? 1 : 0.6,
                      transition: "all 120ms ease",
                    }}
                  >
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${w.active ? accent : "var(--text-secondary, #6a6e76)"}`,
                        background: w.active ? accent : "transparent",
                        flexShrink: 0,
                      }}
                    >
                      {w.active && <Check className="w-2.5 h-2.5" color="#0b0c0e" strokeWidth={3} />}
                    </span>
                    {w.word}
                  </button>
                ))}
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div style={{ fontSize: 12, color: "var(--text-secondary, #8a8f98)", padding: 8 }}>
                No words match "{search}"
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
    <div style={{ borderTop: "1px solid var(--border, #2a2d33)", padding: 12, flexShrink: 0 }}>
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