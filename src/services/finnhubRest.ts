import type { FinnhubSupportResistance } from '../types';

const BASE_URL = 'https://finnhub.io/api/v1';

export async function fetchSupportResistance(
  symbol: string,
  apiKey: string,
  resolution: string = 'D',
): Promise<FinnhubSupportResistance> {
  const url = `${BASE_URL}/scan/support-resistance?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&token=${apiKey}`;
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Finnhub REST error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export async function fetchAllSupportResistance(
  symbols: string[],
  apiKey: string,
): Promise<Record<string, FinnhubSupportResistance>> {
  const results: Record<string, FinnhubSupportResistance> = {};

  // Finnhub free tier has rate limits, fetch sequentially with small delay
  for (const symbol of symbols) {
    try {
      results[symbol] = await fetchSupportResistance(symbol, apiKey);
    } catch (err) {
      console.warn(`Failed to fetch support/resistance for ${symbol}:`, err);
      results[symbol] = { levels: [] };
    }
    // Small delay to avoid rate limiting
    if (symbols.indexOf(symbol) < symbols.length - 1) {
      await new Promise((r) => setTimeout(r, 300));
    }
  }

  return results;
}
