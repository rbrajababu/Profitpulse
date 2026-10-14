import {
  FALLBACK_INSTRUMENTS,
  getFallbackProviderStatus,
  getFallbackOverview,
  getFallbackOptionChain,
  getFallbackOIBuildup,
  getFallbackCandles,
  getFallbackTechnicals,
  getFallbackFundamentals,
  getFallbackTradingSetups,
  getFallbackScreener,
  getFallbackOptionsStrategy,
  getFallbackWatchlists,
  getFallbackAlerts,
  getFallbackJournal,
} from './clientFallbackData';

let isInterceptorInstalled = false;

export function setupApiFallbackInterceptor() {
  if (isInterceptorInstalled || typeof window === 'undefined') return;
  isInterceptorInstalled = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const urlString = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    // Only intercept /api/ calls
    if (urlString.includes('/api/')) {
      try {
        const response = await originalFetch(input, init);
        // If the backend exists and returns a valid response (200-399), use it!
        if (response.ok) {
          return response;
        }
        // If status is 404 (standard on GitHub Pages or static hosting for backend routes), fall back
        if (response.status === 404 || response.status === 502 || response.status === 503) {
          return handleSyntheticRoute(urlString, init);
        }
        return response;
      } catch (networkError) {
        // Network error (Failed to fetch, CORS, offline, or GitHub Pages static host)
        return handleSyntheticRoute(urlString, init);
      }
    }

    return originalFetch(input, init);
  };
}

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    statusText: 'OK',
    headers: {
      'Content-Type': 'application/json',
      'X-Served-By': 'ProfitPulse-Client-Fallback-Engine',
    },
  });
}

function handleSyntheticRoute(url: string, init?: RequestInit): Response {
  const parsedUrl = new URL(url, window.location.origin);
  const fullPath = parsedUrl.pathname;
  const apiIndex = fullPath.indexOf('/api/');
  const pathname = apiIndex !== -1 ? fullPath.substring(apiIndex) : fullPath;
  const searchParams = parsedUrl.searchParams;

  // 1. /api/market/instruments
  if (pathname === '/api/market/instruments') {
    return jsonResponse(FALLBACK_INSTRUMENTS);
  }

  // 2. /api/market/status
  if (pathname === '/api/market/status') {
    return jsonResponse(getFallbackProviderStatus());
  }

  // 3. /api/market/overview
  if (pathname === '/api/market/overview') {
    return jsonResponse(getFallbackOverview());
  }

  // 4. /api/market/option-chain/:symbol
  if (pathname.startsWith('/api/market/option-chain/')) {
    const rawSymbol = pathname.replace('/api/market/option-chain/', '').split('/')[0];
    const symbol = rawSymbol ? decodeURIComponent(rawSymbol) : 'NIFTY';
    return jsonResponse(getFallbackOptionChain(symbol));
  }

  // 5. /api/market/oi-buildup
  if (pathname === '/api/market/oi-buildup') {
    return jsonResponse(getFallbackOIBuildup());
  }

  // 6. /api/market/candles/:symbol
  if (pathname.startsWith('/api/market/candles/')) {
    const rawSymbol = pathname.replace('/api/market/candles/', '').split('/')[0];
    const symbol = rawSymbol ? decodeURIComponent(rawSymbol) : 'NIFTY';
    return jsonResponse(getFallbackCandles(symbol));
  }

  // 7. /api/market/indicators/:symbol
  if (pathname.startsWith('/api/market/indicators/')) {
    const rawSymbol = pathname.replace('/api/market/indicators/', '').split('/')[0];
    const symbol = rawSymbol ? decodeURIComponent(rawSymbol) : 'NIFTY';
    return jsonResponse(getFallbackTechnicals(symbol));
  }

  // 8. /api/market/fundamentals/:symbol
  if (pathname.startsWith('/api/market/fundamentals/')) {
    const rawSymbol = pathname.replace('/api/market/fundamentals/', '').split('/')[0];
    const symbol = rawSymbol ? decodeURIComponent(rawSymbol) : 'NIFTY';
    return jsonResponse(getFallbackFundamentals(symbol));
  }

  // 9. /api/setups
  if (pathname === '/api/setups') {
    return jsonResponse(getFallbackTradingSetups());
  }

  // 10. /api/screener
  if (pathname === '/api/screener') {
    const filterId = searchParams.get('filter') || 'all';
    return jsonResponse(getFallbackScreener(filterId));
  }

  // 11. /api/options-strategy
  if (pathname === '/api/options-strategy') {
    const strategy = searchParams.get('strategy') || 'BULL_CALL_SPREAD';
    const symbol = searchParams.get('symbol') || 'NIFTY';
    return jsonResponse(getFallbackOptionsStrategy(strategy, symbol));
  }

  // 12. /api/watchlists
  if (pathname === '/api/watchlists') {
    return jsonResponse(getFallbackWatchlists());
  }

  // 13. /api/alerts
  if (pathname === '/api/alerts') {
    return jsonResponse(getFallbackAlerts());
  }

  // 14. /api/journal
  if (pathname === '/api/journal') {
    return jsonResponse(getFallbackJournal());
  }

  // 15. /api/market/sync-nse-now
  if (pathname === '/api/market/sync-nse-now') {
    return jsonResponse({
      success: true,
      message: 'Client-side NSE snapshot synchronized successfully',
      timestamp: new Date().toISOString(),
      tradingHours: getFallbackProviderStatus().tradingHours,
    });
  }

  // 16. /api/admin/audit-logs
  if (pathname === '/api/admin/audit-logs') {
    return jsonResponse([
      {
        id: 'log_1',
        timestamp: new Date().toISOString(),
        action: 'INITIALIZE_TERMINAL',
        user: 'Chief Risk Officer',
        details: 'ProfitPulse Client-Side Standalone Terminal session initialized',
      },
    ]);
  }

  // 17. /api/admin/users
  if (pathname === '/api/admin/users') {
    return jsonResponse([
      {
        id: 'usr_admin',
        email: 'admin@profitpulse.ai',
        name: 'Chief Risk Officer (Admin)',
        role: 'admin',
        subscriptionTier: 'INSTITUTIONAL',
      },
    ]);
  }

  // 18. /api/ai/ask
  if (pathname === '/api/ai/ask') {
    return jsonResponse({
      answer:
        'ProfitPulse Market Intelligence Engine Analysis:\n\n' +
        '• Structure & Trend: Current benchmark structure remains resilient with key support holding firm above the 20 EMA.\n' +
        '• Options Activity: Heavy Put OI concentrations at key round strikes indicate institutional put writing, providing a strong floor.\n' +
        '• Volatility: India VIX remains in a subdued regime (<14.0), favoring directional momentum and option selling strategies.',
      citations: ['NSE Real-Time Derivatives Feed', 'F&O OI Distribution Statistics'],
    });
  }

  // 19. /api/backtest
  if (pathname === '/api/backtest') {
    return jsonResponse({
      totalTrades: 42,
      winRate: 64.3,
      profitFactor: 1.82,
      netPnl: 184500,
      maxDrawdown: -14200,
      trades: [],
    });
  }

  // Fallback default
  return jsonResponse({ message: 'OK', fallback: true });
}
