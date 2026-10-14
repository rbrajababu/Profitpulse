import { Candle, TechnicalIndicators } from '../src/types/market';

/**
 * Technical Analysis Calculations & Scoring Model
 */

export function calculateSma(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(prices.length - period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return Math.round((sum / period) * 100) / 100;
}

export function calculateEma(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) return calculateSma(prices, prices.length);

  const k = 2 / (period + 1);
  let ema = calculateSma(prices.slice(0, period), period);

  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return Math.round(ema * 100) / 100;
}

export function calculateRsi(prices: number[], period: number = 14): number {
  if (prices.length <= period) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = prices[i] - prices[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = period + 1; i < prices.length; i++) {
    const diff = prices[i] - prices[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? Math.abs(diff) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));
  return Math.round(rsi * 10) / 10;
}

export function calculateMacd(prices: number[]): { macdLine: number; signalLine: number; histogram: number } {
  if (prices.length < 26) {
    return { macdLine: 0, signalLine: 0, histogram: 0 };
  }

  // Calculate MACD series for the last 15 periods to compute 9-period Signal Line
  const macdSeries: number[] = [];
  const startIdx = Math.max(0, prices.length - 35);

  for (let i = startIdx; i < prices.length; i++) {
    const subPrices = prices.slice(0, i + 1);
    const ema12 = calculateEma(subPrices, 12);
    const ema26 = calculateEma(subPrices, 26);
    macdSeries.push(ema12 - ema26);
  }

  const currentMacd = macdSeries[macdSeries.length - 1];
  const signalLine = calculateEma(macdSeries, 9);
  const histogram = currentMacd - signalLine;

  return {
    macdLine: Math.round(currentMacd * 100) / 100,
    signalLine: Math.round(signalLine * 100) / 100,
    histogram: Math.round(histogram * 100) / 100,
  };
}

export function calculateVwap(candles: Candle[]): number {
  if (candles.length === 0) return 0;
  let totalTypicalPriceVol = 0;
  let totalVol = 0;

  for (const c of candles) {
    const typicalPrice = (c.high + c.low + c.close) / 3;
    totalTypicalPriceVol += typicalPrice * c.volume;
    totalVol += c.volume;
  }

  if (totalVol === 0) return candles[candles.length - 1].close;
  return Math.round((totalTypicalPriceVol / totalVol) * 100) / 100;
}

export function calculateAtr(candles: Candle[], period: number = 14): number {
  if (candles.length < 2) return 1;

  const trs: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const current = candles[i];
    const prev = candles[i - 1];
    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - prev.close),
      Math.abs(current.low - prev.close)
    );
    trs.push(tr);
  }

  if (trs.length < period) {
    const sum = trs.reduce((a, b) => a + b, 0);
    return Math.round((sum / trs.length) * 100) / 100;
  }

  let atr = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trs.length; i++) {
    atr = (atr * (period - 1) + trs[i]) / period;
  }

  return Math.round(atr * 100) / 100;
}

export function calculateBollingerBands(prices: number[], period: number = 20, multiplier: number = 2): {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
} {
  const sma = calculateSma(prices, period);
  if (prices.length < period) {
    return { upper: sma * 1.02, middle: sma, lower: sma * 0.98, bandwidth: 4 };
  }

  const slice = prices.slice(prices.length - period);
  const variance = slice.reduce((acc, val) => acc + Math.pow(val - sma, 2), 0) / period;
  const stdDev = Math.sqrt(variance);

  const upper = Math.round((sma + multiplier * stdDev) * 100) / 100;
  const lower = Math.round((sma - multiplier * stdDev) * 100) / 100;
  const bandwidth = Math.round(((upper - lower) / sma) * 1000) / 10;

  return { upper, middle: sma, lower, bandwidth };
}

export function calculateSupportResistance(candles: Candle[]): { support: number[]; resistance: number[] } {
  if (candles.length < 5) return { support: [], resistance: [] };

  const currentPrice = candles[candles.length - 1].close;
  const pivotHighs: number[] = [];
  const pivotLows: number[] = [];

  // Swing points identification (window of 3)
  for (let i = 2; i < candles.length - 2; i++) {
    const c = candles[i];
    if (
      c.high > candles[i - 1].high &&
      c.high > candles[i - 2].high &&
      c.high > candles[i + 1].high &&
      c.high > candles[i + 2].high
    ) {
      pivotHighs.push(c.high);
    }
    if (
      c.low < candles[i - 1].low &&
      c.low < candles[i - 2].low &&
      c.low < candles[i + 1].low &&
      c.low < candles[i + 2].low
    ) {
      pivotLows.push(c.low);
    }
  }

  const resistance = Array.from(new Set(pivotHighs))
    .filter(p => p > currentPrice)
    .sort((a, b) => a - b)
    .slice(0, 3);

  const support = Array.from(new Set(pivotLows))
    .filter(p => p < currentPrice)
    .sort((a, b) => b - a)
    .slice(0, 3);

  return {
    support: support.length > 0 ? support : [Math.round(currentPrice * 0.98 * 100) / 100, Math.round(currentPrice * 0.95 * 100) / 100],
    resistance: resistance.length > 0 ? resistance : [Math.round(currentPrice * 1.02 * 100) / 100, Math.round(currentPrice * 1.05 * 100) / 100],
  };
}

/**
 * Composite Transparent Scoring Model (-100 to +100)
 */
export function calculateAllIndicators(candles: Candle[], niftyReturns: number = 0.5): TechnicalIndicators {
  const closes = candles.map(c => c.close);
  const currentPrice = closes[closes.length - 1] || 100;

  const ema9 = calculateEma(closes, 9);
  const ema20 = calculateEma(closes, 20);
  const ema50 = calculateEma(closes, 50);
  const ema200 = calculateEma(closes, Math.min(closes.length, 200));

  const sma20 = calculateSma(closes, 20);
  const sma50 = calculateSma(closes, 50);
  const sma200 = calculateSma(closes, Math.min(closes.length, 200));

  const rsi14 = calculateRsi(closes, 14);
  const macd = calculateMacd(closes);
  const vwap = calculateVwap(candles);
  const atr14 = calculateAtr(candles, 14);
  const bollingerBands = calculateBollingerBands(closes, 20);
  const sr = calculateSupportResistance(candles);

  // Stock return over last 20 candles vs Nifty return
  const startPrice = closes[Math.max(0, closes.length - 20)];
  const stock20Return = startPrice > 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0;
  const relativeStrengthVsNifty = Math.round((stock20Return - niftyReturns) * 10) / 10;

  // Transparent scoring algorithm (-100 to +100)
  let score = 0;

  // 1. Trend alignment (EMA stack): max +/- 30 pts
  if (currentPrice > ema20 && ema20 > ema50) score += 20;
  else if (currentPrice < ema20 && ema20 < ema50) score -= 20;

  if (currentPrice > ema9) score += 10;
  else score -= 10;

  // 2. Momentum (RSI 14): max +/- 25 pts
  if (rsi14 >= 55 && rsi14 <= 70) score += 20; // healthy bullish momentum
  else if (rsi14 > 70) score += 5; // overbought warning
  else if (rsi14 <= 45 && rsi14 >= 30) score -= 20; // healthy bearish momentum
  else if (rsi14 < 30) score -= 5; // oversold warning
  else score += (rsi14 - 50) * 1.5;

  // 3. MACD: max +/- 20 pts
  if (macd.histogram > 0) {
    score += macd.macdLine > macd.signalLine ? 15 : 5;
  } else {
    score -= macd.macdLine < macd.signalLine ? 15 : 5;
  }

  // 4. VWAP alignment: max +/- 15 pts
  if (currentPrice > vwap) score += 15;
  else score -= 15;

  // 5. Bollinger Band alignment: max +/- 10 pts
  if (currentPrice > bollingerBands.middle) score += 10;
  else score -= 10;

  const normalizedScore = Math.max(-100, Math.min(100, Math.round(score)));

  let sentimentLabel: 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';
  if (normalizedScore >= 60) sentimentLabel = 'Strong Bullish';
  else if (normalizedScore >= 25) sentimentLabel = 'Bullish';
  else if (normalizedScore <= -60) sentimentLabel = 'Strong Bearish';
  else if (normalizedScore <= -25) sentimentLabel = 'Bearish';
  else sentimentLabel = 'Neutral';

  return {
    ema9,
    ema20,
    ema50,
    ema200,
    sma20,
    sma50,
    sma200,
    rsi14,
    macd,
    vwap,
    atr14,
    bollingerBands,
    supportLevels: sr.support,
    resistanceLevels: sr.resistance,
    relativeStrengthVsNifty,
    compositeScore: normalizedScore,
    sentimentLabel,
  };
}
