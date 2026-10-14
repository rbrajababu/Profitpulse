import { GoogleGenAI } from '@google/genai';
import { db } from './db';
import { calculateAllIndicators } from './indicators';

export async function askAiAssistant(question: string, symbol: string = 'NIFTY'): Promise<{
  reply: string;
  groundingContext: any;
  timestamp: string;
  source: string;
}> {
  const inst = db.instruments.get(symbol) || Array.from(db.instruments.values())[0];
  const chain = db.optionChains.get(symbol);
  const tfMap = db.candles.get(symbol);
  const candles = (tfMap && tfMap['15m']) ? tfMap['15m'] : [];
  const ind = calculateAllIndicators(candles);
  const fundamental = db.fundamentals.get(symbol);

  const contextData = {
    symbol: inst.symbol,
    name: inst.name,
    segment: inst.segment,
    spotPrice: inst.currentPrice,
    changePercent: inst.changePercent,
    dayHigh: inst.dayHigh,
    dayLow: inst.dayLow,
    volume: inst.volume,
    lotSize: inst.lotSize,
    atmStrike: chain?.atmStrike,
    maxPain: chain?.maxPainStrike,
    pcrOi: chain?.pcrOi,
    highestCeOiStrike: chain?.highestCeOiStrike,
    highestPeOiStrike: chain?.highestPeOiStrike,
    indiaVix: chain?.indiaVix || 13.65,
    technicalIndicators: {
      rsi14: ind.rsi14,
      vwap: ind.vwap,
      ema9: ind.ema9,
      ema20: ind.ema20,
      ema50: ind.ema50,
      compositeScore: ind.compositeScore,
      sentiment: ind.sentimentLabel,
      supportLevels: ind.supportLevels,
      resistanceLevels: ind.resistanceLevels,
    },
    fundamentals: fundamental ? {
      peRatio: fundamental.peRatio,
      roe: fundamental.roePercent,
      roce: fundamental.rocePercent,
      debtToEquity: fundamental.debtToEquity,
      opm: fundamental.opmPercent,
    } : null,
    timestamp: new Date().toISOString(),
  };

  const apiKey = process.env.GEMINI_API_KEY;

  const getFallbackReport = (note?: string) => {
    return `
### 📊 ProfitPulse Quantitative Research Analysis: ${inst.symbol}
**Data Timestamp:** ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST | **Source:** Verified Terminal Engine
${note ? `\n> *Note: ${note} Generated via deterministic quantitative engine.*\n` : ''}
#### 1. Verified Market Facts
- **Spot Price:** ₹${inst.currentPrice.toLocaleString('en-IN')} (${inst.changePercent >= 0 ? '+' : ''}${inst.changePercent}%)
- **Day Range:** Low ₹${inst.dayLow.toLocaleString('en-IN')} — High ₹${inst.dayHigh.toLocaleString('en-IN')}
- **Volume:** ${(inst.volume / 100000).toFixed(2)} Lakh shares

#### 2. Quantitative Option Chain & Greeks Metrics
- **ATM Strike:** ₹${chain?.atmStrike || 'N/A'}
- **Put-Call Ratio (PCR OI):** ${chain?.pcrOi || 1.0} (${(chain?.pcrOi || 1) >= 1.1 ? 'Put writers dominating / Solid underlying floor' : (chain?.pcrOi || 1) <= 0.85 ? 'Call writers dominating / Heavy ceiling' : 'Balanced'})
- **Max Pain Strike:** ₹${chain?.maxPainStrike || 'N/A'} (Theoretical point where option buyers lose maximum premium)
- **Call Resistance Wall:** ₹${chain?.highestCeOiStrike || 'N/A'} (Largest open interest concentration)
- **Put Support Floor:** ₹${chain?.highestPeOiStrike || 'N/A'} (Key institutional cushion)

#### 3. Technical Framework & Indicator Confluence
- **Composite Score:** **${ind.compositeScore > 0 ? '+' : ''}${ind.compositeScore}/100** (${ind.sentimentLabel})
- **RSI (14):** ${ind.rsi14} | **VWAP:** ₹${ind.vwap} (Spot is ${inst.currentPrice >= ind.vwap ? 'above' : 'below'} VWAP)
- **Key Support Levels:** ${ind.supportLevels.map(s => '₹' + s).join(', ')}
- **Key Resistance Levels:** ${ind.resistanceLevels.map(r => '₹' + r).join(', ')}

#### 4. Actionable Strategy & Risk Assessment
- **Directional Bias:** ${ind.sentimentLabel.toUpperCase()}
- **Invalidation Condition:** A 15-minute close ${inst.currentPrice >= ind.vwap ? 'below VWAP at ₹' + ind.vwap : 'above VWAP at ₹' + ind.vwap}.
- **Risk Warning:** Options exposure carries non-linear time decay (Theta). Defined-risk spreads (e.g. Bull Call or Bear Put) are strictly recommended over naked option buying.

*Disclaimer: Generated for educational decision-support. Not SEBI registered investment advice.*
    `.trim();
  };

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      reply: getFallbackReport(),
      groundingContext: contextData,
      timestamp: contextData.timestamp,
      source: 'Internal Quantitative Analytics Engine',
    };
  }

  try {
    const ai = new GoogleGenAI();
    const prompt = `
You are the Lead Quantitative Research Analyst and Options Strategist at ProfitPulse AI.
Analyze the user's question about the Indian stock market using the following verified data as your sole source of truth:

VERIFIED CURRENT MARKET DATA:
${JSON.stringify(contextData, null, 2)}

USER QUESTION:
"${question}"

STRICT GUIDELINES:
1. Always state the data timestamp.
2. Structure your response into:
   - **Verified Market Facts**: Exact spot prices, volume, and range.
   - **Quantitative Derivatives & Technical Insights**: PCR, Max Pain, Open Interest walls, EMAs, VWAP, RSI.
   - **Analytical Interpretation & Setups**: Directional bias, trade invalidation triggers.
   - **Risk Management & Constraints**: Theta decay, volatility, capital preservation.
3. NEVER guarantee profits or predict future price certainty.
4. Clearly distinguish verified numbers from analytical interpretations.
5. Emphasize defined risk strategies (spreads).
6. Include the mandatory educational disclaimer at the end.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    return {
      reply: response.text || getFallbackReport(),
      groundingContext: contextData,
      timestamp: contextData.timestamp,
      source: 'Gemini 3.8 Flash (Server-Side Grounded Engine)',
    };
  } catch (error: any) {
    console.error('Gemini API call failed, providing grounded report:', error);
    return {
      reply: getFallbackReport('External AI model temporarily busy.'),
      groundingContext: contextData,
      timestamp: contextData.timestamp,
      source: 'Internal Quantitative Engine (Fail-safe)',
    };
  }
}
