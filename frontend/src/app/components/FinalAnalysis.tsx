import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { fetchAnalysis } from '../../lib/api';

export default function FinalAnalysis() {
  const navigate = useNavigate();
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis()
      .then(data => setAnalysisData(data))
      .catch(err => console.error('Failed to load analysis:', err))
      .finally(() => setLoading(false));
  }, []);

  const historicalData = analysisData?.time_series
    ?.filter((d: any) => d.daily_fi !== null)
    ?.map((d: any) => ({ date: d.date, fi: d.daily_fi, stockPrice: d.nifty_it, regime: d.regime })) ?? [];

  const scatterData = historicalData.map((d: any) => ({ fi: d.fi, returnPct: d.stockPrice }));

  const regimeBreakdown = analysisData?.regime_breakdown ?? [
    { regime: 'Stable',   count: 0, avg_fi: 0, color: '#22c55e' },
    { regime: 'Watch',    count: 0, avg_fi: 0, color: '#eab308' },
    { regime: 'Alert',    count: 0, avg_fi: 0, color: '#f97316' },
    { regime: 'Critical', count: 0, avg_fi: 0, color: '#ef4444' },
  ];

  const correlation   = analysisData?.correlation_coefficient;
  const corrDisplay   = correlation !== null && correlation !== undefined ? correlation.toFixed(2) : '—';
  const corrStrength  = Math.abs(correlation ?? 0) > 0.7 ? 'Strong' : Math.abs(correlation ?? 0) > 0.4 ? 'Moderate' : 'Weak';

  const tooltipStyle = { backgroundColor: '#111827', border: '1px solid #1E2A3A', color: '#fff' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#0A0E1A] dark:to-[#0D1221] p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">Final Analysis</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 mt-2">FI–Stock Performance Correlation Analysis</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/network')}
            className="dark:border-[#1E2A3A] dark:text-slate-400 dark:hover:border-amber-400">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Network
          </Button>
        </div>

        {/* Explainer */}
        <Card className="bg-blue-50 dark:bg-[#0D1B2E] border-2 border-blue-200 dark:border-blue-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-300">
              <TrendingUp className="w-6 h-6" />
              Understanding FI–Stock Performance Correlation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-blue-900 dark:text-blue-300">
            <p>This analysis demonstrates the <strong>correlation between the Foreboding Index (FI)</strong> and <strong>actual stock performance</strong>.</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Higher FI values tend to precede stock price declines</li>
              <li>Lower FI values correlate with stable or positive performance</li>
              <li>Regime classifications help categorize risk levels for portfolio decisions</li>
              <li>The system enables proactive risk management rather than reactive responses</li>
            </ul>
            {analysisData && (
              <p className="mt-2 font-semibold text-amber-600 dark:text-amber-400">{analysisData.interpretation}</p>
            )}
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="dark:bg-[#111827] dark:border-[#1E2A3A]">
            <CardHeader>
              <CardTitle className="dark:text-white">FI vs Stock Price Trend</CardTitle>
              <CardDescription className="dark:text-slate-400">Daily FI vs NIFTY IT price</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <YAxis yAxisId="left"  tick={{ fill: '#94a3b8' }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0,1]} tick={{ fill: '#94a3b8' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Line yAxisId="left"  type="monotone" dataKey="stockPrice" stroke="#4A90D9" name="NIFTY IT"  strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="fi"         stroke="#F5A623" name="Daily FI"  strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="dark:bg-[#111827] dark:border-[#1E2A3A]">
            <CardHeader>
              <CardTitle className="dark:text-white">FI–Return Correlation</CardTitle>
              <CardDescription className="dark:text-slate-400">Each point = one trading date</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                  <XAxis type="number" dataKey="fi"         name="FI"       domain={[0,1]} tick={{ fill: '#94a3b8' }} />
                  <YAxis type="number" dataKey="returnPct"  name="NIFTY IT" tick={{ fill: '#94a3b8' }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={tooltipStyle} />
                  <Scatter name="FI vs NIFTY IT" data={scatterData} fill="#8b5cf6" />
                </ScatterChart>
              </ResponsiveContainer>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 text-center">
                Correlation: <strong className="text-amber-500">{corrDisplay}</strong>
                {correlation !== null && correlation !== undefined && (
                  <span className="text-slate-500"> ({corrStrength} negative correlation)</span>
                )}
              </p>
            </CardContent>
          </Card>

          <Card className="dark:bg-[#111827] dark:border-[#1E2A3A]">
            <CardHeader>
              <CardTitle className="dark:text-white">Articles by Regime</CardTitle>
              <CardDescription className="dark:text-slate-400">Article count per regime classification</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regimeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                  <XAxis dataKey="regime" tick={{ fill: '#94a3b8' }} />
                  <YAxis tick={{ fill: '#94a3b8' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" name="Articles" fill="#4A90D9" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="dark:bg-[#111827] dark:border-[#1E2A3A]">
            <CardHeader>
              <CardTitle className="dark:text-white">Avg FI by Regime</CardTitle>
              <CardDescription className="dark:text-slate-400">Mean FI score per regime bucket</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regimeBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2A3A" />
                  <XAxis dataKey="regime" tick={{ fill: '#94a3b8' }} />
                  <YAxis domain={[0,1]} tick={{ fill: '#94a3b8' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="avg_fi" name="Avg FI" fill="#F5A623" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        <Card className="dark:bg-[#111827] dark:border-[#1E2A3A]">
          <CardHeader>
            <CardTitle className="dark:text-white">Key Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { regime: 'Stable',   bg: 'bg-green-50  dark:bg-green-950',  border: 'border-green-200  dark:border-green-900',  text: 'text-green-700  dark:text-green-400',  label: 'text-green-600  dark:text-green-500'  },
                { regime: 'Watch',    bg: 'bg-yellow-50 dark:bg-yellow-950', border: 'border-yellow-200 dark:border-yellow-900', text: 'text-yellow-700 dark:text-yellow-400', label: 'text-yellow-600 dark:text-yellow-500' },
                { regime: 'Alert',    bg: 'bg-orange-50 dark:bg-orange-950', border: 'border-orange-200 dark:border-orange-900', text: 'text-orange-700 dark:text-orange-400', label: 'text-orange-600 dark:text-orange-500' },
                { regime: 'Critical', bg: 'bg-red-50    dark:bg-red-950',    border: 'border-red-200    dark:border-red-900',    text: 'text-red-700    dark:text-red-400',    label: 'text-red-600    dark:text-red-500'    },
              ].map(({ regime, bg, border, text, label }) => {
                const stat = regimeBreakdown.find((r: any) => r.regime === regime);
                return (
                  <div key={regime} className={`text-center p-4 ${bg} rounded-lg border ${border}`}>
                    <div className={`text-3xl font-bold ${text}`}>{stat?.count ?? 0}</div>
                    <div className={`text-sm ${label} mt-1`}>{regime} articles</div>
                    <div className={`text-xs ${label} mt-1`}>Avg FI: {stat?.avg_fi?.toFixed(3) ?? '—'}</div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 bg-slate-50 dark:bg-[#0A0E1A] rounded-lg border dark:border-[#1E2A3A]">
              <h4 className="font-semibold mb-3 dark:text-white">Dataset Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Total Articles:</span>
                  <span className="ml-2 font-semibold dark:text-white">{analysisData?.total_articles ?? '—'}</span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Date Range:</span>
                  <span className="ml-2 font-semibold dark:text-white text-xs">
                    {analysisData?.date_range?.from ?? '—'} → {analysisData?.date_range?.to ?? '—'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 dark:text-slate-400">Correlation:</span>
                  <span className="ml-2 font-semibold text-amber-500">{corrDisplay}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}