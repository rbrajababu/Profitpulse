/**
 * Quantitative Financial Math Engine:
 * - Black-Scholes formula
 * - Implied Volatility (Newton-Raphson & Bisection fallback)
 * - Greeks: Delta, Gamma, Theta, Vega, Rho
 * - Max Pain calculation
 */

// Standard normal cumulative distribution function (Abramowitz & Stegun approximation)
export function normalCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * absX);
  const erf = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * erf);
}

// Standard normal probability density function
export function normalPdf(x: number): number {
  return (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

export interface GreeksResult {
  price: number;
  delta: number;
  gamma: number;
  theta: number; // 1-day theta
  vega: number;  // 1% IV change
  rho: number;   // 1% rate change
}

/**
 * Calculate Black-Scholes price and Greeks for Call or Put
 * @param S Current Spot Price
 * @param K Strike Price
 * @param T Time to expiry in years (e.g., 7 days = 7/365)
 * @param r Risk-free rate (annualized decimal, e.g. 0.0675 for 6.75%)
 * @param sigma Implied Volatility (decimal, e.g. 0.14 for 14%)
 * @param type 'CE' | 'PE'
 */
export function calculateBlackScholesGreeks(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: 'CE' | 'PE'
): GreeksResult {
  if (T <= 0.0001) {
    // At expiry
    const intrinsic = type === 'CE' ? Math.max(0, S - K) : Math.max(0, K - S);
    const delta = type === 'CE' ? (S > K ? 1 : 0) : (S < K ? -1 : 0);
    return { price: intrinsic, delta, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }

  const vol = Math.max(0.001, sigma);
  const d1 = (Math.log(S / K) + (r + 0.5 * vol * vol) * T) / (vol * Math.sqrt(T));
  const d2 = d1 - vol * Math.sqrt(T);

  const nd1 = normalCdf(d1);
  const nd2 = normalCdf(d2);
  const n_minus_d1 = normalCdf(-d1);
  const n_minus_d2 = normalCdf(-d2);
  const pdfD1 = normalPdf(d1);

  const discount = Math.exp(-r * T);

  let price: number;
  let delta: number;
  let theta: number;
  let rho: number;

  const gamma = pdfD1 / (S * vol * Math.sqrt(T));
  const vega = (S * Math.sqrt(T) * pdfD1) / 100; // per 1% change

  if (type === 'CE') {
    price = S * nd1 - K * discount * nd2;
    delta = nd1;
    // Daily theta
    theta = (-(S * pdfD1 * vol) / (2 * Math.sqrt(T)) - r * K * discount * nd2) / 365;
    rho = (K * T * discount * nd2) / 100;
  } else {
    price = K * discount * n_minus_d2 - S * n_minus_d1;
    delta = nd1 - 1;
    // Daily theta
    theta = (-(S * pdfD1 * vol) / (2 * Math.sqrt(T)) + r * K * discount * n_minus_d2) / 365;
    rho = (-K * T * discount * n_minus_d2) / 100;
  }

  return {
    price: Math.max(0.05, Math.round(price * 100) / 100),
    delta: Math.round(delta * 1000) / 1000,
    gamma: Math.round(gamma * 10000) / 10000,
    theta: Math.round(theta * 100) / 100,
    vega: Math.round(vega * 100) / 100,
    rho: Math.round(rho * 100) / 100,
  };
}

/**
 * Newton-Raphson method to estimate Implied Volatility from market option price
 */
export function calculateImpliedVolatility(
  marketPrice: number,
  S: number,
  K: number,
  T: number,
  r: number,
  type: 'CE' | 'PE'
): number {
  if (marketPrice <= 0.05 || T <= 0.001) return 0.12;

  let sigma = 0.20; // Initial guess 20%
  const maxIterations = 50;
  const tolerance = 0.01;

  for (let i = 0; i < maxIterations; i++) {
    const res = calculateBlackScholesGreeks(S, K, T, r, sigma, type);
    const diff = res.price - marketPrice;
    if (Math.abs(diff) < tolerance) {
      return Math.min(2.0, Math.max(0.03, sigma));
    }
    const vega = res.vega * 100; // unscaled vega
    if (Math.abs(vega) < 1e-6) break;
    sigma -= diff / vega;
    if (sigma <= 0.005) sigma = 0.01;
  }

  return Math.min(2.0, Math.max(0.05, sigma));
}

/**
 * Max Pain Strike Calculation
 * Find strike at which the total financial loss for option buyers (value of in-the-money options) is minimized.
 */
export function calculateMaxPain(
  strikes: { strikePrice: number; ceOi: number; peOi: number }[]
): number {
  if (!strikes || strikes.length === 0) return 0;

  let minLoss = Infinity;
  let maxPainStrike = strikes[0].strikePrice;

  for (const candidate of strikes) {
    const kSpot = candidate.strikePrice;
    let totalBuyerLoss = 0;

    for (const strike of strikes) {
      // Calls in-the-money if spot > strike
      if (kSpot > strike.strikePrice) {
        totalBuyerLoss += (kSpot - strike.strikePrice) * strike.ceOi;
      }
      // Puts in-the-money if spot < strike
      if (kSpot < strike.strikePrice) {
        totalBuyerLoss += (strike.strikePrice - kSpot) * strike.peOi;
      }
    }

    if (totalBuyerLoss < minLoss) {
      minLoss = totalBuyerLoss;
      maxPainStrike = candidate.strikePrice;
    }
  }

  return maxPainStrike;
}
