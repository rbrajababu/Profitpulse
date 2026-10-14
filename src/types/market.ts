export type MarketSegment = 'INDEX' | 'EQUITY' | 'FO_EQUITY';

export interface Instrument {
  symbol: string;
  name: string;
  segment: MarketSegment;
  lotSize: number;
  tickSize: number;
  strikeStep: number;
  sector: string;
  currentPrice: number;
  prevClose: number;
  change: number;
  changePercent: number;
  high52w: number;
  low52w: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  lastUpdated: string; // ISO string
}

export interface OptionContract {
  strikePrice: number;
  expiryDate: string;
  // CE fields
  ceLtp: number;
  ceChange: number;
  ceChangePercent: number;
  ceVolume: number;
  ceOi: number;
  ceOiChange: number;
  ceIv: number;
  ceBid: number;
  ceAsk: number;
  ceBidQty: number;
  ceAskQty: number;
  ceDelta: number;
  ceGamma: number;
  ceTheta: number;
  ceVega: number;
  
  // PE fields
  peLtp: number;
  peChange: number;
  peChangePercent: number;
  peVolume: number;
  peOi: number;
  peOiChange: number;
  peIv: number;
  peBid: number;
  peAsk: number;
  peBidQty: number;
  peAskQty: number;
  peDelta: number;
  peGamma: number;
  peTheta: number;
  peVega: number;

  isAtm?: boolean;
}

export interface OptionChainData {
  symbol: string;
  spotPrice: number;
  futuresPrice: number;
  expiryDate: string;
  availableExpiries: string[];
  atmStrike: number;
  maxPainStrike: number;
  totalCeOi: number;
  totalPeOi: number;
  pcrOi: number;
  pcrVolume: number;
  highestCeOiStrike: number;
  highestPeOiStrike: number;
  strikes: OptionContract[];
  indiaVix: number;
  timestamp: string;
  dataSource: string;
}

export interface Candle {
  time: string; // ISO
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  oi?: number;
}

export interface TechnicalIndicators {
  ema9: number;
  ema20: number;
  ema50: number;
  ema200: number;
  sma20: number;
  sma50: number;
  sma200: number;
  rsi14: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  vwap: number;
  atr14: number;
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    bandwidth: number;
  };
  supportLevels: number[];
  resistanceLevels: number[];
  relativeStrengthVsNifty: number; // positive = outperforming
  compositeScore: number; // -100 to +100
  sentimentLabel: 'Strong Bullish' | 'Bullish' | 'Neutral' | 'Bearish' | 'Strong Bearish';
}

export interface FundamentalData {
  symbol: string;
  companyName: string;
  marketCapCr: number;
  peRatio: number;
  pbRatio: number;
  evEbitda: number;
  debtToEquity: number;
  roePercent: number;
  rocePercent: number;
  dividendYield: number;
  epsTtm: number;
  revenueGrowthQoQ: number;
  profitGrowthQoQ: number;
  opmPercent: number;
  npmPercent: number;
  promoterHolding: number;
  fiiHolding: number;
  diiHolding: number;
  publicHolding: number;
  reportingPeriod: string;
  lastUpdated: string;
}

export type SetupTimeframe = 'INTRADAY' | 'SWING' | 'SHORT_TERM';
export type SetupBias = 'BULLISH' | 'BEARISH' | 'NEUTRAL' | 'NO_TRADE';

export interface TradingSetup {
  id: string;
  symbol: string;
  timeframe: SetupTimeframe;
  bias: SetupBias;
  setupName: string;
  entryZone: string;
  entryPrice: number;
  stopLoss: number;
  target1: number;
  target2: number;
  riskRewardRatio: number;
  suggestedPositionSizeLots: number;
  suggestedQuantity: number;
  invalidationCondition: string;
  supportingFactors: string[];
  confidenceScore: number; // 0-100
  isNoTrade: boolean;
  noTradeReason?: string;
  createdAt: string;
  validUntil: string;
}

export type BuildupType = 'LONG_BUILDUP' | 'SHORT_BUILDUP' | 'SHORT_COVERING' | 'LONG_UNWINDING' | 'NEUTRAL';

export interface OIBuildupItem {
  symbol: string;
  currentPrice: number;
  priceChangePercent: number;
  totalOi: number;
  oiChangePercent: number;
  buildup: BuildupType;
  pcr: number;
  interpretation: string;
}

export interface OptionsStrategyLeg {
  id: string;
  type: 'CE' | 'PE';
  action: 'BUY' | 'SELL';
  strike: number;
  expiry: string;
  premium: number;
  lots: number;
  lotSize: number;
}

export interface StrategyAnalysis {
  strategyName: string;
  outlook: 'Bullish' | 'Bearish' | 'Neutral' | 'Volatile';
  netPremium: number; // positive = net debit, negative = net credit
  maxProfit: string; // formatted or "Unlimited"
  maxLoss: string; // formatted or "Unlimited"
  riskReward: string;
  breakevens: number[];
  netGreeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
  estBrokerageTaxes: number;
  payoffPoints: { price: number; pnlAtExpiry: number; pnlCurrent: number }[];
  riskWarning?: string;
}

export interface ScreenerFilter {
  id: string;
  name: string;
  description: string;
  category: 'TECHNICAL' | 'DERIVATIVES' | 'FUNDAMENTAL';
}

export interface ScreenerResult {
  symbol: string;
  name: string;
  ltp: number;
  changePercent: number;
  volume: number;
  pcr?: number;
  rsi?: number;
  buildup?: BuildupType;
  signalTag: string;
  matchedCriteria: string[];
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  name: string;
  addedAt: string;
  notes?: string;
}

export interface Watchlist {
  id: string;
  name: string;
  items: WatchlistItem[];
}

export interface AlertRule {
  id: string;
  symbol: string;
  condition: 'PRICE_ABOVE' | 'PRICE_BELOW' | 'PCR_ABOVE' | 'PCR_BELOW' | 'OI_SPIKE' | 'RSI_OVERBOUGHT' | 'RSI_OVERSOLD';
  targetValue: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  message?: string;
}

export interface TradeJournalEntry {
  id: string;
  symbol: string;
  segment: 'EQUITY' | 'FUTURES' | 'OPTIONS';
  direction: 'LONG' | 'SHORT';
  entryDate: string;
  entryPrice: number;
  exitDate?: string;
  exitPrice?: number;
  quantity: number;
  stopLoss: number;
  target: number;
  pnl?: number;
  status: 'OPEN' | 'CLOSED';
  notes: string;
  setupType: string;
}

export interface BacktestConfig {
  symbol: string;
  strategyId: string;
  timeframe: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  riskPerTradePercent: number;
  slippagePercent: number;
  brokeragePerTrade: number;
}

export interface BacktestTrade {
  id: string;
  date: string;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  returnPercent: number;
  pnl: number;
  netPnl: number;
  reason: 'TARGET' | 'STOP_LOSS' | 'SIGNAL_EXIT';
}

export interface BacktestSummary {
  strategyName: string;
  symbol: string;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnl: number;
  netPnlAfterCharges: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  expectancy: number;
  equityCurve: { date: string; balance: number }[];
  trades: BacktestTrade[];
}

export interface MarketTradingHours {
  isOpen: boolean;
  istTime: string;
  session: string;
  nextOpenMsg: string;
}

export interface ProviderStatus {
  name: string;
  mode: 'DEMO_SIMULATED' | 'OFFICIAL_FEED' | 'CSV_INGESTED';
  isLive: boolean;
  lastSync: string;
  apiHealth: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
  rateLimitUsage: string;
  activeContractsCount: number;
  tradingHours?: MarketTradingHours;
  nextSyncInSeconds?: number;
}

