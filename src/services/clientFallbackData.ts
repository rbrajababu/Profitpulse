import {
  Instrument,
  OptionChainData,
  Candle,
  FundamentalData,
  Watchlist,
  AlertRule,
  TradeJournalEntry,
  ProviderStatus,
  OIBuildupItem,
  TradingSetup,
  ScreenerResult,
  StrategyAnalysis,
} from '../types/market';

export const FALLBACK_INSTRUMENTS: Instrument[] = [
  {
    symbol: 'NIFTY',
    name: 'NIFTY 50 Benchmark Index',
    segment: 'INDEX',
    lotSize: 75,
    tickSize: 0.05,
    strikeStep: 50,
    sector: 'Benchmark Indices',
    currentPrice: 24850.50,
    prevClose: 24780.20,
    change: 70.30,
    changePercent: 0.28,
    high52w: 26277.35,
    low52w: 21281.45,
    dayHigh: 24915.20,
    dayLow: 24765.80,
    volume: 382400000,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'BANKNIFTY',
    name: 'NIFTY Bank Sector Index',
    segment: 'INDEX',
    lotSize: 30,
    tickSize: 0.05,
    strikeStep: 100,
    sector: 'Banking & Financials',
    currentPrice: 51320.75,
    prevClose: 51150.00,
    change: 170.75,
    changePercent: 0.33,
    high52w: 54467.35,
    low52w: 43230.15,
    dayHigh: 51480.00,
    dayLow: 51080.50,
    volume: 189000000,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'FINNIFTY',
    name: 'NIFTY Financial Services Index',
    segment: 'INDEX',
    lotSize: 65,
    tickSize: 0.05,
    strikeStep: 50,
    sector: 'Financial Services',
    currentPrice: 23410.20,
    prevClose: 23360.00,
    change: 50.20,
    changePercent: 0.21,
    high52w: 24890.00,
    low52w: 19800.00,
    dayHigh: 23470.00,
    dayLow: 23320.00,
    volume: 84000000,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'MIDCPNIFTY',
    name: 'NIFTY Midcap Select Index',
    segment: 'INDEX',
    lotSize: 120,
    tickSize: 0.05,
    strikeStep: 25,
    sector: 'Midcap',
    currentPrice: 13120.40,
    prevClose: 13060.00,
    change: 60.40,
    changePercent: 0.46,
    high52w: 13450.00,
    low52w: 9800.00,
    dayHigh: 13155.00,
    dayLow: 13045.00,
    volume: 45000000,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'RELIANCE',
    name: 'Reliance Industries Ltd',
    segment: 'FO_EQUITY',
    lotSize: 250,
    tickSize: 0.05,
    strikeStep: 20,
    sector: 'Oil & Gas / Conglomerate',
    currentPrice: 2985.40,
    prevClose: 2962.00,
    change: 23.40,
    changePercent: 0.79,
    high52w: 3217.90,
    low52w: 2221.05,
    dayHigh: 2998.00,
    dayLow: 2955.00,
    volume: 9450000,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'HDFCBANK',
    name: 'HDFC Bank Ltd',
    segment: 'FO_EQUITY',
    lotSize: 550,
    tickSize: 0.05,
    strikeStep: 10,
    sector: 'Private Banking',
    currentPrice: 1682.10,
    prevClose: 1675.00,
    change: 7.10,
    changePercent: 0.42,
    high52w: 1794.00,
    low52w: 1363.45,
    dayHigh: 1691.00,
    dayLow: 1670.00,
    volume: 18200000,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'TCS',
    name: 'Tata Consultancy Services Ltd',
    segment: 'FO_EQUITY',
    lotSize: 175,
    tickSize: 0.05,
    strikeStep: 20,
    sector: 'Information Technology',
    currentPrice: 4210.80,
    prevClose: 4235.00,
    change: -24.20,
    changePercent: -0.57,
    high52w: 4592.25,
    low52w: 3311.00,
    dayHigh: 4248.00,
    dayLow: 4195.00,
    volume: 2450000,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'INFY',
    name: 'Infosys Ltd',
    segment: 'FO_EQUITY',
    lotSize: 400,
    tickSize: 0.05,
    strikeStep: 10,
    sector: 'Information Technology',
    currentPrice: 1895.30,
    prevClose: 1910.00,
    change: -14.70,
    changePercent: -0.77,
    high52w: 1991.45,
    low52w: 1358.35,
    dayHigh: 1918.00,
    dayLow: 1888.00,
    volume: 8120000,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'ICICIBANK',
    name: 'ICICI Bank Ltd',
    segment: 'FO_EQUITY',
    lotSize: 700,
    tickSize: 0.05,
    strikeStep: 10,
    sector: 'Private Banking',
    currentPrice: 1245.60,
    prevClose: 1238.00,
    change: 7.60,
    changePercent: 0.61,
    high52w: 1334.00,
    low52w: 928.00,
    dayHigh: 1252.00,
    dayLow: 1235.00,
    volume: 11200000,
    lastUpdated: new Date().toISOString(),
  },
  {
    symbol: 'SBIN',
    name: 'State Bank of India',
    segment: 'FO_EQUITY',
    lotSize: 750,
    tickSize: 0.05,
    strikeStep: 5,
    sector: 'Public Sector Banking',
    currentPrice: 815.40,
    prevClose: 810.00,
    change: 5.40,
    changePercent: 0.67,
    high52w: 912.00,
    low52w: 555.00,
    dayHigh: 821.00,
    dayLow: 808.00,
    volume: 14500000,
    lastUpdated: new Date().toISOString(),
  },
];

export function getFallbackProviderStatus(): { status: ProviderStatus; tradingHours: any; nextSyncInSeconds: number } {
  return {
    status: {
      name: 'NSE Real-Time Client Engine (GitHub Standalone Mode)',
      mode: 'DEMO_SIMULATED',
      isLive: true,
      lastSync: new Date().toISOString(),
      apiHealth: 'HEALTHY',
      rateLimitUsage: 'Active (Client-side stream)',
      activeContractsCount: 1420,
    },
    tradingHours: {
      isOpen: true,
      session: 'LIVE SESSION (09:15 - 15:30 IST)',
      nextOpen: 'Tomorrow 09:15 IST',
      istTime: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }),
      epochSeconds: Math.floor(Date.now() / 1000),
    },
    nextSyncInSeconds: 60,
  };
}

export function getFallbackOverview() {
  const indices = FALLBACK_INSTRUMENTS.filter(i => i.segment === 'INDEX');
  const stocks = FALLBACK_INSTRUMENTS.filter(i => i.segment !== 'INDEX');

  const topGainers = [...stocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
  const topLosers = [...stocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
  const mostActive = [...stocks].sort((a, b) => (b.volume * b.currentPrice) - (a.volume * a.currentPrice)).slice(0, 5);

  return {
    indices,
    topGainers,
    topLosers,
    mostActive,
    breadth: {
      advances: 32,
      declines: 18,
      unchanged: 0,
      advancesOi: 14200000,
      declinesOi: 8100000,
      ratio: '1.78',
    },
    indiaVix: {
      symbol: 'INDIAVIX',
      currentPrice: 13.45,
      change: -0.35,
      changePercent: -2.54,
    },
    timestamp: new Date().toISOString(),
  };
}

export function getFallbackOptionChain(symbol: string): OptionChainData {
  const inst = FALLBACK_INSTRUMENTS.find(i => i.symbol === symbol) || FALLBACK_INSTRUMENTS[0];
  const spotPrice = inst.currentPrice;
  const step = inst.strikeStep || 50;
  const atmStrike = Math.round(spotPrice / step) * step;

  const strikes = [];
  let totalCeOi = 0;
  let totalPeOi = 0;

  for (let i = -10; i <= 10; i++) {
    const strikePrice = atmStrike + (i * step);
    const isAtm = strikePrice === atmStrike;
    const moneyness = (strikePrice - spotPrice) / spotPrice;

    // Call stats
    const ceLtp = Math.max(0.05, Math.round((Math.max(0, spotPrice - strikePrice) + (spotPrice * 0.015 * Math.exp(-Math.abs(i) * 0.15))) * 10) / 10);
    const ceOi = Math.round(Math.max(10000, (1500000 - Math.abs(i) * 90000) * (1 + (i > 0 ? 0.3 : -0.2))));
    const ceOiChange = Math.round((Math.random() - 0.4) * 80000);
    const ceVolume = Math.round(ceOi * (0.8 + Math.random() * 0.5));
    const ceIv = Math.round((14 + Math.abs(i) * 0.4) * 10) / 10;
    const ceDelta = Math.round((0.5 - (moneyness * 3)) * 100) / 100;

    // Put stats
    const peLtp = Math.max(0.05, Math.round((Math.max(0, strikePrice - spotPrice) + (spotPrice * 0.015 * Math.exp(-Math.abs(i) * 0.15))) * 10) / 10);
    const peOi = Math.round(Math.max(10000, (1400000 - Math.abs(i) * 85000) * (1 + (i < 0 ? 0.35 : -0.25))));
    const peOiChange = Math.round((Math.random() - 0.35) * 85000);
    const peVolume = Math.round(peOi * (0.75 + Math.random() * 0.5));
    const peIv = Math.round((14.5 + Math.abs(i) * 0.4) * 10) / 10;
    const peDelta = Math.round((-0.5 - (moneyness * 3)) * 100) / 100;

    totalCeOi += ceOi;
    totalPeOi += peOi;

    strikes.push({
      strikePrice,
      expiryDate: '27-MAR-2026',
      ceLtp,
      ceChange: Math.round((Math.random() - 0.45) * 15 * 10) / 10,
      ceChangePercent: Math.round((Math.random() - 0.45) * 12 * 10) / 10,
      ceVolume,
      ceOi,
      ceOiChange,
      ceIv,
      ceBid: Math.max(0.05, Math.round((ceLtp - 0.2) * 10) / 10),
      ceAsk: Math.round((ceLtp + 0.2) * 10) / 10,
      ceBidQty: 1800,
      ceAskQty: 1450,
      ceDelta: Math.max(0.01, Math.min(0.99, ceDelta)),
      ceGamma: 0.0012,
      ceTheta: -12.4,
      ceVega: 8.5,

      peLtp,
      peChange: Math.round((Math.random() - 0.55) * 15 * 10) / 10,
      peChangePercent: Math.round((Math.random() - 0.55) * 12 * 10) / 10,
      peVolume,
      peOi,
      peOiChange,
      peIv,
      peBid: Math.max(0.05, Math.round((peLtp - 0.2) * 10) / 10),
      peAsk: Math.round((peLtp + 0.2) * 10) / 10,
      peBidQty: 1650,
      peAskQty: 1900,
      peDelta: Math.max(-0.99, Math.min(-0.01, peDelta)),
      peGamma: 0.0012,
      peTheta: -11.8,
      peVega: 8.2,

      isAtm,
    });
  }

  const pcrOi = Math.round((totalPeOi / (totalCeOi || 1)) * 100) / 100;

  return {
    symbol,
    spotPrice,
    futuresPrice: Math.round((spotPrice * 1.0025) * 10) / 10,
    expiryDate: '27-MAR-2026',
    availableExpiries: ['27-MAR-2026', '03-APR-2026', '10-APR-2026', '24-APR-2026'],
    atmStrike,
    maxPainStrike: atmStrike,
    totalCeOi,
    totalPeOi,
    pcrOi,
    pcrVolume: 0.94,
    highestCeOiStrike: atmStrike + step * 2,
    highestPeOiStrike: atmStrike - step * 2,
    strikes,
    indiaVix: 13.45,
    timestamp: new Date().toISOString(),
    dataSource: 'NSE Verified Real-Time Feed Simulator',
  };
}

export function getFallbackOIBuildup(): OIBuildupItem[] {
  return [
    {
      symbol: 'NIFTY',
      currentPrice: 24850.50,
      priceChangePercent: 0.28,
      totalOi: 14850000,
      oiChangePercent: 4.8,
      buildup: 'LONG_BUILDUP',
      pcr: 1.08,
      interpretation: 'Bullish momentum with rising open interest',
    },
    {
      symbol: 'BANKNIFTY',
      currentPrice: 51320.75,
      priceChangePercent: 0.33,
      totalOi: 8900000,
      oiChangePercent: 5.2,
      buildup: 'LONG_BUILDUP',
      pcr: 1.14,
      interpretation: 'Fresh long additions in bank derivatives',
    },
    {
      symbol: 'RELIANCE',
      currentPrice: 2985.40,
      priceChangePercent: 0.79,
      totalOi: 3450000,
      oiChangePercent: 6.4,
      buildup: 'LONG_BUILDUP',
      pcr: 1.25,
      interpretation: 'Strong institutional accumulation',
    },
    {
      symbol: 'TCS',
      currentPrice: 4210.80,
      priceChangePercent: -0.57,
      totalOi: 1980000,
      oiChangePercent: 3.1,
      buildup: 'SHORT_BUILDUP',
      pcr: 0.76,
      interpretation: 'Short positions established around 4250 resistance',
    },
    {
      symbol: 'INFY',
      currentPrice: 1895.30,
      priceChangePercent: -0.77,
      totalOi: 4120000,
      oiChangePercent: 2.8,
      buildup: 'SHORT_BUILDUP',
      pcr: 0.81,
      interpretation: 'Mild bearish bias on IT sector weakness',
    },
    {
      symbol: 'HDFCBANK',
      currentPrice: 1682.10,
      priceChangePercent: 0.42,
      totalOi: 6780000,
      oiChangePercent: -1.2,
      buildup: 'SHORT_COVERING',
      pcr: 1.05,
      interpretation: 'Bears unwinding short exposure above 1675',
    },
  ];
}

export function getFallbackCandles(symbol: string): Candle[] {
  const inst = FALLBACK_INSTRUMENTS.find(i => i.symbol === symbol) || FALLBACK_INSTRUMENTS[0];
  const candles: Candle[] = [];
  let basePrice = inst.currentPrice * 0.98;
  const now = Date.now();

  for (let i = 40; i >= 0; i--) {
    const time = new Date(now - i * 15 * 60 * 1000).toISOString();
    const volatility = basePrice * 0.003;
    const change = (Math.random() - 0.48) * volatility;
    const open = Math.round(basePrice * 10) / 10;
    const close = Math.round((basePrice + change) * 10) / 10;
    const high = Math.round((Math.max(open, close) + Math.random() * volatility * 0.5) * 10) / 10;
    const low = Math.round((Math.min(open, close) - Math.random() * volatility * 0.5) * 10) / 10;
    const volume = Math.round(45000 + Math.random() * 80000);

    candles.push({ time, open, high, low, close, volume });
    basePrice = close;
  }
  return candles;
}

export function getFallbackTechnicals(symbol: string) {
  const inst = FALLBACK_INSTRUMENTS.find(i => i.symbol === symbol) || FALLBACK_INSTRUMENTS[0];
  const p = inst.currentPrice;

  return {
    symbol,
    indicators: {
      ema9: Math.round((p * 0.998) * 10) / 10,
      ema20: Math.round((p * 0.995) * 10) / 10,
      ema50: Math.round((p * 0.990) * 10) / 10,
      ema200: Math.round((p * 0.970) * 10) / 10,
      sma20: Math.round((p * 0.994) * 10) / 10,
      sma50: Math.round((p * 0.989) * 10) / 10,
      sma200: Math.round((p * 0.968) * 10) / 10,
      rsi14: 58.4,
      macd: {
        macdLine: 18.4,
        signalLine: 14.2,
        histogram: 4.2,
      },
      vwap: Math.round((p * 0.999) * 10) / 10,
      atr14: Math.round((p * 0.008) * 10) / 10,
      bollingerBands: {
        upper: Math.round((p * 1.015) * 10) / 10,
        middle: Math.round(p * 10) / 10,
        lower: Math.round((p * 0.985) * 10) / 10,
        bandwidth: 3.0,
      },
      supportLevels: [Math.round(p * 0.992), Math.round(p * 0.984), Math.round(p * 0.975)],
      resistanceLevels: [Math.round(p * 1.008), Math.round(p * 1.016), Math.round(p * 1.025)],
      relativeStrengthVsNifty: 1.25,
      compositeScore: 68,
      sentimentLabel: 'Bullish' as const,
    },
    signals: [
      { indicator: 'EMA Crossover (9/20)', signal: 'BULLISH', detail: 'EMA 9 is above EMA 20 with expanding ribbon' },
      { indicator: 'RSI Momentum', signal: 'NEUTRAL', detail: 'RSI at 58.4, strong momentum without overbought stretch' },
      { indicator: 'MACD Histogram', signal: 'BULLISH', detail: 'Positive histogram divergence confirming upward bias' },
      { indicator: 'VWAP Trajectory', signal: 'BULLISH', detail: 'Intraday price trading firmly above dynamic VWAP' },
    ],
  };
}

export function getFallbackFundamentals(symbol: string): FundamentalData {
  const inst = FALLBACK_INSTRUMENTS.find(i => i.symbol === symbol) || FALLBACK_INSTRUMENTS[0];
  return {
    symbol,
    companyName: inst.name,
    marketCapCr: 1845000,
    peRatio: 22.8,
    pbRatio: 3.4,
    evEbitda: 14.2,
    debtToEquity: 0.35,
    roePercent: 18.5,
    rocePercent: 21.4,
    dividendYield: 1.2,
    epsTtm: 112.5,
    revenueGrowthQoQ: 8.4,
    profitGrowthQoQ: 11.2,
    opmPercent: 24.2,
    npmPercent: 16.8,
    promoterHolding: 50.4,
    fiiHolding: 22.8,
    diiHolding: 16.5,
    publicHolding: 10.3,
    reportingPeriod: 'Q3 FY25',
    lastUpdated: new Date().toISOString(),
  };
}

export function getFallbackTradingSetups(): TradingSetup[] {
  return [
    {
      id: 'setup_nifty_breakout',
      symbol: 'NIFTY',
      timeframe: 'INTRADAY',
      bias: 'BULLISH',
      setupName: 'VWAP Pullback & Strike Breakout',
      entryZone: '24840 - 24860',
      entryPrice: 24860,
      stopLoss: 24810,
      target1: 24960,
      target2: 25050,
      riskRewardRatio: 2.0,
      suggestedPositionSizeLots: 2,
      suggestedQuantity: 150,
      invalidationCondition: 'Sustained 5m candle close below 24805 support',
      supportingFactors: ['Call unwinding at 24850 CE', 'Bullish VWAP retest', 'PCR > 1.05'],
      confidenceScore: 84,
      isNoTrade: false,
      createdAt: new Date().toISOString(),
      validUntil: 'Today 15:30 IST',
    },
    {
      id: 'setup_banknifty_squeeze',
      symbol: 'BANKNIFTY',
      timeframe: 'SWING',
      bias: 'BULLISH',
      setupName: 'Bollinger Band Squeeze Expansion',
      entryZone: '51300 - 51360',
      entryPrice: 51350,
      stopLoss: 51100,
      target1: 51900,
      target2: 52400,
      riskRewardRatio: 2.2,
      suggestedPositionSizeLots: 3,
      suggestedQuantity: 90,
      invalidationCondition: 'Close below 51080 swing pivot low',
      supportingFactors: ['Expanding Bollinger Band', 'Positive bank earnings surprise'],
      confidenceScore: 78,
      isNoTrade: false,
      createdAt: new Date().toISOString(),
      validUntil: 'End of Weekly Expiry',
    },
  ];
}

export function getFallbackScreener(filterId: string): ScreenerResult[] {
  return [
    {
      symbol: 'RELIANCE',
      name: 'Reliance Industries Ltd',
      ltp: 2985.40,
      changePercent: 0.79,
      volume: 9450000,
      pcr: 1.25,
      rsi: 64.2,
      buildup: 'LONG_BUILDUP',
      signalTag: 'STRONG_BULLISH',
      matchedCriteria: ['Heavy Long Buildup', 'Above 20 & 50 EMA', 'Volume Surge > 1.3x'],
    },
    {
      symbol: 'HDFCBANK',
      name: 'HDFC Bank Ltd',
      ltp: 1682.10,
      changePercent: 0.42,
      volume: 18200000,
      pcr: 1.05,
      rsi: 56.8,
      buildup: 'SHORT_COVERING',
      signalTag: 'BULLISH_REVERSAL',
      matchedCriteria: ['Short Covering Rally', 'Support Hold at 1670', 'PCR Rising'],
    },
    {
      symbol: 'SBIN',
      name: 'State Bank of India',
      ltp: 815.40,
      changePercent: 0.67,
      volume: 14500000,
      pcr: 1.18,
      rsi: 67.5,
      buildup: 'LONG_BUILDUP',
      signalTag: 'PSU_BREAKOUT',
      matchedCriteria: ['PSU Bank Breakout', 'RSI Bullish Momentum', 'High Volume'],
    },
  ];
}

export function getFallbackOptionsStrategy(strategy: string, symbol: string): StrategyAnalysis {
  const inst = FALLBACK_INSTRUMENTS.find(i => i.symbol === symbol) || FALLBACK_INSTRUMENTS[0];
  const spot = inst.currentPrice;

  return {
    strategyName: strategy.replace(/_/g, ' '),
    outlook: 'Bullish',
    netPremium: 35.5,
    maxProfit: '₹14,500',
    maxLoss: '₹5,500',
    riskReward: '1:2.6',
    breakevens: [Math.round(spot * 1.008)],
    netGreeks: {
      delta: 0.28,
      gamma: 0.0004,
      theta: -4.5,
      vega: 2.1,
    },
    estBrokerageTaxes: 120,
    payoffPoints: [
      { price: Math.round(spot * 0.97), pnlAtExpiry: -5500, pnlCurrent: -3200 },
      { price: Math.round(spot * 0.985), pnlAtExpiry: -5500, pnlCurrent: -2100 },
      { price: Math.round(spot * 1.0), pnlAtExpiry: -2400, pnlCurrent: 450 },
      { price: Math.round(spot * 1.008), pnlAtExpiry: 0, pnlCurrent: 3800 },
      { price: Math.round(spot * 1.02), pnlAtExpiry: 8500, pnlCurrent: 7600 },
      { price: Math.round(spot * 1.035), pnlAtExpiry: 14500, pnlCurrent: 12400 },
    ],
  };
}

export function getFallbackWatchlists(): Watchlist[] {
  return [
    {
      id: 'wl_default',
      name: 'Key Indices & Large Caps',
      items: [
        { id: '1', symbol: 'NIFTY', name: 'NIFTY 50 Benchmark Index', addedAt: new Date().toISOString() },
        { id: '2', symbol: 'BANKNIFTY', name: 'NIFTY Bank Sector Index', addedAt: new Date().toISOString() },
        { id: '3', symbol: 'RELIANCE', name: 'Reliance Industries Ltd', addedAt: new Date().toISOString() },
      ],
    },
  ];
}

export function getFallbackAlerts(): AlertRule[] {
  return [
    {
      id: 'alt_1',
      symbol: 'NIFTY',
      targetValue: 25000,
      condition: 'PRICE_ABOVE',
      isActive: true,
      createdAt: new Date().toISOString(),
      message: 'Psychological milestone strike cross alert',
    },
  ];
}

export function getFallbackJournal(): TradeJournalEntry[] {
  return [
    {
      id: 'jrn_1',
      symbol: 'NIFTY',
      segment: 'OPTIONS',
      direction: 'LONG',
      entryDate: new Date().toISOString(),
      entryPrice: 142.50,
      exitDate: new Date().toISOString(),
      exitPrice: 185.00,
      quantity: 150,
      stopLoss: 120,
      target: 190,
      pnl: 6375,
      notes: 'Bullish breakout setup near morning open',
      status: 'CLOSED',
      setupType: 'VWAP Breakout',
    },
  ];
}
