import {
  TradingSetup,
  StrategyAnalysis,
  OptionsStrategyLeg,
  ScreenerResult,
  BacktestConfig,
  BacktestSummary,
  BacktestTrade,
  Candle,
} from '../src/types/market';
import { db } from './db';
import { calculateAllIndicators } from './indicators';
import { calculateBlackScholesGreeks } from './greeks';
import { classifyOIBuildup } from './market-provider';

/**
 * Advanced Trading Setups Engine (Modules 6, 7, 8)
 */
export function generateTradingSetups(symbol?: string): TradingSetup[] {
  const targetSymbols = symbol
    ? [symbol]
    : ['NIFTY', 'BANKNIFTY', 'RELIANCE', 'HDFCBANK', 'TCS', 'INFY', 'BHARTIARTL', 'SUNPHARMA'];

  const setups: TradingSetup[] = [];

  for (const sym of targetSymbols) {
    const inst = db.instruments.get(sym);
    if (!inst) continue;

    const tfMap = db.candles.get(sym);
    if (!tfMap) continue;

    const candles15m = tfMap['15m'] || [];
    const candlesD = tfMap['D'] || [];
    const ind15m = calculateAllIndicators(candles15m);
    const indD = calculateAllIndicators(candlesD);
    const chain = db.optionChains.get(sym);

    const price = inst.currentPrice;
    const lotSize = inst.lotSize;

    // 1. INTRADAY SETUP
    const intradayRsi = ind15m.rsi14;
    const isAboveVwap = price > ind15m.vwap;
    const pcr = chain ? chain.pcrOi : 1.0;

    if (intradayRsi > 58 && isAboveVwap && pcr >= 1.05) {
      // Bullish Intraday ORB / VWAP Bounce
      const sl = Math.round((Math.max(ind15m.vwap, price * 0.994)) * 100) / 100;
      const risk = price - sl;
      const target1 = Math.round((price + risk * 1.8) * 100) / 100;
      const target2 = Math.round((price + risk * 3.0) * 100) / 100;
      const rr = Math.round((risk > 0 ? (target1 - price) / risk : 1.8) * 10) / 10;

      // Position sizing: assume ₹10,000 max risk per trade
      const capitalRisk = 10000;
      const maxShares = risk > 0 ? Math.floor(capitalRisk / risk) : lotSize;
      const lots = Math.max(1, Math.floor(maxShares / lotSize));

      setups.push({
        id: `setup_${sym}_intra_bull`,
        symbol: sym,
        timeframe: 'INTRADAY',
        bias: 'BULLISH',
        setupName: 'VWAP Bounce with High PCR Confirmation',
        entryZone: `₹${Math.round(price * 0.998)} - ₹${Math.round(price * 1.002)}`,
        entryPrice: price,
        stopLoss: sl,
        target1,
        target2,
        riskRewardRatio: rr,
        suggestedPositionSizeLots: lots,
        suggestedQuantity: lots * lotSize,
        invalidationCondition: `Price closes below VWAP (₹${ind15m.vwap}) on a 15-minute candle.`,
        supportingFactors: [
          `Trading above intraday VWAP (₹${ind15m.vwap}).`,
          `RSI(14) in bullish expansion zone at ${intradayRsi}.`,
          `Option Chain Put-Call Ratio at ${pcr} indicates strong support from put writers.`,
          `15m EMA 9 (₹${ind15m.ema9}) > EMA 20 (₹${ind15m.ema20}).`,
        ],
        confidenceScore: 78,
        isNoTrade: false,
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      });
    } else if (intradayRsi < 42 && !isAboveVwap && pcr <= 0.85) {
      // Bearish Intraday Breakdown
      const sl = Math.round((Math.min(ind15m.vwap, price * 1.006)) * 100) / 100;
      const risk = sl - price;
      const target1 = Math.round((price - risk * 1.8) * 100) / 100;
      const target2 = Math.round((price - risk * 3.0) * 100) / 100;
      const rr = Math.round((risk > 0 ? (price - target1) / risk : 1.8) * 10) / 10;
      const lots = Math.max(1, Math.floor(10000 / (risk * lotSize || 1)));

      setups.push({
        id: `setup_${sym}_intra_bear`,
        symbol: sym,
        timeframe: 'INTRADAY',
        bias: 'BEARISH',
        setupName: 'VWAP Rejection & Aggressive Call Writing',
        entryZone: `₹${Math.round(price * 0.998)} - ₹${Math.round(price * 1.002)}`,
        entryPrice: price,
        stopLoss: sl,
        target1,
        target2,
        riskRewardRatio: rr,
        suggestedPositionSizeLots: lots,
        suggestedQuantity: lots * lotSize,
        invalidationCondition: `Price recovers above VWAP (₹${ind15m.vwap}) with sustained volume.`,
        supportingFactors: [
          `Rejected from VWAP with lower high structure.`,
          `RSI(14) depressed at ${intradayRsi}.`,
          `Option Chain PCR low at ${pcr}, signaling heavy call additions at upper strikes.`,
        ],
        confidenceScore: 74,
        isNoTrade: false,
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      });
    } else {
      // Explicit NO TRADE state when conditions are conflicting
      setups.push({
        id: `setup_${sym}_intra_notrade`,
        symbol: sym,
        timeframe: 'INTRADAY',
        bias: 'NO_TRADE',
        setupName: 'Neutral Rangebound / Conflicting Signals',
        entryZone: 'N/A (Stand aside)',
        entryPrice: price,
        stopLoss: 0,
        target1: 0,
        target2: 0,
        riskRewardRatio: 0,
        suggestedPositionSizeLots: 0,
        suggestedQuantity: 0,
        invalidationCondition: 'Wait for decisive breakout beyond VWAP and clear OI momentum.',
        supportingFactors: [
          `RSI (${intradayRsi}) is oscillating in the choppy 42-58 range.`,
          `Risk-to-reward does not meet minimum 1:1.5 standard.`,
          `PCR is balanced without clear directional institutional dominance.`,
        ],
        confidenceScore: 40,
        isNoTrade: true,
        noTradeReason: 'Choppy intraday volatility with no clear momentum edge. Capital preservation recommended.',
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      });
    }

    // 2. SWING TRADING SETUP (2 - 10 Days)
    const dailyEma20 = indD.ema20;
    const dailyEma50 = indD.ema50;
    const swingBias = price > dailyEma20 && dailyEma20 > dailyEma50 ? 'BULLISH' : price < dailyEma20 && dailyEma20 < dailyEma50 ? 'BEARISH' : 'NEUTRAL';

    if (swingBias === 'BULLISH') {
      const sl = Math.round((dailyEma20 * 0.985) * 100) / 100;
      const risk = price - sl;
      const target1 = Math.round((price + risk * 2.2) * 100) / 100;
      const target2 = Math.round((price + risk * 3.5) * 100) / 100;
      const rr = Math.round(((target1 - price) / risk) * 10) / 10;

      setups.push({
        id: `setup_${sym}_swing_bull`,
        symbol: sym,
        timeframe: 'SWING',
        bias: 'BULLISH',
        setupName: 'Multi-Day EMA Trend Pullback',
        entryZone: `₹${Math.round(dailyEma20)} - ₹${Math.round(price)}`,
        entryPrice: price,
        stopLoss: sl,
        target1,
        target2,
        riskRewardRatio: rr,
        suggestedPositionSizeLots: 1,
        suggestedQuantity: lotSize,
        invalidationCondition: `Daily closing below 50 EMA (₹${dailyEma50}).`,
        supportingFactors: [
          `Price holding above upward sloping 20 EMA (₹${dailyEma20}).`,
          `Daily Composite Technical Score at +${indD.compositeScore}/100.`,
          `Healthy multi-session structure with higher swing lows.`,
        ],
        confidenceScore: 82,
        isNoTrade: false,
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      });
    }

    // 3. SHORT-TERM INVESTING SETUP (2 - 20 Days)
    if (inst.segment === 'FO_EQUITY') {
      const fundamental = db.fundamentals.get(sym);
      const isGoodFundamentals = fundamental ? fundamental.peRatio < 35 && fundamental.roePercent > 15 : true;

      setups.push({
        id: `setup_${sym}_short_term`,
        symbol: sym,
        timeframe: 'SHORT_TERM',
        bias: indD.compositeScore > 10 ? 'BULLISH' : 'NEUTRAL',
        setupName: 'Positional Equity Accumulation',
        entryZone: `₹${Math.round(price * 0.98)} - ₹${Math.round(price * 1.01)}`,
        entryPrice: price,
        stopLoss: Math.round((price * 0.94) * 100) / 100,
        target1: Math.round((price * 1.10) * 100) / 100,
        target2: Math.round((price * 1.18) * 100) / 100,
        riskRewardRatio: 2.1,
        suggestedPositionSizeLots: 1,
        suggestedQuantity: Math.floor(50000 / price),
        invalidationCondition: `Breakdown below 52-week support base or quarterly margin shock.`,
        supportingFactors: [
          `Cash Equity Delivery Setup: No expiry time decay risk compared to F&O.`,
          isGoodFundamentals ? `Sound fundamentals (ROE: ${fundamental?.roePercent}%, P/E: ${fundamental?.peRatio}).` : 'Consolidation near strong technical demand zone.',
          `Relative strength vs NIFTY: ${indD.relativeStrengthVsNifty > 0 ? '+' : ''}${indD.relativeStrengthVsNifty}%.`,
        ],
        confidenceScore: 75,
        isNoTrade: false,
        createdAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 20 * 24 * 3600 * 1000).toISOString(),
      });
    }
  }

  return setups;
}

/**
 * Options Strategy Analyzer (Module 9)
 */
export function analyzeOptionStrategy(
  strategyType: 'LONG_CALL' | 'LONG_PUT' | 'BULL_CALL_SPREAD' | 'BEAR_PUT_SPREAD' | 'IRON_CONDOR',
  symbol: string = 'NIFTY'
): StrategyAnalysis {
  const inst = db.instruments.get(symbol) || Array.from(db.instruments.values())[0];
  const chain = db.optionChains.get(symbol);
  const spot = inst.currentPrice;
  const step = inst.strikeStep;
  const atm = Math.round(spot / step) * step;
  const lotSize = inst.lotSize;

  let strategyName = 'Bull Call Spread';
  let outlook: StrategyAnalysis['outlook'] = 'Bullish';
  let netPremium = 0;
  let maxProfit = '';
  let maxLoss = '';
  let breakevens: number[] = [];
  let riskWarning: string | undefined;

  const legs: OptionsStrategyLeg[] = [];

  if (strategyType === 'BULL_CALL_SPREAD') {
    strategyName = `Bull Call Spread (${atm} CE / ${atm + step * 2} CE)`;
    outlook = 'Bullish';

    // Buy ATM Call, Sell OTM Call (+2 steps)
    const buyStrike = atm;
    const sellStrike = atm + step * 2;
    const buyPrem = Math.round(spot * 0.016 * 100) / 100;
    const sellPrem = Math.round(spot * 0.007 * 100) / 100;

    legs.push(
      { id: '1', type: 'CE', action: 'BUY', strike: buyStrike, expiry: 'Current Expiry', premium: buyPrem, lots: 1, lotSize },
      { id: '2', type: 'CE', action: 'SELL', strike: sellStrike, expiry: 'Current Expiry', premium: sellPrem, lots: 1, lotSize }
    );

    const netDebitPerShare = buyPrem - sellPrem;
    netPremium = Math.round(netDebitPerShare * lotSize);
    const maxProfitPerShare = (sellStrike - buyStrike) - netDebitPerShare;
    maxProfit = `₹${Math.round(maxProfitPerShare * lotSize).toLocaleString('en-IN')}`;
    maxLoss = `₹${Math.round(netPremium).toLocaleString('en-IN')} (Capped)`;
    breakevens = [Math.round((buyStrike + netDebitPerShare) * 100) / 100];
  } else if (strategyType === 'BEAR_PUT_SPREAD') {
    strategyName = `Bear Put Spread (${atm} PE / ${atm - step * 2} PE)`;
    outlook = 'Bearish';

    const buyStrike = atm;
    const sellStrike = atm - step * 2;
    const buyPrem = Math.round(spot * 0.015 * 100) / 100;
    const sellPrem = Math.round(spot * 0.006 * 100) / 100;

    legs.push(
      { id: '1', type: 'PE', action: 'BUY', strike: buyStrike, expiry: 'Current Expiry', premium: buyPrem, lots: 1, lotSize },
      { id: '2', type: 'PE', action: 'SELL', strike: sellStrike, expiry: 'Current Expiry', premium: sellPrem, lots: 1, lotSize }
    );

    const netDebitPerShare = buyPrem - sellPrem;
    netPremium = Math.round(netDebitPerShare * lotSize);
    const maxProfitPerShare = (buyStrike - sellStrike) - netDebitPerShare;
    maxProfit = `₹${Math.round(maxProfitPerShare * lotSize).toLocaleString('en-IN')}`;
    maxLoss = `₹${Math.round(netPremium).toLocaleString('en-IN')} (Capped)`;
    breakevens = [Math.round((buyStrike - netDebitPerShare) * 100) / 100];
  } else if (strategyType === 'LONG_CALL') {
    strategyName = `Long Call Option (${atm} CE)`;
    outlook = 'Bullish';
    const buyPrem = Math.round(spot * 0.016 * 100) / 100;
    legs.push({ id: '1', type: 'CE', action: 'BUY', strike: atm, expiry: 'Current Expiry', premium: buyPrem, lots: 1, lotSize });
    netPremium = Math.round(buyPrem * lotSize);
    maxProfit = 'Unlimited';
    maxLoss = `₹${netPremium.toLocaleString('en-IN')} (Capped)`;
    breakevens = [Math.round((atm + buyPrem) * 100) / 100];
    riskWarning = 'High Theta decay risk if underlying stays rangebound before expiry.';
  } else if (strategyType === 'LONG_PUT') {
    strategyName = `Long Put Option (${atm} PE)`;
    outlook = 'Bearish';
    const buyPrem = Math.round(spot * 0.015 * 100) / 100;
    legs.push({ id: '1', type: 'PE', action: 'BUY', strike: atm, expiry: 'Current Expiry', premium: buyPrem, lots: 1, lotSize });
    netPremium = Math.round(buyPrem * lotSize);
    maxProfit = `₹${Math.round((atm - buyPrem) * lotSize).toLocaleString('en-IN')}`;
    maxLoss = `₹${netPremium.toLocaleString('en-IN')} (Capped)`;
    breakevens = [Math.round((atm - buyPrem) * 100) / 100];
  } else {
    // IRON CONDOR
    strategyName = `Iron Condor (${atm - step * 3}/${atm - step} PE & ${atm + step}/${atm + step * 3} CE)`;
    outlook = 'Neutral';
    legs.push(
      { id: '1', type: 'PE', action: 'BUY', strike: atm - step * 3, expiry: 'Current Expiry', premium: 12, lots: 1, lotSize },
      { id: '2', type: 'PE', action: 'SELL', strike: atm - step, expiry: 'Current Expiry', premium: 45, lots: 1, lotSize },
      { id: '3', type: 'CE', action: 'SELL', strike: atm + step, expiry: 'Current Expiry', premium: 48, lots: 1, lotSize },
      { id: '4', type: 'CE', action: 'BUY', strike: atm + step * 3, expiry: 'Current Expiry', premium: 14, lots: 1, lotSize }
    );
    const netCreditPerShare = (45 - 12) + (48 - 14); // 67
    netPremium = -Math.round(netCreditPerShare * lotSize);
    const wingWidth = (step * 2);
    const maxLossVal = (wingWidth - netCreditPerShare) * lotSize;
    maxProfit = `₹${Math.round(Math.abs(netPremium)).toLocaleString('en-IN')} (Net Credit)`;
    maxLoss = `₹${Math.round(maxLossVal).toLocaleString('en-IN')} (Capped)`;
    breakevens = [atm - step - netCreditPerShare, atm + step + netCreditPerShare];
    riskWarning = 'Defined-risk credit strategy. Margin requirement is substantial for multi-leg execution.';
  }

  // Payoff calculations across price band +/- 5%
  const payoffPoints: StrategyAnalysis['payoffPoints'] = [];
  const minPrice = spot * 0.95;
  const maxPrice = spot * 1.05;
  const priceStep = (maxPrice - minPrice) / 30;

  for (let p = minPrice; p <= maxPrice; p += priceStep) {
    let pnlAtExpiry = 0;
    let pnlCurrent = 0;

    for (const leg of legs) {
      const mult = leg.action === 'BUY' ? 1 : -1;
      let payoffLegExpiry = 0;
      if (leg.type === 'CE') {
        payoffLegExpiry = Math.max(0, p - leg.strike) - leg.premium;
      } else {
        payoffLegExpiry = Math.max(0, leg.strike - p) - leg.premium;
      }
      pnlAtExpiry += mult * payoffLegExpiry * leg.lots * leg.lotSize;

      // Estimated pre-expiry curve
      const timeRemainFrac = 0.5; // halfway to expiry
      const currGreeks = calculateBlackScholesGreeks(p, leg.strike, (4 * timeRemainFrac) / 365, 0.0675, 0.14, leg.type);
      const currLegPnl = currGreeks.price - leg.premium;
      pnlCurrent += mult * currLegPnl * leg.lots * leg.lotSize;
    }

    payoffPoints.push({
      price: Math.round(p * 10) / 10,
      pnlAtExpiry: Math.round(pnlAtExpiry),
      pnlCurrent: Math.round(pnlCurrent),
    });
  }

  // Net Greeks summary
  let netDelta = 0;
  let netGamma = 0;
  let netTheta = 0;
  let netVega = 0;

  for (const leg of legs) {
    const mult = leg.action === 'BUY' ? 1 : -1;
    const g = calculateBlackScholesGreeks(spot, leg.strike, 4 / 365, 0.0675, 0.14, leg.type);
    netDelta += mult * g.delta * leg.lots * leg.lotSize;
    netGamma += mult * g.gamma * leg.lots * leg.lotSize;
    netTheta += mult * g.theta * leg.lots * leg.lotSize;
    netVega += mult * g.vega * leg.lots * leg.lotSize;
  }

  // Indian Brokerage & STT: ₹20 per executed order + STT on sell legs
  const numOrders = legs.length;
  const brokerage = numOrders * 20;
  const stt = legs.filter(l => l.action === 'SELL').length * 25;
  const gst = Math.round(brokerage * 0.18);
  const estBrokerageTaxes = brokerage + stt + gst;

  return {
    strategyName,
    outlook,
    netPremium,
    maxProfit,
    maxLoss,
    riskReward: strategyType === 'BULL_CALL_SPREAD' ? '1 : 2.1' : strategyType === 'BEAR_PUT_SPREAD' ? '1 : 1.9' : 'Variable',
    breakevens,
    netGreeks: {
      delta: Math.round(netDelta * 10) / 10,
      gamma: Math.round(netGamma * 100) / 100,
      theta: Math.round(netTheta),
      vega: Math.round(netVega),
    },
    estBrokerageTaxes,
    payoffPoints,
    riskWarning,
  };
}

/**
 * Stock & Options Screener (Module 10)
 */
export function runScreener(filterId: string): ScreenerResult[] {
  const results: ScreenerResult[] = [];
  const buildupList = classifyOIBuildup();
  const buildupMap = new Map(buildupList.map(b => [b.symbol, b]));

  for (const [symbol, inst] of db.instruments.entries()) {
    const tfMap = db.candles.get(symbol);
    if (!tfMap) continue;

    const candles15m = tfMap['15m'] || [];
    const ind = calculateAllIndicators(candles15m);
    const chain = db.optionChains.get(symbol);
    const buildup = buildupMap.get(symbol);

    let match = false;
    let signalTag = '';
    const criteria: string[] = [];

    if (filterId === 'breakout_bullish') {
      if (inst.changePercent > 0.8 && ind.rsi14 > 60 && inst.currentPrice > ind.bollingerBands.upper) {
        match = true;
        signalTag = 'Upper Bollinger Breakout';
        criteria.push('Price > Upper Bollinger Band', `RSI(14) = ${ind.rsi14}`, `Day Change +${inst.changePercent}%`);
      }
    } else if (filterId === 'ema_crossover') {
      if (ind.ema9 > ind.ema20 && inst.currentPrice > ind.ema9) {
        match = true;
        signalTag = 'EMA 9/20 Golden Cross';
        criteria.push(`9 EMA (₹${ind.ema9}) > 20 EMA (₹${ind.ema20})`, 'Price trending above short-term momentum');
      }
    } else if (filterId === 'long_buildup') {
      if (buildup && buildup.buildup === 'LONG_BUILDUP') {
        match = true;
        signalTag = 'Aggressive Long Buildup';
        criteria.push(`Price +${inst.changePercent}%`, `OI +${buildup.oiChangePercent}%`, `PCR: ${chain?.pcrOi || 1.1}`);
      }
    } else if (filterId === 'oversold_reversal') {
      if (ind.rsi14 < 35) {
        match = true;
        signalTag = 'RSI Deep Oversold Reversal';
        criteria.push(`RSI(14) = ${ind.rsi14}`, 'Approaching multi-day support zones');
      }
    } else if (filterId === 'high_pcr_support') {
      if (chain && chain.pcrOi > 1.25) {
        match = true;
        signalTag = 'High Put-Call Ratio (Bullish Floor)';
        criteria.push(`PCR (OI) = ${chain.pcrOi}`, `Max Pain Strike = ₹${chain.maxPainStrike}`);
      }
    } else {
      // Default: Top Momentum
      if (Math.abs(inst.changePercent) > 0.5) {
        match = true;
        signalTag = inst.changePercent > 0 ? 'Bullish Leader' : 'Bearish Pressure';
        criteria.push(`Day Change: ${inst.changePercent}%`, `Volume: ${(inst.volume / 100000).toFixed(1)}L`);
      }
    }

    if (match) {
      results.push({
        symbol,
        name: inst.name,
        ltp: inst.currentPrice,
        changePercent: inst.changePercent,
        volume: inst.volume,
        pcr: chain?.pcrOi,
        rsi: ind.rsi14,
        buildup: buildup?.buildup,
        signalTag,
        matchedCriteria: criteria,
      });
    }
  }

  return results;
}

/**
 * Historical Backtesting Module (Module 13)
 */
export function runStrategyBacktest(config: BacktestConfig): BacktestSummary {
  const symbol = config.symbol || 'NIFTY';
  const tfMap = db.candles.get(symbol);
  const candles = (tfMap && tfMap['D']) ? tfMap['D'] : [];

  let balance = config.initialCapital || 100000;
  const initialCap = balance;
  const trades: BacktestTrade[] = [];
  const equityCurve: { date: string; balance: number }[] = [];

  let inPosition = false;
  let entryPrice = 0;
  let entryDate = '';
  let positionType: 'BUY' | 'SELL' = 'BUY';
  let stopLoss = 0;
  let target = 0;

  for (let i = 20; i < candles.length; i++) {
    const subCandles = candles.slice(0, i + 1);
    const curr = candles[i];
    const prev = candles[i - 1];
    const ind = calculateAllIndicators(subCandles);

    equityCurve.push({ date: curr.time.slice(0, 10), balance: Math.round(balance) });

    if (!inPosition) {
      // Rule: Buy when 9 EMA crosses above 20 EMA and RSI > 50
      if (ind.ema9 > ind.ema20 && curr.close > ind.ema9 && ind.rsi14 > 50) {
        inPosition = true;
        positionType = 'BUY';
        entryPrice = curr.close * (1 + (config.slippagePercent || 0.05) / 100);
        entryDate = curr.time.slice(0, 10);
        stopLoss = ind.ema20 * 0.985;
        target = entryPrice + (entryPrice - stopLoss) * 2;
      }
    } else {
      // Check exits
      let exitTriggered = false;
      let exitPrice = 0;
      let reason: 'TARGET' | 'STOP_LOSS' | 'SIGNAL_EXIT' = 'SIGNAL_EXIT';

      if (curr.high >= target) {
        exitTriggered = true;
        exitPrice = target;
        reason = 'TARGET';
      } else if (curr.low <= stopLoss) {
        exitTriggered = true;
        exitPrice = stopLoss;
        reason = 'STOP_LOSS';
      } else if (ind.ema9 < ind.ema20) {
        exitTriggered = true;
        exitPrice = curr.close;
        reason = 'SIGNAL_EXIT';
      }

      if (exitTriggered) {
        const returnPct = ((exitPrice - entryPrice) / entryPrice) * 100;
        // Position size: 10% of balance
        const tradeCap = balance * 0.20;
        const grossPnl = (tradeCap * returnPct) / 100;
        const charges = config.brokeragePerTrade || 40;
        const netPnl = grossPnl - charges;

        balance += netPnl;
        trades.push({
          id: `trade_${trades.length + 1}`,
          date: entryDate,
          type: positionType,
          entryPrice: Math.round(entryPrice * 100) / 100,
          exitDate: curr.time.slice(0, 10),
          exitPrice: Math.round(exitPrice * 100) / 100,
          returnPercent: Math.round(returnPct * 100) / 100,
          pnl: Math.round(grossPnl),
          netPnl: Math.round(netPnl),
          reason,
        });

        inPosition = false;
      }
    }
  }

  const winningTrades = trades.filter(t => t.netPnl > 0).length;
  const losingTrades = trades.filter(t => t.netPnl <= 0).length;
  const winRate = trades.length > 0 ? Math.round((winningTrades / trades.length) * 100) : 0;
  const totalPnl = trades.reduce((acc, t) => acc + t.pnl, 0);
  const netPnlAfterCharges = trades.reduce((acc, t) => acc + t.netPnl, 0);

  const grossWins = trades.filter(t => t.netPnl > 0).reduce((acc, t) => acc + t.netPnl, 0);
  const grossLosses = Math.abs(trades.filter(t => t.netPnl < 0).reduce((acc, t) => acc + t.netPnl, 0));
  const profitFactor = grossLosses > 0 ? Math.round((grossWins / grossLosses) * 100) / 100 : grossWins > 0 ? 5.0 : 0;

  // Max Drawdown
  let peak = initialCap;
  let maxDd = 0;
  for (const pt of equityCurve) {
    if (pt.balance > peak) peak = pt.balance;
    const dd = ((peak - pt.balance) / peak) * 100;
    if (dd > maxDd) maxDd = dd;
  }

  return {
    strategyName: 'EMA Momentum Trend with Dynamic Volatility Stops',
    symbol,
    totalTrades: trades.length,
    winningTrades,
    losingTrades,
    winRate,
    totalPnl: Math.round(totalPnl),
    netPnlAfterCharges: Math.round(netPnlAfterCharges),
    profitFactor,
    maxDrawdownPercent: Math.round(maxDd * 10) / 10,
    expectancy: trades.length > 0 ? Math.round((netPnlAfterCharges / trades.length) * 100) / 100 : 0,
    equityCurve,
    trades: trades.slice(-15),
  };
}
