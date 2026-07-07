import { useState } from 'react';
import { ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';

const indianPharmaStocks = [
  {
    sector: 'Large Cap Pharma',
    companies: [
      'Sun Pharmaceutical Industries',
      'Divi\'s Laboratories',
      'Dr. Reddy\'s Laboratories',
      'Cipla',
      'Lupin',
      'Aurobindo Pharma',
    ],
  },
  {
    sector: 'Mid Cap Pharma',
    companies: [
      'Torrent Pharmaceuticals',
      'Alkem Laboratories',
      'Biocon',
      'Zydus Lifesciences',
      'Glenmark Pharmaceuticals',
      'Laurus Labs',
    ],
  },
  {
    sector: 'Specialty & Biotech',
    companies: [
      'Syngene International',
      'Natco Pharma',
      'Piramal Pharma',
      'Granules India',
      'Suven Pharmaceuticals',
    ],
  },
  {
    sector: 'Diagnostics',
    companies: [
      'Dr Lal PathLabs',
      'Thyrocare Technologies',
      'Metropolis Healthcare',
    ],
  },
];

type StockSelectorProps = {
  selectedStock: string;
  onSelectStock: (stock: string) => void;
};

export default function StockSelector({ selectedStock, onSelectStock }: StockSelectorProps) {
  const [expandedSectors, setExpandedSectors] = useState<string[]>(['Large Cap Pharma']);

  const toggleSector = (sector: string) => {
    setExpandedSectors((prev) =>
      prev.includes(sector) ? prev.filter((s) => s !== sector) : [...prev, sector]
    );
  };

  return (
    <Card className="h-[800px] flex flex-col fi-card border-[--border]">
      <CardHeader className="pb-3 border-b border-[--border]">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-amber-500" />
          <CardTitle className="text-lg text-[--foreground]">Select Stock</CardTitle>
        </div>
        <p className="text-[11px] tracking-wide uppercase text-[--muted-foreground] font-mono mt-1">
          Stochron AI · Coverage Universe
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-3">
          <div className="space-y-1.5 py-3">
            {indianPharmaStocks.map((category) => (
              <div key={category.sector}>
                <button
                  onClick={() => toggleSector(category.sector)}
                  className="nav-row w-full flex items-center gap-2 px-3 py-2.5 rounded-lg
                    text-left font-semibold text-sm"
                >
                  {expandedSectors.includes(category.sector) ? (
                    <ChevronDown className="w-4 h-4 shrink-0 text-[--muted-foreground]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 shrink-0 text-[--muted-foreground]" />
                  )}
                  <span className="truncate">{category.sector}</span>
                </button>
                {expandedSectors.includes(category.sector) && (
                  <div className="ml-5 mt-1 space-y-1 border-l border-[--border] pl-3">
                    {category.companies.map((company) => {
                      const isActive = selectedStock === company;
                      return (
                        <button
                          key={company}
                          onClick={() => onSelectStock(company)}
                          className={`nav-row w-full text-left px-3 py-2 rounded-lg text-sm
                            ${isActive ? 'is-active' : ''}`}
                        >
                          {company}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}