import { useNavigate } from 'react-router-dom';
import { FileText, TrendingUp, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export default function PlatformOverview() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-12">

        {/* Header */}
        <div className="text-center space-y-3 pt-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="signal-dot bg-amber-400" />
            <span className="text-amber-500 text-xs tracking-[0.25em] uppercase font-mono">
              Stochron AI
            </span>
          </div>
          <h1 className="text-5xl font-bold text-[--foreground] tracking-tight">
            Volatility Foreboding Index Platform
          </h1>
          <p className="text-xl text-[--muted-foreground]">
            Predictive Analytics for Pharma Stock Volatility
          </p>
        </div>

        {/* Main Claim Section — single card, both panels inside it, like the original */}
        <Card className="fi-card border-[--border]">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl text-[--foreground]">
              Re-engineering the Workflow of Risk &amp; Portfolio Managers
            </CardTitle>
            <CardDescription className="text-lg mt-3 text-[--muted-foreground]">
              Traditional approach vs. our approach
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">

            {/* Old Way */}
            <div className="p-6 rounded-lg border-2 border-red-500/25 bg-red-500/[0.06]">
              <h3 className="text-xl font-semibold mb-4 text-red-500 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-6 h-6" />
                Traditional Approach: Messy &amp; Time-Consuming
              </h3>
              <div className="flex flex-wrap gap-4 justify-center items-center">
                <DocumentIcon label="Earnings Call" />
                <ArrowRight className="w-6 h-6 text-red-400/70" />
                <DocumentIcon label="News" />
                <ArrowRight className="w-6 h-6 text-red-400/70" />
                <DocumentIcon label="Filings" />
                <ArrowRight className="w-6 h-6 text-red-400/70" />
                <DocumentIcon label="Reports" />
                <ArrowRight className="w-6 h-6 text-red-400/70" />
                <div className="px-6 py-4 rounded-lg font-semibold text-red-500 dark:text-red-400 bg-red-500/15 border border-red-500/20">
                  Final Analysis?
                </div>
              </div>
              <p className="text-center mt-4 text-red-500/80 dark:text-red-400/80 italic text-sm">
                Hours of reading → uncertain conclusions
              </p>
            </div>

            {/* New Way */}
            <div className="p-6 rounded-lg border-2 border-emerald-500/25 bg-emerald-500/[0.06]">
              <h3 className="text-xl font-semibold mb-4 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Our Approach: Start with Analysis, Dive Deep as Needed
              </h3>
              <div className="flex flex-col items-center gap-4">
                <div className="px-8 py-6 rounded-lg font-semibold text-xl text-black bg-amber-400 shadow-[0_0_24px_rgba(245,158,11,0.25)]">
                  Final Analysis (FI, TFI, Regime)
                </div>
                <ArrowRight className="w-6 h-6 text-emerald-500/70 rotate-90" />
                <div className="flex flex-wrap gap-4 justify-center">
                  <DocumentIcon label="Drill into Earnings" small />
                  <DocumentIcon label="Check News" small />
                  <DocumentIcon label="Review Filings" small />
                  <DocumentIcon label="Validate Sources" small />
                </div>
              </div>
              <p className="text-center mt-4 text-emerald-600 dark:text-emerald-400 font-medium text-sm">
                Immediate insights → deep dive only where needed
              </p>
            </div>

            <div className="text-center pt-2">
              <Button
                size="lg"
                onClick={() => navigate('/network')}
                className="text-lg px-8 py-6 bg-amber-400 hover:bg-amber-300 text-black
                  transition-all hover:shadow-[0_0_24px_rgba(245,158,11,0.4)]"
              >
                Start Analysis
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card className="fi-card border-[--border]">
          <CardHeader>
            <CardTitle className="text-2xl text-[--foreground]">Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-[--border]">
                <AccordionTrigger className="text-lg font-semibold text-[--foreground] hover:text-amber-500 dark:hover:text-amber-400">
                  What is the statistical robustness of this model?
                </AccordionTrigger>
                <AccordionContent className="text-base space-y-4 text-[--muted-foreground]">
                  <p>
                    Our methodology is inspired by rigorous academic research in economic uncertainty measurement:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong className="text-[--foreground]">Baker, S. R., Bloom, N., &amp; Davis, S. J. (2016).</strong> Measuring economic policy uncertainty.
                      <em> The Quarterly Journal of Economics, 131(3), 1593-1636.</em>
                    </li>
                    <li>
                      <strong className="text-[--foreground]">Roy Trivedi, S. (2024).</strong> Into the Unknown: Uncertainty, Foreboding and Financial Markets.
                      <em> Asia-Pacific Financial Markets 31, 1–23.</em>
                    </li>
                  </ul>
                  <p className="mt-4 bg-blue-500/10 p-4 rounded-lg border-l-4 border-blue-400 text-[--foreground]">
                    <strong>Academic Validation:</strong> Dr. Smita Roy Trivedi (Senior Researcher at the National Institute of Bank Management)
                    is closely guiding our research team and evaluating our model for its statistical efficacy and robustness.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2" className="border-[--border]">
                <AccordionTrigger className="text-lg font-semibold text-[--foreground] hover:text-amber-500 dark:hover:text-amber-400">
                  What are the Foreboding Index (FI) and Term Frequency Foreboding Index (TFI)?
                </AccordionTrigger>
                <AccordionContent className="text-base text-[--muted-foreground]">
                  <p className="mb-2">
                    The <strong className="text-[--foreground]">Foreboding Index (FI)</strong> measures the presence of foreboding language in text documents.
                    It quantifies uncertainty and negative sentiment that may precede volatility.
                  </p>
                  <p>
                    The <strong className="text-[--foreground]">Term Frequency Foreboding Index (TFI)</strong> weights the FI by the frequency of foreboding terms,
                    providing a more nuanced measure that accounts for how often concerning language appears.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3" className="border-[--border]">
                <AccordionTrigger className="text-lg font-semibold text-[--foreground] hover:text-amber-500 dark:hover:text-amber-400">
                  How are Regime levels determined?
                </AccordionTrigger>
                <AccordionContent className="text-base text-[--muted-foreground]">
                  <p className="mb-4">
                    Regime levels categorize the current market state based on the FI score:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="w-24 px-3 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded font-semibold text-center text-sm">0.0 – 0.25</span>
                      <span>Stable: Low volatility expected</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-24 px-3 py-1 bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 rounded font-semibold text-center text-sm">0.25 – 0.5</span>
                      <span>Watch: Moderate concern, monitor closely</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-24 px-3 py-1 bg-orange-500/15 text-orange-600 dark:text-orange-400 rounded font-semibold text-center text-sm">0.5 – 0.75</span>
                      <span>Alert: Elevated risk, prepare for volatility</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="w-24 px-3 py-1 bg-red-500/15 text-red-600 dark:text-red-400 rounded font-semibold text-center text-sm">0.75 – 1.0</span>
                      <span>Critical: High volatility imminent</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4" className="border-[--border]">
                <AccordionTrigger className="text-lg font-semibold text-[--foreground] hover:text-amber-500 dark:hover:text-amber-400">
                  Which sectors and stocks are supported?
                </AccordionTrigger>
                <AccordionContent className="text-base text-[--muted-foreground]">
                  <p>
                    Our platform currently focuses on the pharmaceutical sector within the Indian stock market,
                    covering major companies across various sub-sectors including generic drugs, specialty pharma,
                    biotech, and diagnostics. You can select from sector-categorized companies in the analysis interface.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5" className="border-[--border]">
                <AccordionTrigger className="text-lg font-semibold text-[--foreground] hover:text-amber-500 dark:hover:text-amber-400">
                  Can I customize the foreboding dictionaries?
                </AccordionTrigger>
                <AccordionContent className="text-base text-[--muted-foreground]">
                  <p>
                    Yes. Our platform allows you to fully customize the dictionaries used for analysis.
                    You can add or remove words from the Root Foreboding, Foreboding, Assurance, and Geopolitical dictionaries
                    to tailor the analysis to your specific needs and domain expertise.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DocumentIcon({ label, small }: { label: string; small?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 ${small ? 'scale-90' : ''}`}>
      <div className="p-3 rounded-lg fi-card hover-glow border border-[--border] transition-transform hover:-translate-y-0.5">
        <FileText className="w-7 h-7 text-blue-500 dark:text-blue-400" />
      </div>
      <span className="text-xs text-[--muted-foreground] font-medium whitespace-nowrap">{label}</span>
    </div>
  );
}