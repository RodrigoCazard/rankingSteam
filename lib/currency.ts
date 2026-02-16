let cachedRates: Record<string, number> | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hora

export async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  if (cachedRates && now - cacheTimestamp < CACHE_TTL) {
    return cachedRates;
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
    if (!res.ok) throw new Error("Exchange rate API failed");
    const data = await res.json();
    cachedRates = data.rates as Record<string, number>;
    cacheTimestamp = now;
    return cachedRates;
  } catch {
    // Fallback con tasas aproximadas si la API falla
    return cachedRates || { USD: 1, UYU: 43, ARS: 1200, CLP: 950, COP: 4200, MXN: 17, BRL: 5, EUR: 0.92, GBP: 0.79 };
  }
}

export async function convertToUSD(amount: number, fromCurrency: string): Promise<number> {
  if (fromCurrency === "USD" || fromCurrency === "FREE" || amount === 0) return amount;

  const rates = await getExchangeRates();
  const rate = rates[fromCurrency];
  if (!rate || rate === 0) return amount;

  return Math.round((amount / rate) * 100) / 100;
}
