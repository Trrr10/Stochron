import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import type { SourceCategoryType } from './NetworkGraph';

type SourceCategoryProps = {
  category: SourceCategoryType;
  onWeightChange: (weight: number) => void;
  onAddDocument: () => void;
  onDelete: () => void;
  canDelete: boolean;
  sourceId?: string; // anchors the flow-dot animation start point
};


function getRegimeLabel(value: number): string {
  if (value < 0.25) return 'Stable';
  if (value < 0.5) return 'Watch';
  if (value < 0.75) return 'Alert';
  return 'Critical';
}

export default function SourceCategory({
  category,
  onWeightChange,
  onAddDocument,
  onDelete,
  canDelete,
  sourceId,
}: SourceCategoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRegimeDot = (value: number) => {
    if (value < 0.25) return 'bg-emerald-500';
    if (value < 0.5) return 'bg-yellow-500';
    if (value < 0.75) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getRegimeBorder = (value: number) => {
    if (value < 0.25) return 'border-emerald-500/70';
    if (value < 0.5) return 'border-yellow-500/70';
    if (value < 0.75) return 'border-orange-500/70';
    return 'border-red-500/70';
  };

  return (
    <div className="mb-7">
      <div className="flex items-center gap-5">
        {/* Weight Circle — bigger, spacious, theme-aware */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1.5" id={sourceId}>
          <div className="weight-circle w-16 h-16 rounded-full flex items-center justify-center relative">
            <input
              type="number"
              value={category.weight}
              onChange={(e) => onWeightChange(parseFloat(e.target.value) || 0)}
              className="w-12 h-12 text-center text-sm font-semibold bg-transparent border-0
                outline-none text-[--foreground] [appearance:textfield]
                [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              step="0.05"
              min="0"
              max="1"
            />
          </div>
          <span className="text-[10px] uppercase tracking-wider text-[--muted-foreground] font-mono">
            weight
          </span>
        </div>

        {/* Category Box */}
        <div
          className={`flex-1 border-2 ${getRegimeBorder(category.regime)} rounded-xl p-4
            fi-card hover-glow cursor-pointer`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-[--muted-foreground] shrink-0" />
              ) : (
                <ChevronRight className="w-5 h-5 text-[--muted-foreground] shrink-0" />
              )}
              <h3 className="font-semibold text-base text-[--foreground] truncate">{category.name}</h3>
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 signal-dot ${getRegimeDot(category.regime)}`} />
            </div>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/10 dark:hover:bg-red-500/15"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Category Metrics */}
          <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
            <div className="bg-[--muted] rounded-lg p-2.5">
              <div className="text-[--muted-foreground] text-[11px] uppercase tracking-wide">FI</div>
              <div className="font-semibold text-[--foreground]">{category.fi.toFixed(3)}</div>
            </div>
            <div className="bg-[--muted] rounded-lg p-2.5">
              <div className="text-[--muted-foreground] text-[11px] uppercase tracking-wide">TFI</div>
              <div className="font-semibold text-[--foreground]">{category.tfi.toFixed(3)}</div>
            </div>
            <div className="bg-[--muted] rounded-lg p-2.5">
              <div className="text-[--muted-foreground] text-[11px] uppercase tracking-wide">Regime</div>
              <div className="font-semibold text-[--foreground]">{getRegimeLabel(category.regime)}</div>
            </div>
          </div>

          <div className="mt-2 text-xs text-[--muted-foreground]">
            {category.documents.length} document{category.documents.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Expanded Documents */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="ml-[84px] mt-4 space-y-3 overflow-hidden"
          >
            {category.documents.map((doc) => (
              <div key={doc.id} className="flex items-center gap-4">
                {/* Document Weight Circle */}
                <div className="weight-circle w-11 h-11 rounded-full flex items-center justify-center text-xs font-semibold shrink-0">
                  {doc.weight.toFixed(1)}
                </div>

                {/* Document Box */}
                <div className="flex-1 rounded-lg p-3 border border-[--border]"
                  style={{ backgroundColor: 'var(--color-doc-card)' }}>
                  <div className="font-medium text-sm text-[--foreground]">{doc.name}</div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-[--muted-foreground]">FI:</span>{' '}
                      <span className="font-semibold text-[--foreground]">{doc.fi.toFixed(3)}</span>
                    </div>
                    <div>
                      <span className="text-[--muted-foreground]">TFI:</span>{' '}
                      <span className="font-semibold text-[--foreground]">{doc.tfi.toFixed(3)}</span>
                    </div>
                    <div>
                      <span className="text-[--muted-foreground]">Regime:</span>{' '}
                      <span className="font-semibold text-[--foreground]">{getRegimeLabel(doc.regime)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Document Button */}
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 shrink-0" />
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddDocument();
                }}
                className="border-dashed border-[--border] text-[--muted-foreground]
                  hover:border-amber-400/70 hover:text-amber-500 dark:hover:text-amber-400"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Document
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}