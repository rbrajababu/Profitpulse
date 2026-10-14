import React, { useState } from 'react';
import { Sparkles, Send, ShieldAlert, CheckCircle, Clock, BookOpen, Layers } from 'lucide-react';

interface AiResearchAssistantProps {
  symbol: string;
}

export const AiResearchAssistant: React.FC<AiResearchAssistantProps> = ({ symbol }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const sampleQueries = [
    `Why is ${symbol} showing its current quantitative bias?`,
    `Which strikes show the largest Open Interest concentrations on ${symbol}?`,
    `What specific conditions would invalidate the current trading setup on ${symbol}?`,
    `Analyze the Put-Call Ratio (PCR) and Max Pain strike for ${symbol}.`,
    `How do fundamental valuation metrics align with technical momentum for ${symbol}?`,
  ];

  const handleAsk = async (queryText: string) => {
    if (!queryText.trim() || loading) return;
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryText, symbol }),
      });

      if (res.ok) {
        const json = await res.json();
        setResponse(json);
      } else {
        setResponse({
          reply: 'Unable to complete AI quantitative analysis at this moment.',
          timestamp: new Date().toISOString(),
          source: 'System Diagnostic Error',
        });
      }
    } catch (err) {
      console.error('AI assistant error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">ProfitPulse AI Market Research Assistant</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Quantitative decision-support engine grounded in verified exchange spot data, Black-Scholes Greeks, Open Interest concentrations, and mathematical indicators.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-950/70 border border-cyan-800/80 px-2 py-0.5 rounded">
            Target: {symbol}
          </span>
        </div>
      </div>

      {/* Suggested Query Buttons */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Suggested Quantitative Queries for {symbol}:
        </div>
        <div className="flex flex-wrap gap-2">
          {sampleQueries.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setQuestion(q);
                handleAsk(q);
              }}
              className="text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-3 py-1.5 rounded transition text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleAsk(question);
        }}
        className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-2 focus-within:border-cyan-500 transition"
      >
        <input
          type="text"
          placeholder={`Ask about ${symbol} options flow, PCR, Max Pain, or risk levels...`}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          className="flex-1 bg-transparent border-none outline-none text-xs text-slate-100 placeholder-slate-500 px-2"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs rounded transition"
        >
          {loading ? (
            <>
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </>
          )}
        </button>
      </form>

      {/* Analysis Output Card */}
      {response && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Grounded Quantitative Research Report
            </span>
            <div className="text-[11px] text-slate-500 font-mono-num flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" /> {new Date(response.timestamp).toLocaleTimeString('en-IN')} IST
              </span>
              <span>·</span>
              <span>{response.source}</span>
            </div>
          </div>

          {/* Formatted Markdown Content */}
          <div className="prose prose-invert prose-xs max-w-none text-slate-200 leading-relaxed whitespace-pre-line text-xs font-sans">
            {response.reply}
          </div>

          {/* Source Grounding Context Inspection */}
          {response.groundingContext && (
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-300">Grounding Source Context:</span>{' '}
              Spot: ₹{response.groundingContext.spotPrice} | ATM: ₹{response.groundingContext.atmStrike} | Max Pain: ₹{response.groundingContext.maxPain} | PCR: {response.groundingContext.pcrOi} | Technical Score: {response.groundingContext.technicalIndicators?.compositeScore}
            </div>
          )}
        </div>
      )}

      {/* Compliance Note */}
      <div className="p-3 bg-slate-900/60 border border-slate-800 rounded text-xs text-slate-400 flex items-center gap-2">
        <ShieldAlert className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <strong>AI Regulatory Boundary:</strong> ProfitPulse AI outputs are solely quantitative decision-support models for educational market study. The platform never predicts prices with certainty and never accepts or executes broker orders.
        </span>
      </div>
    </div>
  );
};
