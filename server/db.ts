import fs from 'fs';
import path from 'path';
import {
  Instrument,
  OptionChainData,
  Candle,
  FundamentalData,
  Watchlist,
  AlertRule,
  TradeJournalEntry,
  ProviderStatus,
} from '../src/types/market';
import { calculateBlackScholesGreeks, calculateImpliedVolatility, calculateMaxPain } from './greeks';

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'trader';
  subscriptionTier: 'PRO_TERMINAL' | 'INSTITUTIONAL';
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'market_store.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export class MarketDatabase {
  public instruments: Map<string, Instrument> = new Map();
  public optionChains: Map<string, OptionChainData> = new Map();
  public candles: Map<string, Record<string, Candle[]>> = new Map(); // symbol -> timeframe -> Candle[]
  public fundamentals: Map<string, FundamentalData> = new Map();
  public watchlists: Watchlist[] = [];
  public alerts: AlertRule[] = [];
  public journal: TradeJournalEntry[] = [];
  public auditLogs: AuditLog[] = [];
  public users: UserAccount[] = [];
  public providerStatus: ProviderStatus = {
    name: 'NSE Real-Time Adapter (Demo / Fallback Mode)',
    mode: 'DEMO_SIMULATED',
    isLive: true,
    lastSync: new Date().toISOString(),
    apiHealth: 'HEALTHY',
    rateLimitUsage: '42 / 1000 req/min',
    activeContractsCount: 1420,
  };

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Users
    this.users = [
      {
        id: 'usr_admin',
        email: 'admin@profitpulse.ai',
        name: 'Chief Risk Officer (Admin)',
        role: 'admin',
        subscriptionTier: 'INSTITUTIONAL',
      },
      {
        id: 'usr_trader',
        email: 'rajababu57268@gmail.com',
        name: 'Active F&O Quantitative Trader',
        role: 'trader',
        subscriptionTier: 'PRO_TERMINAL',
      },
    ];

    // Seed Instruments
    const defaultInstruments: Instrument[] = [
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
        name: 'NIFTY Bank Index',
        segment: 'INDEX',
        lotSize: 30,
        tickSize: 0.05,
        strikeStep: 100,
        sector: 'Banking',
        currentPrice: 52420.80,
        prevClose: 52180.10,
        change: 240.70,
        changePercent: 0.46,
        high52w: 54467.35,
        low52w: 43230.15,
        dayHigh: 52580.40,
        dayLow: 52090.20,
        volume: 185600000,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'FINNIFTY',
        name: 'NIFTY Financial Services',
        segment: 'INDEX',
        lotSize: 65,
        tickSize: 0.05,
        strikeStep: 50,
        sector: 'Financial Services',
        currentPrice: 23680.15,
        prevClose: 23610.00,
        change: 70.15,
        changePercent: 0.30,
        high52w: 24500.00,
        low52w: 19800.00,
        dayHigh: 23740.00,
        dayLow: 23590.00,
        volume: 92000000,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'MIDCPNIFTY',
        name: 'NIFTY Midcap Select',
        segment: 'INDEX',
        lotSize: 120,
        tickSize: 0.05,
        strikeStep: 25,
        sector: 'Midcap',
        currentPrice: 12890.40,
        prevClose: 12810.00,
        change: 80.40,
        changePercent: 0.63,
        high52w: 13350.00,
        low52w: 9900.00,
        dayHigh: 12920.00,
        dayLow: 12790.00,
        volume: 64000000,
        lastUpdated: new Date().toISOString(),
      },
      // Equities
      {
        symbol: 'RELIANCE',
        name: 'Reliance Industries Limited',
        segment: 'FO_EQUITY',
        lotSize: 250,
        tickSize: 0.05,
        strikeStep: 20,
        sector: 'Energy & Petrochemicals',
        currentPrice: 2985.60,
        prevClose: 2962.10,
        change: 23.50,
        changePercent: 0.79,
        high52w: 3217.90,
        low52w: 2220.30,
        dayHigh: 3004.00,
        dayLow: 2955.00,
        volume: 6850000,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'HDFCBANK',
        name: 'HDFC Bank Limited',
        segment: 'FO_EQUITY',
        lotSize: 550,
        tickSize: 0.05,
        strikeStep: 10,
        sector: 'Private Banking',
        currentPrice: 1682.40,
        prevClose: 1691.00,
        change: -8.60,
        changePercent: -0.51,
        high52w: 1794.00,
        low52w: 1363.55,
        dayHigh: 1698.00,
        dayLow: 1675.00,
        volume: 14200000,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'ICICIBANK',
        name: 'ICICI Bank Limited',
        segment: 'FO_EQUITY',
        lotSize: 700,
        tickSize: 0.05,
        strikeStep: 10,
        sector: 'Private Banking',
        currentPrice: 1248.90,
        prevClose: 1235.40,
        change: 13.50,
        changePercent: 1.09,
        high52w: 1310.00,
        low52w: 920.00,
        dayHigh: 1255.00,
        dayLow: 1232.00,
        volume: 9800000,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'INFY',
        name: 'Infosys Limited',
        segment: 'FO_EQUITY',
        lotSize: 400,
        tickSize: 0.05,
        strikeStep: 20,
        sector: 'Information Technology',
        currentPrice: 1912.30,
        prevClose: 1895.00,
        change: 17.30,
        changePercent: 0.91,
        high52w: 1991.00,
        low52w: 1358.35,
        dayHigh: 1928.00,
        dayLow: 1890.00,
        volume: 5300000,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'TCS',
        name: 'Tata Consultancy Services',
        segment: 'FO_EQUITY',
        lotSize: 175,
        tickSize: 0.05,
        strikeStep: 20,
        sector: 'Information Technology',
        currentPrice: 4210.00,
        prevClose: 4245.00,
        change: -35.00,
        changePercent: -0.82,
        high52w: 4585.00,
        low52w: 3313.00,
        dayHigh: 4260.00,
        dayLow: 4195.00,
        volume: 2100000,
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
        currentPrice: 842.15,
        prevClose: 834.00,
        change: 8.15,
        changePercent: 0.98,
        high52w: 912.00,
        low52w: 555.00,
        dayHigh: 848.00,
        dayLow: 831.00,
        volume: 11200000,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'BHARTIARTL',
        name: 'Bharti Airtel Limited',
        segment: 'FO_EQUITY',
        lotSize: 475,
        tickSize: 0.05,
        strikeStep: 10,
        sector: 'Telecom',
        currentPrice: 1690.50,
        prevClose: 1668.00,
        change: 22.50,
        changePercent: 1.35,
        high52w: 1720.00,
        low52w: 901.00,
        dayHigh: 1702.00,
        dayLow: 1665.00,
        volume: 4900000,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'TATAMOTORS',
        name: 'Tata Motors Limited',
        segment: 'FO_EQUITY',
        lotSize: 550,
        tickSize: 0.05,
        strikeStep: 10,
        sector: 'Automobile',
        currentPrice: 965.80,
        prevClose: 978.20,
        change: -12.40,
        changePercent: -1.27,
        high52w: 1179.00,
        low52w: 630.00,
        dayHigh: 982.00,
        dayLow: 958.00,
        volume: 8700000,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'LT',
        name: 'Larsen & Toubro Limited',
        segment: 'FO_EQUITY',
        lotSize: 150,
        tickSize: 0.05,
        strikeStep: 20,
        sector: 'Capital Goods & Infrastructure',
        currentPrice: 3580.00,
        prevClose: 3540.00,
        change: 40.00,
        changePercent: 1.13,
        high52w: 3948.00,
        low52w: 2860.00,
        dayHigh: 3610.00,
        dayLow: 3530.00,
        volume: 1800000,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'ITC',
        name: 'ITC Limited',
        segment: 'FO_EQUITY',
        lotSize: 1600,
        tickSize: 0.05,
        strikeStep: 5,
        sector: 'FMCG',
        currentPrice: 508.20,
        prevClose: 505.10,
        change: 3.10,
        changePercent: 0.61,
        high52w: 528.00,
        low52w: 399.00,
        dayHigh: 512.00,
        dayLow: 503.00,
        volume: 16500000,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'BAJFINANCE',
        name: 'Bajaj Finance Limited',
        segment: 'FO_EQUITY',
        lotSize: 125,
        tickSize: 0.05,
        strikeStep: 50,
        sector: 'Non-Banking Financial',
        currentPrice: 7210.00,
        prevClose: 7150.00,
        change: 60.00,
        changePercent: 0.84,
        high52w: 8190.00,
        low52w: 6375.00,
        dayHigh: 7260.00,
        dayLow: 7120.00,
        volume: 1100000,
        lastUpdated: new Date().toISOString(),
      },
      {
        symbol: 'SUNPHARMA',
        name: 'Sun Pharmaceutical Industries',
        segment: 'FO_EQUITY',
        lotSize: 350,
        tickSize: 0.05,
        strikeStep: 10,
        sector: 'Pharmaceuticals',
        currentPrice: 1885.00,
        prevClose: 1860.00,
        change: 25.00,
        changePercent: 1.34,
        high52w: 1960.00,
        low52w: 1100.00,
        dayHigh: 1899.00,
        dayLow: 1855.00,
        volume: 2400000,
        lastUpdated: new Date().toISOString(),
      },
    ];

    for (const inst of defaultInstruments) {
      this.instruments.set(inst.symbol, inst);
      this.generateCandlesForInstrument(inst);
      this.generateFundamentalsForInstrument(inst);
      this.generateOptionChainForInstrument(inst);
    }

    // Default watchlists
    this.watchlists = [
      {
        id: 'wl_core',
        name: 'Key Indices & Bluechips',
        items: [
          { id: 'item_1', symbol: 'NIFTY', name: 'NIFTY 50 Benchmark', addedAt: new Date().toISOString() },
          { id: 'item_2', symbol: 'BANKNIFTY', name: 'NIFTY Bank', addedAt: new Date().toISOString() },
          { id: 'item_3', symbol: 'RELIANCE', name: 'Reliance Industries', addedAt: new Date().toISOString() },
          { id: 'item_4', symbol: 'HDFCBANK', name: 'HDFC Bank', addedAt: new Date().toISOString() },
          { id: 'item_5', symbol: 'BHARTIARTL', name: 'Bharti Airtel', addedAt: new Date().toISOString() },
        ],
      },
      {
        id: 'wl_tech_growth',
        name: 'IT & High Momentum',
        items: [
          { id: 'item_6', symbol: 'INFY', name: 'Infosys Limited', addedAt: new Date().toISOString() },
          { id: 'item_7', symbol: 'TCS', name: 'Tata Consultancy Services', addedAt: new Date().toISOString() },
          { id: 'item_8', symbol: 'SUNPHARMA', name: 'Sun Pharma', addedAt: new Date().toISOString() },
        ],
      },
    ];

    // Seed Trade Journal
    this.journal = [
      {
        id: 'tj_1',
        symbol: 'NIFTY',
        segment: 'OPTIONS',
        direction: 'LONG',
        entryDate: '2026-10-10T09:30:00Z',
        entryPrice: 145.50,
        exitDate: '2026-10-10T14:15:00Z',
        exitPrice: 198.00,
        quantity: 150, // 2 lots
        stopLoss: 110.00,
        target: 200.00,
        pnl: 7875.00,
        status: 'CLOSED',
        notes: 'Bullish breakout above previous day high with strong CE OI unwinding at 24800 strike.',
        setupType: 'Intraday Opening Range Breakout',
      },
      {
        id: 'tj_2',
        symbol: 'RELIANCE',
        segment: 'EQUITY',
        direction: 'LONG',
        entryDate: '2026-10-08T10:00:00Z',
        entryPrice: 2940.00,
        quantity: 100,
        stopLoss: 2890.00,
        target: 3040.00,
        pnl: 4560.00,
        status: 'OPEN',
        notes: 'Swing trade following 20 EMA bounce and RSI > 58 with expanding volume.',
        setupType: 'Swing EMA Pullback',
      },
    ];

    // Seed Alerts
    this.alerts = [
      {
        id: 'alt_1',
        symbol: 'NIFTY',
        condition: 'PRICE_ABOVE',
        targetValue: 25000,
        isActive: true,
        createdAt: new Date().toISOString(),
        message: 'NIFTY approaching psychological resistance at 25,000 zone.',
      },
      {
        id: 'alt_2',
        symbol: 'BANKNIFTY',
        condition: 'PCR_ABOVE',
        targetValue: 1.35,
        isActive: true,
        createdAt: new Date().toISOString(),
        message: 'Bank Nifty PCR indicates heavy put writing / strong floor.',
      },
    ];

    this.auditLogs = [
      {
        id: 'log_1',
        timestamp: new Date().toISOString(),
        action: 'MARKET_DATA_INITIALIZED',
        user: 'SYSTEM_DAEMON',
        details: 'Loaded NSE indices, option strike chains, Black-Scholes Greeks, and historical candles.',
      },
    ];
  }

  public generateCandlesForInstrument(inst: Instrument) {
    const timeframes = ['1m', '5m', '15m', '1h', 'D', 'W'];
    const tfMap: Record<string, Candle[]> = {};

    for (const tf of timeframes) {
      const count = tf === '1m' ? 60 : tf === '5m' ? 75 : tf === '15m' ? 75 : tf === '1h' ? 80 : tf === 'D' ? 120 : 52;
      const candles: Candle[] = [];
      let basePrice = inst.currentPrice * (tf === 'D' ? 0.92 : 0.98);

      const now = Date.now();
      const stepMs =
        tf === '1m' ? 60 * 1000 :
        tf === '5m' ? 5 * 60 * 1000 :
        tf === '15m' ? 15 * 60 * 1000 :
        tf === '1h' ? 60 * 60 * 1000 :
        tf === 'D' ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

      for (let i = count; i >= 0; i--) {
        const time = new Date(now - i * stepMs).toISOString();
        const volatility = inst.segment === 'INDEX' ? 0.004 : 0.009;
        const drift = (Math.random() - 0.48) * volatility;
        const open = basePrice;
        const close = Math.round((open * (1 + drift)) * 100) / 100;
        const high = Math.round((Math.max(open, close) * (1 + Math.random() * volatility * 0.7)) * 100) / 100;
        const low = Math.round((Math.min(open, close) * (1 - Math.random() * volatility * 0.7)) * 100) / 100;
        const volume = Math.floor(Math.random() * (inst.segment === 'INDEX' ? 500000 : 80000) + 10000);
        basePrice = close;

        candles.push({ time, open, high, low, close, volume });
      }

      // Ensure last candle close equals currentPrice
      if (candles.length > 0) {
        candles[candles.length - 1].close = inst.currentPrice;
        candles[candles.length - 1].high = Math.max(candles[candles.length - 1].high, inst.currentPrice);
        candles[candles.length - 1].low = Math.min(candles[candles.length - 1].low, inst.currentPrice);
      }

      tfMap[tf] = candles;
    }

    this.candles.set(inst.symbol, tfMap);
  }

  public generateFundamentalsForInstrument(inst: Instrument) {
    if (inst.segment === 'INDEX') return;

    const data: FundamentalData = {
      symbol: inst.symbol,
      companyName: inst.name,
      marketCapCr: Math.round(inst.currentPrice * (inst.symbol === 'RELIANCE' ? 676 : inst.symbol === 'TCS' ? 361 : 450)),
      peRatio: inst.symbol === 'RELIANCE' ? 26.8 : inst.symbol === 'TCS' ? 29.4 : inst.symbol === 'HDFCBANK' ? 18.2 : 24.5,
      pbRatio: inst.symbol === 'HDFCBANK' ? 2.6 : 4.8,
      evEbitda: inst.symbol === 'RELIANCE' ? 14.2 : 19.8,
      debtToEquity: inst.symbol === 'HDFCBANK' ? 0.85 : inst.symbol === 'RELIANCE' ? 0.38 : 0.04,
      roePercent: inst.symbol === 'TCS' ? 49.5 : inst.symbol === 'INFY' ? 31.8 : 16.4,
      rocePercent: inst.symbol === 'TCS' ? 61.2 : inst.symbol === 'RELIANCE' ? 11.2 : 18.9,
      dividendYield: inst.symbol === 'TCS' ? 1.6 : inst.symbol === 'ITC' ? 2.8 : 0.7,
      epsTtm: Math.round((inst.currentPrice / 25) * 100) / 100,
      revenueGrowthQoQ: 8.4,
      profitGrowthQoQ: 11.2,
      opmPercent: inst.symbol === 'TCS' ? 25.8 : 17.5,
      npmPercent: inst.symbol === 'TCS' ? 19.4 : 12.8,
      promoterHolding: inst.symbol === 'RELIANCE' ? 50.3 : inst.symbol === 'TCS' ? 71.8 : 25.5,
      fiiHolding: 21.4,
      diiHolding: 18.2,
      publicHolding: 9.9,
      reportingPeriod: 'Q2 FY2026',
      lastUpdated: new Date().toISOString(),
    };

    this.fundamentals.set(inst.symbol, data);
  }

  public generateOptionChainForInstrument(inst: Instrument) {
    const spot = inst.currentPrice;
    const step = inst.strikeStep;
    const atmStrike = Math.round(spot / step) * step;

    // Weekly and Monthly Expiries (current Thursday / next Thursday)
    const availableExpiries = [
      '2026-10-15',
      '2026-10-22',
      '2026-10-29',
      '2026-11-26',
    ];

    const expiryDate = availableExpiries[0];
    const daysToExpiry = 4; // near term
    const T = daysToExpiry / 365;
    const r = 0.0675; // RBI T-bill risk free rate
    const baseIv = inst.segment === 'INDEX' ? 0.138 : 0.22; // ~13.8% or 22%

    const numStrikes = 21; // 10 OTM, ATM, 10 ITM
    const strikesList: OptionChainData['strikes'] = [];

    let totalCeOi = 0;
    let totalPeOi = 0;
    let totalCeVol = 0;
    let totalPeVol = 0;

    let highestCeOi = 0;
    let highestCeOiStrike = atmStrike;
    let highestPeOi = 0;
    let highestPeOiStrike = atmStrike;

    for (let i = -10; i <= 10; i++) {
      const strikePrice = atmStrike + i * step;
      const isAtm = strikePrice === atmStrike;

      // Volatility smile: IV increases for deep OTM
      const moneyness = Math.abs((strikePrice - spot) / spot);
      const ceIv = Math.round((baseIv + moneyness * 0.18 + (Math.random() * 0.008 - 0.004)) * 1000) / 1000;
      const peIv = Math.round((baseIv + moneyness * 0.22 + (Math.random() * 0.008 - 0.004)) * 1000) / 1000;

      const ceGreeks = calculateBlackScholesGreeks(spot, strikePrice, T, r, ceIv, 'CE');
      const peGreeks = calculateBlackScholesGreeks(spot, strikePrice, T, r, peIv, 'PE');

      // Realistic Open Interest distribution
      // CE OI typically peaks at strikes above spot (resistance)
      // PE OI typically peaks at strikes below spot (support)
      const ceDistFactor = Math.exp(-Math.pow((strikePrice - (spot + step * 2)) / (step * 4), 2));
      const peDistFactor = Math.exp(-Math.pow((strikePrice - (spot - step * 2)) / (step * 4), 2));

      const oiBaseMultiplier = inst.segment === 'INDEX' ? 85000 : 3500;
      const ceOi = Math.floor(ceDistFactor * oiBaseMultiplier + Math.random() * 5000 + 2000);
      const peOi = Math.floor(peDistFactor * oiBaseMultiplier + Math.random() * 5000 + 2000);

      const ceOiChange = Math.floor((Math.random() - 0.4) * (ceOi * 0.25));
      const peOiChange = Math.floor((Math.random() - 0.35) * (peOi * 0.28));

      const ceVolume = Math.floor(ceOi * (0.8 + Math.random() * 0.6));
      const peVolume = Math.floor(peOi * (0.8 + Math.random() * 0.6));

      totalCeOi += ceOi;
      totalPeOi += peOi;
      totalCeVol += ceVolume;
      totalPeVol += peVolume;

      if (ceOi > highestCeOi) {
        highestCeOi = ceOi;
        highestCeOiStrike = strikePrice;
      }
      if (peOi > highestPeOi) {
        highestPeOi = peOi;
        highestPeOiStrike = strikePrice;
      }

      const ceLtp = ceGreeks.price;
      const peLtp = peGreeks.price;

      const ceBid = Math.round((ceLtp * 0.995) * 100) / 100;
      const ceAsk = Math.round((ceLtp * 1.005) * 100) / 100;
      const peBid = Math.round((peLtp * 0.995) * 100) / 100;
      const peAsk = Math.round((peLtp * 1.005) * 100) / 100;

      strikesList.push({
        strikePrice,
        expiryDate,
        isAtm,
        ceLtp,
        ceChange: Math.round((Math.random() * 6 - 2.5) * 100) / 100,
        ceChangePercent: Math.round((Math.random() * 15 - 5) * 10) / 10,
        ceVolume,
        ceOi,
        ceOiChange,
        ceIv: Math.round(ceIv * 1000) / 10,
        ceBid,
        ceAsk,
        ceBidQty: Math.floor(Math.random() * 500 + 100) * inst.lotSize,
        ceAskQty: Math.floor(Math.random() * 500 + 100) * inst.lotSize,
        ceDelta: ceGreeks.delta,
        ceGamma: ceGreeks.gamma,
        ceTheta: ceGreeks.theta,
        ceVega: ceGreeks.vega,

        peLtp,
        peChange: Math.round((Math.random() * 6 - 3.5) * 100) / 100,
        peChangePercent: Math.round((Math.random() * 15 - 8) * 10) / 10,
        peVolume,
        peOi,
        peOiChange,
        peIv: Math.round(peIv * 1000) / 10,
        peBid,
        peAsk,
        peBidQty: Math.floor(Math.random() * 500 + 100) * inst.lotSize,
        peAskQty: Math.floor(Math.random() * 500 + 100) * inst.lotSize,
        peDelta: peGreeks.delta,
        peGamma: peGreeks.gamma,
        peTheta: peGreeks.theta,
        peVega: peGreeks.vega,
      });
    }

    const pcrOi = totalCeOi > 0 ? Math.round((totalPeOi / totalCeOi) * 100) / 100 : 1;
    const pcrVolume = totalCeVol > 0 ? Math.round((totalPeVol / totalCeVol) * 100) / 100 : 1;
    const maxPainStrike = calculateMaxPain(
      strikesList.map(s => ({ strikePrice: s.strikePrice, ceOi: s.ceOi, peOi: s.peOi }))
    );

    const futuresPrice = Math.round((spot * (1 + r * (14 / 365))) * 100) / 100;

    const chainData: OptionChainData = {
      symbol: inst.symbol,
      spotPrice: spot,
      futuresPrice,
      expiryDate,
      availableExpiries,
      atmStrike,
      maxPainStrike,
      totalCeOi,
      totalPeOi,
      pcrOi,
      pcrVolume,
      highestCeOiStrike,
      highestPeOiStrike,
      strikes: strikesList,
      indiaVix: 13.65,
      timestamp: new Date().toISOString(),
      dataSource: 'NSE Derivative Market Feed (Adapter Engine)',
    };

    this.optionChains.set(inst.symbol, chainData);
  }

  /**
   * Real-time Simulation Tick: Updates prices, option chains, and checks alert conditions
   */
  public tickMarket() {
    for (const [symbol, inst] of this.instruments.entries()) {
      const volatility = inst.segment === 'INDEX' ? 0.0006 : 0.0012;
      const drift = (Math.random() - 0.49) * volatility;
      const oldPrice = inst.currentPrice;
      const newPrice = Math.round((oldPrice * (1 + drift)) * 100) / 100;
      const change = Math.round((newPrice - inst.prevClose) * 100) / 100;
      const changePercent = Math.round(((change / inst.prevClose) * 100) * 100) / 100;

      inst.currentPrice = newPrice;
      inst.change = change;
      inst.changePercent = changePercent;
      inst.dayHigh = Math.max(inst.dayHigh, newPrice);
      inst.dayLow = Math.min(inst.dayLow, newPrice);
      inst.volume += Math.floor(Math.random() * 5000 + 500);
      inst.lastUpdated = new Date().toISOString();

      // Update latest candle in 1m timeframe
      const tfMap = this.candles.get(symbol);
      if (tfMap && tfMap['1m'] && tfMap['1m'].length > 0) {
        const lastCandle = tfMap['1m'][tfMap['1m'].length - 1];
        lastCandle.close = newPrice;
        lastCandle.high = Math.max(lastCandle.high, newPrice);
        lastCandle.low = Math.min(lastCandle.low, newPrice);
      }

      // Recompute option chain for F&O symbols periodically
      if (inst.segment === 'INDEX' || inst.segment === 'FO_EQUITY') {
        const chain = this.optionChains.get(symbol);
        if (chain) {
          chain.spotPrice = newPrice;
          chain.timestamp = new Date().toISOString();
        }
      }
    }

    // Check active alert conditions
    this.checkAlerts();
  }

  private checkAlerts() {
    for (const alert of this.alerts) {
      if (!alert.isActive) continue;
      const inst = this.instruments.get(alert.symbol);
      const chain = this.optionChains.get(alert.symbol);
      if (!inst) continue;

      let triggered = false;
      let msg = '';

      if (alert.condition === 'PRICE_ABOVE' && inst.currentPrice >= alert.targetValue) {
        triggered = true;
        msg = `${alert.symbol} crossed above ${alert.targetValue} (Current: ₹${inst.currentPrice})`;
      } else if (alert.condition === 'PRICE_BELOW' && inst.currentPrice <= alert.targetValue) {
        triggered = true;
        msg = `${alert.symbol} fell below ${alert.targetValue} (Current: ₹${inst.currentPrice})`;
      } else if (chain && alert.condition === 'PCR_ABOVE' && chain.pcrOi >= alert.targetValue) {
        triggered = true;
        msg = `${alert.symbol} PCR reached ${chain.pcrOi} (Target: ${alert.targetValue})`;
      }

      if (triggered) {
        alert.isActive = false;
        alert.triggeredAt = new Date().toISOString();
        alert.message = msg;
        this.auditLogs.unshift({
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'ALERT_TRIGGERED',
          user: 'ALERT_DAEMON',
          details: msg,
        });
      }
    }
  }
}

export const db = new MarketDatabase();
